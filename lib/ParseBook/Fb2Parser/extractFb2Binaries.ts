import { Directory, File } from 'expo-file-system';
import { HTMLElement } from 'node-html-parser';

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
};

export const extractFb2Binaries = async (
  dom: HTMLElement,
  unzippedPath: string,
  coverId: string | undefined
) => {
  const imagesDir = new Directory(unzippedPath, 'images');
  if (!imagesDir.exists) imagesDir.create({ intermediates: true, idempotent: true });

  const imageMap: Record<string, string> = {};

  for (const binary of dom.querySelectorAll('binary')) {
    const id = binary.getAttribute('id');
    if (!id) continue;

    const contentType = binary.getAttribute('content-type') ?? 'image/jpeg';
    const ext = MIME_EXT[contentType] ?? 'jpg';

    const base64Data = binary.rawText;
    const file = new File(imagesDir, `${id}.${ext}`);
    file.write(base64Data, { encoding: 'base64' });

    imageMap[id] = file.uri;
  }

  const coverPath = coverId ? imageMap[coverId] : undefined;

  return { coverPath, imageMap };
};
