import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useBookStore } from 'stores/useBookStore';
import { useEpubNextChapter, useEpubPrevChapter } from 'lib/useBookNavigation';
import { SelectedMenu, SelectionMenu } from 'pages/Reader/SelectionMenu';
import { BookEngine } from 'modules/book-engine';
import { useTempStore } from 'stores/useTempStore';
import { Footer } from 'pages/Reader/Footer';

export const ReaderScreen = () => {
  const { currentBook, settings, updateScrollPosition, closeBook, lastJumpTo } =
    useBookStore();
  const {
    currentSearchResult,
    resetSearch,
    isWebViewReady,
    setIsWebViewReady,
    searchQuery,
    isSearchOperation,
    setIsSearchOperation,
  } = useTempStore();
  const font = currentBook?.settings?.font || settings.defaultBookSettings.font;

  const webViewRef = useRef<WebView>(null);
  const containerRef = useRef<View>(null);

  const [webViewSource, setWebViewSource] = useState<{ uri: string } | null>(null);

  const loadNextChapter = useEpubNextChapter(webViewRef, containerRef);
  const loadPrevChapter = useEpubPrevChapter(webViewRef, containerRef);
  const [selectionMenu, setSelectionMenu] = useState<SelectedMenu>({
    visible: false,
    text: '',
    top: 0,
    left: 0,
  });

  const closeMenu = () => setSelectionMenu((prev) => ({ ...prev, visible: false }));

  useEffect(() => {
    return () => {
      setWebViewSource(null);
      setIsWebViewReady(false);
      resetSearch();
      closeBook();
    };
  }, [closeBook]);

  useEffect(() => {
    if (!currentBook || !currentBook.currentChapters.length) return;

    const loadInitialWindow = async () => {
      try {
        setWebViewSource(null);
        setIsWebViewReady(false);

        const { currentChapters, chapters } = currentBook;
        const paths = currentChapters.map((index) => chapters[index].fullPath);

        const generatedFileUrl = await BookEngine.loadInitialHtml(paths, currentChapters, {
          targetChapterIndex: lastJumpTo,
          scrollPosition: currentBook.lastScrollPosition || 0,
          fontSize: font.fontSize,
          fontFamily: font.fontFamily,
        });

        if (typeof generatedFileUrl === 'string') {
          setWebViewSource({ uri: generatedFileUrl });
        }
      } catch (e) {
        console.error('Failed to prepare initial chapters:', e);
      }
    };

    loadInitialWindow();
  }, [currentBook?.basePath, lastJumpTo]);

  useEffect(() => {
    if (currentSearchResult.occurrenceIndex > -1 && isWebViewReady) {
      highlightAllSearched(searchQuery, currentBook?.currentChapters || []);
    }
  }, [currentBook?.currentChapters, isWebViewReady]);

  useEffect(() => {
    if (currentSearchResult.occurrenceIndex > -1 && isWebViewReady && isSearchOperation) {
      onJumpToSearch(currentSearchResult.chapterIndex, currentSearchResult.occurrenceIndex);
      setIsSearchOperation(false);
    }
  }, [isWebViewReady, isSearchOperation]);

  useEffect(() => {
    if (!webViewRef.current) return;
    webViewRef.current.injectJavaScript(`
    window.setFontSize(${font.fontSize});
    window.setFontFamily('${font.fontFamily}');
    true;
  `);
  }, [font]);

  const onMessage = (event: WebViewMessageEvent) => {
    const data = event.nativeEvent.data;

    try {
      const parsedData = JSON.parse(data);

      if (parsedData.type === 'TEXT_SELECTED') {
        setSelectionMenu({
          visible: true,
          text: parsedData.text,
          top: parsedData.top,
          left: parsedData.left,
          noteId: parsedData.noteId,
          colorCode: parsedData.colorCode,
        });
      } else if (parsedData.type === 'SELECTION_CLEARED') {
        closeMenu();
      } else if (parsedData.type === 'SCROLL_POSITION_CHANGED') {
        updateScrollPosition(parsedData.scrollY);
      } else if (parsedData.type === 'INITIAL_LOAD_COMPLETE') {
        setIsWebViewReady(true);
      }
    } catch {
      if (data === 'END_REACHED') {
        loadNextChapter();
      } else if (data === 'TOP_REACHED') {
        loadPrevChapter();
      }
    }
  };

  const onUpdateTag = (word: string | null, noteId: string, colorCode: string) => {
    const script = `window.highlightWord(${JSON.stringify(word)}, ${noteId}, ${colorCode}); true;`;
    webViewRef.current?.injectJavaScript(script);
  };

  const onJumpToSearch = (chapterIndex: number, occurrenceIndex: number) => {
    const script = `window.jumpToSearch(${chapterIndex}, ${occurrenceIndex}); true;`;
    webViewRef.current?.injectJavaScript(script);
  };

  const highlightAllSearched = (searchQuery: string, currentChapters: number[]) => {
    const script = `window.highlightAll(${JSON.stringify(searchQuery)}, ${JSON.stringify(currentChapters)}); true;`;
    webViewRef.current?.injectJavaScript(script);
  };

  const clearSearch = () => {
    const script = `window.clearSearch(); true;`;
    webViewRef.current?.injectJavaScript(script);
    resetSearch();
  }

  if (!webViewSource) return;

  return (
    <View ref={containerRef} collapsable={false} className="flex-1">
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={webViewSource}
        className="flex-1"
        onMessage={onMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        textZoom={100}
        setBuiltInZoomControls={false}
        setDisplayZoomControls={false}
        scalesPageToFit={false}
        showsVerticalScrollIndicator={false}
        androidLayerType="hardware"
      />

      {(!currentBook || !isWebViewReady) && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'white',
          }}>
          <ActivityIndicator size="large" />
        </View>
      )}

      {selectionMenu.visible && (
        <SelectionMenu
          selectionMenu={selectionMenu}
          closeMenu={closeMenu}
          onUpdateTag={onUpdateTag}
        />
      )}

      {currentSearchResult.chapterIndex > -1 && (
        <Footer clearSearch={clearSearch} onJumpToSearch={onJumpToSearch} />
      )}
    </View>
  );
};
