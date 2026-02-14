import { View, Image, FlatList } from 'react-native';
import { useBookStore } from 'stores/useBookStore';
import { Text, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Book } from 'lib/types';

export const ReadingNowScreen = () => {
  const { books, openBook } = useBookStore();
  const navigation = useNavigation();

  const onOpen = (basePath: string) => {
    openBook(basePath);
    navigation.navigate('Reader');
  };

  const renderBook = ({ item: book }: { item: Book }) => (
    <Card className="bg-white" onPress={() => onOpen(book.basePath)}>
      <View className="flex flex-row items-center gap-4 p-4">
        <View className="overflow-hidden rounded-md bg-gray-200">
          <Image className="h-48 w-32" source={{ uri: book.cover }} resizeMode="cover" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-red-900" numberOfLines={3}>
            {book.title}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <FlatList
      data={books}
      keyExtractor={(book) => book.basePath}
      renderItem={renderBook}
      contentContainerClassName="p-4 gap-4"
    />
  );
};
