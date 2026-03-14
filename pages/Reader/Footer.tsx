import { Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { useJumpToNextSearchResult, useJumpToPrevSearchResult } from 'lib/useBookNavigation';

interface Props {
  clearSearch: () => void;
  onJumpToSearch: (chapterIndex: number, occurrenceIndex: number) => void;
}

export const Footer = ({ clearSearch, onJumpToSearch }: Props) => {
  const jumpToNext = useJumpToNextSearchResult(onJumpToSearch);
  const jumpToPrev = useJumpToPrevSearchResult(onJumpToSearch);

  return (
    <View className="absolute bottom-[30px] left-0 right-0 flex flex-row justify-center gap-16">
      <TouchableOpacity
        onPress={jumpToPrev}
        className="elevation-5 h-[50px] w-[50px] items-center justify-center rounded-full bg-gray-200 shadow-md">
        <Text className="text-xl font-bold text-white">{'<'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={clearSearch}
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
