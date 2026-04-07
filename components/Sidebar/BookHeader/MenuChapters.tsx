import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { FlatList } from 'react-native';
import { ChapterCard } from 'components/Sidebar/BookHeader/ChapterCard';
import { Chapter } from 'types';
import { calculateBookProgress } from 'lib/utils';

export const MenuChapters = ({ onClose }: { onClose: () => void }) => {
  const currentBook = useCurrentBook();
  const jumpToBlock = useBookStore((state) => state.jumpToBlock);
  const scrollToBlockAction = useBookStore((state) => state.scrollToBlockAction);
  const updateMisc = useBookStore((state) => state.updateMisc);

  const onPress = (chapter: Chapter) => {
    const firstBlockId = chapter.blockIds[0];
    if (!firstBlockId && firstBlockId !== 0) return;

    if (currentBook.currentBlocks.find((b) => b === firstBlockId)) {
      scrollToBlockAction(firstBlockId);
    } else {
      jumpToBlock(firstBlockId);
    }

    updateMisc({
      percent: calculateBookProgress(currentBook, chapter.id, 0),
    });
    onClose();
  };

  const renderChapter = ({ item }: { item: Chapter }) => {
    return (
      <ChapterCard
        isCurrentChapter={item.blockIds.includes(currentBook.currentBlock)}
        chapter={item}
        onPress={() => onPress(item)}
      />
    );
  };

  return (
    <FlatList
      data={currentBook.chapters}
      keyExtractor={(chapter) => chapter.id.toString()}
      renderItem={renderChapter}
      contentContainerClassName="p-4 gap-4"
      initialNumToRender={15}
    />
  );
};
