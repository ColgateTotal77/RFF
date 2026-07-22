import { FlatList } from 'react-native';
import { useState } from 'react';
import { useBookStore } from 'stores/useBookStore';
import { Book } from 'types';
import { BookCard } from 'pages/BookLists/BookCard';
import { useAnkiStore } from 'stores/useAnkiStore';
import { useTempStore } from 'stores/useTempStore';
import { EmptyNoAnki } from 'pages/BookLists/EmptyNoAnki';
import { EmptyNoSearchResults } from 'pages/BookLists/EmptyNoSearchResults';
import { DeleteBookDialog } from 'pages/BookLists/DeleteBookDialog';
import { EmptyNoBooks } from 'pages/BookLists/EmptyNoBooks';
import { openBook } from 'stores/actions';

interface BookListScreenProps {
  filterFn: (book: Book) => boolean;
  toggleLabel: string;
}

export const BookListScreen = ({ filterFn, toggleLabel }: BookListScreenProps) => {
  const books = useBookStore((state) => state.books);
  const removeBook = useBookStore((state) => state.removeBook);
  const decks = useAnkiStore((state) => state.decks);
  const bookListQuery = useTempStore((state) => state.bookListQuery);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  const filteredBooks = books.filter(filterFn);

  if (books.length === 0 && !decks.length) return <EmptyNoAnki />;
  if (filteredBooks.length === 0) {
    return bookListQuery !== '' ? <EmptyNoSearchResults /> : <EmptyNoBooks />;
  }

  const renderBook = ({ item }: { item: Book }) => (
    <BookCard
      book={item}
      onPress={() => openBook(item.basePath)}
      toggleLabel={toggleLabel}
      onDeletePress={() => setBookToDelete(item)}
    />
  );

  return (
    <>
      <FlatList
        data={filteredBooks}
        keyExtractor={(book) => book.basePath}
        renderItem={renderBook}
        contentContainerClassName="p-4 gap-4"
      />
      <DeleteBookDialog
        isOpen={bookToDelete !== null}
        bookTitle={bookToDelete?.title ?? ''}
        onConfirm={() => bookToDelete && removeBook(bookToDelete.basePath)}
        onClose={() => setBookToDelete(null)}
      />
    </>
  );
};
