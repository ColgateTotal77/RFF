import { File } from 'expo-file-system';

interface Response {
  chapterData: {
    id: number;
    href: string;
    fullPath: string;
    chapterBasePath: string;
    html: string;
  }[];
  mapHrefChapterId: Record<string, number>;
}

export const extractChapterData = async (
  spineItems: any[],
  manifestMap: Record<string, string>,
  absoluteBasePath: string
): Promise<Response> => {
  const chapterData: Response['chapterData'] = [];
  const mapHrefChapterId: Record<string, number> = {};

  for (const spineItem of spineItems) {
    const idref = spineItem['@_idref'];
    const href = manifestMap[idref];
    if (!href) continue;

    try {
      const file = new File(`file://${absoluteBasePath}/${href}`);
      let html = await file.text();

      const chapterDir = href.includes('/') ? href.substring(0, href.lastIndexOf('/')) : '';
      const chapterBasePath = chapterDir ? `${absoluteBasePath}/${chapterDir}` : absoluteBasePath;

      const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (bodyMatch) html = bodyMatch[1];

      const chapterId = chapterData.length;
      chapterData.push({ id: chapterId, href, fullPath: `${absoluteBasePath}/${href}`, chapterBasePath, html });
      mapHrefChapterId[href] = chapterId;
    } catch (e) {
      console.warn(`Skipping chapter ${href}:`, e);
    }
  }

  return { chapterData, mapHrefChapterId };
};
