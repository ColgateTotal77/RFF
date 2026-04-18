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

export interface Block {
  id: number;           // Global index
  chapterId: number;
  fullPath: string;
  charCount: number;
  charOffset: number;
}

export interface Chapter {
  id: number;
  href: string;
  fullPath: string;
  title: string;
  charCount: number;
  charOffset: number;
  blockIds: number[];
}

export interface Book {
  title: string;
  cover?: string;
  chapters: Chapter[];
  blocks: Block[];
  currentBlocks: number[];
  currentBlock: number;
  basePath: string;
  settings: BookSettings;
  misc: Misc;
  scrollPosition: number;
  // bookmarks: Bookmark[];
}

export interface Bookmark {
  id: string;
  chapterIndex: number;
  scrollPosition: number;
  createdAt: number;
}

export interface Misc {
  percent: number;
  totalCharCount: number;
  currentBlockScrollPercent: number;
}

export interface Font {
  fontSize: number;
  fontFamily: string;
}

export const FIELD_MAPPING_KEYS = ['word', 'translation', 'examples', 'zipf'] as const;

export interface FieldMapping {
  word?: number;
  translation?: number;
  examples?: number;
  zipf?: number;
  fieldCount: number;
  modalId: string;
}

export interface BookSettings {
  ankiDeckId?: string;
  ankiModelId?: string;
  fieldMapping?: FieldMapping;
  mirroredAnkiModelId?: string;
  mirroredFieldMapping?: FieldMapping;
  isTwoSided?: boolean;
  autoCardOnDoubleTap?: boolean;
  langCodeFrom: string;
  langCodeTo: string;
  font?: Font;
}

export interface DefaultBookSettings {
  ankiDeckId: string;
  ankiModelId: string;
  fieldMapping: FieldMapping;
  mirroredAnkiModelId: string;
  mirroredFieldMapping: FieldMapping;
  isTwoSided: boolean;
  autoCardOnDoubleTap: boolean;
  font: Font;
  theme: Theme;
}

export type Theme = 'light' | 'dark';

export interface SearchResult {
  id: number;
  blockId: number;
  title: string;
  snippet: string;
  occurrenceIndex: number;
  query: string;
}

export interface CurrentCTree {
  langCode: string;
  deckId: string;
}

export type SelectionMenu = {
  visible: boolean;
  text: string;
  top: number;
  left: number;
  noteIds?: string;
  colorCode?: string;
};
