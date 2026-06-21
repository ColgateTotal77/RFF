import { useCallback } from 'react';
import { useBookStore } from 'stores/useBookStore';
import { useTempStore } from 'stores/useTempStore';
import { useWordAction } from 'lib/useWordAction';
import { calculateBookProgress } from 'lib/utils';
import { WebViewMessageEvent } from 'react-native-webview';
import { useWebViewStore } from 'stores/useWebViewStore';
import { DASH_REGEX_STRING } from 'lib/constants';

export const useMessageHandler = () => {
  const currentBook = useBookStore((state) => state.currentBook);
  const setCurrentBlock = useBookStore((state) => state.setCurrentBlock);
  const updateMisc = useBookStore((state) => state.updateMisc);
  const updateCurrentBlocks = useBookStore((state) => state.updateCurrentBlocks);
  const setSelectionMenu = useTempStore((state) => state.setSelectionMenu);
  const closeMenu = useTempStore((state) => state.closeSelectionMenu);
  const { openSystemTranslator, addNewCard, updateWordTag } = useWordAction();
  const executeQueueActions = useWebViewStore((state) => state.executeQueueActions);
  const setIsWebViewReady = useWebViewStore((state) => state.setIsWebViewReady);

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
              ...parsedData,
            });
            break;

          case 'SELECTION_CLEARED':
            closeMenu();
            break;

          case 'SCROLL_POSITION_CHANGED':
            if (!currentBook) return;

            const percent = calculateBookProgress(
              currentBook,
              parsedData.currentBlockScrollPercent,
              parsedData.currentBlock
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

          case 'DOUBLE_TAP':
            await openSystemTranslator(
              parsedData.text.replace(new RegExp(`[^\\p{L}\\d\\s${DASH_REGEX_STRING}]+`, 'gu'), '')
            );
            closeMenu();
            break;

          case 'TRIPLE_TAP':
            if (parsedData.noteIds) {
              if (!parsedData.colorCode || parsedData.colorCode === '-1') return;

              updateWordTag({
                noteIds: parsedData.noteIds,
                colorCode: String(Number(parsedData.colorCode) + 1),
              });
            } else {
              addNewCard(parsedData.text, parsedData.sentence);
            }
            closeMenu();
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
