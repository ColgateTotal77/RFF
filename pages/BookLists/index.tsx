import { View } from 'react-native';
import { useState, useMemo } from 'react';
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
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';

interface BookListScreenProps {
  filterFn: (book: Book) => boolean;
  toggleLabel: string;
}

type BookExtra = {
  toggleLabel: string;
  onDeletePress: (book: Book) => void;
};

const Separator = () => <View className="h-4" />;

const renderBook = ({ item, extraData }: ListRenderItemInfo<Book>) => {
  const { toggleLabel, onDeletePress } = extraData as BookExtra;

  return (
    <BookCard
      book={item}
      onPress={() => openBook(item.basePath)}
      toggleLabel={toggleLabel}
      onDeletePress={() => onDeletePress(item)}
    />
  );
};

export const BookListScreen = ({ filterFn, toggleLabel }: BookListScreenProps) => {
  const books = useBookStore((state) => state.books);
  const removeBook = useBookStore((state) => state.removeBook);
  const decks = useAnkiStore((state) => state.decks);
  const bookListQuery = useTempStore((state) => state.bookListQuery);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  const extraData = useMemo<BookExtra>(
    () => ({ toggleLabel, onDeletePress: setBookToDelete }),
    [toggleLabel]
  );

  const filteredBooks = books.filter(filterFn);

  if (books.length === 0 && !decks.length) return <EmptyNoAnki />;
  if (filteredBooks.length === 0) {
    return bookListQuery !== '' ? <EmptyNoSearchResults /> : <EmptyNoBooks />;
  }

  return (
    <>
      <FlashList
        data={filteredBooks}
        extraData={extraData}
        renderItem={renderBook}
        contentContainerClassName="p-4"
        ItemSeparatorComponent={Separator}
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
