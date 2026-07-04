import { LayoutChangeEvent, View } from 'react-native';
import React, { useCallback } from 'react';
import { useTempStore } from 'stores/useTempStore';
import { SearchOverlay } from 'pages/Reader/Overlay/SearchOverlay';
import { BookMarkButton } from 'pages/Reader/Overlay/BookMarkButton';
import { BookProgressOverlay } from 'pages/Reader/Overlay/BookProgressOverlay';
import { BackStackOverlay } from 'pages/Reader/Overlay/BackStackOverlay';
import { BookHeader } from 'pages/Reader/Overlay/BookHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const Overlay = () => {
  const currentSearchResult = useTempStore((state) => state.currentSearchResult);
  const setOverlayHeaderOffset = useTempStore((state) => state.setOverlayHeaderOffset);
  const { top } = useSafeAreaInsets();

  const onHeaderLayout = useCallback(
    (e: LayoutChangeEvent) => {
      setOverlayHeaderOffset(Math.round(e.nativeEvent.layout.height - top));
    },
    [setOverlayHeaderOffset]
  );

  return (
    <>
      <View className="absolute left-0 right-0 top-0 z-50" onLayout={onHeaderLayout}>
        <BookHeader />
      </View>
      <BookMarkButton />
      <View className="absolute bottom-8 left-0 right-0 items-center gap-2">
        <BackStackOverlay />
        {currentSearchResult.blockId > -1 ? <SearchOverlay /> : <BookProgressOverlay />}
      </View>
    </>
  );
};
