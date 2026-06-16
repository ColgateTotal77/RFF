import { BookEngine } from 'modules/book-engine';
import { Theme } from 'types';
import { create } from 'zustand';
import { useBookStore } from './useBookStore';
import { useTempStore } from './useTempStore';

export type QueueAction =
  | { type: 'instantScroll'; targetBlockId: number; blockScrollPercent?: number }
  | { type: 'scrollToBlock'; blockId: number; scrollPercent?: number }
  | { type: 'scrollToFragment'; fragmentId: string }
  | { type: 'highlightAll'; query: string }
  | { type: 'jumpToSearch'; blockId: number; occurrenceIndex: number }
  | { type: 'clearSearch' };

export type ImmediateAction =
  | { type: 'scrollToBlock'; blockId: number; scrollPercent?: number }
  | { type: 'scrollToFragment'; fragmentId: string }
  | { type: 'highlightAll'; query: string }
  | { type: 'jumpToSearch'; blockId: number; occurrenceIndex: number }
  | { type: 'setTheme'; theme: Theme }
  | { type: 'updateFont'; fontSize?: number; fontFamily?: string }
  | { type: 'updateTag'; word: string | string[] | null; noteIds: string; colorCode: string }
  | { type: 'clearSearch' };

type Store = {
  isWebViewReady: boolean;
  webViewSource: { uri: string } | null;
  postLoadQueue: QueueAction[];
  reactTag: number | null;

  setReactTag: (reactTag: number | null) => void;

  setIsWebViewReady: (isWebViewReady: boolean) => void;
  setPostLoadQueue: (postLoadQueue: QueueAction[]) => void;
  addToPostLoadQueue: (step: QueueAction) => void;
  resetWebView: () => void;
  loadWindow: (jumpTo: number, blockScrollPercent: number) => Promise<void>;

  injectScript?: (script: string) => void;
  registerWebViewAction: (injectScript: (script: string) => void) => void;
  runScript: (script: string) => void;

  executeImmediateActions: (actions: ImmediateAction[]) => void;
  executeQueueActions: () => void;
};

export const useWebViewStore = create<Store>()((set, get) => ({
  isWebViewReady: false,
  webViewSource: null,
  postLoadQueue: [],
  reactTag: null,

  setReactTag: (reactTag) => set({ reactTag }),

  setIsWebViewReady: (isWebViewReady) => set({ isWebViewReady }),
  setPostLoadQueue: (postLoadQueue) => set({ postLoadQueue }),
  addToPostLoadQueue: (step) => set((state) => ({ postLoadQueue: [...state.postLoadQueue, step] })),

  resetWebView: () => set({ webViewSource: null, isWebViewReady: false, postLoadQueue: [] }),

  loadWindow: async (targetBlockId: number, blockScrollPercent: number) => {
    const { settings, jumpToBlock } = useBookStore.getState();

    if (targetBlockId !== -1) jumpToBlock(targetBlockId);

    try {
      const currentBook = useBookStore.getState().currentBook;
      if (!currentBook) return;

      const fontFamily = currentBook.settings?.font?.fontFamily || settings.font.fontFamily;
      const fontSize = currentBook.settings?.font?.fontSize || settings.font.fontSize;

      const { currentBlocks, blocks } = currentBook;
      const paths = currentBlocks.map((index) => blocks[index].fullPath);

      const currentSearchResult = useTempStore.getState().currentSearchResult;

      if (get().postLoadQueue.length === 0) {
        get().addToPostLoadQueue({
          type: 'scrollToBlock',
          blockId: currentBook.currentBlock,
          scrollPercent: blockScrollPercent,
        });
      }

      if (currentSearchResult.id !== -1) {
        get().setPostLoadQueue([
          {
            type: 'highlightAll',
            query: currentSearchResult.query,
          },
          ...(get().postLoadQueue ?? []),
        ]);
      }

      const generatedFileUrl = await BookEngine.loadInitialHtml(
        paths,
        currentBlocks,
        currentBook.cssPaths,
        {
          fontSize: fontSize,
          fontFamily: fontFamily,
          theme: settings.theme,
        }
      );

      const reactTag = await new Promise((resolve) => {
        const currentTag = useWebViewStore.getState().reactTag;
        if (currentTag !== null) {
          return resolve(currentTag);
        }

        const unsubscribe = useWebViewStore.subscribe((state) => {
          if (state.reactTag !== null) {
            unsubscribe();
            resolve(state.reactTag);
          }
        });
      });

      setTimeout(async () => {
        await BookEngine.setupBookBridge(
          reactTag,
          currentBook.blocks.map((b) => b.fullPath),
          currentBook.currentBlocks
        );

        set({ webViewSource: { uri: generatedFileUrl } });
      }, 0);
    } catch (e) {
      console.error('Failed to prepare initial blocks:', e);
    }
  },

  registerWebViewAction: (injectScript) => set({ injectScript }),

  runScript: (script) => {
    get().injectScript?.(script);
  },

  executeImmediateActions: (actions) => {
    get().runScript?.('window.executeQueueAction(' + JSON.stringify(actions) + ');');
  },

  executeQueueActions: () => {
    const actions = get().postLoadQueue;
    get().runScript?.('window.executeQueueAction(' + JSON.stringify(actions) + ');');
    set(() => ({ postLoadQueue: [] }));
  },
}));
