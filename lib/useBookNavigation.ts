import { RefObject } from 'react';
import { WebView } from 'react-native-webview';
import { findNodeHandle, View } from 'react-native';
import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { BookEngine } from 'modules/book-engine';
import { useTempStore } from 'stores/useTempStore';
import { calculateBookProgress } from 'lib/utils';
import { Book } from 'types';

export const shiftNext = (currentBook: Book): { fetchIndex: number; removeIndex: number | null; newWindow: number[] } | null => {
  if (!currentBook) return null;

  const lastRendered = currentBook.currentBlocks[currentBook.currentBlocks.length - 1];
  const fetchIndex = lastRendered + 1;

  if (fetchIndex >= currentBook.blocks.length) return null;

  let newWindow = [...currentBook.currentBlocks, fetchIndex];
  let removeIndex: number | null = null;

  if (newWindow.length > 3) {
    removeIndex = newWindow.shift() || null;
  }

  return { fetchIndex, removeIndex, newWindow };
};

export const shiftPrev = (currentBook: Book): { fetchIndex: number; removeIndex: number | null; newWindow: number[] } | null => {
  if (!currentBook) return null;

  const firstRendered = currentBook.currentBlocks[0];
  const fetchIndex = firstRendered - 1;

  if (fetchIndex < 0) return null;

  let newWindow = [fetchIndex, ...currentBook.currentBlocks];
  let removeIndex: number | null = null;

  if (newWindow.length > 3) {
    removeIndex = newWindow.pop() || null;
  }

  return { fetchIndex, removeIndex, newWindow };
};

export const useEpubNextBlock = (
  webViewRef: RefObject<WebView | null>,
  containerRef: RefObject<View | null>
) => {
  const currentBook = useCurrentBook();
  const updateCurrentBlocks = useBookStore((state) => state.updateCurrentBlocks);

  return async () => {
    const shiftResult = shiftNext(currentBook);

    if (!shiftResult) {
      console.log('End of book reached.');
      webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
      return;
    }

    const { fetchIndex, removeIndex, newWindow } = shiftResult;
    console.log('Shift result:', { fetchIndex, removeIndex, newWindow });

    updateCurrentBlocks(newWindow);

    try {
      const nextBlock = currentBook.blocks[fetchIndex];

      if (!nextBlock) {
        webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
        return;
      }

      const reactTag = findNodeHandle(containerRef.current);

      if (reactTag) {
        BookEngine.injectBlock(reactTag, nextBlock.fullPath, fetchIndex, removeIndex, 'bottom');
      } else {
        console.error('No react tag found');
        webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
      }

      console.log('currentBlocks:', currentBook.currentBlocks);
    } catch (e) {
      console.error('Failed to natively inject next block:', e);
      webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
    }
  };
};

export const useEpubPrevBlock = (
  webViewRef: RefObject<WebView | null>,
  containerRef: RefObject<View | null>
) => {
  const currentBook = useCurrentBook();
  const updateCurrentBlocks = useBookStore((state) => state.updateCurrentBlocks);

  return async () => {
    const shiftResult = shiftPrev(currentBook);

    if (!shiftResult) {
      console.log('Start of book reached.');
      webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
      return;
    }

    const { fetchIndex, removeIndex, newWindow } = shiftResult;
    console.log('Shift result:', { fetchIndex, removeIndex, newWindow });

    updateCurrentBlocks(newWindow);

    try {
      const prevBlock = currentBook.blocks[fetchIndex];

      if (!prevBlock) {
        webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
        return;
      }

      const reactTag = findNodeHandle(containerRef.current);
      if (reactTag) {
        BookEngine.injectBlock(reactTag, prevBlock.fullPath, fetchIndex, removeIndex, 'top');
      } else {
        console.error('No react tag found');
        webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
      }

      console.log('currentBlocks:', currentBook.currentBlocks);
    } catch (e) {
      console.error('Failed to natively inject prev block:', e);
      webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
    }
  };
};

export const useJumpToNextSearchResult = () => {
  const currentSearchResult = useTempStore((state) => state.currentSearchResult);
  const setCurrentSearchResult = useTempStore((state) => state.setCurrentSearchResult);
  const searchResults = useTempStore((state) => state.searchResults);
  const setIsWebViewReady = useTempStore((state) => state.setIsWebViewReady);
  const setIsSearchOperation = useTempStore((state) => state.setIsSearchOperation);
  const jumpToBlock = useBookStore((state) => state.jumpToBlock);
  const jumpToSearchAction = useBookStore((state) => state.jumpToSearchAction);
  const updateMisc = useBookStore((state) => state.updateMisc);
  const currentBook = useCurrentBook();

  return () => {
    const newSearchResult = searchResults.find(
      (result) => result.id === currentSearchResult.id + 1
    );

    if (!newSearchResult) return;

    if (!currentBook.currentBlocks.includes(newSearchResult.blockId)) {
      setIsWebViewReady(false);
      setIsSearchOperation(true);
      jumpToBlock(newSearchResult.blockId);
    } else {
      jumpToSearchAction(newSearchResult.blockId, newSearchResult.occurrenceIndex);
    }

    updateMisc({
      percent: calculateBookProgress(currentBook, newSearchResult.blockId, 0),
    });

    setCurrentSearchResult(newSearchResult);
  };
};

export const useJumpToPrevSearchResult = () => {
  const currentSearchResult = useTempStore((state) => state.currentSearchResult);
  const setCurrentSearchResult = useTempStore((state) => state.setCurrentSearchResult);
  const searchResults = useTempStore((state) => state.searchResults);
  const setIsWebViewReady = useTempStore((state) => state.setIsWebViewReady);
  const setIsSearchOperation = useTempStore((state) => state.setIsSearchOperation);
  const jumpToBlock = useBookStore((state) => state.jumpToBlock);
  const jumpToSearchAction = useBookStore((state) => state.jumpToSearchAction);
  const updateMisc = useBookStore((state) => state.updateMisc);
  const currentBook = useCurrentBook();

  return () => {
    const newSearchResult = searchResults.find((result) => result.id === currentSearchResult.id - 1);

    if (!newSearchResult) return;

    if (!currentBook.currentBlocks.includes(newSearchResult.blockId)) {
      setIsWebViewReady(false);
      setIsSearchOperation(true);
      jumpToBlock(newSearchResult.blockId);
    } else {
      jumpToSearchAction(newSearchResult.blockId, newSearchResult.occurrenceIndex);
    }

    updateMisc({
      percent: calculateBookProgress(currentBook, newSearchResult.blockId, 0),
    });
    setCurrentSearchResult(newSearchResult);
  }
};

export const useProcessBookLinks = () => {
  const setIsWebViewReady = useTempStore((state) => state.setIsWebViewReady);
  const jumpToBlock = useBookStore((state) => state.jumpToBlock);
  const scrollToFragment = useBookStore((state) => state.scrollToFragmentAction);
  const setLastFragmentId = useBookStore((state) => state.setLastFragmentId);
  const currentBook = useCurrentBook();

  return (chapterId: number, fragmentId: string) => {
    const chapter = currentBook.chapters.find((c) => c.id === chapterId);
    if (!chapter) return;

    const blockId = chapter.anchors[fragmentId];
    if (!blockId) return;

    if (!currentBook.currentBlocks.includes(blockId)) {
      setIsWebViewReady(false);
      setLastFragmentId(fragmentId);
      jumpToBlock(blockId);
    } else {
      scrollToFragment(fragmentId);
    }
  };
};
