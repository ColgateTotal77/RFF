import { Book } from 'types';

export const ensureArray = (item: any) => {
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
};

export const deepMerge = (target: any, source: any): any => {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
};

export const calculateBookProgress = (
  currentBook: Book,
  currentChapter: number,
  currentChapterScrollPosition: number
) => {
  const charOffset = currentBook.misc.charOffsets[currentChapter];
  const charsIntoChapter =
    currentBook.chapters[currentChapter].charCount * currentChapterScrollPosition;
  return (charOffset + charsIntoChapter) / currentBook.misc.totalCharCount;
};
