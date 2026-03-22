import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useBookStore } from 'stores/useBookStore';
import { useEpubNextChapter, useEpubPrevChapter } from 'lib/useBookNavigation';
import { SelectedMenu, SelectionMenu } from 'pages/Reader/SelectionMenu';
import { BookEngine } from 'modules/book-engine';
import { useTempStore } from 'stores/useTempStore';
import { Footer } from 'pages/Reader/Footer';
import { useWordAction } from 'hooks/useWordAction';

export const ReaderScreen = () => {
  const {
    currentBook,
    settings,
    updateScrollPosition,
    closeBook,
    lastJumpTo,
    registerWebViewAction,
  } = useBookStore();
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
  const { addNewCard, updateWordTag, openSystemTranslator } = useWordAction();

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
      closeMenu();
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

  const onUpdateFont = useCallback((fontSize?: number, fontFamily?: string) => {
    const parts: string[] = [];
    if (fontSize !== undefined) parts.push(`window.setFontSize(${fontSize})`);
    if (fontFamily !== undefined) parts.push(`window.setFontFamily('${fontFamily}')`);
    if (parts.length === 0) return;

    const script = `${parts.join('; ')}; true;`;
    webViewRef.current?.injectJavaScript(script);
  }, []);

  const onUpdateTag = useCallback((word: string | null, noteId: string, colorCode: string) => {
    const script = `window.highlightWord(${JSON.stringify(word)}, ${noteId}, ${colorCode}); true;`;
    webViewRef.current?.injectJavaScript(script);
  }, []);

  const onJumpToSearch = useCallback((chapterIndex: number, occurrenceIndex: number) => {
    const script = `window.jumpToSearch(${chapterIndex}, ${occurrenceIndex}); true;`;
    webViewRef.current?.injectJavaScript(script);
  }, []);

  const onScrollToChapter = useCallback((chapterIndex: number) => {
    const script = `window.scrollToChapter(${chapterIndex}); true;`;
    webViewRef.current?.injectJavaScript(script);
  }, []);

  const highlightAllSearched = (searchQuery: string, currentChapters: number[]) => {
    const script = `window.highlightAll(${JSON.stringify(searchQuery)}, ${JSON.stringify(currentChapters)}); true;`;
    webViewRef.current?.injectJavaScript(script);
  };

  const clearSearch = useCallback(() => {
    const script = `window.clearSearch(); true;`;
    webViewRef.current?.injectJavaScript(script);
    resetSearch();
  }, [resetSearch]);

  useEffect(() => {
    registerWebViewAction('scrollToChapter', onScrollToChapter);
    registerWebViewAction('jumpToSearch', onJumpToSearch);
    registerWebViewAction('clearSearch', clearSearch);
    registerWebViewAction('updateTag', onUpdateTag);
    registerWebViewAction('updateFont', onUpdateFont);
  }, [registerWebViewAction, onScrollToChapter, onJumpToSearch, clearSearch, onUpdateTag, onUpdateFont]);

  if (!webViewSource) return;

  const onMessage = async (event: WebViewMessageEvent) => {
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
      } else if (parsedData.type === 'DOUBLE_TAP') {
        await openSystemTranslator(parsedData.text);
        closeMenu();
      } else if (parsedData.type === 'TRIPLE_TAP') {
        if(parsedData.noteId) {
          updateWordTag({ noteId: parsedData.noteId, colorCode: parsedData.colorCode || 0});
        } else {
          addNewCard(parsedData.text);
        }

        closeMenu();
      }
    } catch {
      if (data === 'END_REACHED') {
        loadNextChapter();
      } else if (data === 'TOP_REACHED') {
        loadPrevChapter();
      }
    }
  };


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
          overScrollMode="never"
          scrollEnabled={true}
          mixedContentMode="always"
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
          />
        )}

        {currentSearchResult.chapterIndex > -1 && (
          <Footer/>
        )}
      </View>
    );
};
