import { File } from 'expo-file-system';
import { TocItem } from 'types';
import { XMLParser } from 'fast-xml-parser';
import { parse } from 'node-html-parser';
import { encodePathSegments } from 'lib/utils';
import { extractHeadingToc } from 'lib/ParseBook/EpubParser/extractHeadingToc';
import { SourceChapter } from 'lib/ParseBook/types';

interface Props {
  tocId: string;
  unzippedPath: string;
  opfDirName: string;
  manifestMap: Record<string, string>;
  mapHrefChapterId: Record<string, number>;
  chapters: SourceChapter[];
  navHref?: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: false,
});

const resolveFile = (unzippedPath: string, opfDirName: string, href: string) =>
  new File(`${unzippedPath}${encodePathSegments(`${opfDirName ? opfDirName + '/' : ''}${href}`)}`);

const parseNcxNavPoints = (
  points: any[],
  mapHrefChapterId: Record<string, number>,
  level: number,
  parentId: string | undefined,
  toc: TocItem[]
) => {
  for (const point of points) {
    const navLabelText = point.navLabel?.text;
    const rawTitle = typeof navLabelText === 'object' ? navLabelText?.['#text'] : navLabelText;
    const title = (rawTitle != null ? String(rawTitle).trim() : '') || 'Unknown Chapter';
    const chapterSrc = point.content?.['@_src'];
    const pointId = point['@_id'];

    if (!chapterSrc) continue;

    const baseHref = chapterSrc.split('#')[0];
    const chapterId = mapHrefChapterId[baseHref];

    if (chapterId !== undefined && chapterId !== null) {
      toc.push({ id: pointId, title, chapterId, level, parentId });
    }

    const children = point.navPoint;
    if (children) {
      parseNcxNavPoints(
        Array.isArray(children) ? children : [children],
        mapHrefChapterId,
        level + 1,
        pointId,
        toc
      );
    }
  }
};

const extractNcxToc = async (
  ncxFile: File,
  mapHrefChapterId: Record<string, number>
): Promise<TocItem[]> => {
  if (!ncxFile.exists) return [];

  const ncxXml = await ncxFile.text();
  const navPointsRaw = parser.parse(ncxXml)?.ncx?.navMap?.navPoint;
  const navPoints = Array.isArray(navPointsRaw) ? navPointsRaw : navPointsRaw ? [navPointsRaw] : [];

  const toc: TocItem[] = [];
  parseNcxNavPoints(navPoints, mapHrefChapterId, 0, undefined, toc);
  return toc;
};

const parseNavList = (
  ol: any,
  mapHrefChapterId: Record<string, number>,
  level: number,
  parentId: string | undefined,
  toc: TocItem[]
) => {
  let idx = 0;
  for (const child of ol.childNodes) {
    if ((child.rawTagName || '').toLowerCase() !== 'li') continue;

    const pointId = `nav-${level}-${idx++}`;
    const a = child.querySelector('a');
    if (!a) continue;

    const title = (a.text ?? '').trim() || 'Unknown Chapter';
    const file = (a.getAttribute('href') ?? '').split('#')[0];
    const chapterId = mapHrefChapterId[file];

    if (chapterId !== undefined) toc.push({ id: pointId, title, chapterId, level, parentId });

    const nestedOl = child.querySelector('ol');
    if (nestedOl) parseNavList(nestedOl, mapHrefChapterId, level + 1, pointId, toc);
  }
};

const extractNavToc = async (
  navFile: File,
  mapHrefChapterId: Record<string, number>
): Promise<TocItem[]> => {
  if (!navFile.exists) return [];

  const navHtml = await navFile.text();
  const navDom = parse(navHtml);
  const navElements = navDom.querySelectorAll('nav');
  const tocNav = navElements.find((n) => n.getAttribute('epub:type') === 'toc') ?? navElements[0];
  const rootOl = tocNav?.querySelector('ol');
  if (!rootOl) return [];

  const toc: TocItem[] = [];
  parseNavList(rootOl, mapHrefChapterId, 0, undefined, toc);
  return toc;
};

export const extractToc = async (props: Props): Promise<TocItem[]> => {
  const { tocId, unzippedPath, opfDirName, manifestMap, mapHrefChapterId, chapters, navHref } =
    props;

  let toc: TocItem[] = [];
  try {
    const ncxHref = manifestMap[tocId];
    const ncxFile = resolveFile(unzippedPath, opfDirName, ncxHref);
    toc = await extractNcxToc(ncxFile, mapHrefChapterId);
  } catch (ncxError) {
    console.warn('Failed to parse NCX TOC:', ncxError);
  }

  if (toc.length === 0 && navHref) {
    try {
      const navFile = resolveFile(unzippedPath, opfDirName, navHref);
      toc = await extractNavToc(navFile, mapHrefChapterId);
    } catch (navError) {
      console.warn('Failed to parse EPUB3 NAV TOC:', navError);
    }
  }

  if (toc.length <= 1) {
    const headingToc = extractHeadingToc(chapters);
    if (headingToc.length > toc.length) toc = headingToc;
  }

  return toc;
};
