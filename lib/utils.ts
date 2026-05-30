import { Book, Mapping } from 'types';

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
  currentBlockScrollPercent: number,
  blockId?: number
) => {
  const targetBlockId = typeof blockId === 'number' ? blockId : currentBook.currentBlock;
  const blockIndex = currentBook.mapping.blockIndex[targetBlockId];

  if (!blockIndex) return 0;

  const charsIntoChapter =
    blockIndex.blockCharOffset -
    blockIndex.chapterCharOffset +
    blockIndex.blockCharCount * currentBlockScrollPercent;

  return (blockIndex.chapterCharOffset + charsIntoChapter) / currentBook.misc.totalCharCount;
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

export const buildBookMapping = (book: Book) => {
  const mapping: Mapping = {
    chapterById: {},
    tocByChapterId: {},
    tocById: {},
    firstBlockByChapterId: {},
    blockIndex: {},
  };

  for (const chapter of book.chapters) {
    mapping.chapterById[chapter.id] = chapter;
    const firstBlockId = chapter.blockIds[0];
    if (typeof firstBlockId === 'number') {
      mapping.firstBlockByChapterId[chapter.id] = firstBlockId;
    }
  }

  for (const tocItem of book.toc) {
    const items = mapping.tocByChapterId[tocItem.chapterId];
    if (items) items.push(tocItem);
    else mapping.tocByChapterId[tocItem.chapterId] = [tocItem];
    mapping.tocById[tocItem.id] = tocItem;
  }

  let lastTitle = '';
  for (const block of book.blocks) {
    const chapter = mapping.chapterById[block.chapterId];

    const title = mapping.tocByChapterId[block.chapterId]?.[0]?.title ?? lastTitle;
    lastTitle = title;

    mapping.blockIndex[block.id] = {
      chapterId: block.chapterId,
      chapterTitle: title,
      firstBlockId: mapping.firstBlockByChapterId[block.chapterId],
      chapterCharOffset: chapter.charOffset,
      chapterCharCount: chapter.charCount,
      blockCharOffset: block.charOffset,
      blockCharCount: block.charCount,
    };
  }

  return mapping;
};
