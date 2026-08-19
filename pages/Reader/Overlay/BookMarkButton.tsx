import { IconButton } from 'components/ui/IconButton';
import React from 'react';
import { useBookStore } from 'stores/useBookStore';

export const BookMarkButton = () => {
  const currentBook = useBookStore((state) => state.currentBook);
  const addBookmark = useBookStore((state) => state.addBookmark);
  const removeBookmark = useBookStore((state) => state.removeBookmark);

  const activeBookmark = currentBook
    ? (currentBook.bookmarks ?? []).find(
        (bookmark) =>
          bookmark.blockId === currentBook.currentBlock &&
          Math.abs(bookmark.scrollPercent - currentBook.misc.currentBlockScrollPercent) < 0.05
      )
    : null;

  return (
    <IconButton
      icon={activeBookmark ? 'bookmark' : 'bookmark-outline'}
      size={28}
      accessibilityLabel={activeBookmark ? 'Remove bookmark' : 'Add bookmark'}
      style={{
        position: 'absolute',
        top: 116,
        right: 16,
        zIndex: 50,
        elevation: 5,
      }}
      onPress={() => {
        if (activeBookmark) removeBookmark(activeBookmark.id);
        else addBookmark();
      }}
    />
  );
};
