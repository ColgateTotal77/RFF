import { RefObject } from 'react';
import { WebView } from 'react-native-webview';
import { findNodeHandle, View } from 'react-native';
import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { BookEngine } from 'modules/book-engine';
import { useTempStore } from 'stores/useTempStore';
import { calculateBookProgress } from 'lib/utils';

export const useEpubNextBlock = (
  webViewRef: RefObject<WebView | null>,
  containerRef: RefObject<View | null>
) => {
  const currentBook = useCurrentBook();
  const shiftNext = useBookStore((state) => state.shiftNext);

  return async () => {
    const shiftResult = shiftNext();

    if (!shiftResult) {
      console.log('End of book reached.');
      webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
      return;
    }

    const { fetchIndex, removeIndex } = shiftResult;
    console.log('Shift result:', { fetchIndex, removeIndex });

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
  const shiftPrev = useBookStore((state) => state.shiftPrev);

  return async () => {
    const shiftResult = shiftPrev();

    if (!shiftResult) {
      console.log('Start of book reached.');
      webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
      return;
    }

    const { fetchIndex, removeIndex } = shiftResult;
    console.log('Shift result:', { fetchIndex, removeIndex });

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
    const newSearchResult = searchResults[currentSearchResult.id + 1];

    if (!newSearchResult) return;

    if (!currentBook.currentBlocks.includes(newSearchResult.blockIndex)) {
      setIsWebViewReady(false);
      setIsSearchOperation(true);
      jumpToBlock(newSearchResult.blockIndex);
    } else {
      jumpToSearchAction(newSearchResult.blockIndex, newSearchResult.occurrenceIndex);
    }

    updateMisc({
      percent: calculateBookProgress(currentBook, newSearchResult.blockIndex, 0),
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
    const newSearchResult = searchResults[currentSearchResult.id - 1];

    if (!newSearchResult) return;

    if (!currentBook.currentBlocks.includes(newSearchResult.blockIndex)) {
      setIsWebViewReady(false);
      setIsSearchOperation(true);
      jumpToBlock(newSearchResult.blockIndex);
    } else {
      jumpToSearchAction(newSearchResult.blockIndex, newSearchResult.occurrenceIndex);
    }

    updateMisc({
      percent: calculateBookProgress(currentBook, newSearchResult.blockIndex, 0),
    });
    setCurrentSearchResult(newSearchResult);
  }
};
