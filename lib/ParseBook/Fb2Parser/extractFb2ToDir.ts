import { Directory, File, Paths } from 'expo-file-system';
import { unzip } from 'react-native-zip-archive';
import { detectXmlEncoding, decodeCp1251 } from 'lib/ParseBook/Fb2Parser/decodeXmlBytes';

export const extractFb2ToDir = async (uri: string, isZipped = false) => {
  try {
    const rawName = uri.split('/').at(-1) || 'unknown_book';
    const fileName =
      rawName.replace(/\.fb2\.zip$|\.fb2$|\.zip$/i, '').replace(/[^\w.-]+/g, '_') || 'unknown_book';
    const timestamp = Date.now();

    const booksDir = new Directory(Paths.document, 'books');
    const targetDir = new Directory(booksDir, `${fileName}_${timestamp}`);

    if (!booksDir.exists) booksDir.create({ intermediates: true, idempotent: true });
    if (!targetDir.exists) targetDir.create({ intermediates: true, idempotent: true });

    let fb2File: File;
    if (isZipped) {
      await unzip(uri, targetDir.uri);
      const innerFb2 =
        targetDir
          .list()
          .find((e): e is File => e instanceof File && e.name.toLowerCase().endsWith('.fb2')) ??
        null;
      if (!innerFb2) throw new Error('No .fb2 file found inside the archive.');
      fb2File = innerFb2;
    } else {
      fb2File = new File(uri);
    }

    const bytes = await fb2File.bytes();
    const encoding = detectXmlEncoding(bytes);

    let xml: string;
    switch (encoding) {
      case 'windows-1251':
      case 'cp1251':
        xml = decodeCp1251(bytes);
        break;

      default:
        xml = await fb2File.text();
    }

    return { unzippedPath: targetDir.uri, xml };
  } catch (error) {
    console.error('Error extracting FB2:', error);
    throw new Error('Failed to unzip the book file.');
  }
};
