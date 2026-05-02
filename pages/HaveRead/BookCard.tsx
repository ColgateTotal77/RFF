import { Book } from 'types';
import { useState } from 'react';
import { Card, Text, IconButton, Menu } from 'react-native-paper';
import { View, Image } from 'react-native';
import { useBookStore } from 'stores/useBookStore';

interface Props {
  book: Book;
  onPress: () => void;
}

export const BookCard = ({ book, onPress }: Props) => {
  const { removeBook } = useBookStore();
  const { toggleHaveRead } = useBookStore();
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <Card className="bg-white" onPress={onPress}>
      <View className="relative flex flex-row items-center gap-4 p-4">
        <View className="absolute right-2 top-2 z-10">
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            elevation={1}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={(e) => {
                  e?.stopPropagation();
                  setMenuVisible(true);
                }}
              />
            }>
            <Menu.Item onPress={() => {}} title="Item 1" />
            <Menu.Item onPress={() => toggleHaveRead(book.basePath)} title="Remove have read" />
            <Menu.Item onPress={() => removeBook(book.basePath)} title="Delete" />
          </Menu>
        </View>

        <View className="overflow-hidden rounded-md bg-gray-200">
          <Image className="h-48 w-32" source={{ uri: book.cover }} resizeMode="cover" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold" numberOfLines={3}>
            {book.title}
          </Text>
          <Text className="text-md">{book.author}</Text>
        </View>
      </View>
    </Card>
  );
};
