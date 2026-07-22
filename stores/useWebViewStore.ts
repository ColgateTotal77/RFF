import { Theme } from 'types';
import { create } from 'zustand';

export type QueueAction =
  | { type: 'instantScroll'; targetBlockId: number; blockScrollPercent?: number }
  | { type: 'scrollToBlock'; blockId: number; scrollPercent?: number; instant?: boolean }
  | { type: 'scrollToFragment'; fragmentId: string }
  | { type: 'highlightAll'; query: string }
  | { type: 'jumpToSearch'; blockId: number; occurrenceIndex: number }
  | { type: 'clearSearch' }
  | { type: 'setTheme'; theme: Theme };

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
  setWebViewSource: (webViewSource: { uri: string } | null) => void;
  setPostLoadQueue: (postLoadQueue: QueueAction[]) => void;
  addToPostLoadQueue: (step: QueueAction) => void;
  resetWebView: () => void;

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
  setWebViewSource: (webViewSource) => set({ webViewSource }),
  setPostLoadQueue: (postLoadQueue) => set({ postLoadQueue }),
  addToPostLoadQueue: (step) => set((state) => ({ postLoadQueue: [...state.postLoadQueue, step] })),

  resetWebView: () => set({ webViewSource: null, isWebViewReady: false, postLoadQueue: [] }),

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
