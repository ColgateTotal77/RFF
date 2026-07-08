import { FlatList } from 'react-native';
import { useBookStore } from 'stores/useBookStore';
import { Book } from 'types';
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
  const decks = useAnkiStore((state) => state.decks);
  const theme = useTheme();

  const filteredBooks = books.filter(filterFn);

  if (books.length === 0 && !decks.length) return <EmptyNoAnki />;
  if (filteredBooks.length === 0) return <EmptyNoBooks />;

  const renderBook = ({ item }: { item: Book }) => (
    <BookCard book={item} onPress={() => openBook(item.basePath)} toggleLabel={toggleLabel} />
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
