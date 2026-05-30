import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { FlatList } from 'react-native';
import { ChapterCard } from './ChapterCard';
import { TocItem } from 'types';
import { calculateBookProgress } from 'lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { useWebViewStore } from 'stores/useWebViewStore';

export const MenuChapters = ({ onClose }: { onClose: () => void }) => {
  const currentBook = useCurrentBook();
  const updateMisc = useBookStore((state) => state.updateMisc);
  const executeImmediateAction = useWebViewStore((state) => state.executeImmediateAction);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);
  const setCurrentBlock = useBookStore((state) => state.setCurrentBlock);
  const loadWindow = useWebViewStore((state) => state.loadWindow);
  const chapterId = currentBook.mapping.blockIndex[currentBook.currentBlock].chapterId;
  const currentChapter = currentBook.mapping.tocByChapterId[chapterId]?.[0] ?? null;

  const parentIdsSet = useMemo(() => {
    const ids = new Set<string>();
    currentBook.toc.forEach((item) => {
      if (item.parentId) ids.add(item.parentId);
    });
    return ids;
  }, [currentBook.toc]);

  const visibleToc = useMemo(() => {
    return currentBook.toc.filter(
      (item) => !item.parentId || expandedParents.includes(item.parentId)
    );
  }, [expandedParents, currentBook.toc]);

  useEffect(() => {
    if (!currentChapter) return;

    const parentsToExpand: string[] = [];
    let currentParent = currentChapter.parentId;

    while (currentParent) {
      parentsToExpand.push(currentParent);
      currentParent = currentBook.mapping.tocById[currentParent].parentId;
    }

    setExpandedParents(parentsToExpand);
  }, [currentChapter]);

  const onPress = (tocItem: TocItem) => {
    const firstBlockId = currentBook.mapping.firstBlockByChapterId[tocItem.chapterId];

    if (currentBook.currentBlocks.includes(firstBlockId)) {
      setCurrentBlock(firstBlockId);
      executeImmediateAction({ type: 'scrollToBlock', blockId: firstBlockId });
    } else {
      loadWindow(firstBlockId, 0);
    }

    updateMisc({
      percent: calculateBookProgress(currentBook, 0, firstBlockId),
    });
    onClose();
  };

  const toggleExpand = (tocId: string) => {
    setExpandedParents((prev) =>
      prev.includes(tocId) ? prev.filter((id) => id !== tocId) : [...prev, tocId]
    );
  };

  const renderChapter = ({ item }: { item: TocItem }) => {
    const hasChildren = parentIdsSet.has(item.id);
    const isCurrentChapter = item.chapterId === chapterId;

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

  return (
    <FlatList
      data={visibleToc}
      keyExtractor={(item) => item.id}
      renderItem={renderChapter}
      contentContainerClassName="gap-4 p-4"
      initialNumToRender={15}
    />
  );
};
