import { FlatList } from 'react-native';
import { useBookStore } from 'stores/useBookStore';
import { useNavigation } from '@react-navigation/native';
import { BookCard } from 'pages/HaveRead/BookCard';
import { Book, RootDrawerNavigationProp } from 'types';
import { useTempStore } from 'stores/useTempStore';

export const HaveReadScreen = () => {
  const books = useBookStore((state) => state.books);
  const openBook = useBookStore((state) => state.openBook);
  const closeMenu = useTempStore((state) => state.closeSelectionMenu);

  const navigation = useNavigation<RootDrawerNavigationProp>();

  const onPress = (basePath: string) => {
    closeMenu();
    openBook(basePath);
    navigation.navigate('Reader');
  };

  const renderBook = ({ item }: { item: Book }) => (
    <BookCard book={item} onPress={() => onPress(item.basePath)} />
  );

  return (
    <FlatList
      data={books.filter((b) => b.misc.haveRead)}
      keyExtractor={(book) => book.basePath}
      renderItem={renderBook}
      contentContainerClassName="p-4 gap-4"
    />
  );
};
