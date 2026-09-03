import { Book } from 'types';
import React, { useState } from 'react';
import { Card, Text, useTheme } from 'react-native-paper';
import { View, Image } from 'react-native';
import { useBookStore } from 'stores/useBookStore';
import { IconButton } from 'components/ui/IconButton';
import { DropdownMenu } from 'components/ui/DropdownMenu';
import { useTranslation } from 'react-i18next';

interface Props {
  book: Book;
  onPress: () => void;
  toggleLabel: string;
  onDeletePress: () => void;
}

interface BookProgressProps {
  book: Book;
}

const BookProgress = ({ book }: BookProgressProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'reader.footer' });

  const { percent = 0, currentBlockScrollPercent = 0 } = book.misc;
  const bookProgress = Math.min(100, Math.max(0, Math.round(percent * 100)));
  const currentBlock = book.blocks.find((b) => b.id === book.currentBlock);
  const currentChapter = book.chapters.find((c) => c.blockIds.includes(book.currentBlock));

  if (!currentChapter || !currentBlock) return null;

  const chapterStartOffset = currentChapter.charOffset;
  const currentChapterOffset =
    currentBlock.charOffset -
    chapterStartOffset +
    currentBlock.charCount * currentBlockScrollPercent;
  const chapterProgress = currentChapter.charCount ? Math.round((currentChapterOffset / currentChapter.charCount) * 100) : 0;

  return (
    <View className="flex gap-1">
      <View className="relative h-px w-full" style={{ backgroundColor: colors.outline }}>
        <View
          className="absolute left-0 top-0 h-full overflow-hidden rounded-full"
          style={{ width: `${bookProgress}%`, backgroundColor: colors.primary }}
        />

        <View
          className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
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

const CHARS_PER_PAGE = 1800;

export const BookCard = ({ book, onPress, toggleLabel, onDeletePress }: Props) => {
  const { t } = useTranslation('translation', { keyPrefix: 'bookLists' });
  const { toggleHaveRead } = useBookStore();
  const [menuVisible, setMenuVisible] = useState(false);
  const pageCount = Math.max(1, Math.round(book.misc.totalCharCount / CHARS_PER_PAGE));

  return (
    <Card onPress={onPress}>
      <View className="relative flex flex-row items-center gap-4 p-4">
        <View className="absolute right-2 top-2 z-10">
          <DropdownMenu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            elevation={3}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={(e) => {
                  e?.stopPropagation();
                  setMenuVisible(true);
                }}
                accessibilityLabel={t('moreOptions', { keyPrefix: 'common' })}
              />
            }>
            <DropdownMenu.Item onPress={() => toggleHaveRead(book.basePath)} title={toggleLabel} />
            <DropdownMenu.Item
              onPress={() => {
                setMenuVisible(false);
                onDeletePress();
              }}
              title={t('delete', { keyPrefix: 'common' })}
            />
          </DropdownMenu>
        </View>

        <Image className="h-48 w-32" source={{ uri: book.cover }} resizeMode="cover" />

        <View className="flex-1">
          <Text className="text-lg font-bold" numberOfLines={3}>
            {book.title}
          </Text>
          <Text className="text-md">{book.author}</Text>
          <Text className="text-sm opacity-60">{t('pages', { count: pageCount })}</Text>

          <View className="flex-1 justify-end">
            <BookProgress book={book} />
          </View>
        </View>
      </View>
    </Card>
  );
};
