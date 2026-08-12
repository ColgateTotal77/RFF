import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { ChapterCard } from 'pages/Reader/Overlay/BookHeader/BookHeaderNavigation/MenuChapters/ChapterCard';
import { TocItem } from 'types';
import { calculateBookProgress } from 'lib/utils';
import { useState, useMemo, useCallback } from 'react';
import { useWebViewStore, WebViewAction } from 'stores/useWebViewStore';
import { useTempStore } from 'stores/useTempStore';
import { useAppStore } from 'stores/useAppStore';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { View } from 'react-native';
import { loadWindow } from 'stores/actions';

type ChapterExtra = {
  parentIdsSet: Set<string>;
  currentChapterId: number;
  expandedParents: string[];
  onToggle: (tocId: string) => void;
  onPress: (tocItem: TocItem) => void;
};

const Separator = () => <View className="h-4" />;

const renderChapter = ({ item, extraData }: ListRenderItemInfo<TocItem>) => {
  const { parentIdsSet, currentChapterId, expandedParents, onToggle, onPress } =
    extraData as ChapterExtra;

  return (
    <ChapterCard
      tocItem={item}
      isCurrentChapter={item.chapterId === currentChapterId}
      hasChildren={parentIdsSet.has(item.id)}
      isExpanded={expandedParents.includes(item.id)}
      onToggle={() => onToggle(item.id)}
      onPress={() => onPress(item)}
    />
  );
};

export const MenuChapters = ({ onClose }: { onClose: () => void }) => {
  const currentBook = useCurrentBook();
  const updateMisc = useBookStore((state) => state.updateMisc);
  const executeImmediateActions = useWebViewStore((state) => state.executeImmediateActions);
  const addToPostLoadQueue = useWebViewStore((state) => state.addToPostLoadQueue);
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

  const onPress = useCallback(
    (tocItem: TocItem) => {
      addToBackStack({
        blockId: currentBook.currentBlock,
        scrollPercent: currentBook.misc.currentBlockScrollPercent,
      });

      const anchorId = tocItem.anchorId;
      const anchorBlockId = anchorId
        ? currentBook.mapping.chapterById[tocItem.chapterId]?.anchors[anchorId]
        : undefined;

      const targetBlockId =
        anchorBlockId ?? currentBook.mapping.firstBlockByChapterId[tocItem.chapterId];
      const scrollAction: WebViewAction = anchorId
        ? { type: 'scrollToFragment', fragmentId: anchorId }
        : { type: 'scrollToBlock', blockId: targetBlockId };

      if (currentBook.currentBlocks.includes(targetBlockId)) {
        setCurrentBlock(targetBlockId);
        executeImmediateActions([scrollAction]);
      } else {
        if (anchorId) addToPostLoadQueue(scrollAction);
        setGlobalLoading({ isLoading: true, message: 'Opening chapter…' });
        loadWindow(targetBlockId, 0);
      }

      updateMisc({
        percent: calculateBookProgress(currentBook, 0, targetBlockId),
      });

      onClose();
    },
    [
      currentBook,
      addToBackStack,
      setCurrentBlock,
      executeImmediateActions,
      addToPostLoadQueue,
      setGlobalLoading,
      updateMisc,
      onClose,
    ]
  );

  const toggleExpand = useCallback((tocId: string) => {
    setExpandedParents((prev) =>
      prev.includes(tocId) ? prev.filter((id) => id !== tocId) : [...prev, tocId]
    );
  }, []);

  const currentChapterIndex = visibleToc.findIndex((item) => item.id === currentTocChapter?.id);

  const extraData = useMemo<ChapterExtra>(
    () => ({ parentIdsSet, currentChapterId, expandedParents, onToggle: toggleExpand, onPress }),
    [parentIdsSet, currentChapterId, expandedParents, toggleExpand, onPress]
  );

  return (
    <FlashList
      data={visibleToc}
      extraData={extraData}
      renderItem={renderChapter}
      contentContainerClassName="p-4"
      ItemSeparatorComponent={Separator}
      initialScrollIndex={Math.max(0, currentChapterIndex - 3)}
    />
  );
};
