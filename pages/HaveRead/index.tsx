import { FlatList } from 'react-native';
import { useBookStore } from 'stores/useBookStore';
import { useNavigation } from '@react-navigation/native';
import { Book, RootDrawerNavigationProp } from 'types';
import { useTempStore } from 'stores/useTempStore';
import { BookCard } from 'pages/ReadingNow/BookCard';

// TODO(23): merge with ReadingNow into BookListScreen (filter + toggleLabel props)
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
    <BookCard book={item} onPress={() => onPress(item.basePath)} toggleLabel="Have read" />
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
