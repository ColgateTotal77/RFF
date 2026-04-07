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
