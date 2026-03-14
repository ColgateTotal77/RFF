import { unzip } from 'react-native-zip-archive';
import { Directory, File, Paths } from 'expo-file-system';
import { Chapter, Book } from 'types';
import { ensureArray } from 'lib/utils';
import { XMLParser } from 'fast-xml-parser';

export const extractEpub = async (uri: string | null) => {
  if (uri)
    try {
      const fileName = uri.split('/').pop()?.replace('.epub', '') || 'unknown_book';
      const timestamp = Date.now();

      const booksDir = new Directory(Paths.document, 'books');
      const targetDir = new Directory(booksDir, `${fileName}_${timestamp}`);

      if (!booksDir.exists) {
        booksDir.create({ intermediates: true, idempotent: true });
      }

      await unzip(uri, targetDir.uri);

      console.log('EPUB unzipped successfully to:', targetDir.uri);
      return targetDir.uri;
    } catch (error) {
      console.error('Error extracting EPUB:', error);
      throw new Error('Failed to unzip the book file.');
    }
};

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

    const chapters: Chapter[] = spineItems
      .map((spineItem: any) => {
        const id = spineItem['@_idref'];
        const href = manifestMap[id];

        if (!href) return null;
        console.log('fullPath: ', `${absoluteBasePath}/${href}`);
        return {
          id: Number(id),
          href,
          fullPath: `${absoluteBasePath}/${href}`,
          title: `Chapter`,
        };
      })
      .filter((c): c is Chapter => c !== null);

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

    return {
      title: String(title),
      cover: coverPath,
      chapters,
      basePath: 'file://' + absoluteBasePath,
      currentChapters: [1, 2],
      lastScrollPosition: 0,
      settings: {},
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
