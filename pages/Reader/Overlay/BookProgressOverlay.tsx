import { View } from 'react-native';
import React from 'react';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useBookStore } from 'stores/useBookStore';
import { useTempStore } from 'stores/useTempStore';

export const BookProgressOverlay = () => {
  const currentBook = useBookStore((state) => state.currentBook);
  const isOverlayVisible = useTempStore((state) => state.isOverlayVisible);
  const { t } = useTranslation('translation', { keyPrefix: 'reader.footer' });
  const { colors } = useTheme();

  if (!currentBook) return null;
  if (!isOverlayVisible) return null;

  const { percent = 0, currentBlockScrollPercent = 0, totalCharCount = 1 } = currentBook.misc;
  const bookProgress = Math.min(100, Math.max(0, Math.round(percent * 100)));
  const blockIndex = currentBook.mapping.blockIndex[currentBook.currentBlock];

  const chapterStartOffset = blockIndex.chapterCharOffset;
  const currentChapterOffset =
    blockIndex.blockCharOffset -
    chapterStartOffset +
    blockIndex.blockCharCount * currentBlockScrollPercent;
  const chapterProgress = blockIndex.chapterCharCount ? Math.round((currentChapterOffset / blockIndex.chapterCharCount) * 100) : 0;

  console.log("chapterProgress: ", chapterProgress)

  const chapterMarkers = currentBook.toc.flatMap((item) => {
    const charOffset = currentBook.mapping.chapterById[item.chapterId]?.charOffset;
    return charOffset != null ? [(charOffset / totalCharCount) * 100] : [];
  });

  return (
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
  );
};
