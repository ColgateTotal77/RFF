import { Card, IconButton, Text } from 'react-native-paper';
import { View } from 'react-native';
import React from 'react';
import { Bookmark } from 'types';
import { useBookStore } from 'stores/useBookStore';

interface Props {
  bookmark: Bookmark;
  onPress: () => void;
}

export const BookmarkCard = (props: Props) => {
  const { bookmark, onPress } = props;
  const removeBookmark = useBookStore((state) => state.removeBookmark);

  return (
    <Card onPress={onPress}>
      <View className="flex-row items-center">
        <View className="flex-1 gap-1 p-4">
          <Text>{bookmark.title}</Text>
          <Text className="text-sm text-gray-500">{'[' + bookmark.blockId + ']'}</Text>
        </View>
        <IconButton icon="delete" onPress={() => removeBookmark(bookmark.id)} />
      </View>
    </Card>
  );
};
