import { View } from 'react-native';
import { useState } from 'react';
import { useBookStore } from 'stores/useBookStore';
import { Book, DrawerTab } from 'types';
import { BookCard } from 'pages/BookLists/BookCard';
import { useTempStore } from 'stores/useTempStore';
import { Banner } from 'pages/BookLists/AnkiBanner';
import { EmptyNoSearchResults } from 'pages/BookLists/EmptyNoSearchResults';
import { DeleteBookDialog } from 'pages/BookLists/DeleteBookDialog';
import { EmptyNoBooks } from 'pages/BookLists/EmptyNoBooks';
import { openBook } from 'stores/actions';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';

interface BookListScreenProps {
  tab: DrawerTab;
}

type BookExtra = {
  tab: DrawerTab;
  onDeletePress: (book: Book) => void;
};

const Separator = () => <View className="h-4" />;

const renderBook = ({ item, extraData }: ListRenderItemInfo<Book>) => {
  const { tab, onDeletePress } = extraData as BookExtra;

  return (
    <BookCard
      book={item}
      onPress={() => openBook(item.basePath)}
      tab={tab}
      onDeletePress={() => onDeletePress(item)}
    />
  );
};

export const BookListScreen = ({ tab }: BookListScreenProps) => {
  const books = useBookStore((state) => state.books);
  const bookListQuery = useTempStore((state) => state.bookListQuery);
  const removeBook = useBookStore((state) => state.removeBook);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  const extraData: BookExtra = { tab, onDeletePress: setBookToDelete };

  const filteredBooks = books.filter((book) => (tab === 'Have Read' ? book.misc.haveRead : !book.misc.haveRead) && book.title.toLowerCase().includes(bookListQuery));

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
