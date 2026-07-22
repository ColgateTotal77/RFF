import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { Book, Bookmark, BookSettings, CurrentCTree, DeepPartial, FieldMapping, Misc } from 'types';
import { deepMerge } from 'lib/utils';
import { BookEngine } from 'modules/book-engine';
import { useWebViewStore } from './useWebViewStore';
import { useAppStore } from './useAppStore';
import { useTempStore } from './useTempStore';
import { Directory } from 'expo-file-system';

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
  currentCTree: CurrentCTree | null;

  setCurrentCTree: (treeData: CurrentCTree) => void;
  jumpToBlock: (currentBlock: number) => void;
  setCurrentBlock: (currentBlock: number) => void;
  closeBook: () => void;
  removeBook: (basePath: string) => Promise<void>;
  toggleHaveRead: (basePath: string) => void;
  updateCurrentBlocks: (newBlocks: number[]) => void;
  addBookmark: () => void;
  updateBookmark: (bookmarkId: number, toUpdate: Partial<Bookmark>) => void;
  removeBookmark: (id: number) => void;

  updateBookSettings: (toUpdate: DeepPartial<BookSettings>) => void;
  setBookFieldMapping: (
    mappingName: 'fieldMapping' | 'mirroredFieldMapping',
    mapping: FieldMapping | undefined
  ) => void;
  updateMisc: (misc: Partial<Misc>) => void;
  getBookSettings: (book?: Book) => Required<BookSettings>;
  isAnkiConfigStale: (book?: Book) => boolean;
};

export const useBookStore = create<Store>()(
  persist(
    (set, get) => ({
      currentBook: null,
      books: [],
      currentCTree: null,

      setCurrentCTree: (treeData: CurrentCTree) =>
        set((state) => ({
          ...state,
          currentCTree: treeData,
        })),

      closeBook: () => {
        const { currentBook } = get();
        if (!currentBook) return;

        console.log('Closing book');

        try {
          useWebViewStore.getState().resetWebView();
          set(() => ({ currentBook: null }));
          useTempStore.getState().resetSearch(false);
          useTempStore.getState().setTempSearchQuery('');
          useTempStore.getState().closeSelectionMenu();
          useTempStore.getState().clearBackStack();
          useTempStore.getState().setIsOverlayVisible(false);
        } catch (e) {
          console.error('❌ Failed to unload book:', e);
        }
      },

      removeBook: async (basePath: string) => {
        const book = get().books.find((b) => b.basePath === basePath);
        if (!book) return;

        if (basePath === get().currentBook?.basePath) get().closeBook();

        const dir = new Directory(book.unzippedPath);
        if (dir.exists) dir.delete();

        await BookEngine.deleteBookFromSQL(basePath);

        set((state) => ({
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

      updateCurrentBlocks: (newBlocks) =>
        set((state) => {
          if (!state.currentBook) return state;

          const updatedBook = { ...state.currentBook, currentBlocks: newBlocks };

          return {
            currentBook: updatedBook,
            books: state.books.map((b) => (b.basePath === updatedBook.basePath ? updatedBook : b)),
          };
        }),

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

      setBookFieldMapping: (mappingName, mapping) =>
        set((state) => {
          if (!state.currentBook) return state;

          const updatedBook = {
            ...state.currentBook,
            settings: { ...state.currentBook.settings, [mappingName]: mapping },
          };

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
          };

          useWebViewStore.getState().setIsWebViewReady(false);

          return {
            currentBook: updatedBook,
            books: state.books.map((b) => (b.basePath === updatedBook.basePath ? updatedBook : b)),
          };
        }),

      addBookmark: () =>
        set((state) => {
          if (!state.currentBook) return state;

          const bookmarks = state.currentBook.bookmarks || [];
          const lastBookmarkId = bookmarks.length > 0 ? bookmarks[bookmarks.length - 1].id : 0;

          const bookmark = {
            id: lastBookmarkId + 1,
            blockId: state.currentBook.currentBlock,
            title: `${state.currentBook.mapping.blockIndex[state.currentBook.currentBlock].chapterTitle} - ${lastBookmarkId + 1}`,
            scrollPercent: state.currentBook.misc.currentBlockScrollPercent,
            createdAt: Date.now(),
          };

          const updatedBook = {
            ...state.currentBook,
            bookmarks: [...state.currentBook.bookmarks, bookmark],
          };

          return {
            currentBook: updatedBook,
            books: state.books.map((b) => (b.basePath === updatedBook.basePath ? updatedBook : b)),
          };
        }),

      updateBookmark: (bookmarkId, toUpdate) =>
        set((state) => {
          if (!state.currentBook) return state;

          const bookmarks = state.currentBook.bookmarks || [];

          const updatedBook = {
            ...state.currentBook,
            bookmarks: bookmarks.map((bookmark) => {
              if (bookmark.id === bookmarkId) {
                return { ...bookmark, ...toUpdate };
              }
              return bookmark;
            }),
          };

          return {
            currentBook: updatedBook,
            books: state.books.map((b) => (b.basePath === updatedBook.basePath ? updatedBook : b)),
          };
        }),

      removeBookmark: (id: number) =>
        set((state) => {
          if (!state.currentBook) return state;

          const updatedBook = {
            ...state.currentBook,
            bookmarks: [...state.currentBook.bookmarks.filter((bm) => bm.id !== id)],
          };

          return {
            currentBook: updatedBook,
            books: state.books.map((b) => (b.basePath === updatedBook.basePath ? updatedBook : b)),
          };
        }),

      getBookSettings: (book) => {
        const currentBookSettings = (book ?? get().currentBook)?.settings ?? ({} as BookSettings);
        const settings = useAppStore.getState().settings;

        const ankiDeckId = currentBookSettings.ankiDeckId || settings.ankiDeckId;
        const ankiModelId = currentBookSettings.ankiModelId || settings.ankiModelId;
        const mirroredAnkiModelId =
          currentBookSettings.mirroredAnkiModelId || settings.mirroredAnkiModelId;

        return {
          ...currentBookSettings,
          ankiDeckId,
          ankiModelId,
          mirroredAnkiModelId,
          isTwoSided: currentBookSettings.isTwoSided || settings.isTwoSided,
          fieldMapping: deepMerge(
            settings.fieldMappings?.[`${ankiDeckId}:${ankiModelId}`] || {},
            currentBookSettings.fieldMapping || {}
          ),
          mirroredFieldMapping: deepMerge(
            settings.mirroredFieldMappings?.[`${ankiDeckId}:${mirroredAnkiModelId}`] || {},
            currentBookSettings.mirroredFieldMapping || {}
          ),
          font: {
            fontFamily: currentBookSettings?.font?.fontFamily || settings.font.fontFamily,
            fontSize: currentBookSettings?.font?.fontSize || settings.font.fontSize,
          },
          autoCardOnDoubleTap:
            currentBookSettings.autoCardOnDoubleTap || settings.autoCardOnDoubleTap,
        };
      },

      isAnkiConfigStale: (book) => {
        const { currentCTree, getBookSettings } = get();
        const bookSettings = getBookSettings(book);

        return (
          currentCTree?.deckId !== bookSettings.ankiDeckId ||
          currentCTree?.langCode !== bookSettings.bookLang ||
          JSON.stringify(currentCTree?.fieldMapping ?? {}) !==
            JSON.stringify(bookSettings.fieldMapping) ||
          JSON.stringify(currentCTree?.mirroredFieldMapping ?? {}) !==
            JSON.stringify(bookSettings.mirroredFieldMapping)
        );
      },
    }),
    {
      name: 'book-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        books: state.books.map(({ mapping, ...rest }) => rest),
      }),
    }
  )
);

export const useCurrentBook = () => {
  const book = useBookStore((state) => state.currentBook);
  return book!;
};
