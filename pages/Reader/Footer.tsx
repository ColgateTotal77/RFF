import { Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { useJumpToNextSearchResult, useJumpToPrevSearchResult } from 'lib/useBookNavigation';
import { useBookStore } from 'stores/useBookStore';

export const Footer = () => {
  const { clearSearchAction } = useBookStore();

  const jumpToNext = useJumpToNextSearchResult();
  const jumpToPrev = useJumpToPrevSearchResult();

  return (
    <View className="absolute bottom-[30px] left-0 right-0 flex flex-row justify-center gap-16">
      <TouchableOpacity
        onPress={jumpToPrev}
        className="elevation-5 h-[50px] w-[50px] items-center justify-center rounded-full bg-gray-200 shadow-md">
        <Text className="text-xl font-bold text-white">{'<'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={clearSearchAction}
        className="elevation-5 h-[50px] w-[50px] items-center justify-center rounded-full bg-red-500 shadow-md">
        <Text className="text-xl font-bold text-white">✕</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={jumpToNext}
        className="elevation-5 h-[50px] w-[50px] items-center justify-center rounded-full bg-gray-200 shadow-md">
        <Text className="text-xl font-bold text-white">{'>'}</Text>
      </TouchableOpacity>
    </View>
  );
};
