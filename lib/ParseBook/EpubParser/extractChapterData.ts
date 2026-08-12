import { File } from 'expo-file-system';
import { processChapterDom } from 'lib/ParseBook/EpubParser/processChapterDom';
import { SourceChapter } from 'lib/ParseBook/types';
import { encodePathSegments } from 'lib/utils';

interface Response {
  chapters: SourceChapter[];
  mapHrefChapterId: Record<string, number>;
}

export const extractChapterData = async (
  spineItems: any[],
  manifestMap: Record<string, string>,
  absoluteBasePath: string
): Promise<Response> => {
  const rawChapters: { chapterBasePath: string; html: string }[] = [];
  const mapHrefChapterId: Record<string, number> = {};

  for (const spineItem of spineItems) {
    const idref = spineItem['@_idref'];
    const href = manifestMap[idref];
    if (!href) continue;

    try {
      const file = new File(`file://${absoluteBasePath}/${encodePathSegments(href)}`);
      let html = await file.text();

      const chapterDir = href.includes('/') ? href.substring(0, href.lastIndexOf('/')) : '';
      const chapterBasePath = chapterDir ? `${absoluteBasePath}/${chapterDir}` : absoluteBasePath;

      const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (bodyMatch) html = bodyMatch[1];

      const chapterId = rawChapters.length;
      rawChapters.push({ chapterBasePath, html });
      mapHrefChapterId[href] = chapterId;
    } catch (e) {
      console.warn(`Skipping chapter ${href}:`, e);
    }
  }

  const chapters: SourceChapter[] = rawChapters.map(({ chapterBasePath, html }, chapterId) => ({
    id: chapterId,
    html: processChapterDom({
      chapterId,
      chapterBasePath,
      html,
      mapHrefChapterId,
      absoluteBasePath,
    }),
  }));

  return { chapters, mapHrefChapterId };
};
