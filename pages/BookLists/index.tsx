import { View } from 'react-native';
import { useState } from 'react';
import { useBookStore } from 'stores/useBookStore';
import { Book } from 'types';
import { BookCard } from 'pages/BookLists/BookCard';
import { useTempStore } from 'stores/useTempStore';
import { Banner } from 'pages/BookLists/AnkiBanner';
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
  const bookListQuery = useTempStore((state) => state.bookListQuery);
  const removeBook = useBookStore((state) => state.removeBook);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  const extraData: BookExtra = { toggleLabel, onDeletePress: setBookToDelete };

  const filteredBooks = books.filter(filterFn);

  if (filteredBooks.length === 0 && bookListQuery !== '') return <EmptyNoSearchResults />;

  return (
    <>
      <FlashList
        data={filteredBooks}
        extraData={extraData}
        renderItem={renderBook}
        contentContainerClassName="p-4"
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={Banner}
        ListEmptyComponent={EmptyNoBooks}
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
