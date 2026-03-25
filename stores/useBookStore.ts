import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { Book, CurrectCTree, DeepPartial, Misc, Setting } from 'types';
import { extractEpub, parseManifest } from 'lib/useBookExtraction';
import { deepMerge } from 'lib/utils';
import { BookEngine } from 'modules/book-engine';

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
  settings: Setting;
  lastJumpTo: number;
  currentCTree: CurrectCTree | null;

  loadBook: (uri: string) => Promise<void>;
  openBook: (basePath: string) => void;
  setCurrentCTree: (treeData: CurrectCTree) => void;
  jumpToChapter: (currentChapter: number) => void;
  setCurrentChapter: (currentChapter: number) => void;
  closeBook: () => Promise<void>;
  removeBook: (basePath: string) => void;
  shiftNext: () => { fetchIndex: number; removeIndex: number | null } | null;
  shiftPrev: () => { fetchIndex: number; removeIndex: number | null } | null;

  updateSettings: (toUpdate: DeepPartial<Setting>) => void;
  setScrollPosition: (scrollY: number) => void;
  updateMisc: (misc: Partial<Misc>) => void;

  webViewActions: {
    scrollToChapter?: (index: number) => void;
    jumpToSearch?: (chapter: number, occurrence: number) => void;
    highlightAll?: (query: string, chapters: number[]) => void;
    clearSearch?: () => void;
    updateTag?: (word: string | null, noteId: string, colorCode: string) => void;
    updateFont?: (fontSize?: number, fontFamily?: string) => void;
  };

  registerWebViewAction: <K extends keyof Store['webViewActions']>(
    name: K,
    fn: Store['webViewActions'][K]
  ) => void;

  scrollToChapterAction: (currentChapter: number) => void;
  jumpToSearchAction: (chapter: number, occurrence: number) => void;
  clearSearchAction: () => void;
  updateTagAction: (word: string | null, noteId: string, colorCode: string) => void;
  updateFontAction: (fontSize?: number, fontFamily?: string) => void;
};

export const useBookStore = create<Store>()(
  persist(
    (set, get) => ({
      currentBook: null,
      books: [],
      currentCTree: null,
      lastJumpTo: -1,
      webViewActions: {},
      settings: {
        defaultBookSettings: {
          font: { fontSize: 30, fontFamily: 'Georgia, serif' },
        },
      },

      loadBook: async (uri: string) => {
        set({ currentBook: null });

        try {
          const unzippedPath = await extractEpub(uri);
          if (!unzippedPath) return;

          const book = await parseManifest(unzippedPath);

          set((state) => ({
            currentBook: book,
            lastJumpTo: -1,
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
          const deckId =
            bookToOpen?.settings?.ankiDeckId || settings.defaultBookSettings.ankiDeckId;
          console.log('currentCTree?.deckId !== deckId', currentCTree?.deckId !== deckId);
          console.log('currentCTree?.deckId', currentCTree?.deckId, typeof currentCTree?.deckId);
          console.log('deckId', deckId, typeof deckId);
          if (currentCTree?.deckId !== deckId) await BookEngine.loadAnkiDictionary('en', deckId);

          set((state) => ({
            currentBook: bookToOpen,
            lastJumpTo: -1,
            books: [bookToOpen, ...state.books.filter((b) => b.basePath !== basePath)],
          }));
        } catch (e) {
          console.error('❌ Failed to load book:', e);
        }
      },

      setCurrentCTree: (treeData: CurrectCTree) =>
        set((state) => ({
          ...state,
          currentCTree: treeData,
        })),

      closeBook: async () => {
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

      removeBook: (basePath: string) =>
        set((state) => ({
          currentBook: null,
          books: state.books.filter((book) => book.basePath !== basePath),
        })),

      setCurrentChapter: (currentChapter: number) =>
        set((state) => {
          if (!state.currentBook) return state;

          const updatedBook = { ...state.currentBook, currentChapter };

          return {
            currentBook: updatedBook,
            books: state.books.map((b) => (b.basePath === updatedBook.basePath ? updatedBook : b)),
          };
        }),

      shiftNext: () => {
        const { currentBook, books } = get();
        if (!currentBook || currentBook.currentChapters.length === 0) return null;

        const lastRendered = currentBook.currentChapters[currentBook.currentChapters.length - 1];
        const fetchIndex = lastRendered + 1;

        if (fetchIndex >= currentBook.chapters.length) return null;

        let newWindow = [...currentBook.currentChapters, fetchIndex];
        let removeIndex: number | null = null;

        if (newWindow.length > 3) {
          removeIndex = newWindow.shift() || null;
        }

        const newChapters = newWindow.sort((a, b) => a - b);
        const updatedBook = { ...currentBook, currentChapters: newChapters };

        set({
          currentBook: updatedBook,
          books: books.map((b) => (b.basePath === updatedBook.basePath ? updatedBook : b)),
        });

        return { fetchIndex, removeIndex };
      },

      shiftPrev: () => {
        const { currentBook, books } = get();
        if (!currentBook || currentBook.currentChapters.length === 0) return null;

        const firstRendered = currentBook.currentChapters[0];
        const fetchIndex = firstRendered - 1;

        if (fetchIndex < 1) return null;

        let newWindow = [fetchIndex, ...currentBook.currentChapters];
        let removeIndex: number | null = null;

        if (newWindow.length > 3) {
          removeIndex = newWindow.pop() || null;
        }

        const newChapters = newWindow.sort((a, b) => a - b);
        const updatedBook = { ...currentBook, currentChapters: newChapters };

        set({
          currentBook: updatedBook,
          books: books.map((b) => (b.basePath === updatedBook.basePath ? updatedBook : b)),
        });

        return { fetchIndex, removeIndex };
      },

      updateSettings: (toUpdate: DeepPartial<Setting>) =>
        set((state) => ({
          settings: deepMerge(state.settings, toUpdate),
        })),

      setScrollPosition: (scrollY) =>
        set((state) => {
          if (!state.currentBook) return state;

          const updatedBook = { ...state.currentBook, currentChapterScrollPosition: scrollY };

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

      jumpToChapter: (currentChapter: number) =>
        set((state) => {
          if (!state.currentBook) return state;

          const windowSize = state.currentBook.currentChapters.length;
          const halfWindow = Math.floor(windowSize / 2);

          let start = Math.max(0, currentChapter - halfWindow);
          let end = Math.min(state.currentBook.chapters.length, start + windowSize);

          if (end - start < windowSize) {
            start = Math.max(0, end - windowSize);
          }

          const newChaptersWindow = state.currentBook.chapters
            .slice(start, end)
            .map((chapter) => chapter.id);

          return {
            currentBook: {
              ...state.currentBook,
              currentChapters: newChaptersWindow,
            },
            lastJumpTo: currentChapter,
          };
        }),

      registerWebViewAction: (name, fn) =>
        set((state) => ({
          webViewActions: { ...state.webViewActions, [name]: fn },
        })),

      updateFontAction: (fontSize, fontFamily) => {
        get().webViewActions.updateFont?.(fontSize, fontFamily);
      },

      scrollToChapterAction: (currentChapter) => {
        get().webViewActions.scrollToChapter?.(currentChapter);
      },

      jumpToSearchAction: (chapter, occurrence) => {
        get().webViewActions.jumpToSearch?.(chapter, occurrence);
      },

      clearSearchAction: () => {
        get().webViewActions.clearSearch?.();
      },

      updateTagAction: (word, noteId, colorCode) => {
        get().webViewActions.updateTag?.(word, noteId, colorCode);
      },
    }),
    {
      name: 'book-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ settings: state.settings, books: state.books }),
    }
  )
);
