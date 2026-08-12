import React, { useEffect, useRef, useCallback } from 'react';
import { findNodeHandle, Linking, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProcessBookLinks } from 'lib/useBookNavigation';
import { useWebViewStore } from 'stores/useWebViewStore';
import { useAppStore } from 'stores/useAppStore';
import { SelectionMenu } from 'pages/Reader/SelectionMenu';
import { useTempStore } from 'stores/useTempStore';
import { useMessageHandler } from './useMessageHandler';
import { Overlay } from 'pages/Reader/Overlay';

const TEMP_WEBVIEW_SOURCE = {
  html: '<!DOCTYPE html><html><head></head><body style="background-color: transparent;"></body></html>',
};

export const ReaderScreen = () => {
  const registerWebViewAction = useWebViewStore((state) => state.registerWebViewAction);
  const webViewSource = useWebViewStore((state) => state.webViewSource);
  const selectionMenu = useTempStore((state) => state.selectionMenu);
  const setReactTag = useWebViewStore((state) => state.setReactTag);
  const theme = useAppStore((state) => state.theme);
  const { top, bottom } = useSafeAreaInsets();

  const webViewRef = useRef<WebView>(null);

  const handleContainerRef = useCallback(
    (node: View | null) => {
      setReactTag(node !== null ? findNodeHandle(node) : null);
    },
    [setReactTag]
  );

  useEffect(() => {
    registerWebViewAction((script) => {
      webViewRef.current?.injectJavaScript(script);
    });
  }, [registerWebViewAction]);

  const handleMessage = useMessageHandler();
  const processBookLinks = useProcessBookLinks();

  return (
    <View
      ref={handleContainerRef}
      collapsable={false}
      style={{ flex: 1, backgroundColor: theme === 'dark' ? '#121212' : '#ffffff' }}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={webViewSource ?? TEMP_WEBVIEW_SOURCE}
        className="flex-1"
        style={{
          backgroundColor: 'transparent',
          marginTop: top,
          marginBottom: bottom,
        }}
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={(request) => {
          if (/^https?:\/\//.test(request.url)) {
            Linking.openURL(request.url);
            return false;
          }
          if (request.url.startsWith('chapter://')) {
            const url = new URL(request.url);
            processBookLinks(parseInt(url.hostname), url.hash.replace('#', ''));
            return false;
          }
          return true;
        }}
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
        renderToHardwareTextureAndroid={true}
        overScrollMode="never"
        scrollEnabled={true}
        mixedContentMode="always"
      />

      <Overlay />

      {selectionMenu.visible && <SelectionMenu selectionMenu={selectionMenu} />}
    </View>
  );
};
