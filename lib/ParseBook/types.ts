import { TocItem } from 'types';
import { LanguageCode } from 'lib/langHelper';

export interface SourceChapter {
  id: number;
  html: string;
}

export interface ParsedSource {
  title: string;
  author: string;
  coverPath?: string;
  basePath: string;
  unzippedPath: string;
  cssPaths: string[];
  bookLanguage: LanguageCode | null;
  chapters: SourceChapter[];
  toc: TocItem[];
}
