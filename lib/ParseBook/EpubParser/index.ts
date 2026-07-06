import { ParsedSource } from 'lib/ParseBook/types';
import { extractEpubMeta } from 'lib/ParseBook/EpubParser/extractEpubMeta';
import { extractEpubToDir } from 'lib/ParseBook/EpubParser/extractEpubToDir';
import { extractChapterData } from 'lib/ParseBook/EpubParser/extractChapterData';
import { extractToc } from 'lib/ParseBook/EpubParser/extractToc';

export const epubParser = async (bookUri: string): Promise<ParsedSource> => {
  const unzippedPath = await extractEpubToDir(bookUri);

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
  } = await extractEpubMeta(unzippedPath);

  const { chapters, mapHrefChapterId } = await extractChapterData(
    spineItems,
    manifestMap,
    absoluteBasePath
  );

  const toc =
    manifestMap[tocId] || navHref
      ? await extractToc({
          tocId,
          unzippedPath,
          opfDirName,
          manifestMap,
          mapHrefChapterId,
          navHref,
        })
      : [];

  return {
    title,
    author,
    coverPath,
    basePath,
    unzippedPath,
    cssPaths,
    bookLanguage,
    chapters,
    toc,
  };
};
