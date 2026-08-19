import { useBookStore } from 'stores/useBookStore';
import { ChapterCard } from 'pages/Reader/Overlay/BookHeader/BookHeaderNavigation/MenuChapters/ChapterCard';
import { TocItem } from 'types';
import { calculateBookProgress } from 'lib/utils';
import { useState } from 'react';
import { useWebViewStore, WebViewAction } from 'stores/useWebViewStore';
import { useTempStore } from 'stores/useTempStore';
import { useAppStore } from 'stores/useAppStore';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { View } from 'react-native';
import { loadWindow } from 'stores/actions';

type ChapterExtra = {
  parentIdsSet: Set<string>;
  currentChapterId: number | undefined;
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
  const currentBook = useBookStore((state) => state.currentBook);
  const updateMisc = useBookStore((state) => state.updateMisc);
  const executeImmediateActions = useWebViewStore((state) => state.executeImmediateActions);
  const addToPostLoadQueue = useWebViewStore((state) => state.addToPostLoadQueue);
  const setCurrentBlock = useBookStore((state) => state.setCurrentBlock);
  const addToBackStack = useTempStore((state) => state.addToBackStack);
  const setGlobalLoading = useAppStore((state) => state.setGlobalLoading);

  const currentChapterId = currentBook?.mapping.blockIndex[currentBook.currentBlock]?.chapterId;
  const currentTocChapter =
    currentChapterId != null
      ? (currentBook?.mapping.tocByChapterId[currentChapterId]?.[0] ?? null)
      : null;

  const [expandedParents, setExpandedParents] = useState<string[]>(() => {
    if (!currentTocChapter) return [];

    const parentsToExpand: string[] = [];
    let currentParent = currentTocChapter.parentId;

    while (currentParent) {
      parentsToExpand.push(currentParent);
      currentParent = currentBook?.mapping.tocById[currentParent].parentId;
    }

    return parentsToExpand;
  });

  if (!currentBook) return;

  const parentIdsSet = new Set<string>();
  currentBook.toc.forEach((item) => {
    if (item.parentId) parentIdsSet.add(item.parentId);
  });

  const visibleToc = currentBook.toc.filter(
    (item) => !item.parentId || expandedParents.includes(item.parentId)
  );

  const onPress = (tocItem: TocItem) => {
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
  };

  const toggleExpand = (tocId: string) => {
    setExpandedParents((prev) =>
      prev.includes(tocId) ? prev.filter((id) => id !== tocId) : [...prev, tocId]
    );
  };

  const currentChapterIndex = visibleToc.findIndex((item) => item.id === currentTocChapter?.id);

  const extraData: ChapterExtra = {
    parentIdsSet,
    currentChapterId,
    expandedParents,
    onToggle: toggleExpand,
    onPress,
  };

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
