import { RefObject, useCallback } from 'react';
import { useBookStore } from 'stores/useBookStore';
import { useTempStore } from 'stores/useTempStore';
import { useWordAction } from 'lib/useWordAction';
import { useEpubNextBlock, useEpubPrevBlock, useProcessBookLinks } from 'lib/useBookNavigation';
import { calculateBookProgress } from 'lib/utils';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { View } from 'react-native';

export const useMessageHandler = (webViewRef: RefObject<WebView | null>, containerRef: RefObject<View | null>) => {
  const loadNextBlock = useEpubNextBlock(webViewRef, containerRef);
  const loadPrevBlock = useEpubPrevBlock(webViewRef, containerRef);
  const processBookLinks = useProcessBookLinks();
  const currentBook = useBookStore((state) => state.currentBook);
  const setScrollPosition = useBookStore((state) => state.setScrollPosition);
  const setCurrentBlock = useBookStore((state) => state.setCurrentBlock);
  const updateMisc = useBookStore((state) => state.updateMisc);
  const setIsWebViewReady = useTempStore((state) => state.setIsWebViewReady);
  const currentSearchResult = useTempStore((state) => state.currentSearchResult);
  const isSearchOperation = useTempStore((state) => state.isSearchOperation);
  const setIsSearchOperation = useTempStore((state) => state.setIsSearchOperation);
  const setSelectionMenu = useTempStore((state) => state.setSelectionMenu);
  const closeMenu = useTempStore((state) => state.closeSelectionMenu);
  const jumpToSearchAction = useBookStore((state) => state.jumpToSearchAction);
  const { openSystemTranslator, addNewCard, updateWordTag } = useWordAction();

  return useCallback(
    async (event: WebViewMessageEvent) => {
      const data = event.nativeEvent.data;

      try {
        const parsedData = JSON.parse(data);

        switch (parsedData.type) {
          case 'LOG':
            if (parsedData.logType === 'error') console.error(parsedData.message);
            else console.log(parsedData.message);
            break;

          case 'TEXT_SELECTED':
            setSelectionMenu({
              visible: true,
              text: parsedData.text,
              top: parsedData.top,
              left: parsedData.left,
              noteIds: parsedData.noteIds,
              colorCode: parsedData.colorCode,
            });
            break;

          case 'SELECTION_CLEARED':
            closeMenu();
            break;

          case 'SCROLL_POSITION_CHANGED':
            if (!currentBook) return;

            const percent = calculateBookProgress(
              currentBook,
              parsedData.currentBlock,
              parsedData.currentBlockScrollPercent
            );

            updateMisc({
              percent,
              currentBlockScrollPercent: parsedData.currentBlockScrollPercent,
            });
            setScrollPosition(parsedData.scrollPosition);

            if (parsedData.currentBlock !== currentBook.currentBlock)
              setCurrentBlock(parsedData.currentBlock);

            break;

          case 'INITIAL_LOAD_COMPLETE':
            setIsWebViewReady(true);
            break;

          case 'END_REACHED':
            loadNextBlock();
            break;

          case 'TOP_REACHED':
            loadPrevBlock();
            break;

          case 'DOUBLE_TAP':
            await openSystemTranslator(parsedData.text.replace(/[^\w\s]|_/g, ''));
            closeMenu();
            break;

          case 'TRIPLE_TAP':
            if (parsedData.noteIds) {
              updateWordTag({ noteIds: parsedData.noteIds, colorCode: parsedData.colorCode || 0 });
            } else {
              addNewCard(parsedData.text);
            }
            closeMenu();
            break;

          case 'SEARCH_HIGHLIGHT_COMPLETE':
            if (currentSearchResult.occurrenceIndex > -1 && isSearchOperation) {
              jumpToSearchAction(currentSearchResult.blockId, currentSearchResult.occurrenceIndex);
              setIsSearchOperation(false);
            }
            break;

          case 'BOOK_LINK_PRESSED':
            const url = new URL(parsedData.href);
            const chapterId = parseInt(url.hostname);
            const fragmentId = url.hash.replace('#', '');
            processBookLinks(chapterId, fragmentId);
        }
      } catch (error) {
        console.log('useMessageHandler error: ', error);
      }
    },
    [
      loadNextBlock,
      loadPrevBlock,
      processBookLinks,
      setSelectionMenu,
      closeMenu,
      currentBook,
      jumpToSearchAction,
      setScrollPosition,
      setCurrentBlock,
      updateMisc,
      setIsWebViewReady,
      currentSearchResult,
      isSearchOperation,
      setIsSearchOperation,
      openSystemTranslator,
      addNewCard,
      updateWordTag,
    ]
  );
};
