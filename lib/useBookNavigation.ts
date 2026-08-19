import { useBookStore } from 'stores/useBookStore';
import { useTempStore } from 'stores/useTempStore';
import { calculateBookProgress } from 'lib/utils';
import { useWebViewStore } from 'stores/useWebViewStore';
import { useAppStore } from 'stores/useAppStore';
import { loadWindow } from 'stores/actions';

export const useJumpToNextSearchResult = () => {
  const currentSearchResult = useTempStore((state) => state.currentSearchResult);
  const setCurrentSearchResult = useTempStore((state) => state.setCurrentSearchResult);
  const searchResults = useTempStore((state) => state.searchResults);
  const executeImmediateActions = useWebViewStore((state) => state.executeImmediateActions);
  const addToPostLoadQueue = useWebViewStore((state) => state.addToPostLoadQueue);
  const updateMisc = useBookStore((state) => state.updateMisc);
  const setCurrentBlock = useBookStore((state) => state.setCurrentBlock);
  const currentBook = useBookStore((state) => state.currentBook);
  const setGlobalLoading = useAppStore((state) => state.setGlobalLoading);

  return () => {
    if (!currentBook) return;
    const newSearchResult = searchResults.find(
      (result) => result.id === currentSearchResult.id + 1
    );

    if (!newSearchResult) return;

    if (!currentBook.currentBlocks.includes(newSearchResult.blockId)) {
      addToPostLoadQueue({
        type: 'jumpToSearch',
        blockId: newSearchResult.blockId,
        occurrenceIndex: newSearchResult.occurrenceIndex,
      });
      setGlobalLoading({ isLoading: true, message: 'Loading result…' });
      loadWindow(newSearchResult.blockId, 0);
    } else {
      setCurrentBlock(newSearchResult.blockId);
      executeImmediateActions([
        {
          type: 'jumpToSearch',
          blockId: newSearchResult.blockId,
          occurrenceIndex: newSearchResult.occurrenceIndex,
        },
      ]);
    }

    updateMisc({
      percent: calculateBookProgress(currentBook, 0, newSearchResult.blockId),
    });

    setCurrentSearchResult(newSearchResult);
  };
};

export const useJumpToPrevSearchResult = () => {
  const currentSearchResult = useTempStore((state) => state.currentSearchResult);
  const setCurrentSearchResult = useTempStore((state) => state.setCurrentSearchResult);
  const searchResults = useTempStore((state) => state.searchResults);
  const executeImmediateActions = useWebViewStore((state) => state.executeImmediateActions);
  const addToPostLoadQueue = useWebViewStore((state) => state.addToPostLoadQueue);
  const updateMisc = useBookStore((state) => state.updateMisc);
  const currentBook = useBookStore((state) => state.currentBook);
  const setCurrentBlock = useBookStore((state) => state.setCurrentBlock);
  const setGlobalLoading = useAppStore((state) => state.setGlobalLoading);

  return () => {
    if (!currentBook) return;
    const newSearchResult = searchResults.find(
      (result) => result.id === currentSearchResult.id - 1
    );

    if (!newSearchResult) return;

    if (!currentBook.currentBlocks.includes(newSearchResult.blockId)) {
      addToPostLoadQueue({
        type: 'jumpToSearch',
        blockId: newSearchResult.blockId,
        occurrenceIndex: newSearchResult.occurrenceIndex,
      });
      setGlobalLoading({ isLoading: true, message: 'Loading result…' });
      loadWindow(newSearchResult.blockId, 0);
    } else {
      setCurrentBlock(newSearchResult.blockId);
      executeImmediateActions([
        {
          type: 'jumpToSearch',
          blockId: newSearchResult.blockId,
          occurrenceIndex: newSearchResult.occurrenceIndex,
        },
      ]);
    }

    updateMisc({
      percent: calculateBookProgress(currentBook, 0, newSearchResult.blockId),
    });
    setCurrentSearchResult(newSearchResult);
  };
};

export const useProcessBookLinks = () => {
  const executeImmediateActions = useWebViewStore((state) => state.executeImmediateActions);
  const addToPostLoadQueue = useWebViewStore((state) => state.addToPostLoadQueue);
  const currentBook = useBookStore((state) => state.currentBook);
  const addToBackStack = useTempStore((state) => state.addToBackStack);
  const setGlobalLoading = useAppStore((state) => state.setGlobalLoading);

  return (chapterId: number, fragmentId: string) => {
    if (!currentBook) return;
    const chapter = currentBook.mapping.chapterById[chapterId];

    if (!fragmentId) {
      const blockId = chapter.blockIds[0];
      addToBackStack({
        blockId: currentBook.currentBlock,
        scrollPercent: currentBook.misc.currentBlockScrollPercent,
      });
      if (!currentBook.currentBlocks.includes(blockId)) {
        setGlobalLoading({ isLoading: true, message: 'Opening link…' });
        loadWindow(blockId, 0);
      } else {
        executeImmediateActions([{ type: 'scrollToBlock', blockId, scrollPercent: 0 }]);
      }
      return;
    }

    const blockId = chapter.anchors[fragmentId];
    if (!blockId) return;

    addToBackStack({
      blockId: currentBook.currentBlock,
      scrollPercent: currentBook.misc.currentBlockScrollPercent,
    });

    if (!currentBook.currentBlocks.includes(blockId)) {
      addToPostLoadQueue({ type: 'scrollToFragment', fragmentId });
      setGlobalLoading({ isLoading: true, message: 'Opening link…' });
      loadWindow(blockId, 0);
    } else {
      executeImmediateActions([{ type: 'scrollToFragment', fragmentId }]);
    }
  };
};
