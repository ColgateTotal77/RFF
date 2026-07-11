package com.reader.bookengine

import android.content.ActivityNotFoundException
import android.content.Intent
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import com.reader.bookengine.anki.AllAnkiWordsFetcher
import com.reader.bookengine.database.AppDatabase
import com.reader.bookengine.database.AppDependencies
import com.reader.bookengine.database.BlockEntity
import com.reader.bookengine.database.FrequencyDatabase
import com.reader.bookengine.database.WordFormEntity
import com.reader.bookengine.database.syncWordFormsFromSupabase
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.withContext
import org.json.JSONObject
import org.jsoup.Jsoup
import java.io.File

class BookEngineModule : Module() {
    companion object {
        init {
            System.loadLibrary("book_engine_native")
        }
    }

    private val ankiModule = AnkiModule()
    private var freqDatabase: FrequencyDatabase? = null
    val bookBridge = BookBridge(this)

    private val moduleContext get() = appContext.reactContext ?: throw Exception("React context is null")

    fun extractBlockHtmlPublic(filePath: String): String? = extractBlockHtml(filePath)

    suspend fun loadAnkiDictionary(
        langCode: String,
        deckId: String,
        appDatabase: AppDatabase,
        mapping: Map<String, Any?>,
        mirroredMapping: Map<String, Any?>,
    ): Boolean {
        try {
            val t1 = System.currentTimeMillis()

            freeAnkiDictionary()

            val ankiWordsFetcher = AllAnkiWordsFetcher(moduleContext)
            val ankiData = ankiWordsFetcher.getAllAnkiWords(deckId, mapping, mirroredMapping)
            if (ankiData.words.isEmpty()) {
                android.util.Log.w("BookEngine", "Anki returned 0 words")
                return true
            }

            val ankiBaseMap = mutableMapOf<String, Pair<LongArray, Int>>()
            for (i in ankiData.words.indices) {
                ankiBaseMap[ankiData.words[i].lowercase()] = Pair(ankiData.noteIds[i], ankiData.colorCodes[i])
            }

            val uniqueLemmas = ankiBaseMap.keys.toList()
            android.util.Log.d("BookEngine", "Found ${uniqueLemmas.size} unique words in Anki.")

            val expandedForms = ArrayList<WordFormEntity>(uniqueLemmas.size)
            val chunkedLemmas = uniqueLemmas.chunked(1000)

            coroutineScope {
                chunkedLemmas
                    .map { chunk ->
                        async {
                            appDatabase.wordFormDao().getFormsForLemmas(langCode, chunk)
                        }
                    }.awaitAll()
                    .forEach { formsChunk ->
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
                finalColors.toIntArray(),
            )

            val t3 = System.currentTimeMillis()
            android.util.Log.d("BookEngine", "Load Anki Dictionary in C tree took: ${t3 - t2} ms")

            val t4 = System.currentTimeMillis()

            freqDatabase = AppDependencies.getFrequencyDatabase(moduleContext)
            freqDatabase?.ensureDownloaded(langCode)
            freqDatabase?.open(langCode)
            ankiModule.setFrequencyDatabase(freqDatabase)

            val t5 = System.currentTimeMillis()
            android.util.Log.d("BookEngine", "Freq DB open took: ${t5 - t4} ms")

            return true
        } catch (e: Exception) {
            android.util.Log.e("BookEngine", "Failed to init dictionary", e)
            return false
        }
    }

    private fun findWebView(view: View?): WebView? {
        if (view == null) return null
        if (view is WebView) return view
        if (view !is ViewGroup) return null

        for (i in 0 until view.childCount) {
            val foundWebView = findWebView(view.getChildAt(i))
            if (foundWebView != null) return foundWebView
        }
        return null
    }

    private external fun extractBlockHtml(filePath: String): String?

    private external fun initAnkiDictionary(
        words: Array<String>,
        noteIds: Array<LongArray>,
        colorCodes: IntArray,
    )

    private external fun freeAnkiDictionary()

    override fun definition() =
        ModuleDefinition {
            Name("BookEngine")

            AsyncFunction("onAppInit") Coroutine { ->
                withContext(Dispatchers.IO) {
                    android.util.Log.d("BookEngine", "onAppInit called")
                    try {
                        val myAppDatabase = AppDependencies.getDatabase(moduleContext)
                        val mySupabaseClient = AppDependencies.supabaseClient

                        android.util.Log.d("BookEngine", "About to call syncWordFormsFromSupabase...")
                        syncWordFormsFromSupabase(mySupabaseClient, myAppDatabase, moduleContext)
                        android.util.Log.d("BookEngine", "syncWordFormsFromSupabase completed")

                        android.util.Log.d("BookEngine", "onAppInit completed successfully")
                    } catch (e: Exception) {
                        android.util.Log.e("BookEngine", "Exception in onAppInit: ${e.message}", e)
                        throw e
                    }
                }
            }

            AsyncFunction("openSystemTranslator") { text: String ->
                val activity =
                    appContext.activityProvider?.currentActivity
                        ?: throw Exception("No current activity found")

                android.util.Log.d("BookEngine", "Opening system translator for text: $text")

                val translateIntent =
                    Intent(Intent.ACTION_PROCESS_TEXT).apply {
                        putExtra(Intent.EXTRA_PROCESS_TEXT, text)
                        type = "text/plain"
                        setPackage("com.google.android.apps.translate")
                    }

                try {
                    activity.startActivity(translateIntent)
                    true
                } catch (e: ActivityNotFoundException) {
                    android.util.Log.e("BookEngine", "Failed to open any translator", e)
                    throw Exception("No translation app is installed.")
                }
            }

            AsyncFunction("loadBookInSQL") Coroutine
                { bookBasePath: String, blockPaths: List<String>, blockIds: List<Int>, chapterTitles: List<String> ->
                    withContext(Dispatchers.IO) {
                        val t1 = System.currentTimeMillis()
                        val db = AppDependencies.getDatabase(moduleContext)

                        val blocks =
                            blockPaths.mapIndexed { i, path ->
                                val file = File(path)
                                val rawHtml = file.readText()
                                val plainText = Jsoup.parse(rawHtml).text()

                                BlockEntity(
                                    bookBasePath = bookBasePath,
                                    blockId = blockIds[i],
                                    content = plainText,
                                    title = chapterTitles[i],
                                )
                            }

                        db.blockDao().insertAll(blocks)

                        val t2 = System.currentTimeMillis()
                        android.util.Log.d("BookEngine", "Loaded ${blocks.size} blocks in Room in ${t2 - t1} ms")
                        blocks.size
                    }
                }

            AsyncFunction("deleteBookFromSQL") Coroutine { bookBasePath: String ->
                withContext(Dispatchers.IO) {
                    val db = AppDependencies.getDatabase(moduleContext)
                    db.blockDao().delete(bookBasePath)
                    android.util.Log.d("BookEngine", "Delete book from SQL: $bookBasePath")
                }
            }

            AsyncFunction("searchInBook") Coroutine { query: String, bookBasePath: String ->
                withContext(Dispatchers.IO) {
                    val t1 = System.currentTimeMillis()
                    val db = AppDependencies.getDatabase(moduleContext)

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

                            val matchData =
                                mapOf(
                                    "id" to globalIndex,
                                    "blockId" to block.blockId,
                                    "title" to block.title,
                                    "occurrenceIndex" to matchIndex,
                                    "snippet" to customSnippet,
                                    "query" to query,
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

            AsyncFunction("loadAnkiDictionary") Coroutine
                { langCode: String, deckId: String, mapping: Map<String, Any?>, mirroredMapping: Map<String, Any?> ->
                    withContext(Dispatchers.IO) {
                        val myAppDatabase = AppDependencies.getDatabase(moduleContext)
                        val success = loadAnkiDictionary(langCode, deckId, myAppDatabase, mapping, mirroredMapping)
                        if (!success) throw Exception("Failed to load Anki dictionary")
                    }
                }

            AsyncFunction("unloadAnkiDictionary") Coroutine { -> freeAnkiDictionary() }

            AsyncFunction("loadInitialHtml") Coroutine
                { paths: List<String>, indices: List<Int>, cssPaths: List<String>, options: Map<String, Any> ->
                    withContext(Dispatchers.IO) {
                        try {
                            val t1 = System.currentTimeMillis()

                            if (paths.isEmpty()) return@withContext ""

                            val firstFile = File(paths[0])
                            if (!firstFile.exists()) return@withContext ""

                            val firstHtml = firstFile.readText()

                            val bodyStartIdx = firstHtml.indexOf("<body", ignoreCase = true)
                            val bodyStartEndIdx = if (bodyStartIdx != -1) firstHtml.indexOf(">", bodyStartIdx) else -1
                            val bodyEndIdx = firstHtml.lastIndexOf("</body>", ignoreCase = true)

                            var header =
                                if (bodyStartEndIdx != -1) {
                                    firstHtml.substring(0, bodyStartEndIdx + 1)
                                } else {
                                    "<html><head></head><body>"
                                }

                            val headEndIdx = header.indexOf("</head>", ignoreCase = true)
                            if (headEndIdx != -1) {
                                val cssLinks =
                                    cssPaths.joinToString("\n") { path ->
                                        """<link rel="stylesheet" href="$path">"""
                                    }

                                val viewportMeta =
                                    """<meta name="viewport" content="width=device-width, initial-scale=1.0, """ +
                                        """maximum-scale=1.0, user-scalable=no">"""
                                header = header.substring(0, headEndIdx) +
                                    viewportMeta +
                                    (if (cssLinks.isNotEmpty()) "\n$cssLinks" else "") +
                                    header.substring(headEndIdx)
                            }

                            val baseUrlString = "file://${firstFile.parentFile?.absolutePath}/"
                            val headIdx = header.indexOf("<head", ignoreCase = true)
                            if (headIdx != -1) {
                                val headEndIdx = header.indexOf(">", headIdx)
                                if (headEndIdx != -1) {
                                    header =
                                        header.substring(0, headEndIdx + 1) + "\n<base href=\"$baseUrlString\">\n" +
                                        header.substring(headEndIdx + 1)
                                }
                            } else {
                                header =
                                    header.replaceFirst("<html>", "<html><head><base href=\"$baseUrlString\"></head>", ignoreCase = true)
                            }

                            val footer =
                                if (bodyEndIdx != -1) {
                                    firstHtml.substring(bodyEndIdx)
                                } else {
                                    "</body></html>"
                                }

                            val cacheDir = moduleContext.cacheDir ?: throw Exception("No cache dir")

                            cacheDir.listFiles { _, name -> name.startsWith("initial_book_") }?.forEach { it.delete() }

                            val timestamp = System.currentTimeMillis()
                            val initialFile = File(cacheDir, "initial_book_$timestamp.html")

                            val htmlBlocksDeferred =
                                coroutineScope {
                                    paths.map { path ->
                                        async { extractBlockHtml(path) }
                                    }
                                }

                            java.io.FileOutputStream(initialFile).use { fos ->
                                fos.write(header.toByteArray())

                                val configJson = org.json.JSONObject(options).toString()
                                val configScript = "\n<script>\nwindow.BookConfig = $configJson;\n</script>\n"
                                fos.write(configScript.toByteArray())

                                val loadedScripts =
                                    try {
                                        moduleContext.assets
                                            ?.list("onBookInit")
                                            ?.filter { it.endsWith(".html") }
                                            ?.mapNotNull { fileName ->
                                                moduleContext.assets?.open("onBookInit/$fileName")?.bufferedReader().use {
                                                    it?.readText()
                                                }
                                            }?.joinToString("\n") ?: ""
                                    } catch (e: Exception) {
                                        android.util.Log.e("BookEngine", "Failed to load HTML files", e)
                                        ""
                                    }

                                fos.write("\n$loadedScripts\n".toByteArray())

                                val htmlBlocks = htmlBlocksDeferred.awaitAll().joinToString("\n") { it ?: "" }

                                fos.write(htmlBlocks.toByteArray())
                                fos.write(footer.toByteArray())
                            }

                            val fileUrl = "file://${initialFile.absolutePath}"

                            val t2 = System.currentTimeMillis()
                            android.util.Log.d("BookEngine", "Kotlin loadInitialHtml in: ${t2 - t1} ms")

                            fileUrl
                        } catch (e: Exception) {
                            android.util.Log.e("BookEngine", "Failed to build initial HTML", e)
                            ""
                        }
                    }
                }

            AsyncFunction("setupBookBridge") Coroutine { viewTag: Int, allBlockPaths: List<String>, initialBlocks: List<Int> ->
                withContext(Dispatchers.Main) {
                    bookBridge.setup(allBlockPaths, initialBlocks)
                    val activity = appContext.activityProvider?.currentActivity
                    if (activity == null) {
                        android.util.Log.e("BookEngine", "setupBookBridge: no activity")
                        return@withContext
                    }
                    val rootView = activity.findViewById<View>(viewTag)
                    val webView = findWebView(rootView)
                    if (webView != null) {
                        try {
                            webView.removeJavascriptInterface("BookBridge")
                        } catch (_: Exception) {
                        }
                        webView.addJavascriptInterface(bookBridge, "BookBridge")
                        bookBridge.webView = webView
                        android.util.Log.d("BookEngine", "BookBridge attached to WebView")
                    } else {
                        android.util.Log.e("BookEngine", "setupBookBridge: No WebView found for viewTag=$viewTag")
                        throw Exception("No WebView found for viewTag=$viewTag")
                    }
                }
            }
        }
}
