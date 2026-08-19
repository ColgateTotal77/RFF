import { useState } from 'react';
import { useBookStore } from 'stores/useBookStore';
import { View } from 'react-native';
import { Bookmark } from 'types';
import { BookmarkCard } from 'pages/Reader/Overlay/BookHeader/BookHeaderNavigation/MenuBookmarks/BookmarkCard';
import { RenameBookmarkDialog } from 'pages/Reader/Overlay/BookHeader/BookHeaderNavigation/MenuBookmarks/RenameBookmarkDialog';
import { calculateBookProgress } from 'lib/utils';
import { useWebViewStore } from 'stores/useWebViewStore';
import { useTempStore } from 'stores/useTempStore';
import { useAppStore } from 'stores/useAppStore';
import { loadWindow } from 'stores/actions';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';

interface Props {
  onClose: () => void;
}

type BookmarkExtra = {
  onPress: (bookmark: Bookmark) => void;
  onRename: (bookmark: Bookmark) => void;
};

const Separator = () => <View className="h-4" />;

const renderBookmarkCard = ({ item, extraData }: ListRenderItemInfo<Bookmark>) => {
  const { onPress, onRename } = extraData as BookmarkExtra;

  return (
    <BookmarkCard bookmark={item} onPress={() => onPress(item)} onRename={() => onRename(item)} />
  );
};

export const MenuBookmarks = ({ onClose }: Props) => {
  const currentBook = useBookStore((state) => state.currentBook);
  const updateMisc = useBookStore((state) => state.updateMisc);
  const updateBookmark = useBookStore((state) => state.updateBookmark);
  const executeImmediateActions = useWebViewStore((state) => state.executeImmediateActions);
  const addToPostLoadQueue = useWebViewStore((state) => state.addToPostLoadQueue);
  const setCurrentBlock = useBookStore((state) => state.setCurrentBlock);
  const addToBackStack = useTempStore((state) => state.addToBackStack);
  const setGlobalLoading = useAppStore((state) => state.setGlobalLoading);
  const [renamingBookmark, setRenamingBookmark] = useState<Bookmark | null>(null);

  if (!currentBook) return;

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

  const extraData: BookmarkExtra = {
    onPress,
    onRename: setRenamingBookmark,
  };

  return (
    <>
      <FlashList
        data={currentBook.bookmarks}
        extraData={extraData}
        renderItem={renderBookmarkCard}
        contentContainerClassName="p-4"
        ItemSeparatorComponent={Separator}
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
