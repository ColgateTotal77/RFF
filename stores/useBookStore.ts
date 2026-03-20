import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { Book, CurrectCTree, DeepPartial, Setting } from 'types';
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
  jumpToChapter: (chapterIndex: number) => void;
  closeBook: () => Promise<void>;
  removeBook: (basePath: string) => void;
  shiftNext: () => { fetchIndex: number; removeIndex: number | null } | null;
  shiftPrev: () => { fetchIndex: number; removeIndex: number | null } | null;

  updateSettings: (toUpdate: DeepPartial<Setting>) => void;
  updateScrollPosition: (scrollY: number) => void;
};

export const useBookStore = create<Store>()(
  persist(
    (set, get) => ({
      currentBook: null,
      books: [],
      currentCTree: null,
      lastJumpTo: 0,
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
            lastJumpTo: 0,
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
            lastJumpTo: 0,
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

      updateScrollPosition: (scrollY: number) =>
        set((state) => {
          if (!state.currentBook) return state;

          const updatedBook = { ...state.currentBook, lastScrollPosition: scrollY };

          return {
            currentBook: updatedBook,
            books: state.books.map((b) => (b.basePath === updatedBook.basePath ? updatedBook : b)),
          };
        }),

      jumpToChapter: (chapterIndex: number) =>
        set((state) => {
          if (!state.currentBook) return state;

          const nextIndex = chapterIndex + 1;
          const prevIndex = chapterIndex - 1;
          const newChaptersWindow = [chapterIndex];

          if (prevIndex >= 0) newChaptersWindow.unshift(prevIndex);
          if (nextIndex <= state.currentBook.chapters.length) newChaptersWindow.push(nextIndex);

          return {
            currentBook: {
              ...state.currentBook,
              currentChapters: newChaptersWindow,
            },
            lastJumpTo: chapterIndex,
          };
        }),
    }),
    {
      name: 'book-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ settings: state.settings, books: state.books }),
    }
  )
);
