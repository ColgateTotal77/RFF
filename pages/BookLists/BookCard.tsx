import { Book } from 'types';
import { useState } from 'react';
import { Card, Text } from 'react-native-paper';
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
                accessibilityLabel="More options"
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
        </View>
      </View>
    </Card>
  );
};
