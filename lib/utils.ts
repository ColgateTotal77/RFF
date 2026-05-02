import { Book } from 'types';
import { ISO_639_3_TO_2 } from './constants';

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
  currentBlock: number,
  currentBlockScrollPosition: number
) => {
  const currentChapter = currentBook.chapters.find((ch) => ch.blockIds.includes(currentBlock));

  if (!currentChapter) return 0;

  const block = currentBook.blocks[currentBlock];
  const charsIntoChapter =
    block.charOffset -
    currentBook.blocks[currentChapter.blockIds[0]].charOffset +
    block.charCount * currentBlockScrollPosition;

  return (currentChapter.charOffset + charsIntoChapter) / currentBook.misc.totalCharCount;
};

export const resolvePath = (base: string, relative: string) => {
  const stack = base.split('/').filter(Boolean);
  const parts = relative.split('/');
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return stack.join('/');
};

export const normalizeLanguageCode = (lang: string): string => {
  if (!lang) return 'en';

  const normalized = lang.toLowerCase().trim();

  if (/^[a-z]{2}$/.test(normalized)) return normalized;

  if (/^[a-z]{3}$/.test(normalized)) return ISO_639_3_TO_2[normalized] || normalized;

  const twoLetterCode = normalized.split(/[-_]/)[0];
  if (/^[a-z]{2}$/.test(twoLetterCode)) return twoLetterCode;

  return normalized;
};

export const updateNestedMapping = <T extends Record<string, any>>(
  mappings: Record<string, T> | undefined,
  key: string,
  partialData: Partial<T>
): Record<string, T> => {
  return {
    ...(mappings || {}),
    [key]: {
      ...(mappings?.[key] || {}),
      ...partialData,
    } as T,
  } as Record<string, T>;
};
