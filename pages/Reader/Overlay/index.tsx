import { View } from 'react-native';
import React from 'react';
import { useTempStore } from 'stores/useTempStore';
import { SearchOverlay } from 'pages/Reader/Overlay/SearchOverlay';
import { BookMarkButton } from 'pages/Reader/Overlay/BookMarkButton';
import { BookProgressOverlay } from 'pages/Reader/Overlay/BookProgressOverlay';
import { BackStackOverlay } from 'pages/Reader/Overlay/BackStackOverlay';

export const Overlay = () => {
  const currentSearchResult = useTempStore((state) => state.currentSearchResult);

  return (
    <>
      <BookMarkButton />
      <View className="absolute bottom-8 left-0 right-0 items-center gap-2">
        <BackStackOverlay />
        {currentSearchResult.blockId > -1 ? <SearchOverlay /> : <BookProgressOverlay />}
      </View>
    </>
  );
};
