import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useBookStore } from 'stores/useBookStore';
import { SelectionMenu } from 'pages/Reader/SelectionMenu';
import { BookEngine } from 'modules/book-engine';
import { useTempStore } from 'stores/useTempStore';
import { Footer } from 'pages/Reader/Footer';
import { Theme } from 'types';
import { useMessageHandler } from './useMessageHandler';

export const ReaderScreen = () => {
  const currentBook = useBookStore((state) => state.currentBook);
  const settings = useBookStore((state) => state.settings);
  const closeBook = useBookStore((state) => state.closeBook);
  const lastJumpTo = useBookStore((state) => state.lastJumpTo);
  const registerWebViewAction = useBookStore((state) => state.registerWebViewAction);
  const lastFragmentId = useBookStore((state) => state.lastFragmentId);
  const setLastFragmentId = useBookStore((state) => state.setLastFragmentId);

  const currentSearchResult = useTempStore((state) => state.currentSearchResult);
  const resetSearch = useTempStore((state) => state.resetSearch);
  const isWebViewReady = useTempStore((state) => state.isWebViewReady);
  const setIsWebViewReady = useTempStore((state) => state.setIsWebViewReady);
  const searchQuery = useTempStore((state) => state.searchQuery);
  const selectionMenu = useTempStore((state) => state.selectionMenu);
  const closeMenu = useTempStore((state) => state.closeSelectionMenu);

  const font = currentBook?.settings?.font || settings.font;

  const webViewRef = useRef<WebView>(null);
  const containerRef = useRef<View>(null);
  const [webViewSource, setWebViewSource] = useState<{ uri: string } | null>(null);

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
    if (!currentBook) return;

    const loadInitialWindow = async () => {
      try {
        setWebViewSource(null);
        setIsWebViewReady(false);

        const { currentBlocks, blocks } = currentBook;
        const paths = currentBlocks.map((index) => blocks[index].fullPath);

        const generatedFileUrl = await BookEngine.loadInitialHtml(paths, currentBlocks, {
          targetblockId: lastJumpTo,
          scrollPosition: currentBook.scrollPosition,
          fontSize: font.fontSize,
          fontFamily: font.fontFamily,
          theme: settings.theme || 'light',
        });

        if (typeof generatedFileUrl === 'string') {
          setWebViewSource({ uri: generatedFileUrl });
        }
      } catch (e) {
        console.error('Failed to prepare initial blocks:', e);
      }
    };

    loadInitialWindow();
  }, [currentBook?.basePath, lastJumpTo]);

  useEffect(() => {
    if (lastFragmentId && isWebViewReady) {
      onScrollToFragment(lastFragmentId);
      setLastFragmentId('');
    }
  }, [isWebViewReady]);

  useEffect(() => {
    if (currentSearchResult.occurrenceIndex > -1 && isWebViewReady) {
      highlightAllSearched(searchQuery, currentBook?.currentBlocks || []);
    }
  }, [currentBook?.currentBlocks, isWebViewReady, currentSearchResult]);

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

  const onJumpToSearch = useCallback((blockId: number, occurrenceIndex: number) => {
    const script = `window.jumpToSearch(${blockId}, ${occurrenceIndex}); true;`;
    webViewRef.current?.injectJavaScript(script);
  }, []);

  const onScrollToBlock = useCallback((blockId: number) => {
    const script = `window.scrollToBlock(${blockId}); true;`;
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

  const onUpdateTheme = useCallback((theme: Theme) => {
    const script = `window.setTheme('${theme}'); true;`;
    webViewRef.current?.injectJavaScript(script);
  }, []);

  const onScrollToFragment = useCallback((fragmentId: string) => {
    const script = `window.onScrollToFragment(${fragmentId}); true;`;
    webViewRef.current?.injectJavaScript(script);
  }, []);

  useEffect(() => {
    registerWebViewAction('scrollToBlock', onScrollToBlock);
    registerWebViewAction('jumpToSearch', onJumpToSearch);
    registerWebViewAction('clearSearch', clearSearch);
    registerWebViewAction('updateTag', onUpdateTag);
    registerWebViewAction('updateFont', onUpdateFont);
    registerWebViewAction('updateTheme', onUpdateTheme);
    registerWebViewAction('scrollToFragment', onScrollToFragment);
  }, [registerWebViewAction, onScrollToBlock, onJumpToSearch, clearSearch, onUpdateTag, onUpdateFont, onUpdateTheme, onScrollToFragment]);

  const handleMessage = useMessageHandler(webViewRef, containerRef);

  if (!webViewSource) return;

    return (
      <View ref={containerRef} collapsable={false} className="flex-1">
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={webViewSource}
          className="flex-1"
          onMessage={handleMessage}
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
