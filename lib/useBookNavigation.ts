import { RefObject } from 'react';
import { WebView } from 'react-native-webview';
import { findNodeHandle, View } from 'react-native';
import { useBookStore } from 'stores/useBookStore';
import { BookEngine } from 'modules/book-engine';
import { useTempStore } from 'stores/useTempStore';

export const useEpubNextChapter = (
  webViewRef: RefObject<WebView | null>,
  containerRef: RefObject<View | null>
) => {
  const { currentBook, shiftNext } = useBookStore();

  return async () => {
    if (!currentBook) return;

    const shiftResult = shiftNext();

    if (!shiftResult) {
      console.log('End of book reached.');
      webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
      return;
    }

    const { fetchIndex, removeIndex } = shiftResult;
    console.log('Shift result:', { fetchIndex, removeIndex });

    try {
      const nextChapter = currentBook.chapters[fetchIndex];

      if (!nextChapter) {
        webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
        return;
      }

      const reactTag = findNodeHandle(containerRef.current);

      if (reactTag) {
        BookEngine.injectChapter(reactTag, nextChapter.fullPath, fetchIndex, removeIndex, 'bottom');
      } else {
        console.error('No react tag found');
        webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
      }

      console.log('currentChapters:', currentBook.currentChapters);
    } catch (e) {
      console.error('Failed to natively inject next chapter:', e);
      webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
    }
  };
};

export const useEpubPrevChapter = (
  webViewRef: RefObject<WebView | null>,
  containerRef: RefObject<View | null>
) => {
  const { currentBook, shiftPrev } = useBookStore();

  return async () => {
    if (!currentBook) return;

    const shiftResult = shiftPrev();

    if (!shiftResult) {
      console.log('Start of book reached.');
      webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
      return;
    }

    const { fetchIndex, removeIndex } = shiftResult;
    console.log('Shift result:', { fetchIndex, removeIndex });

    try {
      const prevChapter = currentBook.chapters[fetchIndex];

      if (!prevChapter) {
        webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
        return;
      }

      const reactTag = findNodeHandle(containerRef.current);
      if (reactTag) {
        BookEngine.injectChapter(reactTag, prevChapter.fullPath, fetchIndex, removeIndex, 'top');
      } else {
        console.error('No react tag found');
        webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
      }

      console.log('currentChapters:', currentBook.currentChapters);
    } catch (e) {
      console.error('Failed to natively inject prev chapter:', e);
      webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
    }
  };
};

export const useJumpToNextSearchResult = (
  onJumpToSearch: (chapterIndex: number, occurrenceIndex: number) => void
) => {
  const { currentSearchResult, setCurrentSearchResult, searchResults, setIsWebViewReady, setIsSearchOperation } =
    useTempStore();
  const { jumpToChapter, currentBook } = useBookStore();

  return () => {
    const newSearchResult = searchResults[currentSearchResult.id + 1];

    if (newSearchResult) {
      const isAlreadyLoaded = (currentBook?.currentChapters || []).includes(
        newSearchResult.chapterIndex
      );

      if (!isAlreadyLoaded) {
        setIsWebViewReady(false);
        setIsSearchOperation(true);
        jumpToChapter(newSearchResult.chapterIndex);
      } else {
        onJumpToSearch(newSearchResult.chapterIndex, newSearchResult.occurrenceIndex);
      }

      setCurrentSearchResult(newSearchResult);
    }
  };
};

export const useJumpToPrevSearchResult = (
  onJumpToSearch: (occurrenceIndex: number, chapterIndex: number) => void
) => {
  const { currentSearchResult, setCurrentSearchResult, searchResults, setIsWebViewReady, setIsSearchOperation } =
    useTempStore();
  const { jumpToChapter, currentBook } = useBookStore();

  return () => {
    const newSearchResult = searchResults[currentSearchResult.id - 1];

    if (newSearchResult) {
      const isAlreadyLoaded = (currentBook?.currentChapters || []).includes(
        newSearchResult.chapterIndex
      );

      if (!isAlreadyLoaded) {
        setIsWebViewReady(false);
        setIsSearchOperation(true);
        jumpToChapter(newSearchResult.chapterIndex);
      } else {
        onJumpToSearch(newSearchResult.chapterIndex, newSearchResult.occurrenceIndex);
      }

      setCurrentSearchResult(newSearchResult);
    }
  };
};
