import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { Book, DeepPartial, Setting } from 'lib/types';
import { extractEpub, parseManifest } from 'lib/useEpubFunctions';
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
  isLoading: boolean;

  loadBook: (uri: string) => Promise<void>;
  openBook: (basePath: string) => void;
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
      isLoading: false,
      settings: {
        defaultBookSettings: {
          font: { fontSize: 30, fontFamily: 'Georgia, serif' },
        },
      },

      loadBook: async (uri: string) => {
        set({ currentBook: null, isLoading: true });

        try {
          const unzippedPath = await extractEpub(uri);
          if (!unzippedPath) return;

          const [book, _] = await Promise.all([
            parseManifest(unzippedPath),
            BookEngine.loadAnkiDictionary(),
          ]);

          set((state) => ({
            currentBook: book,
            isLoading: false,
            books: [book, ...state.books.filter((b) => b.basePath !== book.basePath)],
          }));
        } catch (e) {
          console.error('❌ Failed to load book:', e);
          set({ isLoading: false });
        }
      },

      openBook: async (basePath: string) => {
        set({ currentBook: null, isLoading: true });
        const { books } = get();
        const bookToOpen = books.find((book) => book.basePath === basePath);
        if (!bookToOpen) return;

        try {
          await BookEngine.loadAnkiDictionary();

          set((state) => ({
            currentBook: bookToOpen,
            isLoading: false,
            books: [bookToOpen, ...state.books.filter((b) => b.basePath !== basePath)],
          }));
        } catch (e) {
          console.error('❌ Failed to load book:', e);
          set({ isLoading: false });
        }
      },

      closeBook: async () => {
        const { currentBook } = get();
        if (!currentBook) return;

        try {
          await BookEngine.unloadAnkiDictionary();

          set(() => ({
            currentBook: null,
          }));
        } catch (e) {
          console.error('❌ Failed to unload book:', e);
        }
      },

      removeBook: (basePath: string) => {
        set((state) => ({
          currentBook: null,
          books: state.books.filter((book) => book.basePath !== basePath),
        }));
      },

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

      updateScrollPosition: (scrollY: number) => {
        const { currentBook, books } = get();

        if (!currentBook) return;

        const updatedBook = { ...currentBook, lastScrollPosition: scrollY };

        set({
          currentBook: updatedBook,
          books: books.map((b) => (b.basePath === updatedBook.basePath ? updatedBook : b)),
        });
      },
    }),
    {
      name: 'book-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ settings: state.settings, books: state.books }),
    }
  )
);
