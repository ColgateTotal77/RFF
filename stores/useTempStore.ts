import { create } from 'zustand'
import { SearchResultWithTitle, SearchResultsMapWithTitle } from 'types';

type Store = {
  searchQuery: string;
  searchResults: SearchResultsMapWithTitle;
  isSearchModuleOpen: boolean;
  isWebViewReady: boolean;
  currentSearchResult: SearchResultWithTitle;
  isSearchOperation: boolean;

  setSearchQuery: (searchQuery: string) => void;
  setSearchResults: (result: SearchResultsMapWithTitle) => void;
  toggleIsSearchModuleOpen: () => void;
  setCurrentSearchResult: (searchResult: SearchResultWithTitle) => void;
  resetSearch: () => void;
  setIsWebViewReady: (isWebViewReady: boolean) => void;
  setIsSearchOperation: (isSearchOperation: boolean) => void;
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
    chapterIndex: -1,
    chapterTitle: '',
    snippet: '',
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
        chapterIndex: -1,
        chapterTitle: '',
        snippet: '',
      },
      searchQuery: '',
      searchResults: {},
      isSearchOperation: false,
    }),
  setIsWebViewReady: (isWebViewReady) => set({ isWebViewReady: isWebViewReady }),
  setIsSearchOperation: (isSearchOperation) => set({ isSearchOperation: isSearchOperation }),
}));
