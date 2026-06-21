import { resolvePath } from 'lib/utils';
import { parse } from 'node-html-parser';

interface Props {
  chapter: {
    id: number;
    href: string;
    fullPath: string;
    chapterBasePath: string;
    html: string;
  };
  mapHrefChapterId: Record<string, number>;
  absoluteBasePath: string;
}

export const processChapterDom = ({
  chapter,
  mapHrefChapterId,
  absoluteBasePath,
}: Props): string => {
  const dom = parse(chapter.html);

  const links = dom.querySelectorAll('a[href]');
  for (const a of links) {
    const href = a.getAttribute('href');

    if (!href || /^[a-z0-9\-.]+:/i.test(href)) continue;

    if (href.startsWith('#')) {
      a.setAttribute('href', `chapter://${chapter.id}${href}`);
      continue;
    }

    const [file, fragmentId] = href.split('#');
    const decodedFile = decodeURIComponent(file);
    const resolvedFile = resolvePath(chapter.chapterBasePath, decodedFile);

    const cleanResolvedFile = resolvedFile.replace(/^\/+/, '');
    const cleanBasePath = absoluteBasePath.replace(/^\/+/, '');

    const normalizedResolvedFile = cleanResolvedFile.startsWith(cleanBasePath)
      ? cleanResolvedFile.substring(cleanBasePath.length).replace(/^\/+/, '')
      : resolvedFile;

    const matchingChapterId = mapHrefChapterId[normalizedResolvedFile];

    if (matchingChapterId) {
      const newHref = fragmentId
        ? `chapter://${matchingChapterId}#${fragmentId}`
        : `chapter://${matchingChapterId}`;
      a.setAttribute('href', newHref);
    }
  }

  const images = dom.querySelectorAll('img, image');
  for (const img of images) {
    const attrName = ['src', 'href', 'xlink:href'].find((attr) => img.hasAttribute(attr));
    if (!attrName) continue;

    const src = img.getAttribute(attrName);
    if (!src || /^[a-z0-9\-.]+:/i.test(src)) continue;

    const decodedSrc = decodeURIComponent(src);
    const resolvedSrc = resolvePath(chapter.chapterBasePath, decodedSrc);
    img.setAttribute(attrName, `file:///${resolvedSrc}`);
  }

  return dom.toString();
};
