import { ParsedSource } from 'lib/ParseBook/types';
import { extractFb2ToDir } from 'lib/ParseBook/Fb2Parser/extractFb2ToDir';
import { parse } from 'node-html-parser';
import { extractFb2Meta } from 'lib/ParseBook/Fb2Parser/extractFb2Meta';
import { extractChapterData } from 'lib/ParseBook/Fb2Parser/extractChapterData';
import { extractFb2Sections } from 'lib/ParseBook/Fb2Parser/extractFb2Sections';
import { extractToc } from 'lib/ParseBook/Fb2Parser/extractToc';

export const fb2Parser = async (bookUri: string, isZipped = false): Promise<ParsedSource> => {
  const { unzippedPath, xml } = await extractFb2ToDir(bookUri, isZipped);
  const dom = parse(xml);
  const { title, author, bookLanguage, coverPath, imageMap } = await extractFb2Meta(
    dom,
    unzippedPath
  );

  const sections = extractFb2Sections(dom);
  const chapters = extractChapterData(sections, imageMap);
  const toc = extractToc(sections);

  return {
    title,
    author,
    coverPath,
    basePath: unzippedPath,
    unzippedPath,
    cssPaths: [],
    bookLanguage,
    chapters,
    toc,
  };
};
