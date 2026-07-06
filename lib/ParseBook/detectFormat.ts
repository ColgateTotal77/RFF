import { File } from 'expo-file-system';

export type BookFormat = 'epub' | 'fb2' | 'fb2-zip';

const bytesToAscii = (bytes: Uint8Array): string => {
  let result = '';
  for (let i = 0; i < bytes.length; i++) result += String.fromCharCode(bytes[i]);
  return result;
};

export const detectBookFormat = async (uri: string): Promise<BookFormat> => {
  const lower = uri.toLowerCase();

  if (new File(uri).size === 0) throw new Error(`This file is empty or could not be read.`);

  if (lower.endsWith('.epub')) return 'epub';
  if (lower.endsWith('.fb2')) return 'fb2';
  if (lower.endsWith('.fb2.zip')) return 'fb2-zip';

  const bytes = await new File(uri).bytes();

  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (isZip) {
    const zipHeader = bytesToAscii(bytes.subarray(0, 128));
    return zipHeader.includes('application/epub+zip') ? 'epub' : 'fb2-zip';
  }

  const fileHead = new TextDecoder('utf-8').decode(bytes.subarray(0, 1024)).toLowerCase();
  if (fileHead.includes('<fictionbook')) return 'fb2';

  throw new Error(`Unsupported book format.`);
};
