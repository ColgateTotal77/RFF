import { unzip } from 'react-native-zip-archive';
import { Directory, File, Paths } from 'expo-file-system';
import { Chapter, Book } from 'lib/types';
import { ensureArray, parser } from 'lib/utils';
import { useBookStore } from 'stores/useBookStore';
import { WebView } from 'react-native-webview';
import { RefObject } from 'react';
import { BookEngine } from 'modules/book-engine';
import { findNodeHandle, View } from 'react-native';

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
          id,
          href,
          fullPath: `${absoluteBasePath}/${href}`,
        };
      })
      .filter((c): c is Chapter => c !== null);

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

export const useEpubNextChapter = (
  webViewRef: RefObject<WebView | null>,
  containerRef: RefObject<View | null>
) => {
  const { currentBook, shiftNext } = useBookStore();

  return async () => {
    if (!currentBook) return;

    const shiftResult = shiftNext();

    if (!shiftResult) {
      console.log('End of book reached.');
      webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
      return;
    }

    const { fetchIndex, removeIndex } = shiftResult;
    console.log('Shift result:', { fetchIndex, removeIndex });

    try {
      const nextChapter = currentBook.chapters[fetchIndex];

      if (!nextChapter) {
        webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
        return;
      }

      const reactTag = findNodeHandle(containerRef.current);

      if (reactTag) {
        BookEngine.injectChapter(
          reactTag,
          nextChapter.fullPath,
          fetchIndex,
          removeIndex,
          'bottom'
        );
      } else {
        console.error('No react tag found');
        webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
      }

      console.log('currentChapters:', currentBook.currentChapters);
    } catch (e) {
      console.error('Failed to natively inject next chapter:', e);
      webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
    }
  };
};

export const useEpubPrevChapter = (
  webViewRef: RefObject<WebView | null>,
  containerRef: RefObject<View | null>
) => {
  const { currentBook, shiftPrev } = useBookStore();

  return async () => {
    if (!currentBook) return;

    const shiftResult = shiftPrev();

    if (!shiftResult) {
      console.log('Start of book reached.');
      webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
      return;
    }

    const { fetchIndex, removeIndex } = shiftResult;
    console.log('Shift result:', { fetchIndex, removeIndex });

    try {
      const prevChapter = currentBook.chapters[fetchIndex];

      if (!prevChapter) {
        webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
        return;
      }

      const reactTag = findNodeHandle(containerRef.current);
      if (reactTag) {
        BookEngine.injectChapter(
          reactTag,
          prevChapter.fullPath,
          fetchIndex,
          removeIndex,
          'top'
        );
      } else {
        console.error('No react tag found');
        webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
      }

      console.log('currentChapters:', currentBook.currentChapters);
    } catch (e) {
      console.error('Failed to natively inject prev chapter:', e);
      webViewRef.current?.injectJavaScript(`window.isFetching = false; true;`);
    }
  };
};
