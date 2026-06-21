import { File } from 'expo-file-system';
import { TocItem } from 'types';
import { XMLParser } from 'fast-xml-parser';
import { parse } from 'node-html-parser';

interface Props {
  tocId: string;
  unzippedPath: string;
  opfDirName: string;
  manifestMap: Record<string, string>;
  mapHrefChapterId: Record<string, number>;
  navHref?: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

export const extractToc = async (props: Props): Promise<TocItem[]> => {
  const { tocId, unzippedPath, opfDirName, manifestMap, mapHrefChapterId, navHref } = props;

  const toc: TocItem[] = [];
  try {
    const ncxHref = manifestMap[tocId];
    const ncxFile = new File(unzippedPath, `${opfDirName ? opfDirName + '/' : ''}${ncxHref}`);

    if (!ncxFile.exists) return toc;

    const ncxXml = await ncxFile.text();
    const ncxData = parser.parse(ncxXml);
    const navPointsRaw = ncxData?.ncx?.navMap?.navPoint;
    const navPoints = Array.isArray(navPointsRaw) ? navPointsRaw : navPointsRaw ? [navPointsRaw] : [];

    const parseNavPoints = (points: any[], currentLevel: number, currentParentId?: string) => {
      points.forEach((point: any) => {
        const navLabelText = point.navLabel?.text;
        const chapterTitle =
          (typeof navLabelText === 'object' ? navLabelText?.['#text'] : navLabelText)?.trim() ||
          'Unknown Chapter';
        const chapterSrc = point.content?.['@_src'];
        const pointId = point['@_id'];

        if (!chapterSrc) return;

        const baseHref = chapterSrc.split('#')[0];
        const matchingChapterId = mapHrefChapterId[baseHref];

        if (matchingChapterId !== undefined && matchingChapterId !== null) {
          toc.push({
            id: pointId,
            title: chapterTitle,
            chapterId: matchingChapterId,
            level: currentLevel,
            parentId: currentParentId,
          });
        }

        if (point?.navPoint) {
          const children = point.navPoint;
          parseNavPoints(
            Array.isArray(children) ? children : [children],
            currentLevel + 1,
            pointId
          );
        }
      });
    };

    parseNavPoints(navPoints, 0);
  } catch (ncxError) {
    console.warn('Failed to parse NCX TOC:', ncxError);
  }

  if (toc.length === 0 && navHref) {
    try {
      const navFile = new File(unzippedPath, `${opfDirName ? opfDirName + '/' : ''}${navHref}`);
      if (navFile.exists) {
        const navHtml = await navFile.text();
        const navDom = parse(navHtml);

        const navElements = navDom.querySelectorAll('nav');
        const tocNav =
          navElements.find((n) => n.getAttribute('epub:type') === 'toc') ?? navElements[0];

        if (tocNav) {
          const rootOl = tocNav.querySelector('ol');
          if (rootOl) {
            const parseNavOl = (ol: any, level: number, parentId?: string) => {
              let idx = 0;
              for (const child of ol.childNodes as any[]) {
                if ((child.rawTagName || '').toLowerCase() !== 'li') continue;
                const a = child.querySelector('a');
                if (!a) { idx++; continue; }

                const title = (a.text ?? '').trim() || 'Unknown Chapter';
                const file = (a.getAttribute('href') ?? '').split('#')[0];
                const chapterId = mapHrefChapterId[file];
                const pointId = `nav-${level}-${idx}`;
                idx++;

                if (chapterId !== undefined) {
                  toc.push({ id: pointId, title, chapterId, level, parentId });
                }

                const nestedOl = child.querySelector('ol');
                if (nestedOl) parseNavOl(nestedOl, level + 1, pointId);
              }
            };
            parseNavOl(rootOl, 0);
          }
        }
      }
    } catch (navError) {
      console.warn('Failed to parse EPUB3 NAV TOC:', navError);
    }
  }

  return toc;
};
