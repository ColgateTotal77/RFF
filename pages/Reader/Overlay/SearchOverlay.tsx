import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTempStore } from 'stores/useTempStore';
import { useJumpToNextSearchResult, useJumpToPrevSearchResult } from 'lib/useBookNavigation';
import { IconButton } from 'components/ui/IconButton';

export const SearchOverlay = () => {
  const resetSearch = useTempStore((state) => state.resetSearch);
  const searchResults = useTempStore((state) => state.searchResults);
  const currentSearchResult = useTempStore((state) => state.currentSearchResult);
  const jumpToNext = useJumpToNextSearchResult();
  const jumpToPrev = useJumpToPrevSearchResult();
  const { t } = useTranslation('translation', { keyPrefix: 'reader.footer' });
  const { colors } = useTheme();

  const totalResults = searchResults.length;
  const currentPosition = searchResults.findIndex((r) => r.id === currentSearchResult.id) + 1;
  const hasPrev = currentPosition > 1;
  const hasNext = currentPosition > 0 && currentPosition < totalResults;

  return (
    <View
      className="w-[280px] flex-row items-center rounded-2xl py-0.5"
      style={{ backgroundColor: colors.surfaceVariant }}>
      <View className="flex-1 flex-row items-center justify-between">
        <IconButton
          icon="chevron-left"
          size={22}
          onPress={jumpToPrev}
          disabled={!hasPrev}
          iconColor={colors.onSurfaceVariant}
          accessibilityLabel={t('prev')}
        />

        <View className="min-w-[56px] flex-row items-center justify-center">
          <Text variant="labelLarge" style={{ color: colors.onSurface }}>
            {currentPosition}
          </Text>
          <Text variant="labelLarge" style={{ color: colors.onSurfaceVariant }}>
            {' / '}
            {totalResults}
          </Text>
        </View>

        <IconButton
          icon="chevron-right"
          size={22}
          onPress={jumpToNext}
          disabled={!hasNext}
          iconColor={colors.onSurfaceVariant}
          accessibilityLabel={t('next')}
        />
      </View>

      <IconButton
        icon="close"
        size={20}
        onPress={() => resetSearch()}
        iconColor={colors.error}
        accessibilityLabel={t('clear')}
      />
    </View>
  );
};
