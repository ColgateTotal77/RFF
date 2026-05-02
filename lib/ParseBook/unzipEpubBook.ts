import { Directory, Paths } from 'expo-file-system';
import { unzip } from 'react-native-zip-archive';

export const unzipEpubBook = async (uri: string) => {
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
