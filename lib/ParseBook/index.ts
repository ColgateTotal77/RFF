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

export const parseBook = async (bookUri: string): Promise<Book> => {
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

    for (const chapter of chapterData) {
      const processedHtml = processChapterDom({ chapter, mapHrefChapterId, absoluteBasePath });

      const blockContents = splitHtmlIntoBlocks(processedHtml, globalBlockId);

      const { newBlocks, chapterBlockIds, chapterAnchors, chapterCharCount } =
        processChapterBlocks({
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
        href: chapter.href,
        fullPath: chapter.fullPath,
        charCount: 0,
        charOffset: 0,
        blockIds: chapterBlockIds,
        anchors: chapterAnchors,
      });
    }

    let globalCharOffset = 0;
    const chapterCharCounts: number[] = new Array(chapters.length).fill(0);

    chapters.forEach((chapter, chapterIndex) => {
      chapter.charOffset = globalCharOffset;

      for (const block of blocks.filter(b => b.chapterId === chapterIndex)) {
        block.charOffset = globalCharOffset;
        globalCharOffset += block.charCount;
        chapterCharCounts[chapterIndex] += block.charCount;
      }

      chapter.charCount = chapterCharCounts[chapterIndex];
    });

    let toc: TocItem[] = [];
    if (manifestMap[tocId]) {
      toc = await extractToc({
        tocId,
        unzippedPath,
        opfDirName,
        manifestMap,
        mapHrefChapterId
      });
    }

    const blockPath = blocks.map((block) => block.fullPath)

    let detectedLanguage = await detectLanguage(blockPath);

    await BookEngine.loadBookInSQL(
      basePath,
      blockPath,
      blocks.map((block) => block.id),
      blocks.map((block) => toc.find((t) => t.chapterId === block.chapterId)?.title || '')
    );

    return {
      title: String(title),
      author,
      cover: coverPath,
      basePath,
      settings: {
        bookLang: detectedLanguage ? detectedLanguage : bookLanguage,
        targetLang: '',
      },
      chapters,
      toc,
      blocks,
      currentBlocks: [0, 1],
      currentBlock: 0,
      scrollPosition: 0,
      misc: {
        percent: 0,
        totalCharCount,
        currentBlockScrollPercent: 0,
        haveRead: false,
      },
    };
  } catch (error) {
    console.error('Error parsing manifest:', error);
    throw new Error('Failed to parse book manifest.');
  }
};
