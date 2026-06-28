import { create } from 'zustand';
import { SelectionMenu, SearchResult, BackStackItem } from 'types';
import { useWebViewStore } from 'stores/useWebViewStore';

type Store = {
  searchQuery: string;
  searchResults: SearchResult[];
  isSearchModuleOpen: boolean;
  currentSearchResult: SearchResult;
  selectionMenu: SelectionMenu;
  bookListQuery: string;
  backStack: BackStackItem[];
  isOverlayVisible: boolean;

  setSearchQuery: (searchQuery: string) => void;
  setSearchResults: (result: SearchResult[]) => void;
  toggleIsSearchModuleOpen: () => void;
  setCurrentSearchResult: (searchResult: SearchResult) => void;
  resetSearch: () => void;

  setSelectionMenu: (menu: SelectionMenu) => void;
  closeSelectionMenu: () => void;

  isBookSettingsTransparent: boolean;
  setIsBookSettingsTransparent: (isSliding: boolean) => void;
  setBookListQuery: (bookListQuery: string) => void;

  addToBackStack: (backStackItem: BackStackItem) => void;
  removeLastFromBackStack: () => void;
  clearBackStack: () => void;
  setIsOverlayVisible: (isOverlayVisible: boolean) => void;
};

export const useTempStore = create<Store>()((set) => ({
  searchQuery: '',
  searchResults: [],
  isSearchModuleOpen: false,
  currentSearchResult: {
    id: -1,
    occurrenceIndex: -1,
    blockId: -1,
    title: '',
    snippet: '',
    query: '',
  },
  selectionMenu: {
    visible: false,
    text: '',
    sentence: '',
    top: 0,
    bottom: 0,
    left: 0,
  },
  isBookSettingsTransparent: false,
  bookListQuery: '',
  backStack: [],
  isOverlayVisible: false,

  setSearchQuery: (searchQuery) => set({ searchQuery: searchQuery }),
  setSearchResults: (result) => set({ searchResults: result }),
  toggleIsSearchModuleOpen: () =>
    set((state) => ({ isSearchModuleOpen: !state.isSearchModuleOpen })),
  setCurrentSearchResult: (searchResult) => set({ currentSearchResult: searchResult }),
  resetSearch: () => {
    useWebViewStore.getState().executeImmediateActions([{ type: 'clearSearch' }]);

    set({
      currentSearchResult: {
        id: -1,
        occurrenceIndex: -1,
        blockId: -1,
        title: '',
        snippet: '',
        query: '',
      },
      searchQuery: '',
      searchResults: [],
    });
  },

  setSelectionMenu: (menu) => set({ selectionMenu: menu }),
  closeSelectionMenu: () =>
    set((state) => ({ selectionMenu: { ...state.selectionMenu, visible: false } })),

  setIsBookSettingsTransparent: (isSliding) => set({ isBookSettingsTransparent: isSliding }),

  setBookListQuery: (bookListQuery) => set({ bookListQuery }),

  addToBackStack: (backStackItem) =>
    set((state) => ({ backStack: [...state.backStack, backStackItem] })),
  removeLastFromBackStack: () => set((state) => ({ backStack: state.backStack.slice(0, -1) })),
  clearBackStack: () => set({ backStack: [] }),

  setIsOverlayVisible: (isOverlayVisible) => set({ isOverlayVisible: isOverlayVisible }),
}));
