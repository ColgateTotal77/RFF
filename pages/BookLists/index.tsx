import { FlatList } from 'react-native';
import { useBookStore } from 'stores/useBookStore';
import { useNavigation } from '@react-navigation/native';
import { Book, RootDrawerNavigationProp } from 'types';
import { useTempStore } from 'stores/useTempStore';
import { BookCard } from 'pages/BookLists/BookCard';

interface BookListScreenProps {
  filterFn: (book: Book) => boolean;
  toggleLabel: string;
}

export const BookListScreen = ({ filterFn, toggleLabel }: BookListScreenProps) => {
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
    <BookCard book={item} onPress={() => onPress(item.basePath)} toggleLabel={toggleLabel} />
  );

  const filteredBooks = books.filter(filterFn);

  return (
    <FlatList
      data={filteredBooks}
      keyExtractor={(book) => book.basePath}
      renderItem={renderBook}
      contentContainerClassName="p-4 gap-4"
    />
  );
};
