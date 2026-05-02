import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { FlatList } from 'react-native';
import { ChapterCard } from 'components/Sidebar/BookHeader/ChapterCard';
import { TocItem } from 'types';
import { calculateBookProgress } from 'lib/utils';
import { useState, useEffect } from 'react';

export const MenuChapters = ({ onClose }: { onClose: () => void }) => {
  const currentBook = useCurrentBook();
  const jumpToBlock = useBookStore((state) => state.jumpToBlock);
  const scrollToBlockAction = useBookStore((state) => state.scrollToBlockAction);
  const updateMisc = useBookStore((state) => state.updateMisc);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);

  const currentChapterId = currentBook.blocks.find(
    (block) => block.id === currentBook.currentBlock
  )?.chapterId;

  const currentChapter = currentBook.toc.find((item) => item.chapterId === currentChapterId);

  useEffect(() => {
    if (currentChapter) {
      const parentsToExpand: string[] = [];
      let currentParent = currentChapter.parentId;

      while (currentParent) {
        parentsToExpand.push(currentParent);
        const parentChapter = currentBook.toc.find((item) => item.id === currentParent);
        currentParent = parentChapter?.parentId;
      }

      setExpandedParents(parentsToExpand);
    }
  }, [currentChapterId]);

  const onPress = (tocItem: TocItem) => {
    const firstBlockId = currentBook.blocks.find((block) => block.chapterId === tocItem.chapterId)?.id;
    if (!firstBlockId && firstBlockId !== 0) return;

    if (currentBook.currentBlocks.find((b) => b === firstBlockId)) {
      scrollToBlockAction(firstBlockId);
    } else {
      jumpToBlock(firstBlockId);
    }

    updateMisc({
      percent: calculateBookProgress(currentBook, tocItem.chapterId, 0),
    });
    onClose();
  };

  const toggleExpand = (tocId: string) => {
    setExpandedParents(
      (prev) =>
        prev.includes(tocId)
          ? prev.filter((id) => id !== tocId)
          : [...prev, tocId]
    );
  };

  const renderChapter = ({ item }: { item: TocItem }) => {
    const hasChildren = currentBook.toc.some((child) => child.parentId === item.id);
    const isCurrentChapter = item.chapterId === currentChapterId;

    return (
      <ChapterCard
        tocItem={item}
        isCurrentChapter={isCurrentChapter}
        hasChildren={hasChildren}
        isExpanded={expandedParents.includes(item.id)}
        onToggle={() => toggleExpand(item.id)}
        onPress={() => onPress(item)}
      />
    );
  };


  const visibleToc = currentBook.toc.filter(
    (item) => !item.parentId || expandedParents.includes(item.parentId)
  );

  return (
    <FlatList
      data={visibleToc}
      keyExtractor={(item) => item.id}
      renderItem={renderChapter}
      contentContainerClassName="p-4 gap-4"
      initialNumToRender={15}
    />
  );
};
