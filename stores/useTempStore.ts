import { create } from 'zustand';
import { SelectionMenu, SearchResult, BackStackItem } from 'types';
import { useWebViewStore } from 'stores/useWebViewStore';

type Store = {
  tempSearchQuery: string;
  searchQuery: string;
  searchResults: SearchResult[];
  isSearchModuleOpen: boolean;
  isSearchLoading: boolean;
  currentSearchResult: SearchResult;
  selectionMenu: SelectionMenu;
  bookListQuery: string;
  backStack: BackStackItem[];
  isOverlayVisible: boolean;
  overlayHeaderOffset: number;

  setTempSearchQuery: (searchQuery: string) => void;
  setSearchQuery: (searchQuery: string) => void;
  setSearchResults: (result: SearchResult[]) => void;
  setIsSearchLoading: (loading: boolean) => void;
  toggleIsSearchModuleOpen: () => void;
  setCurrentSearchResult: (searchResult: SearchResult) => void;
  resetSearch: (clearWebView?: boolean) => void;

  setSelectionMenu: (menu: SelectionMenu) => void;
  closeSelectionMenu: () => void;

  isBookSettingsTransparent: boolean;
  setIsBookSettingsTransparent: (isSliding: boolean) => void;
  setBookListQuery: (bookListQuery: string) => void;

  addToBackStack: (backStackItem: BackStackItem) => void;
  removeLastFromBackStack: () => void;
  clearBackStack: () => void;
  setIsOverlayVisible: (isOverlayVisible: boolean) => void;
  setOverlayHeaderOffset: (overlayHeaderOffset: number) => void;
};

export const useTempStore = create<Store>()((set) => ({
  tempSearchQuery: '',
  searchQuery: '',
  searchResults: [],
  isSearchModuleOpen: false,
  isSearchLoading: false,
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
  overlayHeaderOffset: 100,

  setTempSearchQuery: (searchQuery: string) => set({ tempSearchQuery: searchQuery }),
  setSearchQuery: (searchQuery) => set({ searchQuery: searchQuery }),
  setSearchResults: (result) => set({ searchResults: result }),
  setIsSearchLoading: (loading) => set({ isSearchLoading: loading }),
  toggleIsSearchModuleOpen: () =>
    set((state) => ({ isSearchModuleOpen: !state.isSearchModuleOpen })),
  setCurrentSearchResult: (searchResult) => set({ currentSearchResult: searchResult }),
  resetSearch: (clearWebView = true) => {
    if (clearWebView) useWebViewStore.getState().executeImmediateActions([{ type: 'clearSearch' }]);

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
  setOverlayHeaderOffset: (overlayHeaderOffset) => set({ overlayHeaderOffset }),
}));
