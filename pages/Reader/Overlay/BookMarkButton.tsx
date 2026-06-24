import { IconButton } from 'components/ui/IconButton';
import React, { useMemo } from 'react';
import { useBookStore } from 'stores/useBookStore';

export const BookMarkButton = () => {
  const currentBook = useBookStore((state) => state.currentBook);
  const addBookmark = useBookStore((state) => state.addBookmark);
  const removeBookmark = useBookStore((state) => state.removeBookmark);

  const activeBookmark = useMemo(() => {
    if (!currentBook) return null;
    return (currentBook.bookmarks ?? []).find(
      (bookmark) =>
        bookmark.blockId === currentBook.currentBlock &&
        Math.abs(bookmark.scrollPercent - currentBook.misc.currentBlockScrollPercent) < 0.05
    );
  }, [
    currentBook?.bookmarks,
    currentBook?.currentBlock,
    currentBook?.misc.currentBlockScrollPercent,
  ]);

  return (
    <IconButton
      icon={activeBookmark ? 'bookmark' : 'bookmark-outline'}
      size={28}
      accessibilityLabel={activeBookmark ? 'Remove bookmark' : 'Add bookmark'}
      style={{
        position: 'absolute',
        top: 16,
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
