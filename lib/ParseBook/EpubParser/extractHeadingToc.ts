import { SourceChapter } from 'lib/ParseBook/types';
import { TocItem } from 'types';

const HEADING_RE = /<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
const ID_RE = /\bid=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;

const toText = (html: string) =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/(?:&nbsp;|\s)+/gi, ' ')
    .trim();

export const extractHeadingToc = (chapters: SourceChapter[]): TocItem[] => {
  const headings: { tag: number; title: string; chapterId: number; anchorId?: string }[] = [];

  for (const chapter of chapters) {
    for (const match of chapter.html.matchAll(HEADING_RE)) {
      const title = toText(match[3]);
      if (!title) continue;

      const idMatch = ID_RE.exec(match[2]);
      const anchorId = idMatch?.[1] ?? idMatch?.[2] ?? idMatch?.[3];
      headings.push({ tag: Number(match[1]), title, chapterId: chapter.id, anchorId });
    }
  }

  const titled = headings.filter((heading) => !/^\d+$/.test(heading.title));
  const kept = titled.length ? titled : headings;

  const tags = [...new Set(kept.map((heading) => heading.tag))].sort((a, b) => a - b);
  const parentByLevel: string[] = [];

  return kept.map((heading, index) => {
    const level = tags.indexOf(heading.tag);
    const id = `heading-${index}`;
    const parentId = level > 0 ? parentByLevel[level - 1] : undefined;

    parentByLevel.length = level + 1;
    parentByLevel[level] = id;

    return {
      id,
      title: heading.title,
      chapterId: heading.chapterId,
      level,
      parentId,
      anchorId: heading.anchorId,
    };
  });
};
