import { FlatList } from 'react-native';
import { useBookStore } from 'stores/useBookStore';
import { useNavigation } from '@react-navigation/native';
import { Book, RootDrawerNavigationProp } from 'types';
import { useTempStore } from 'stores/useTempStore';
import { BookCard } from 'pages/BookLists/BookCard';
import { useTheme } from 'react-native-paper';
import { useAnkiStore } from 'stores/useAnkiStore';
import { EmptyNoAnki } from 'pages/BookLists/EmptyNoAnki';
import { EmptyNoBooks } from 'pages/BookLists/EmptyNoBooks';

interface BookListScreenProps {
  filterFn: (book: Book) => boolean;
  toggleLabel: string;
}

export const BookListScreen = ({ filterFn, toggleLabel }: BookListScreenProps) => {
  const books = useBookStore((state) => state.books);
  const openBook = useBookStore((state) => state.openBook);
  const closeMenu = useTempStore((state) => state.closeSelectionMenu);
  const hasDeck = useAnkiStore((state) => state.hasDeck);
  const theme = useTheme();

  const navigation = useNavigation<RootDrawerNavigationProp>();
  const filteredBooks = books.filter(filterFn);

  if (books.length === 0 && !hasDeck()) return <EmptyNoAnki />;
  if (filteredBooks.length === 0) return <EmptyNoBooks />;

  const onPress = (basePath: string) => {
    closeMenu();
    openBook(basePath);
    navigation.navigate('Reader');
  };

  const renderBook = ({ item }: { item: Book }) => (
    <BookCard book={item} onPress={() => onPress(item.basePath)} toggleLabel={toggleLabel} />
  );

  return (
    <FlatList
      data={filteredBooks}
      style={{ backgroundColor: theme.colors.background }}
      keyExtractor={(book) => book.basePath}
      renderItem={renderBook}
      contentContainerClassName="p-4 gap-4"
    />
  );
};
