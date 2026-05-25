import { Book } from 'types';

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

export const calculateBookProgress = (currentBook: Book, currentBlockScrollPercent: number) => {
  const currentChapter = currentBook.chapters.find((ch) =>
    ch.blockIds.includes(currentBook.currentBlock)
  );

  if (!currentChapter) return 0;

  const block = currentBook.blocks[currentBook.currentBlock];
  const charsIntoChapter =
    block.charOffset -
    currentBook.blocks[currentChapter.blockIds[0]].charOffset +
    block.charCount * currentBlockScrollPercent;

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
