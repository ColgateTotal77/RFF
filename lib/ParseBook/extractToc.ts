import { File } from 'expo-file-system';
import { TocItem } from 'types';
import { XMLParser } from 'fast-xml-parser';

interface Props {
  tocId: string;
  unzippedPath: string;
  opfDirName: string;
  manifestMap: Record<string, string>;
  mapHrefChapterId: Record<string, number>;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

export const extractToc = async (props: Props): Promise<TocItem[]> => {
  const { tocId, unzippedPath, opfDirName, manifestMap, mapHrefChapterId } = props;

  const toc: TocItem[] = [];
  try {
    const ncxHref = manifestMap[tocId];
    const ncxFile = new File(unzippedPath, `${opfDirName ? opfDirName + '/' : ''}${ncxHref}`);

    if (!ncxFile.exists) return toc;

    const ncxXml = await ncxFile.text();
    const ncxData = parser.parse(ncxXml);
    const navPoints = ncxData?.ncx?.navMap?.navPoint || [];

    const parseNavPoints = (points: any[], currentLevel: number, currentParentId?: string) => {
      points.forEach((point: any) => {
        const chapterTitle = point.navLabel?.text?.trim() || 'Unknown Chapter';
        const chapterSrc = point.content?.['@_src'];
        const pointId = point['@_id'];

        if (!chapterSrc) return;

        const baseHref = chapterSrc.split('#')[0];
        const matchingChapterId = mapHrefChapterId[baseHref];

        if (matchingChapterId) {
          toc.push({
            id: pointId,
            title: chapterTitle,
            href: chapterSrc,
            chapterId: matchingChapterId,
            level: currentLevel,
            parentId: currentParentId,
          });
        }

        if (Array.isArray(point?.navPoint)) parseNavPoints(point.navPoint, currentLevel + 1, pointId);
      });
    };

    parseNavPoints(navPoints, 0);
  } catch (ncxError) {
    console.warn('Failed to parse NCX TOC:', ncxError);
  }

  return toc;
};
