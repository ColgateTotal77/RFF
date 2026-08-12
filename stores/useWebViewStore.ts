import { Theme } from 'types';
import { create } from 'zustand';

export type WebViewAction =
  | { type: 'scrollToBlock'; blockId: number; scrollPercent?: number; instant?: boolean }
  | { type: 'scrollToFragment'; fragmentId: string }
  | { type: 'highlightAll'; query: string }
  | { type: 'jumpToSearch'; blockId: number; occurrenceIndex: number }
  | { type: 'clearSearch' }
  | { type: 'setTheme'; theme: Theme }
  | { type: 'updateFont'; fontSize?: number; fontFamily?: string }
  | { type: 'updateTag'; word: string | string[] | null; noteIds: string; colorCode: string };

type Store = {
  isWebViewReady: boolean;
  webViewSource: { uri: string } | null;
  postLoadQueue: WebViewAction[];
  reactTag: number | null;

  setReactTag: (reactTag: number | null) => void;

  setIsWebViewReady: (isWebViewReady: boolean) => void;
  setWebViewSource: (webViewSource: { uri: string } | null) => void;
  setPostLoadQueue: (postLoadQueue: WebViewAction[]) => void;
  addToPostLoadQueue: (step: WebViewAction) => void;
  resetWebView: () => void;

  injectScript?: (script: string) => void;
  registerWebViewAction: (injectScript: (script: string) => void) => void;
  runScript: (script: string) => void;

  executeImmediateActions: (actions: WebViewAction[]) => void;
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
