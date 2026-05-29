import { RefObject, useCallback } from 'react';
import { useBookStore } from 'stores/useBookStore';
import { useTempStore } from 'stores/useTempStore';
import { useWordAction } from 'lib/useWordAction';
import { useEpubNextBlock, useEpubPrevBlock, useProcessBookLinks } from 'lib/useBookNavigation';
import { calculateBookProgress } from 'lib/utils';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { View } from 'react-native';
import { useWebViewStore } from 'stores/useWebViewStore';
import { DASH_REGEX_STRING } from 'lib/constants';

export const useMessageHandler = (
  webViewRef: RefObject<WebView | null>,
  containerRef: RefObject<View | null>
) => {
  const loadNextBlock = useEpubNextBlock(webViewRef, containerRef);
  const loadPrevBlock = useEpubPrevBlock(webViewRef, containerRef);
  const processBookLinks = useProcessBookLinks();
  const currentBook = useBookStore((state) => state.currentBook);
  const setCurrentBlock = useBookStore((state) => state.setCurrentBlock);
  const updateMisc = useBookStore((state) => state.updateMisc);
  const setSelectionMenu = useTempStore((state) => state.setSelectionMenu);
  const closeMenu = useTempStore((state) => state.closeSelectionMenu);
  const { openSystemTranslator, addNewCard, updateWordTag } = useWordAction();
  const executeQueueActions = useWebViewStore((state) => state.executeQueueActions);
  const setIsWebViewReady = useWebViewStore((state) => state.setIsWebViewReady);
  const updateCurrentBlocks = useBookStore((state) => state.updateCurrentBlocks);

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
              parsedData.currentBlockScrollPercent
            );

            updateMisc({
              percent,
              currentBlockScrollPercent: parsedData.currentBlockScrollPercent,
            });

            if (parsedData.currentBlock !== currentBook.currentBlock)
              setCurrentBlock(parsedData.currentBlock);

            break;

          case 'INITIAL_LOAD_COMPLETE':
            executeQueueActions();
            break;

          case 'QUEUE_ACTIONS_COMPLETE':
            setIsWebViewReady(true);
            break;

          case 'END_REACHED':
            loadNextBlock();
            break;

          case 'TOP_REACHED':
            loadPrevBlock();
            break;

          case 'DOUBLE_TAP':
            await openSystemTranslator(
              parsedData.text.replace(new RegExp(`[^\\p{L}\\d\\s${DASH_REGEX_STRING}]+`, 'gu'), '')
            );
            closeMenu();
            break;

          case 'TRIPLE_TAP':
            console.log('TRIPLE_TAP: ', JSON.stringify(parsedData, null, 2));

            if (parsedData.noteIds) {
              updateWordTag({
                noteIds: parsedData.noteIds,
                colorCode: String(Number(parsedData.colorCode!) + 1),
              });
            } else {
              addNewCard(parsedData.text);
            }
            closeMenu();
            break;

          case 'BOOK_LINK_PRESSED':
            const url = new URL(parsedData.href);
            const chapterId = parseInt(url.hostname);
            const fragmentId = url.hash.replace('#', '');
            processBookLinks(chapterId, fragmentId);
            break;

          case 'UPDATE_BLOCK_WINDOW':
            updateCurrentBlocks(parsedData.newWindow);
            break;
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
      setCurrentBlock,
      updateMisc,
      setIsWebViewReady,
      executeQueueActions,
      openSystemTranslator,
      addNewCard,
      updateWordTag,
    ]
  );
};
