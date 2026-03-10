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

class BookEngineModule : Module() {
    companion object {
        init {
            System.loadLibrary("book_engine_native")
        }
    }
    private val ankiModule = AnkiModule()

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

    private external fun extractChapterToFile(filePath: String, outputPath: String): Boolean

    private external fun initAnkiDictionary(
        words: Array<String>,
        noteIds: LongArray,
        colorCodes: IntArray
    )
    private external fun freeAnkiDictionary()

    override fun definition() = ModuleDefinition {
        Name("BookEngine")

        AsyncFunction("openSystemTranslator") { text: String ->
            val activity = appContext.currentActivity ?: throw Exception("No current activity found")

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

        AsyncFunction("loadAnkiDictionary") { ->
            try {
                val t1 = System.currentTimeMillis()
                val context = appContext.reactContext ?: throw Exception("React context is null")
                val ankiData = ankiModule.getAllAnkiWords(context)
                val t2 = System.currentTimeMillis()
                android.util.Log.d("BookEngine", "Load Anki Cards from DB took: ${t2 - t1} ms")
                initAnkiDictionary(ankiData.words, ankiData.noteIds, ankiData.colorCodes)
                val t3 = System.currentTimeMillis()
                android.util.Log.d(
                    "BookEngine",
                    "Load Anki Dictionary in C tree took: ${t3 - t2} ms"
                )
                return@AsyncFunction true
            } catch (e: Exception) {
                android.util.Log.e("BookEngine", "Failed to init dictionary", e)
                return@AsyncFunction false
            }
        }

        AsyncFunction("unloadAnkiDictionary") { ->
            freeAnkiDictionary()
        }

        AsyncFunction("loadInitialHtml") { paths: List<String>, indices: List<Int>, scriptsAndStyles: String, targetChapterIndex: Int?, scrollPosition: Int? ->
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

                    fos.write("\n$scriptsAndStyles\n".toByteArray())

                    paths.forEachIndexed { i, path ->
                        val chapterIndex = indices[i]
                        fos.write("\n<div id=\"chapter-$chapterIndex\">\n".toByteArray())

                        val tempChapFile = File(cacheDir, "temp_init_$i.html")
                        val success = extractChapterToFile(path, tempChapFile.absolutePath)

                        if (success) {
                            tempChapFile.inputStream().use { fis ->
                                fis.copyTo(fos)
                            }
                            tempChapFile.delete()
                        } else {
                            android.util.Log.e("BookEngine", "C failed to extract chapter: $path")
                        }

                        fos.write("\n</div>\n".toByteArray())
                    }

                    val scriptTemplate = try {
                        appContext.reactContext?.assets?.open("scrollScript.html")?.bufferedReader().use {
                            it?.readText() ?: ""
                        }
                    } catch (e: Exception) {
                        android.util.Log.e("BookEngine", "Failed to load scrollScript.html from assets", e)
                        ""
                    }

                    val finalScrollScript = scriptTemplate
                        .replace("\$targetChapterIndex", (targetChapterIndex ?: 0).toString())
                        .replace("\$scrollPosition", (scrollPosition ?: 0).toString())

                    fos.write("\n$finalScrollScript\n".toByteArray())

                    fos.write(footer.toByteArray())
                }

                val fileUrl = "file://${initialFile.absolutePath}"

                val t2 = System.currentTimeMillis()
                android.util.Log.d("BookEngine", "Kotlin loadInitialHtml via File Stream in: ${t2 - t1} ms")

                return@AsyncFunction fileUrl

            } catch (e: Exception) {
                android.util.Log.e("BookEngine", "Failed to build initial HTML", e)
                return@AsyncFunction ""
            }
        }

        AsyncFunction("injectChapter") { viewTag: Int, path: String, fetchIndex: Int, removeIndex: Int?, position: String ->
            val t1 = System.currentTimeMillis()

            val cacheDir = appContext.reactContext?.cacheDir ?: throw Exception("No cache dir")
            cacheDir.listFiles { _, name -> name.startsWith("initial_book_$viewTag") }?.forEach { it.delete() }

            val timestamp = System.currentTimeMillis()
            val tempFile = File(cacheDir, "temp_chapter_${fetchIndex}_$timestamp.html")

            val outputPath = tempFile.absolutePath

            val success = extractChapterToFile(path, outputPath)

            if (!success) {
                android.util.Log.e("BookEngine", "C failed to write chapter to file")
            }

            val fileUrl = "file://$outputPath"
            val jsScript = "window.loadNewChapter('$fileUrl', '$position', $fetchIndex, ${removeIndex ?: "null"});"

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
