import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { ChapterCard } from 'pages/Reader/Overlay/BookHeader/BookHeaderNavigation/MenuChapters/ChapterCard';
import { TocItem } from 'types';
import { calculateBookProgress } from 'lib/utils';
import { useState, useMemo } from 'react';
import { useWebViewStore } from 'stores/useWebViewStore';
import { useTempStore } from 'stores/useTempStore';
import { useAppStore } from 'stores/useAppStore';
import { FlashList } from '@shopify/flash-list';
import { View } from 'react-native';
import { loadWindow } from 'stores/actions';

export const MenuChapters = ({ onClose }: { onClose: () => void }) => {
  const currentBook = useCurrentBook();
  const updateMisc = useBookStore((state) => state.updateMisc);
  const executeImmediateActions = useWebViewStore((state) => state.executeImmediateActions);
  const setCurrentBlock = useBookStore((state) => state.setCurrentBlock);
  const addToBackStack = useTempStore((state) => state.addToBackStack);
  const setGlobalLoading = useAppStore((state) => state.setGlobalLoading);
  const currentChapterId = currentBook.mapping.blockIndex[currentBook.currentBlock].chapterId;
  const currentTocChapter = currentBook.mapping.tocByChapterId[currentChapterId]?.[0] ?? null;
  const [expandedParents, setExpandedParents] = useState<string[]>(() => {
    if (!currentTocChapter) return [];

    const parentsToExpand: string[] = [];
    let currentParent = currentTocChapter.parentId;

    while (currentParent) {
      parentsToExpand.push(currentParent);
      currentParent = currentBook.mapping.tocById[currentParent].parentId;
    }

    return parentsToExpand;
  });

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

  const onPress = (tocItem: TocItem) => {
    addToBackStack({
      blockId: currentBook.currentBlock,
      scrollPercent: currentBook.misc.currentBlockScrollPercent,
    });

    const firstBlockId = currentBook.mapping.firstBlockByChapterId[tocItem.chapterId];

    if (currentBook.currentBlocks.includes(firstBlockId)) {
      setCurrentBlock(firstBlockId);
      executeImmediateActions([{ type: 'scrollToBlock', blockId: firstBlockId }]);
    } else {
      setGlobalLoading({ isLoading: true, message: 'Opening chapter…' });
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

  const currentChapterIndex = visibleToc.findIndex((item) => item.id === currentTocChapter?.id);

  return (
    <FlashList
      data={visibleToc}
      keyExtractor={(item) => item.id}
      renderItem={renderChapter}
      contentContainerStyle={{ padding: 16 }}
      ItemSeparatorComponent={() => <View className="h-4" />}
      initialScrollIndex={Math.max(0, currentChapterIndex - 3)}
    />
  );
};
