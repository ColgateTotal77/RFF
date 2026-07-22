import React from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { IconButton } from 'components/ui/IconButton';
import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { useTempStore } from 'stores/useTempStore';
import { useWebViewStore } from 'stores/useWebViewStore';
import { useAppStore } from 'stores/useAppStore';
import { calculateBookProgress } from 'lib/utils';
import { loadWindow } from 'stores/actions';

export const BackStackOverlay = () => {
  const backStack = useTempStore((state) => state.backStack);
  const removeLastFromBackStack = useTempStore((state) => state.removeLastFromBackStack);
  const clearBackStack = useTempStore((state) => state.clearBackStack);
  const currentBook = useCurrentBook();
  const setCurrentBlock = useBookStore((state) => state.setCurrentBlock);
  const updateMisc = useBookStore((state) => state.updateMisc);
  const executeImmediateActions = useWebViewStore((state) => state.executeImmediateActions);
  const addToPostLoadQueue = useWebViewStore((state) => state.addToPostLoadQueue);
  const setGlobalLoading = useAppStore((state) => state.setGlobalLoading);
  const { colors } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'reader.footer' });

  if (backStack.length === 0) return null;

  const onBack = () => {
    const target = backStack[backStack.length - 1];
    removeLastFromBackStack();

    if (currentBook.currentBlocks.includes(target.blockId)) {
      setCurrentBlock(target.blockId);
      executeImmediateActions([
        { type: 'scrollToBlock', blockId: target.blockId, scrollPercent: target.scrollPercent },
      ]);
    } else {
      addToPostLoadQueue({
        type: 'scrollToBlock',
        blockId: target.blockId,
        scrollPercent: target.scrollPercent,
      });
      setGlobalLoading({ isLoading: true, message: 'Going back…' });
      loadWindow(target.blockId, 0);
    }

    updateMisc({
      percent: calculateBookProgress(currentBook, target.scrollPercent, target.blockId),
    });
  };

  return (
    <View
      className="w-[280px] flex-row items-center rounded-2xl py-0.5"
      style={{ backgroundColor: colors.surfaceVariant }}>
      <IconButton
        icon="arrow-left"
        size={22}
        onPress={onBack}
        iconColor={colors.onSurfaceVariant}
        accessibilityLabel={t('goBack')}
      />
      <Text variant="labelLarge" className="flex-1" style={{ color: colors.onSurface }}>
        {t('goBack')}
        {backStack.length > 1 ? ` (${backStack.length})` : ''}
      </Text>
      <IconButton
        icon="close"
        size={20}
        onPress={clearBackStack}
        iconColor={colors.error}
        accessibilityLabel={'Clear navigation history'}
      />
    </View>
  );
};
