import { Directory } from 'expo-file-system';
import { Chapter, Book, Block, TocItem } from 'types';
import { BookEngine } from 'modules/book-engine';
import { unzipEpubBook } from 'lib/ParseBook/unzipEpubBook';
import { extractBookMeta } from 'lib/ParseBook/extractBookMeta';
import { splitHtmlIntoBlocks } from 'lib/ParseBook/splitHtmlIntoBlocks';
import { extractChapterData } from 'lib/ParseBook/extractChapterData';
import { processChapterDom } from 'lib/ParseBook/processChapterDom';
import { processChapterBlocks } from 'lib/ParseBook/processChapterBlock';
import { extractToc } from 'lib/ParseBook/extractToc';
import { detectLanguage } from 'lib/ParseBook/detectLang';
import { LanguageCode } from 'lib/langHelper';

export const parseBook = async (bookUri: string, targetLang: LanguageCode): Promise<Book> => {
  try {
    const unzippedPath = await unzipEpubBook(bookUri);

    const {
      title,
      author,
      coverPath,
      language: bookLanguage,
      absoluteBasePath,
      basePath,
      opfDirName,
      spineItems,
      tocId,
      manifestMap,
      cssPaths,
      navHref,
    } = await extractBookMeta(unzippedPath);

    const { chapterData, mapHrefChapterId } = await extractChapterData(
      spineItems,
      manifestMap,
      absoluteBasePath
    );

    const blocksDir = new Directory(unzippedPath, '_blocks');
    if (!blocksDir.exists) blocksDir.create({ intermediates: true });

    const chapters: Chapter[] = [];
    const blocks: Block[] = [];
    let globalBlockId = 0;
    let totalCharCount = 0;
    let langSample = '';

    for (const chapter of chapterData) {
      const processedHtml = processChapterDom({ chapter, mapHrefChapterId, absoluteBasePath });

      const blockContents = splitHtmlIntoBlocks(processedHtml, globalBlockId);

      if (langSample.length < 2000) {
        for (const blockHtml of blockContents.blocks) {
          const textOnly = blockHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
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

      chapters.push({
        id: chapter.id,
        charCount: 0,
        charOffset: 0,
        blockIds: chapterBlockIds,
        anchors: chapterAnchors,
      });
    }

    let globalCharOffset = 0;
    const chapterCharCounts: number[] = new Array(chapters.length).fill(0);

    let blockIndex = 0;
    for (const chapter of chapters) {
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

    let toc: TocItem[] = [];
    if (manifestMap[tocId] || navHref) {
      toc = await extractToc({
        tocId,
        unzippedPath,
        opfDirName,
        manifestMap,
        mapHrefChapterId,
        navHref,
      });
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
        bookLang: detectedLanguage || bookLanguage || 'en',
        targetLang,
      },
      chapters,
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
    console.error('Error parsing manifest:', error);
    throw new Error('Failed to parse book manifest.');
  }
};
