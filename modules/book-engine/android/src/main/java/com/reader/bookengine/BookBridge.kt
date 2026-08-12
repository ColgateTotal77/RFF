package com.reader.bookengine

import android.webkit.WebView

class BookBridge(
    private val module: BookEngineModule,
) {
    var webView: WebView? = null
    private var blockPaths: List<String> = emptyList()
    private var currentBlocks: MutableList<Int> = mutableListOf()

    fun setup(
        allBlockPaths: List<String>,
        initialBlocks: List<Int>,
    ) {
        blockPaths = allBlockPaths
        currentBlocks = initialBlocks.toMutableList()
    }

    @android.webkit.JavascriptInterface
    fun onTopReached() {
        val firstRendered = currentBlocks.firstOrNull() ?: return
        val fetchIndex = firstRendered - 1
        if (fetchIndex < 0) {
            runOnWebView("window.isFetching = false; true;")
            return
        }
        injectBlock(fetchIndex, "top")
    }

    @android.webkit.JavascriptInterface
    fun onEndReached() {
        val lastRendered = currentBlocks.lastOrNull() ?: return
        val fetchIndex = lastRendered + 1
        if (fetchIndex >= blockPaths.size) {
            runOnWebView("window.isFetching = false; true;")
            return
        }
        injectBlock(fetchIndex, "bottom")
    }

    @android.webkit.JavascriptInterface
    fun updateBlockWindow(newWindowJson: String) {
        try {
            val arr = org.json.JSONArray(newWindowJson)
            currentBlocks.clear()
            for (i in 0 until arr.length()) {
                currentBlocks.add(arr.getInt(i))
            }
            android.util.Log.d("BookEngine", "Block window updated: $currentBlocks")
        } catch (e: Exception) {
            android.util.Log.e("BookEngine", "Failed to parse block window", e)
        }
    }

    private fun injectBlock(
        fetchIndex: Int,
        position: String,
    ) {
        val path = blockPaths.getOrNull(fetchIndex)
        if (path == null) {
            runOnWebView("window.isFetching = false; true;")
            return
        }
        val t1 = System.currentTimeMillis()

        val html = module.extractBlockHtmlPublic(path)

        val t2 = System.currentTimeMillis()
        android.util.Log.d("BookEngine", "C parsed new block for: ${t2-t1} ms")

        if (html == null) {
            android.util.Log.e("BookEngine", "Failed to extract block HTML from $path")
            runOnWebView("window.isFetching = false; true;")
            return
        }

        val htmlJson = org.json.JSONObject.quote(html)
        val jsScript = "window.loadNewBlock($htmlJson, '$position', $fetchIndex);"
        runOnWebView(jsScript)
    }

    private fun runOnWebView(js: String) {
        webView?.post {
            webView?.evaluateJavascript(js) { _ ->
                android.util.Log.d("BookEngine", "JavaScript execution done")
            }
        }
    }
}
