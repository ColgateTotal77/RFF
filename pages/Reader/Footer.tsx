import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useJumpToNextSearchResult, useJumpToPrevSearchResult } from 'lib/useBookNavigation';
import { useBookStore } from 'stores/useBookStore';
import { useTempStore } from 'stores/useTempStore';
import { useWebViewStore } from 'stores/useWebViewStore';
import { Button } from 'components/ui/Button';

export const Footer = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'reader.footer' });
  const { colors } = useTheme();
  const currentSearchResult = useTempStore((state) => state.currentSearchResult);
  const resetSearch = useTempStore((state) => state.resetSearch);
  const currentBook = useBookStore((state) => state.currentBook);
  const executeImmediateAction = useWebViewStore((state) => state.executeImmediateAction);
  const jumpToNext = useJumpToNextSearchResult();
  const jumpToPrev = useJumpToPrevSearchResult();

  if (!currentBook) return null;

  const { percent = 0, currentBlockScrollPercent = 0, totalCharCount = 1 } = currentBook.misc;
  const bookProgress = Math.min(100, Math.max(0, Math.round(percent * 100)));

  const currentBlock = currentBook.blocks[currentBook.currentBlock];
  const currentChapter = currentBook.chapters[currentBlock.chapterId];
  const chapterStartOffset = currentBook.blocks[currentChapter.blockIds[0]].charOffset;
  const currentChapterOffset =
    currentBlock.charOffset -
    chapterStartOffset +
    currentBlock.charCount * currentBlockScrollPercent;
  const chapterProgress = Math.min(
    100,
    Math.max(0, Math.round((currentChapterOffset / currentChapter.charCount) * 100))
  );

  const chapterMarkers = currentBook.chapters.map(
    (chapter) => (chapter.charOffset / totalCharCount) * 100
  );

  return (
    <View className="absolute bottom-8 left-0 right-0 items-center">
      {currentSearchResult.blockId > -1 ? (
        <View className="flex-row items-center gap-4">
          <Button
            mode="contained-tonal"
            icon="chevron-left"
            onPress={jumpToPrev}
            contentStyle={{ paddingVertical: 4, paddingHorizontal: 8 }}
            className="rounded-full">
            {t('prev')}
          </Button>

          <Button
            mode="contained"
            icon="close"
            onPress={() => {
              executeImmediateAction({ type: 'clearSearch' });
              resetSearch();
            }}
            buttonColor={colors.errorContainer}
            textColor={colors.onErrorContainer}
            contentStyle={{ paddingVertical: 4, paddingHorizontal: 8 }}
            className="rounded-full">
            {t('clear')}
          </Button>

          <Button
            mode="contained-tonal"
            icon="chevron-right"
            onPress={jumpToNext}
            contentStyle={{ paddingVertical: 4, paddingHorizontal: 8 }}
            className="rounded-full">
            {t('next')}
          </Button>
        </View>
      ) : (
        <View
          className="w-[280px] gap-1.5 rounded-2xl px-4 py-3"
          style={{ backgroundColor: colors.surfaceVariant }}>
          <View className="relative h-6 w-full justify-center">
            <View
              className="absolute h-px w-full rounded-full"
              style={{ backgroundColor: colors.outline }}
            />

            {chapterMarkers.map((position, index) => (
              <View
                key={index}
                className="absolute top-1/2 h-3 w-px -translate-y-1/2"
                style={{ left: `${position}%`, backgroundColor: colors.onSurfaceVariant }}
              />
            ))}

            <View
              className="absolute top-1/2 z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `${bookProgress}%`, backgroundColor: colors.primary }}
            />
          </View>

          <View className="flex-row justify-between">
            <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>
              {t('bookProgress', { progress: bookProgress })}
            </Text>
            <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>
              {t('chapterProgress', { progress: chapterProgress })}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};
