import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { Book, BookSettings, CurrentCTree, DeepPartial, Settings, Misc } from 'types';
import { buildBookMapping, deepMerge } from 'lib/utils';
import { BookEngine } from 'modules/book-engine';
import { parseBook } from 'lib/ParseBook';
import { useAnkiStore } from './useAnkiStore';
import { useWebViewStore } from './useWebViewStore';
import i18n from 'i18n';
import { LanguageCode } from 'lib/langHelper';

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

// TODO(25): split into focused stores (books/currentBook, settings, reader bridge) to cut re-renders
type Store = {
  books: Book[];
  currentBook: Book | null;
  settings: Settings;
  currentCTree: CurrentCTree | null;

  loadBook: (uri: string) => Promise<void>;
  openBook: (basePath: string) => void;
  setCurrentCTree: (treeData: CurrentCTree) => void;
  jumpToBlock: (currentBlock: number) => void;
  setCurrentBlock: (currentBlock: number) => void;
  closeBook: () => void;
  removeBook: (basePath: string) => Promise<void>;
  toggleHaveRead: (basePath: string) => void;
  updateCurrentBlocks: (newBlocks: number[]) => void;
  addBookmark: () => void;
  removeBookmark: (id: number) => void;

  updateSettings: (toUpdate: DeepPartial<Settings>) => void;
  updateBookSettings: (toUpdate: DeepPartial<BookSettings>) => void;
  updateMisc: (misc: Partial<Misc>) => void;
};

export const useBookStore = create<Store>()(
  persist(
    (set, get) => ({
      currentBook: null,
      books: [],
      currentCTree: null,
      settings: {
        ankiDeckId: '',
        ankiModelId: '',
        fieldMappings: {},
        mirroredAnkiModelId: '',
        mirroredFieldMappings: {},
        isTwoSided: false,
        autoCardOnDoubleTap: false,
        targetLang: i18n.language as LanguageCode,
        font: { fontSize: 30, fontFamily: 'Georgia, serif' },
        theme: 'light',
      },

      loadBook: async (uri: string) => {
        get().closeBook();

        try {
          const book = await parseBook(uri, get().settings.targetLang);
          book.mapping = buildBookMapping(book);

          set((state) => ({
            currentBook: book,
            lastFragmentId: '',
            books: [book, ...state.books.filter((b) => b.basePath !== book.basePath)],
          }));
        } catch (e) {
          console.error('❌ Failed to load book:', e);
        }
      },

      openBook: (basePath: string) => {
        get().closeBook();

        const { books, settings, currentCTree } = get();
        const bookToOpen = books.find((book) => book.basePath === basePath);
        if (!bookToOpen) return;

        const deckId = bookToOpen?.settings?.ankiDeckId || settings.ankiDeckId;
        const modelId = bookToOpen?.settings?.ankiModelId || settings.ankiModelId;
        const mirroredModelId =
          bookToOpen?.settings?.mirroredAnkiModelId || settings.mirroredAnkiModelId;

        const { loadFieldsInto } = useAnkiStore.getState();
        loadFieldsInto(modelId, 'bookFields');
        loadFieldsInto(mirroredModelId, 'bookMirroredFields');

        try {
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

            BookEngine.loadAnkiDictionary(
              bookToOpen.settings.bookLang,
              deckId,
              mapping,
              mirroredMapping
            );
          }

          bookToOpen.mapping = buildBookMapping(bookToOpen);

          set((state) => ({
            currentBook: bookToOpen,
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
    }),
    {
      name: 'book-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        settings: state.settings,
        books: state.books.map(({ mapping, ...rest }) => rest),
      }),
    }
  )
);

export const useCurrentBook = () => {
  const book = useBookStore((state) => state.currentBook);
  return book!;
};
