import { DrawerNavigationProp } from '@react-navigation/drawer';
import { FontFamily } from 'lib/constants';
import { LanguageCode } from 'lib/langHelper';
export type RootStackParamList = {
  'Reading Now': undefined;
  Settings: undefined;
  Reader: undefined;
  'Have Read': undefined;
};
export type DrawerTab = keyof RootStackParamList;
export type RootDrawerNavigationProp = DrawerNavigationProp<RootStackParamList>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : Partial<T[P]>;
};

export interface Block {
  id: number; // Global index
  chapterId: number;
  fullPath: string;
  charCount: number;
  charOffset: number;
}

export interface Chapter {
  id: number;
  charCount: number;
  charOffset: number;
  blockIds: number[];
  anchors: Record<string, number>;
}

export interface TocItem {
  id: string;
  title: string;
  chapterId: number;
  level: number;
  parentId?: string;
}

export interface Mapping {
  chapterById: Record<number, Chapter>;
  tocByChapterId: Record<number, TocItem[]>;
  tocById: Record<string, TocItem>;
  firstBlockByChapterId: Record<number, number>;
  blockIndex: Record<
    number,
    {
      chapterId: number;
      chapterTitle: string;
      firstBlockId: number;
      chapterCharOffset: number;
      chapterCharCount: number;
      blockCharOffset: number;
      blockCharCount: number;
    }
  >;
}

export interface Book {
  title: string;
  author: string;
  cover?: string;
  toc: TocItem[];
  chapters: Chapter[];
  blocks: Block[];
  currentBlocks: number[];
  currentBlock: number;
  basePath: string;
  cssPaths: string[];
  settings: BookSettings;
  misc: Misc;
  bookmarks: Bookmark[];
  mapping: Mapping;
  unzippedPath: string;
}

export type Bookmark = {
  id: number;
  title: string;
  blockId: number;
  scrollPercent: number;
  createdAt: number;
};

export interface Misc {
  percent: number;
  totalCharCount: number;
  currentBlockScrollPercent: number;
  haveRead: boolean;
}

export interface Font {
  fontFamily: FontFamily;
  fontSize: number;
}

export const FIELD_MAPPING_KEYS = [
  'word',
  'translation',
  'examples',
  'zipf',
  'synonyms',
  'audio',
] as const;

export type AppFieldKey = (typeof FIELD_MAPPING_KEYS)[number];

export interface FieldMapping {
  word?: number;
  translation?: number;
  examples?: number;
  zipf?: number;
  synonyms?: number;
  audio?: number;
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
  bookLang: LanguageCode;
  targetLang: LanguageCode;
  font?: Font;
}

export interface Settings {
  ankiDeckId: string;
  ankiModelId: string;
  fieldMappings: Record<string, FieldMapping>;
  mirroredAnkiModelId: string;
  mirroredFieldMappings: Record<string, FieldMapping>;
  isTwoSided: boolean;
  autoCardOnDoubleTap: boolean;
  targetLang: LanguageCode;
  font: Font;
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
  langCode: LanguageCode;
  deckId: string;
}

export type SelectionMenu = {
  visible: boolean;
  text: string;
  sentence: string;
  top: number;
  bottom: number;
  left: number;
  noteIds?: string;
  colorCode?: string;
};
