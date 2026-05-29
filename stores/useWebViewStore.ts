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

  setIsWebViewReady: (isWebViewReady: boolean) => void;
  setPostLoadQueue: (postLoadQueue: QueueAction[]) => void;
  addToPostLoadQueue: (step: QueueAction) => void;
  resetWebView: () => void;
  loadWindow: (jumpTo: number, blockScrollPercent: number) => Promise<void>;

  injectScript?: (script: string) => void;
  registerWebViewAction: (injectScript: (script: string) => void) => void;
  runScript: (script: string) => void;

  executeImmediateAction: (action: ImmediateAction) => void;
  executeQueueActions: () => void;
};

export const useWebViewStore = create<Store>()((set, get) => ({
  isWebViewReady: false,
  webViewSource: null,
  postLoadQueue: [],

  setIsWebViewReady: (isWebViewReady) => set({ isWebViewReady }),
  setPostLoadQueue: (postLoadQueue) => set({ postLoadQueue }),
  addToPostLoadQueue: (step) => set((state) => ({ postLoadQueue: [...state.postLoadQueue, step] })),

  resetWebView: () => set({ webViewSource: null, isWebViewReady: false }),

  loadWindow: async (targetBlockId: number, blockScrollPercent: number) => {
    const { settings, jumpToBlock } = useBookStore.getState();

    if (targetBlockId !== -1) jumpToBlock(targetBlockId);

    try {
      set({ webViewSource: null, isWebViewReady: false });

      const currentBook = useBookStore.getState().currentBook;
      if (!currentBook) return;

      const font = currentBook.settings?.font || settings.font;
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
          fontSize: font.fontSize,
          fontFamily: font.fontFamily,
          theme: settings.theme,
        }
      );

      if (typeof generatedFileUrl === 'string') {
        set({ webViewSource: { uri: generatedFileUrl } });
      }
    } catch (e) {
      console.error('Failed to prepare initial blocks:', e);
    }
  },

  registerWebViewAction: (injectScript) => set({ injectScript }),

  runScript: (script) => {
    get().injectScript?.(script);
  },

  executeImmediateAction: (action: ImmediateAction) => {
    get().runScript?.('window.executeImmediateAction(' + JSON.stringify(action) + ');');
  },

  executeQueueActions: () => {
    const actions = get().postLoadQueue;
    get().runScript?.('window.executeQueueAction(' + JSON.stringify(actions) + ');');
    set(() => ({ postLoadQueue: [] }));
  },
}));
