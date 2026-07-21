import { Directory } from 'expo-file-system';
import { Chapter, Book, Block } from 'types';
import { BookEngine } from 'modules/book-engine';
import { splitHtmlIntoBlocks } from 'lib/ParseBook/splitHtmlIntoBlocks';
import { processChapterBlocks } from 'lib/ParseBook/processChapterBlock';
import { detectLanguage } from 'lib/ParseBook/detectLang';
import { LanguageCode, FALLBACK_BOOK_LANGUAGE } from 'lib/langHelper';
import { epubParser } from 'lib/ParseBook/EpubParser';
import { fb2Parser } from 'lib/ParseBook/Fb2Parser';
import { detectBookFormat } from 'lib/ParseBook/detectFormat';

export const parseBook = async (bookUri: string, targetLang: LanguageCode): Promise<Book> => {
  try {
    const format = await detectBookFormat(bookUri);

    const {
      title,
      author,
      coverPath,
      basePath,
      unzippedPath,
      cssPaths,
      bookLanguage,
      chapters,
      toc,
    } =
      format === 'epub'
        ? await epubParser(bookUri)
        : await fb2Parser(bookUri, format === 'fb2-zip');

    const blocksDir = new Directory(unzippedPath, '_blocks');
    if (!blocksDir.exists) blocksDir.create({ intermediates: true });

    const outChapters: Chapter[] = [];
    const blocks: Block[] = [];
    let globalBlockId = 0;
    let totalCharCount = 0;
    let langSample = '';
    const sampleStart = Math.floor(chapters.length / 3);

    for (const [index, chapter] of chapters.entries()) {
      const blockContents = splitHtmlIntoBlocks(chapter.html, globalBlockId);

      if (index >= sampleStart && langSample.length < 2000) {
        for (const blockHtml of blockContents.blocks) {
          const textOnly = blockHtml
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (textOnly.length > 0) {
            langSample += textOnly + '\n';
            if (langSample.length >= 2000) break;
          }
        }
      }

      const { newBlocks, chapterBlockIds, chapterAnchors, chapterCharCount } =
        await processChapterBlocks({
          blockContents,
          chapterId: chapter.id,
          startingBlockId: globalBlockId,
          blocksDir,
        });

      blocks.push(...newBlocks);
      totalCharCount += chapterCharCount;
      globalBlockId = blockContents.finalBlockId + 1;

      outChapters.push({
        id: chapter.id,
        charCount: 0,
        charOffset: 0,
        blockIds: chapterBlockIds,
        anchors: chapterAnchors,
      });
    }

    let globalCharOffset = 0;
    const chapterCharCounts: number[] = new Array(outChapters.length).fill(0);

    let blockIndex = 0;
    for (const chapter of outChapters) {
      chapter.charOffset = globalCharOffset;

      while (blockIndex < blocks.length && blocks[blockIndex].chapterId === chapter.id) {
        const block = blocks[blockIndex];
        block.charOffset = globalCharOffset;
        globalCharOffset += block.charCount;
        chapterCharCounts[chapter.id] += block.charCount;
        blockIndex++;
      }

      chapter.charCount = chapterCharCounts[chapter.id];
    }

    const blockPaths = blocks.map((block) => block.fullPath);

    const detectedLanguage = detectLanguage(langSample);

    const tocTitleByChapterId = new Map(toc.map((t) => [t.chapterId, t.title]));

    BookEngine.loadBookInSQL(
      basePath,
      blockPaths,
      blocks.map((block) => block.id),
      blocks.map((block) => tocTitleByChapterId.get(block.chapterId) || '')
    );

    return {
      title: String(title),
      author,
      cover: coverPath,
      basePath,
      unzippedPath: unzippedPath,
      cssPaths,
      settings: {
        bookLang: detectedLanguage || bookLanguage || FALLBACK_BOOK_LANGUAGE,
        targetLang,
      },
      chapters: outChapters,
      toc,
      blocks,
      bookmarks: [],
      currentBlocks: [0, 1],
      currentBlock: 0,
      misc: {
        percent: 0,
        totalCharCount,
        currentBlockScrollPercent: 0,
        haveRead: false,
      },
      mapping: {
        chapterById: {},
        tocByChapterId: {},
        tocById: {},
        firstBlockByChapterId: {},
        blockIndex: {},
      },
    };
  } catch (error) {
    console.error('Error parsing book:', error);
    throw error instanceof Error ? error : new Error('Failed to load book.');
  }
};
