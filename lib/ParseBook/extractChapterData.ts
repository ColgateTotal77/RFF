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
  const chapterData = (await Promise.all(
    spineItems.map(async (spineItem: any, index: number) => {
      const id = spineItem['@_idref'];
      const href = manifestMap[id];

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

        return {
          id: index,
          href,
          fullPath: `${absoluteBasePath}/${href}`,
          chapterBasePath,
          html,
        };
      } catch (e) {
        console.error(e);
        return null;
      }
    })
  )).filter((item): item is NonNullable<typeof item> => item !== null);

  const mapHrefChapterId = chapterData.reduce((acc, chapter) => {
    acc[chapter.href] = chapter.id;
    return acc;
  }, {} as Record<string, number>);

  return {
    chapterData,
    mapHrefChapterId
  }
}
