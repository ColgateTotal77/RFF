import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { useEpubNextBlock, useEpubPrevBlock } from 'lib/useBookNavigation';
import { SelectionMenu } from 'pages/Reader/SelectionMenu';
import { BookEngine } from 'modules/book-engine';
import { useTempStore } from 'stores/useTempStore';
import { Footer } from 'pages/Reader/Footer';
import { useWordAction } from 'lib/useWordAction';
import { calculateBookProgress } from 'lib/utils';

export const ReaderScreen = () => {
  const currentBook = useCurrentBook();
  const settings = useBookStore((state) => state.settings);
  const setScrollPosition = useBookStore((state) => state.setScrollPosition);
  const setCurrentBlock = useBookStore((state) => state.setCurrentBlock);
  const closeBook = useBookStore((state) => state.closeBook);
  const lastJumpTo = useBookStore((state) => state.lastJumpTo);
  const registerWebViewAction = useBookStore((state) => state.registerWebViewAction);
  const updateMisc = useBookStore((state) => state.updateMisc);

  const currentSearchResult = useTempStore((state) => state.currentSearchResult);
  const resetSearch = useTempStore((state) => state.resetSearch);
  const isWebViewReady = useTempStore((state) => state.isWebViewReady);
  const setIsWebViewReady = useTempStore((state) => state.setIsWebViewReady);
  const searchQuery = useTempStore((state) => state.searchQuery);
  const isSearchOperation = useTempStore((state) => state.isSearchOperation);
  const setIsSearchOperation = useTempStore((state) => state.setIsSearchOperation);
  const selectionMenu = useTempStore((state) => state.selectionMenu);
  const setSelectionMenu = useTempStore((state) => state.setSelectionMenu);
  const closeMenu = useTempStore((state) => state.closeSelectionMenu);

  const font = currentBook.settings.font || settings.defaultBookSettings.font;
  const { addNewCard, updateWordTag, openSystemTranslator } = useWordAction();

  const webViewRef = useRef<WebView>(null);
  const containerRef = useRef<View>(null);

  const [webViewSource, setWebViewSource] = useState<{ uri: string } | null>(null);

  const loadNextBlock = useEpubNextBlock(webViewRef, containerRef);
  const loadPrevBlock = useEpubPrevBlock(webViewRef, containerRef);

  useEffect(() => {
    return () => {
      closeBook();
      setWebViewSource(null);
      setIsWebViewReady(false);
      resetSearch();
      closeMenu();
    };
  }, [closeBook]);

  useEffect(() => {
    const loadInitialWindow = async () => {
      try {
        setWebViewSource(null);
        setIsWebViewReady(false);

        const { currentBlocks, blocks } = currentBook;
        const paths = currentBlocks.map((index) => blocks[index].fullPath);

        const generatedFileUrl = await BookEngine.loadInitialHtml(paths, currentBlocks, {
          targetBlockIndex: lastJumpTo,
          scrollPosition: currentBook.scrollPosition,
          fontSize: font.fontSize,
          fontFamily: font.fontFamily,
        });

        if (typeof generatedFileUrl === 'string') {
          setWebViewSource({ uri: generatedFileUrl });
        }
      } catch (e) {
        console.error('Failed to prepare initial blocks:', e);
      }
    };

    loadInitialWindow();
  }, [currentBook.basePath, lastJumpTo]);

  useEffect(() => {
    if (currentSearchResult.occurrenceIndex > -1 && isWebViewReady) {
      highlightAllSearched(searchQuery, currentBook.currentBlocks);
    }
  }, [currentBook.currentBlocks, isWebViewReady, currentSearchResult]);

  const onUpdateFont = useCallback((fontSize?: number, fontFamily?: string) => {
    const parts: string[] = [];
    if (fontSize !== undefined) parts.push(`window.setFontSize(${fontSize})`);
    if (fontFamily !== undefined) parts.push(`window.setFontFamily('${fontFamily}')`);
    if (parts.length === 0) return;

    const script = `${parts.join('; ')}; true;`;
    webViewRef.current?.injectJavaScript(script);
  }, []);

  const onUpdateTag = useCallback(
    (words: string | string[] | null, noteIds: string, colorCode: string) => {
      const script = `window.updateTag(${JSON.stringify(words)}, ${JSON.stringify(noteIds)}, ${colorCode}); true;`;
      webViewRef.current?.injectJavaScript(script);
    },
    []
  );

  const onJumpToSearch = useCallback((blockIndex: number, occurrenceIndex: number) => {
    const script = `window.jumpToSearch(${blockIndex}, ${occurrenceIndex}); true;`;
    webViewRef.current?.injectJavaScript(script);
  }, []);

  const onScrollToBlock = useCallback((blockIndex: number) => {
    const script = `window.scrollToBlock(${blockIndex}); true;`;
    webViewRef.current?.injectJavaScript(script);
  }, []);

  const highlightAllSearched = (searchQuery: string, currentBlocks: number[]) => {
    const script = `window.highlightAll(${JSON.stringify(searchQuery)}, ${JSON.stringify(currentBlocks)}); true;`;
    webViewRef.current?.injectJavaScript(script);
  };

  const clearSearch = useCallback(() => {
    const script = `window.clearSearch(); window._lastSearchQuery = ''; window._lastSearchBlocks = []; true;`;
    webViewRef.current?.injectJavaScript(script);
  }, []);

  useEffect(() => {
    registerWebViewAction('scrollToBlock', onScrollToBlock);
    registerWebViewAction('jumpToSearch', onJumpToSearch);
    registerWebViewAction('clearSearch', clearSearch);
    registerWebViewAction('updateTag', onUpdateTag);
    registerWebViewAction('updateFont', onUpdateFont);
  }, [registerWebViewAction, onScrollToBlock, onJumpToSearch, clearSearch, onUpdateTag, onUpdateFont]);

  if (!webViewSource) return;

  const onMessage = async (event: WebViewMessageEvent) => {
    const data = event.nativeEvent.data;

    try {
      const parsedData = JSON.parse(data);

      switch (parsedData.type) {
        case 'LOG':
          if (parsedData.logType === 'error') console.error(parsedData.message);
          else console.log(parsedData.message);
          break;

        case 'TEXT_SELECTED':
          setSelectionMenu({
            visible: true,
            text: parsedData.text,
            top: parsedData.top,
            left: parsedData.left,
            noteIds: parsedData.noteIds,
            colorCode: parsedData.colorCode,
          });
          break;

        case 'SELECTION_CLEARED':
          closeMenu();
          break;

        case 'SCROLL_POSITION_CHANGED':
          if (!currentBook) return;

          const percent = calculateBookProgress(
            currentBook,
            parsedData.currentBlock,
            parsedData.currentBlockScrollPercent
          );

          updateMisc({ percent, currentBlockScrollPercent: parsedData.currentBlockScrollPercent });
          setScrollPosition(parsedData.scrollPosition);

          if (parsedData.currentBlock !== currentBook.currentBlock)
            setCurrentBlock(parsedData.currentBlock);

          break;

        case 'INITIAL_LOAD_COMPLETE':
          setIsWebViewReady(true);
          break;

        case 'END_REACHED':
          loadNextBlock();
          break;

        case 'TOP_REACHED':
          loadPrevBlock();
          break;

        case 'DOUBLE_TAP':
          await openSystemTranslator(parsedData.text.replace(/[^\w\s]|_/g, ''));
          closeMenu();
          break;

        case 'TRIPLE_TAP':
          if (parsedData.noteIds) {
            updateWordTag({ noteIds: parsedData.noteIds, colorCode: parsedData.colorCode || 0 });
          } else {
            addNewCard(parsedData.text);
          }
          closeMenu();
          break;

        case 'SEARCH_HIGHLIGHT_COMPLETE':
          if (currentSearchResult.occurrenceIndex > -1 && isSearchOperation) {
            onJumpToSearch(currentSearchResult.blockIndex, currentSearchResult.occurrenceIndex);
            setIsSearchOperation(false);
          }
      }
    } catch (error) {
      console.log("onMessage error: ", error)
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
          />
        )}

        <Footer/>
      </View>
    );
};
