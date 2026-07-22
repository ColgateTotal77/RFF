import { useState } from 'react';
import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { FlatList } from 'react-native';
import { Bookmark } from 'types';
import { BookmarkCard } from 'pages/Reader/Overlay/BookHeader/BookHeaderNavigation/MenuBookmarks/BookmarkCard';
import { RenameBookmarkDialog } from 'pages/Reader/Overlay/BookHeader/BookHeaderNavigation/MenuBookmarks/RenameBookmarkDialog';
import { calculateBookProgress } from 'lib/utils';
import { useWebViewStore } from 'stores/useWebViewStore';
import { useTempStore } from 'stores/useTempStore';
import { useAppStore } from 'stores/useAppStore';
import { loadWindow } from 'stores/actions';

interface Props {
  onClose: () => void;
}

export const MenuBookmarks = ({ onClose }: Props) => {
  const currentBook = useCurrentBook();
  const updateMisc = useBookStore((state) => state.updateMisc);
  const updateBookmark = useBookStore((state) => state.updateBookmark);
  const executeImmediateActions = useWebViewStore((state) => state.executeImmediateActions);
  const addToPostLoadQueue = useWebViewStore((state) => state.addToPostLoadQueue);
  const setCurrentBlock = useBookStore((state) => state.setCurrentBlock);
  const addToBackStack = useTempStore((state) => state.addToBackStack);
  const setGlobalLoading = useAppStore((state) => state.setGlobalLoading);
  const [renamingBookmark, setRenamingBookmark] = useState<Bookmark | null>(null);

  const onPress = (bookmark: Bookmark) => {
    addToBackStack({
      blockId: currentBook.currentBlock,
      scrollPercent: currentBook.misc.currentBlockScrollPercent,
    });

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
      setGlobalLoading({ isLoading: true, message: 'Opening bookmark…' });
      loadWindow(bookmark.blockId, 0);
    }

    updateMisc({
      percent: calculateBookProgress(currentBook, bookmark.scrollPercent, bookmark.blockId),
    });

    onClose();
  };

  const renderBookmarkCard = ({ item }: { item: Bookmark }) => (
    <BookmarkCard
      bookmark={item}
      onPress={() => onPress(item)}
      onRename={() => setRenamingBookmark(item)}
    />
  );

  return (
    <>
      <FlatList
        data={currentBook.bookmarks || []}
        keyExtractor={(bookmark) => bookmark.id.toString()}
        renderItem={renderBookmarkCard}
        contentContainerClassName="gap-4 p-4"
        initialNumToRender={15}
      />

      <RenameBookmarkDialog
        isOpen={renamingBookmark !== null}
        initialTitle={renamingBookmark?.title ?? ''}
        onConfirm={(title) => {
          if (renamingBookmark) updateBookmark(renamingBookmark.id, { title });
          setRenamingBookmark(null);
        }}
        onClose={() => setRenamingBookmark(null)}
      />
    </>
  );
};
