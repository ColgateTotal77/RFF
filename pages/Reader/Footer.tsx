import { Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { useJumpToNextSearchResult, useJumpToPrevSearchResult } from 'lib/useBookNavigation';
import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { useTempStore } from 'stores/useTempStore';

export const Footer = () => {
  const currentSearchResult = useTempStore((state) => state.currentSearchResult);
  const resetSearch = useTempStore((state) => state.resetSearch);
  const clearSearchAction = useBookStore((state) => state.clearSearchAction);
  const currentBook = useCurrentBook();
  const { percent = 0, currentBlockScrollPercent = 0, totalCharCount = 1 } = currentBook.misc;

  const bookProgress = Math.min(100, Math.max(0, Math.round(percent * 100)));

  const currentBlock = currentBook.blocks[currentBook.currentBlock];
  const currentChapter = currentBook.chapters[currentBlock.chapterId];
  const chapterStartOffset = currentBook.blocks[currentChapter.blockIds[0]].charOffset;
  const currentChapterOffset =
    currentBlock.charOffset -
    chapterStartOffset +
    currentBlock.charCount * currentBlockScrollPercent;
  const chapterProgress = Math.min(100, Math.max(0, Math.round((currentChapterOffset / currentChapter.charCount) * 100)));

  const chapterMarkers = currentBook.chapters.map((chapter) => {
    return (chapter.charOffset / totalCharCount) * 100;
  }) ?? [];

  const jumpToNext = useJumpToNextSearchResult();
  const jumpToPrev = useJumpToPrevSearchResult();

  return (
    <View className="absolute bottom-[30px] left-0 right-0 flex flex-col items-center">
      {currentSearchResult.blockIndex > -1 ? (
        <View className="flex flex-row justify-center gap-16">
          <TouchableOpacity
            onPress={jumpToPrev}
            className="elevation-5 h-[50px] w-[50px] items-center justify-center rounded-full bg-gray-200 shadow-md">
            <Text className="text-xl font-bold text-white">{'<'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              clearSearchAction();
              resetSearch();
            }}
            className="elevation-5 h-[50px] w-[50px] items-center justify-center rounded-full bg-red-500 shadow-md">
            <Text className="text-xl font-bold text-white">✕</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={jumpToNext}
            className="elevation-5 h-[50px] w-[50px] items-center justify-center rounded-full bg-gray-200 shadow-md">
            <Text className="text-xl font-bold text-white">{'>'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="mb-4 bg-gray-200 p-2">
          <View className="flex w-[280px] flex-col items-center">
            <View className="relative h-6 w-full justify-center">
              <View className="absolute h-0.5 w-full bg-gray-400" />

              {chapterMarkers.map((position, index) => (
                <View
                  key={index}
                  className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-gray-500"
                  style={{ left: `${position}%` }}
                />
              ))}

              <View
                className="absolute top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500"
                style={{ left: `${bookProgress}%` }}
              />
            </View>
            <View className="mt-1 flex w-full flex-row justify-between">
              <Text className="text-xs text-gray-500">Book {bookProgress}%</Text>
              <Text className="text-xs text-gray-500">Chapter {chapterProgress}%</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};
