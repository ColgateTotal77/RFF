import { FlatList } from 'react-native';
import { useBookStore } from 'stores/useBookStore';
import { useNavigation } from '@react-navigation/native';
import { BookCard } from 'pages/ReadingNow/BookCard';
import { Book, RootDrawerNavigationProp } from 'types';

export const ReadingNowScreen = () => {
  const { books, openBook } = useBookStore();
  const navigation = useNavigation<RootDrawerNavigationProp>();

  const onPress = (basePath: string) => {
    openBook(basePath);
    navigation.navigate('Reader');
  };

  const renderBook = ({ item }: { item: Book }) => (
    <BookCard book={item} onPress={() => onPress(item.basePath)} />
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
