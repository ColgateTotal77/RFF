import React, { useEffect, useRef, useMemo } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { IconButton, useTheme } from 'react-native-paper';
import { useBookStore } from 'stores/useBookStore';
import { useWebViewStore } from 'stores/useWebViewStore';
import { SelectionMenu } from 'pages/Reader/SelectionMenu';
import { useTempStore } from 'stores/useTempStore';
import { Footer } from 'pages/Reader/Footer';
import { useMessageHandler } from './useMessageHandler';
import { Loading } from 'components/Loading';

export const ReaderScreen = () => {
  const currentBook = useBookStore((state) => state.currentBook);
  const registerWebViewAction = useWebViewStore((state) => state.registerWebViewAction);
  const webViewSource = useWebViewStore((state) => state.webViewSource);
  const resetWebView = useWebViewStore((state) => state.resetWebView);
  const isWebViewReady = useWebViewStore((state) => state.isWebViewReady);
  const loadWindow = useWebViewStore((state) => state.loadWindow);
  const resetSearch = useTempStore((state) => state.resetSearch);
  const selectionMenu = useTempStore((state) => state.selectionMenu);
  const closeMenu = useTempStore((state) => state.closeSelectionMenu);
  const addBookmark = useBookStore((state) => state.addBookmark);
  const removeBookmark = useBookStore((state) => state.removeBookmark);
  const { colors } = useTheme();

  const webViewRef = useRef<WebView>(null);
  const containerRef = useRef<View>(null);

  const activeBookmark = useMemo(() => {
    if (!currentBook) return null;
    return (currentBook.bookmarks ?? []).find(
      (bookmark) =>
        bookmark.blockId === currentBook.currentBlock &&
        Math.abs(bookmark.scrollPercent - currentBook.misc.currentBlockScrollPercent) < 0.05
    );
  }, [
    currentBook?.bookmarks,
    currentBook?.currentBlock,
    currentBook?.misc.currentBlockScrollPercent,
  ]);

  useEffect(() => {
    if (currentBook) {
      console.log('loadWindow');
      loadWindow(currentBook.currentBlock, currentBook.misc.currentBlockScrollPercent);
    }

    return () => {
      resetWebView();
      resetSearch();
      closeMenu();
      console.log('closeBook');
    };
  }, [currentBook?.basePath]);

  useEffect(() => {
    registerWebViewAction((script) => {
      webViewRef.current?.injectJavaScript(script);
    });
  }, [registerWebViewAction]);

  const handleMessage = useMessageHandler(webViewRef, containerRef);

  const isLoading = !webViewSource || !currentBook || !isWebViewReady;

  return (
    <View ref={containerRef} collapsable={false} className="flex-1 bg-white dark:bg-black">
      {webViewSource && currentBook && (
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={webViewSource}
          className={`flex-1 ${!isLoading ? 'opacity-100' : 'opacity-0'}`}
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
      )}

      {isLoading && (
        <View className="absolute inset-0 z-50 flex-1 items-center justify-center bg-white dark:bg-black">
          <Loading />
        </View>
      )}

      {!isLoading && (
        <IconButton
          icon={activeBookmark ? 'bookmark' : 'bookmark-outline'}
          size={28}
          iconColor={colors.primary}
          className="rounded-none"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 50,
            elevation: 5,
            borderRadius: 8,
          }}
          onPress={() => {
            if (activeBookmark) removeBookmark(activeBookmark.id);
            else addBookmark();
          }}
        />
      )}

      {selectionMenu.visible && <SelectionMenu selectionMenu={selectionMenu} />}

      {!isLoading && <Footer />}
    </View>
  );
};
