import { create } from 'zustand'
import { SearchResultWithTitle, SearchResultsMapWithTitle, SelectionMenu } from 'types';

type Store = {
  searchQuery: string;
  searchResults: SearchResultsMapWithTitle;
  isSearchModuleOpen: boolean;
  isWebViewReady: boolean;
  currentSearchResult: SearchResultWithTitle;
  isSearchOperation: boolean;
  selectionMenu: SelectionMenu;

  setSearchQuery: (searchQuery: string) => void;
  setSearchResults: (result: SearchResultsMapWithTitle) => void;
  toggleIsSearchModuleOpen: () => void;
  setCurrentSearchResult: (searchResult: SearchResultWithTitle) => void;
  resetSearch: () => void;
  setIsWebViewReady: (isWebViewReady: boolean) => void;
  setIsSearchOperation: (isSearchOperation: boolean) => void;
  setSelectionMenu: (menu: Partial<SelectionMenu>) => void;
  closeSelectionMenu: () => void;
};

export const useTempStore = create<Store>()((set) => ({
  searchQuery: '',
  searchResults: {},
  isSearchModuleOpen: false,
  isWebViewReady: false,
  isSearchOperation: false,
  currentSearchResult: {
    id: -1,
    occurrenceIndex: -1,
    blockIndex: -1,
    chapterTitle: '',
    snippet: '',
  },
  selectionMenu: {
    visible: false,
    text: '',
    top: 0,
    left: 0,
  },

  setSearchQuery: (searchQuery) => set({ searchQuery: searchQuery }),
  setSearchResults: (result) => set({ searchResults: result }),
  toggleIsSearchModuleOpen: () =>
    set((state) => ({ isSearchModuleOpen: !state.isSearchModuleOpen })),
  setCurrentSearchResult: (searchResult) => set({ currentSearchResult: searchResult }),
  resetSearch: () =>
    set({
      currentSearchResult: {
        id: -1,
        occurrenceIndex: -1,
        blockIndex: -1,
        chapterTitle: '',
        snippet: '',
      },
      searchQuery: '',
      searchResults: {},
      isSearchOperation: false,
    }),
  setIsWebViewReady: (isWebViewReady) => set({ isWebViewReady: isWebViewReady }),
  setIsSearchOperation: (isSearchOperation) => set({ isSearchOperation: isSearchOperation }),
  setSelectionMenu: (menu) =>
    set((state) => ({ selectionMenu: { ...state.selectionMenu, ...menu } })),
  closeSelectionMenu: () =>
    set((state) => ({ selectionMenu: { ...state.selectionMenu, visible: false } })),
}));
