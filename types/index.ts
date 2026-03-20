import { DrawerNavigationProp } from '@react-navigation/drawer';

export type RootStackParamList = {
  'Reading Now': undefined;
  Settings: undefined;
  Reader: undefined;
};
export type DrawerTab = keyof RootStackParamList;
export type RootDrawerNavigationProp = DrawerNavigationProp<RootStackParamList>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface Chapter {
  id: number;
  href: string;
  fullPath: string;
  title: string;
}

export interface Book {
  title: string;
  cover?: string;
  chapters: Chapter[];
  basePath: string;
  currentChapters: number[];
  lastScrollPosition: number;
  settings: BookSettings;
}

export interface Font {
  fontSize: number;
  fontFamily: string;
}

export interface BookSettings {
  ankiDeckId?: string;
  ankiModelId?: string;
  font?: Font;
}

export interface DefaultBookSettings {
  ankiDeckId?: string;
  ankiModelId?: string;
  font: Font;
}

export interface Setting {
  defaultBookSettings: DefaultBookSettings;
}

export interface SearchResult {
  id: number;
  chapterIndex: number;
  snippet: string;
  occurrenceIndex: number;
}

export type SearchResultWithTitle = SearchResult & { chapterTitle: string };

export type SearchResultsMapWithTitle = Record<string, SearchResultWithTitle>;

export interface CurrectCTree {
  langCode: string;
  deckId: string;
}
