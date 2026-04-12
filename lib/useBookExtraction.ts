import { unzip } from 'react-native-zip-archive';
import { Directory, File, Paths } from 'expo-file-system';
import { Chapter, Book, Block } from 'types';
import { ensureArray, resolvePath } from 'lib/utils';
import { XMLParser } from 'fast-xml-parser';
import { BookEngine } from 'modules/book-engine';

export const extractEpub = async (uri: string | null) => {
  if (uri)
    try {
      const fileName = uri.split('/').pop()?.replace('.epub', '') || 'unknown_book';
      const timestamp = Date.now();

      const booksDir = new Directory(Paths.document, 'books');
      const targetDir = new Directory(booksDir, `${fileName}_${timestamp}`);

      if (!booksDir.exists) booksDir.create({ intermediates: true, idempotent: true });

      await unzip(uri, targetDir.uri);

      console.log('EPUB unzipped successfully to:', targetDir.uri);
      return targetDir.uri;
    } catch (error) {
      console.error('Error extracting EPUB:', error);
      throw new Error('Failed to unzip the book file.');
    }
};

const BLOCK_SIZE = 5000;

function splitHtmlIntoBlocks(html: string, globalBlockId: number): { blocks: string[], finalBlockId: number } {
  const blocks: string[] = [];

  let localGlobalBlockId = globalBlockId;

  const paragraphs = html.split(/(<\/p>\s*)/i);
  let currentBlock = `<div id="block-${localGlobalBlockId}">`;
  let currentSize = 0;

  for (const p of paragraphs) {
    const pText = p.replace(/<[^>]*>/g, ' ');
    const pSize = pText.length;

    if (currentSize + pSize > BLOCK_SIZE && currentSize > 0) {
      currentBlock += '</div>';
      localGlobalBlockId++;
      blocks.push(currentBlock);
      currentBlock = `<div id="block-${localGlobalBlockId}">`;
      currentSize = 0;
    }
    currentBlock += p;
    currentSize += pSize;
  }

  if (currentSize > 0) {
    currentBlock += '</div>';
    blocks.push(currentBlock);
  }

  return blocks.length > 0 ? { blocks, finalBlockId: localGlobalBlockId } : { blocks: [html], finalBlockId: globalBlockId };
}

export const parseManifest = async (unzippedPath: string): Promise<Book> => {
  try {
    const containerFile = new File(unzippedPath, 'META-INF', 'container.xml');

    if (!containerFile.exists) {
      throw new Error('INVALID_EPUB: container.xml not found');
    }

    const containerXml = await containerFile.text();
    const containerData = parser.parse(containerXml);

    const rootFilePath = containerData.container.rootfiles.rootfile['@_full-path'];

    const opfFile = new File(unzippedPath, rootFilePath);
    const opfXml = await opfFile.text();
    const opfData = parser.parse(opfXml);
    const packageData = opfData.package;

    const opfDirName = rootFilePath.substring(0, rootFilePath.lastIndexOf('/'));

    const absoluteBasePath = (opfDirName ? `${unzippedPath}/${opfDirName}` : unzippedPath).replace(
      'file:///',
      '/'
    );

    const metadata = packageData.metadata;
    const title =
      typeof metadata['dc:title'] === 'object'
        ? metadata['dc:title']['#text']
        : metadata['dc:title'];

    const manifestItems = ensureArray(packageData.manifest.item);
    const spineItems = ensureArray(packageData.spine.itemref);

    const manifestMap: Record<string, string> = {};
    manifestItems.forEach((item: any) => {
      manifestMap[item['@_id']] = item['@_href'];
    });

    let totalCharCount = 0;
    const blocks: Block[] = [];
    let globalBlockId = 0;

    const blocksDir = new Directory(unzippedPath, '_blocks');

    if (!blocksDir.exists) blocksDir.create({ intermediates: true });
    const blocksDirPath = blocksDir.uri.replace('file://', '');

    const encoder = new TextEncoder();

    const chapters: Chapter[] = (
      await Promise.all(
        spineItems.map(async (spineItem: any, index: number) => {
          const id = spineItem['@_idref'];
          const href = manifestMap[id];

          const chapterBlockIds = [];
          try {
            const file = new File(`file://${absoluteBasePath}/${href}`);
            let html = await file.text();

            const chapterDir = href.includes('/') ? href.substring(0, href.lastIndexOf('/')) : '';

            const chapterBasePath = chapterDir
              ? `${absoluteBasePath}/${chapterDir}`
              : absoluteBasePath;

            const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            if (bodyMatch) {
              html = bodyMatch[1];
            }

            html = html.replace(
              /<(img|image)[^>]+(?:src|href|xlink:href)=(['"])(.*?)\2/gi,
              (match, tag, quote, src) => {
                if (/^(http|https|file|data):/i.test(src)) return match;

                const resolvedSrc = resolvePath(chapterBasePath, src);
                return match.replace(src, `file:///${resolvedSrc}`);
              }
            );

            const blockContents = splitHtmlIntoBlocks(html, globalBlockId);

            for (const blockContent of blockContents.blocks) {
              const idMatch = blockContent.match(/id="block-(\d+)"/);
              const blockId = idMatch ? parseInt(idMatch[1]) : globalBlockId;

              const blockFileName = `block_${blockId}.html`;
              const blockPath = `${blocksDirPath}${blockFileName}`;
              const blockFile = new File(blocksDir, blockFileName);
              blockFile.write(encoder.encode(blockContent));

              const textOnly = blockContent
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

              blocks.push({
                id: blockId,
                chapterId: index,
                fullPath: blockPath,
                charCount: textOnly.length,
                charOffset: 0,
              });

              totalCharCount += textOnly.length;
              chapterBlockIds.push(blockId);
            }

            globalBlockId = blockContents.finalBlockId + 1;
          } catch (e) {
            console.error(e);
          }

          if (!href) return null;
          return {
            id: index,
            href,
            fullPath: `${absoluteBasePath}/${href}`,
            title: `Chapter`,
            charCount: 0,
            blockIds: chapterBlockIds,
          };
        })
      )
    ).filter((c): c is Chapter => c !== null);

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

    const tocId = packageData.spine['@_toc'];

    if (tocId && manifestMap[tocId]) {
      try {
        const ncxHref = manifestMap[tocId];
        const ncxFile = new File(unzippedPath, `${opfDirName ? opfDirName + '/' : ''}${ncxHref}`);

        if (ncxFile.exists) {
          const ncxXml = await ncxFile.text();
          const ncxData = parser.parse(ncxXml);

          const navPoints = ensureArray(ncxData?.ncx?.navMap?.navPoint || []);

          navPoints.forEach((navPoint: any) => {
            const chapterTitle = navPoint.navLabel?.text;
            const chapterSrc = navPoint.content?.['@_src'];

            if (chapterTitle && chapterSrc) {
              const baseHref = chapterSrc.split('#')[0];

              const matchingChapter = chapters.find((c) => c.href === baseHref);
              if (matchingChapter) {
                matchingChapter.title = chapterTitle.trim();
              }
            }
          });
        }
      } catch (ncxError) {
        console.warn('Failed to parse NCX TOC for chapter titles:', ncxError);
      }
    }

    let coverPath = undefined;
    const metaItems = ensureArray(metadata.meta);
    const coverMeta = metaItems.find((m: any) => m['@_name'] === 'cover');

    if (coverMeta) {
      const coverId = coverMeta['@_content'];
      const coverHref = manifestMap[coverId];
      if (coverHref) {
        coverPath = `file://${absoluteBasePath}/${coverHref}`;
      }
    }

    const basePath = 'file://' + absoluteBasePath;

    await BookEngine.loadBookInSQL(
      basePath,
      blocks.map((block) => block.fullPath),
      blocks.map((block) => block.id),
      blocks.map((block) => chapters[block.chapterId]?.title || ''),
    );

    return {
      title: String(title),
      cover: coverPath,
      basePath,
      settings: {},
      chapters,
      currentBlocks: [0, 1],
      currentBlock: 0,
      blocks,
      scrollPosition: 0,
      misc: {
        percent: 0,
        totalCharCount,
        currentBlockScrollPercent: 0,
      },
    };
  } catch (error) {
    console.error('Error parsing manifest:', error);
    throw new Error('Failed to parse book manifest.');
  }
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});
