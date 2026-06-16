import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { FlatList } from 'react-native';
import { Bookmark } from 'types';
import { BookmarkCard } from './BookmarkCard';
import { calculateBookProgress } from 'lib/utils';
import { useWebViewStore } from 'stores/useWebViewStore';

interface Props {
  onClose: () => void;
}

export const MenuBookmarks = ({ onClose }: Props) => {
  const currentBook = useCurrentBook();
  const updateMisc = useBookStore((state) => state.updateMisc);
  const executeImmediateActions = useWebViewStore((state) => state.executeImmediateActions);
  const addToPostLoadQueue = useWebViewStore((state) => state.addToPostLoadQueue);
  const setCurrentBlock = useBookStore((state) => state.setCurrentBlock);
  const loadWindow = useWebViewStore((state) => state.loadWindow);

  const onPress = (bookmark: Bookmark) => {
    if (currentBook.currentBlocks.includes(bookmark.blockId)) {
      setCurrentBlock(bookmark.blockId);
      executeImmediateActions([
        {
          type: 'scrollToBlock',
          blockId: bookmark.blockId,
          scrollPercent: bookmark.scrollPercent,
        },
      ]);
    } else {
      addToPostLoadQueue({
        type: 'scrollToBlock',
        blockId: bookmark.blockId,
        scrollPercent: bookmark.scrollPercent,
      });
      loadWindow(bookmark.blockId, 0);
    }
    updateMisc({
      percent: calculateBookProgress(currentBook, bookmark.scrollPercent, bookmark.blockId),
    });
    onClose();
  };

  const renderBookmarkCard = ({ item }: { item: Bookmark }) => (
    <BookmarkCard bookmark={item} onPress={() => onPress(item)} />
  );

  return (
    <FlatList
      data={currentBook.bookmarks || []}
      keyExtractor={(bookmark) => bookmark.id.toString()}
      renderItem={renderBookmarkCard}
      contentContainerClassName="gap-4 p-4"
      initialNumToRender={15}
    />
  );
};
