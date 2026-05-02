import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import {
  Book,
  BookSettings,
  CurrentCTree,
  DeepPartial,
  Settings,
  Misc,
  Theme,
} from 'types';
import { deepMerge } from 'lib/utils';
import { BookEngine } from 'modules/book-engine';
import { parseBook } from 'lib/ParseBook';

const mmkvStorage = createMMKV({
  id: 'book-storage',
});

const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    return mmkvStorage.set(name, value);
  },
  getItem: (name) => {
    const value = mmkvStorage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    return mmkvStorage.remove(name);
  },
};

type Store = {
  books: Book[];
  currentBook: Book | null;
  settings: Settings;
  lastJumpTo: number;
  lastFragmentId: string;
  currentCTree: CurrentCTree | null;

  loadBook: (uri: string) => Promise<void>;
  openBook: (basePath: string) => void;
  setCurrentCTree: (treeData: CurrentCTree) => void;
  jumpToBlock: (currentBlock: number) => void;
  setLastFragmentId: (fragmentId: string) => void;
  setCurrentBlock: (currentBlock: number) => void;
  closeBook: () => void;
  removeBook: (basePath: string) => Promise<void>;
  toggleHaveRead: (basePath: string) => void;
  updateCurrentBlocks: (newBlocks: number[]) => void;

  updateSettings: (toUpdate: DeepPartial<Settings>) => void;
  updateBookSettings: (toUpdate: DeepPartial<BookSettings>) => void;
  setScrollPosition: (scrollY: number) => void;
  updateMisc: (misc: Partial<Misc>) => void;

  webViewActions: {
    scrollToBlock?: (index: number) => void;
    jumpToSearch?: (currentBlock: number, occurrence: number) => void;
    highlightAll?: (query: string, blocks: number[]) => void;
    clearSearch?: () => void;
    updateTag?: (word: string | string[] | null, noteIds: string, colorCode: string) => void;
    updateFont?: (fontSize?: number, fontFamily?: string) => void;
    updateTheme?: (theme: Theme) => void;
    scrollToFragment?: (fragmentId: string) => void;
  };

  registerWebViewAction: <K extends keyof Store['webViewActions']>(
    name: K,
    fn: Store['webViewActions'][K]
  ) => void;

  scrollToBlockAction: (currentBlock: number) => void;
  jumpToSearchAction: (currentBlock: number, occurrence: number) => void;
  clearSearchAction: () => void;
  updateTagAction: (words: string | string[] | null, noteIds: string, colorCode: string) => void;
  updateFontAction: (fontSize?: number, fontFamily?: string) => void;
  updateThemeAction: (theme: Theme) => void;
  scrollToFragmentAction: (fragmentId: string) => void;
};

export const useBookStore = create<Store>()(
  persist(
    (set, get) => ({
      currentBook: null,
      books: [],
      currentCTree: null,
      lastJumpTo: -1,
      lastFragmentId: '',
      webViewActions: {},
      settings: {
        ankiDeckId: '',
        ankiModelId: '',
        fieldMappings: {},
        mirroredAnkiModelId: '',
        mirroredFieldMappings: {},
        isTwoSided: false,
        autoCardOnDoubleTap: false,
        targetLang: 'en',
        font: { fontSize: 30, fontFamily: 'Georgia, serif' },
        theme: 'light',
      },

      loadBook: async (uri: string) => {
        set({ currentBook: null });

        try {
          const { settings } = get();
          const book = await parseBook(uri);

          book.settings.targetLang = settings.targetLang;

          set((state) => ({
            currentBook: book,
            lastJumpTo: -1,
            lastFragmentId: '',
            books: [book, ...state.books.filter((b) => b.basePath !== book.basePath)],
          }));
        } catch (e) {
          console.error('❌ Failed to load book:', e);
        }
      },

      openBook: async (basePath: string) => {
        set({ currentBook: null });
        const { books, settings, currentCTree } = get();
        const bookToOpen = books.find((book) => book.basePath === basePath);
        if (!bookToOpen) return;

        try {
          const deckId = bookToOpen?.settings?.ankiDeckId || settings.ankiDeckId;
          const modelId = bookToOpen?.settings?.ankiModelId || settings.ankiModelId;
          const mirroredModelId =
            bookToOpen?.settings?.mirroredAnkiModelId || settings.mirroredAnkiModelId;

          console.log('currentCTree?.deckId !== deckId', currentCTree?.deckId !== deckId);
          console.log('currentCTree?.deckId', currentCTree?.deckId, typeof currentCTree?.deckId);
          console.log('deckId', deckId, typeof deckId);
          if (currentCTree?.deckId !== deckId) {
            const key = `${deckId}:${modelId}`;
            const mirroredKey = `${deckId}:${mirroredModelId}`;

            const mapping = deepMerge(
              settings.fieldMappings?.[key] || {},
              bookToOpen.settings.fieldMapping || {}
            );
            const mirroredMapping = deepMerge(
              settings.mirroredFieldMappings?.[mirroredKey] || {},
              bookToOpen.settings.mirroredFieldMapping || {}
            );

            await BookEngine.loadAnkiDictionary(
              bookToOpen.settings.bookLang,
              deckId,
              mapping,
              mirroredMapping
            );
          }

          set((state) => ({
            currentBook: bookToOpen,
            lastJumpTo: -1,
            lastFragmentId: '',
            books: [bookToOpen, ...state.books.filter((b) => b.basePath !== basePath)],
          }));
        } catch (e) {
          console.error('❌ Failed to load book:', e);
        }
      },

      setCurrentCTree: (treeData: CurrentCTree) =>
        set((state) => ({
          ...state,
          currentCTree: treeData,
        })),

      closeBook: () => {
        const { currentBook } = get();
        if (!currentBook) return;

        try {
          set(() => ({
            currentBook: null,
          }));
        } catch (e) {
          console.error('❌ Failed to unload book:', e);
        }
      },

      removeBook: async (basePath: string) => {
        await BookEngine.deleteBookFromSQL(basePath);
        set((state) => ({
          currentBook: state.currentBook?.basePath === basePath ? null : state.currentBook,
          books: state.books.filter((book) => book.basePath !== basePath),
        }));
      },

      toggleHaveRead: (basePath: string) =>
        set((state) => {
          const book = state.books.find((book) => book.basePath === basePath);
          if (!book) return state;

          const updatedBook = {
            ...book,
            misc: { ...book.misc, haveRead: !book.misc.haveRead },
          };

          return {
            currentBook: updatedBook,
            books: state.books.map((b) => (b.basePath === updatedBook.basePath ? updatedBook : b)),
          };
        }),

      setCurrentBlock: (currentBlock: number) =>
        set((state) => {
          if (!state.currentBook) return state;

          const updatedBook = { ...state.currentBook, currentBlock };

          return {
            currentBook: updatedBook,
            books: state.books.map((b) => (b.basePath === updatedBook.basePath ? updatedBook : b)),
          };
        }),

      setLastFragmentId: (fragmentId) =>
        set((state) => ({
          ...state,
          lastFragmentId: fragmentId,
        })),

      updateCurrentBlocks: (newBlocks) =>
        set((state) => {
          if (!state.currentBook) return state;

          const updatedBook = { ...state.currentBook, currentBlocks: newBlocks };

          return {
            currentBook: updatedBook,
            books: state.books.map((b) => (b.basePath === updatedBook.basePath ? updatedBook : b)),
          };
        }),

      updateSettings: (toUpdate) =>
        set((state) => ({
          settings: deepMerge(state.settings, toUpdate),
        })),

      updateBookSettings: (toUpdate) =>
        set((state) => {
          if (!state.currentBook) return state;

          const updatedBook = {
            ...state.currentBook,
            settings: deepMerge(state.currentBook.settings, toUpdate),
          };

          return {
            currentBook: updatedBook,
            books: state.books.map((b) => (b.basePath === updatedBook.basePath ? updatedBook : b)),
          };
        }),

      setScrollPosition: (scrollY) =>
        set((state) => {
          if (!state.currentBook) return state;

          const updatedBook = { ...state.currentBook, scrollPosition: scrollY };

          return {
            currentBook: updatedBook,
            books: state.books.map((b) => (b.basePath === updatedBook.basePath ? updatedBook : b)),
          };
        }),

      updateMisc: (misc) =>
        set((state) => {
          if (!state.currentBook) return state;

          const updatedBook = {
            ...state.currentBook,
            misc: { ...state.currentBook.misc, ...misc },
          };

          return {
            currentBook: updatedBook,
            books: state.books.map((b) => (b.basePath === updatedBook.basePath ? updatedBook : b)),
          };
        }),

      jumpToBlock: (currentBlock: number) =>
        set((state) => {
          if (!state.currentBook) return state;

          const windowSize = state.currentBook.currentBlocks.length;
          const halfWindow = Math.floor(windowSize / 2);

          let start = Math.max(0, currentBlock - halfWindow);
          let end = Math.min(state.currentBook.blocks.length, start + windowSize);

          if (end - start < windowSize) {
            start = Math.max(0, end - windowSize);
          }

          const newBlocksWindow = state.currentBook.blocks
            .slice(start, end)
            .map((_, index) => start + index);

          const updatedBook = {
            ...state.currentBook,
            currentBlocks: newBlocksWindow,
            currentBlock,
            currentBlockScrollPosition: 0,
          };

          return {
            currentBook: updatedBook,
            books: state.books.map((b) => (b.basePath === updatedBook.basePath ? updatedBook : b)),
            lastJumpTo: currentBlock,
          };
        }),

      registerWebViewAction: (name, fn) =>
        set((state) => ({
          webViewActions: { ...state.webViewActions, [name]: fn },
        })),

      updateFontAction: (fontSize, fontFamily) => {
        get().webViewActions.updateFont?.(fontSize, fontFamily);
      },

      scrollToBlockAction: (currentBlock) => {
        get().webViewActions.scrollToBlock?.(currentBlock);
        set((state) => {
          if (!state.currentBook) return state;

          const updatedBook = {
            ...state.currentBook,
            currentBlock,
            currentBlockScrollPosition: 0,
          };

          return {
            currentBook: updatedBook,
            books: state.books.map((b) => (b.basePath === updatedBook.basePath ? updatedBook : b)),
          };
        });
      },

      jumpToSearchAction: (currentBlock, occurrence) => {
        get().webViewActions.jumpToSearch?.(currentBlock, occurrence);

        set((state) => {
          if (!state.currentBook || state.currentBook.currentBlock === currentBlock) return state;

          const updatedBook = {
            ...state.currentBook,
            currentBlock,
          };

          return {
            currentBook: updatedBook,
            books: state.books.map((b) => (b.basePath === updatedBook.basePath ? updatedBook : b)),
          };
        });
      },

      clearSearchAction: () => {
        get().webViewActions.clearSearch?.();
      },

      updateTagAction: (words, noteIds, colorCode) => {
        get().webViewActions.updateTag?.(words, noteIds, colorCode);
      },

      updateThemeAction: (theme: Theme) => {
        get().webViewActions.updateTheme?.(theme);

        set((state) => ({
          settings: { ...state.settings, theme },
        }));
      },

      scrollToFragmentAction: (fragmentId: string) => {
        get().webViewActions.scrollToFragment?.(fragmentId);
      },
    }),
    {
      name: 'book-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ settings: state.settings, books: state.books }),
    }
  )
);

export const useCurrentBook = () => {
  const book = useBookStore((state) => state.currentBook);
  return book!;
};
