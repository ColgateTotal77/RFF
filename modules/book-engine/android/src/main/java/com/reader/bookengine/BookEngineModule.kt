package com.reader.bookengine

import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject
import android.content.Intent
import android.content.ActivityNotFoundException
import java.io.File
import kotlinx.coroutines.*
import android.app.Activity
import org.jsoup.Jsoup
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.runBlocking
import com.reader.bookengine.database.AppDatabase
import com.reader.bookengine.database.AppDependencies
import com.reader.bookengine.database.syncWordFormsFromSupabase
import com.reader.bookengine.database.WordFormEntity
import com.reader.bookengine.database.FrequencyDatabase
import com.reader.bookengine.database.BlockEntity
import com.reader.bookengine.database.FullBlockMatch

class BookEngineModule : Module() {
    companion object {
        init {
            System.loadLibrary("book_engine_native")
        }
    }
    private val ankiModule = AnkiModule()
    private var freqDatabase: FrequencyDatabase? = null

    suspend fun loadAnkiDictionary(
        langCode: String,
        deckId: String,
        appDatabase: AppDatabase
    ): Boolean {
        try {
            val t1 = System.currentTimeMillis()

            val context = appContext.reactContext ?: throw Exception("React context is null")

            val ankiData = ankiModule.getAllAnkiWords(deckId, context)
            if (ankiData.words.isEmpty()) {
                android.util.Log.w("BookEngine", "Anki returned 0 words. Check deck ID.")
                return false
            }

            val ankiBaseMap = mutableMapOf<String, Pair<LongArray, Int>>()
            for (i in ankiData.words.indices) {
                ankiBaseMap[ankiData.words[i].lowercase()] = Pair(ankiData.noteIds[i], ankiData.colorCodes[i])
            }

            val uniqueLemmas = ankiBaseMap.keys.toList()

            android.util.Log.d("BookEngine", "Found ${uniqueLemmas.size} unique words in Anki.")

            val expandedForms = ArrayList<WordFormEntity>(uniqueLemmas.size)
            val chunkedLemmas = uniqueLemmas.chunked(900)

            kotlinx.coroutines.coroutineScope {
                chunkedLemmas.map { chunk ->
                    async {
                        appDatabase.wordFormDao().getFormsForLemmas(langCode, chunk)
                    }
                }.awaitAll().forEach { formsChunk ->
                    expandedForms.addAll(formsChunk)
                }
            }

            android.util.Log.d("BookEngine", "Found ${expandedForms.size} expanded forms in Room DB for lang: $langCode")

            val finalWords = ArrayList<String>(uniqueLemmas.size + expandedForms.size)
            val finalNoteIds = ArrayList<LongArray>(uniqueLemmas.size + expandedForms.size)
            val finalColors = ArrayList<Int>(uniqueLemmas.size + expandedForms.size)

            for ((lemma, data) in ankiBaseMap) {
                finalWords.add(lemma)
                finalNoteIds.add(data.first)
                finalColors.add(data.second)
            }

            for (form in expandedForms) {
                val inputWordLower = form.inputWord.lowercase()
                val lemmaLower = form.lemma.lowercase()

                if (inputWordLower == lemmaLower) continue

                val baseAnkiData = ankiBaseMap[lemmaLower]

                if (baseAnkiData != null) {
                    finalWords.add(inputWordLower)
                    finalNoteIds.add(baseAnkiData.first)
                    finalColors.add(baseAnkiData.second)
                }
            }

            val t2 = System.currentTimeMillis()
            android.util.Log.d("BookEngine", "Data prep took: ${t2 - t1} ms. Total words ready for C: ${finalWords.size}")

            initAnkiDictionary(
                finalWords.toTypedArray(),
                finalNoteIds.toTypedArray(),
                finalColors.toIntArray()
            )

            val t3 = System.currentTimeMillis()
            android.util.Log.d("BookEngine", "Load Anki Dictionary in C tree took: ${t3 - t2} ms")

            freqDatabase = AppDependencies.getFrequencyDatabase(context)
            freqDatabase?.ensureDownloaded(langCode)
            freqDatabase?.open(langCode)
            ankiModule.setFrequencyDatabase(freqDatabase)

            return true
        } catch (e: Exception) {
            android.util.Log.e("BookEngine", "Failed to init dictionary", e)
            return false
        }
    }

    private fun findWebView(view: View): WebView? {
        android.util.Log.d("BookEngine", "Searching in view: ${view.javaClass.simpleName}")

        if (view is WebView) {
            android.util.Log.d("BookEngine", "Found WebView!")
            return view
        }

        if (view is ViewGroup) {
            for (i in 0 until view.childCount) {
                val child = view.getChildAt(i)
                val foundWebView = findWebView(child)
                if (foundWebView != null) return foundWebView
            }
        }

        return null
    }

    private fun injectInWebView(activity: Activity,  viewTag: Int, jsScript: String): Unit {
        val rootView = activity.findViewById<View>(viewTag)
        val webView = findWebView(rootView)

        if (webView != null) {
            webView.evaluateJavascript(jsScript) { result ->
                android.util.Log.d("BookEngine", "JavaScript execution result: $result")
            }
        } else {
            android.util.Log.e("BookEngine", "No WebView found in view hierarchy")
        }
    }

    private external fun extractBlockToFile(filePath: String, outputPath: String): Boolean

    private external fun initAnkiDictionary(
        words: Array<String>,
        noteIds: Array<LongArray>,
        colorCodes: IntArray
    )
    private external fun freeAnkiDictionary()

    override fun definition() = ModuleDefinition {
        Name("BookEngine")

        AsyncFunction("onAppInit") { langCode: String, deckId: String ->
            android.util.Log.d("BookEngine", "onAppInit called with langCode: $langCode, deckId: $deckId")
            runBlocking<Unit> {
                try {
                    val context = appContext.reactContext ?: throw Exception("React context is null")
                    val myAppDatabase = AppDependencies.getDatabase(context)
                    val mySupabaseClient = AppDependencies.supabaseClient

                    android.util.Log.d("BookEngine", "About to call syncWordFormsFromSupabase...")
                    syncWordFormsFromSupabase(mySupabaseClient, myAppDatabase, context)
                    android.util.Log.d("BookEngine", "syncWordFormsFromSupabase completed")

                    val success = this@BookEngineModule.loadAnkiDictionary(langCode, deckId, myAppDatabase)
                    if (!success) {
                        throw Exception("Failed to load Anki dictionary")
                    }
                    android.util.Log.d("BookEngine", "onAppInit completed successfully")
                } catch (e: Exception) {
                    android.util.Log.e("BookEngine", "Exception in onAppInit: ${e.message}", e)
                    throw e
                }
            }
        }

        AsyncFunction("openSystemTranslator") { text: String ->
            val activity = appContext.activityProvider?.currentActivity
                ?: throw Exception("No current activity found")

            val translateIntent = Intent(Intent.ACTION_PROCESS_TEXT).apply {
                putExtra(Intent.EXTRA_PROCESS_TEXT, text)
                type = "text/plain"
                setPackage("com.google.android.apps.translate")
            }

            try {
                activity.startActivity(translateIntent)
                return@AsyncFunction true
            } catch (e: ActivityNotFoundException) {
                android.util.Log.w("BookEngine", "Google Translate not found, falling back to system chooser.")

                val fallbackIntent = Intent(Intent.ACTION_PROCESS_TEXT).apply {
                    putExtra(Intent.EXTRA_PROCESS_TEXT, text)
                    type = "text/plain"
                }

                try {
                    activity.startActivity(fallbackIntent)
                    return@AsyncFunction true
                } catch (e2: Exception) {
                    android.util.Log.e("BookEngine", "Failed to open any translator", e2)
                    throw Exception("No translation app is installed.")
                }
            }
        }

        AsyncFunction("loadBookInSQL") { bookBasePath: String, blockPaths: List<String>, blockIds: List<Int>, chapterTitles: List<String> ->
            runBlocking(Dispatchers.IO) {
                val t1 = System.currentTimeMillis()

                val context = appContext.reactContext ?: throw Exception("React context is null")
                val db = AppDependencies.getDatabase(context)

                val blocks = blockPaths.mapIndexed { i, path ->
                    val file = File(path)
                    val rawHtml = file.readText()
                    val plainText = Jsoup.parse(rawHtml).text()

                    BlockEntity(
                        bookBasePath = bookBasePath,
                        blockId = blockIds[i],
                        content = plainText,
                        title = chapterTitles[i]
                    )
                }

                db.blockDao().insertAll(blocks)

                val t2 = System.currentTimeMillis()
                android.util.Log.d("BookEngine", "Loaded ${blocks.size} blocks in Room in ${t2 - t1} ms")
                blocks.size
            }
        }

        AsyncFunction("deleteBookFromSQL") { bookBasePath: String ->
            runBlocking(Dispatchers.IO) {
                val context = appContext.reactContext ?: throw Exception("React context is null")
                val db = AppDependencies.getDatabase(context)

                val matchedBlocks = db.blockDao().delete(bookBasePath)
            }
            android.util.Log.d("BookEngine", "Delete book from SQL: $bookBasePath")
        }

        AsyncFunction("searchInBook") { query: String, bookBasePath: String ->
            runBlocking(Dispatchers.IO) {
                val t1 = System.currentTimeMillis()

                val context = appContext.reactContext ?: throw Exception("React context is null")
                val db = AppDependencies.getDatabase(context)

                val matchedBlocks = db.blockDao().searchAllMatches(query.trim(), bookBasePath)

                val results = mutableListOf<Map<String, Any>>()

                var globalIndex = 0

                for (block in matchedBlocks) {
                    val text = block.content
                    var charIndex = text.indexOf(query, ignoreCase = true)
                    var matchIndex = 0

                    while (charIndex >= 0) {
                        val startSnippet = maxOf(0, charIndex - 30)
                        val endSnippet = minOf(text.length, charIndex + query.length + 30)

                        var rawSnippet = text.substring(startSnippet, endSnippet)
                        rawSnippet = rawSnippet.replace("\n", " ").replace("\r", " ")

                        val customSnippet = "...${rawSnippet.trim()}..."

                        val matchData = mapOf(
                            "id" to globalIndex,
                            "blockId" to block.blockId,
                            "title" to block.title,
                            "occurrenceIndex" to matchIndex,
                            "snippet" to customSnippet,
                            "query" to query
                        )

                        results.add(matchData)

                        globalIndex++
                        matchIndex++
                        charIndex = text.indexOf(query, charIndex + query.length, ignoreCase = true)
                    }
                }

                val t2 = System.currentTimeMillis()
                android.util.Log.d("BookEngine", "Search for '$query' in SearchInBook found ${results.size} matches in ${t2 - t1} ms")
                results
            }
        }

        AsyncFunction("loadAnkiDictionary") { langCode: String, deckId: String ->
            runBlocking {
                val context = appContext.reactContext ?: throw Exception("React context is null")
                val myAppDatabase = AppDependencies.getDatabase(context)
                val success = this@BookEngineModule.loadAnkiDictionary(langCode, deckId, myAppDatabase)
                if (!success) {
                    throw Exception("Failed to load Anki dictionary")
                }
                success
            }
        }

        AsyncFunction("unloadAnkiDictionary") { ->
            freeAnkiDictionary()
        }

        AsyncFunction("loadInitialHtml") { paths: List<String>, indices: List<Int>, options: Map<String, Any> ->
            try {
                val t1 = System.currentTimeMillis()

                val firstFile = File(paths[0])
                val firstHtml = firstFile.readText()

                val bodyStartIdx = firstHtml.indexOf("<body", ignoreCase = true)
                val bodyStartEndIdx = if (bodyStartIdx != -1) firstHtml.indexOf(">", bodyStartIdx) else -1
                val bodyEndIdx = firstHtml.lastIndexOf("</body>", ignoreCase = true)

                var header = if (bodyStartEndIdx != -1) {
                    firstHtml.substring(0, bodyStartEndIdx + 1)
                } else "<html><head></head><body>"

                val headEndIdx = header.indexOf("</head>", ignoreCase = true)
                if (headEndIdx != -1) {
                    header = header.substring(0, headEndIdx) +
                        """<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">""" +
                        header.substring(headEndIdx)
                }

                val baseUrlString = "file://${firstFile.parentFile?.absolutePath}/"
                val headIdx = header.indexOf("<head", ignoreCase = true)
                if (headIdx != -1) {
                    val headEndIdx = header.indexOf(">", headIdx)
                    if (headEndIdx != -1) {
                        header = header.substring(0, headEndIdx + 1) + "\n<base href=\"$baseUrlString\">\n" + header.substring(headEndIdx + 1)
                    }
                } else {
                    header = header.replaceFirst("<html>", "<html><head><base href=\"$baseUrlString\"></head>", ignoreCase = true)
                }

                val footer = if (bodyEndIdx != -1) {
                    firstHtml.substring(bodyEndIdx)
                } else "</body></html>"

                val cacheDir = appContext.reactContext?.cacheDir ?: throw Exception("No cache dir")

                cacheDir.listFiles { _, name -> name.startsWith("initial_book_") }?.forEach { it.delete() }

                val timestamp = System.currentTimeMillis()
                val initialFile = File(cacheDir, "initial_book_$timestamp.html")

                java.io.FileOutputStream(initialFile).use { fos ->
                    fos.write(header.toByteArray())

                    val configJson = org.json.JSONObject(options).toString()

                    val configScript = "\n<script>\nwindow.BookConfig = $configJson;\n</script>\n"
                    fos.write(configScript.toByteArray())

                    val loadedScripts = try {
                        appContext.reactContext?.assets?.list("onBookInit")
                            ?.filter { it.endsWith(".html") }
                            ?.mapNotNull { fileName ->
                                appContext.reactContext?.assets?.open("onBookInit/$fileName")?.bufferedReader().use {
                                    it?.readText()
                                }
                            }?.joinToString("\n") ?: ""
                    } catch (e: Exception) {
                        android.util.Log.e("BookEngine", "Failed to load HTML files", e)
                        ""
                    }

                    fos.write("\n$loadedScripts\n".toByteArray())

                    val tempFiles = runBlocking(Dispatchers.IO) {
                        paths.mapIndexed { i, path ->
                            async {
                                val tempFile = File(cacheDir, "temp_init_$i.html")
                                val success = extractBlockToFile(path, tempFile.absolutePath)
                                i to if (success) tempFile else null
                            }
                        }.awaitAll().toMap().toSortedMap()
                    }

                    tempFiles.forEach { (i, tempFile) ->
                        val blockId = indices[i]
                        tempFile?.inputStream()?.use { it.copyTo(fos) }
                        tempFile?.delete()
                    }

                    fos.write(footer.toByteArray())
                }

                val fileUrl = "file://${initialFile.absolutePath}"

                val t2 = System.currentTimeMillis()
                android.util.Log.d("BookEngine", "Kotlin loadInitialHtml in: ${t2 - t1} ms")

                return@AsyncFunction fileUrl

            } catch (e: Exception) {
                android.util.Log.e("BookEngine", "Failed to build initial HTML", e)
                return@AsyncFunction ""
            }
        }

        AsyncFunction("injectBlock") { viewTag: Int, path: String, fetchIndex: Int, removeIndex: Int?, position: String ->
            val t1 = System.currentTimeMillis()

            val cacheDir = appContext.reactContext?.cacheDir ?: throw Exception("No cache dir")
            cacheDir.listFiles { _, name -> name.startsWith("initial_book_$viewTag") }?.forEach { it.delete() }

            val timestamp = System.currentTimeMillis()
            val tempFile = File(cacheDir, "temp_block_${fetchIndex}_$timestamp.html")

            val outputPath = tempFile.absolutePath

            val success = extractBlockToFile(path, outputPath)

            if (!success) {
                android.util.Log.e("BookEngine", "C failed to write block to file")
            }

            val fileUrl = "file://$outputPath"
            val jsScript = "window.loadNewBlock('$fileUrl', '$position', $fetchIndex, ${removeIndex ?: "null"});"

            appContext.activityProvider?.currentActivity?.runOnUiThread {
                val activity = appContext.activityProvider?.currentActivity ?: return@runOnUiThread
                try {
                    injectInWebView(activity, viewTag, jsScript)
                } catch (e: Exception) {
                    android.util.Log.e("BookEngine", "Failed to inject JS", e)
                }
            }

            val t2 = System.currentTimeMillis()
            android.util.Log.d("BookEngine", "C File Write & Injection took: ${t2 - t1} ms")
        }
    }
}
