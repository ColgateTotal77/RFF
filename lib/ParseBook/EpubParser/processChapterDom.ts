import { resolvePath } from 'lib/utils';

interface Props {
  chapterId: number;
  chapterBasePath: string;
  html: string;
  mapHrefChapterId: Record<string, number>;
  absoluteBasePath: string;
}

const SCHEME_RE = /^[a-z0-9\-.]+:/i;

const rewriteFirstAttr = (
  tag: string,
  attrNames: string[],
  transform: (value: string) => string | null
): string => {
  for (const name of attrNames) {
    const re = new RegExp(`(\\s${name}\\s*=\\s*)(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i');
    const m = re.exec(tag);
    if (!m) continue;

    const value = m[2] ?? m[3] ?? m[4] ?? '';
    const newValue = transform(value);
    if (newValue === null) return tag;

    const quote = newValue.includes('"') && !newValue.includes("'") ? "'" : '"';
    const rebuilt = `${m[1]}${quote}${newValue}${quote}`;
    return tag.slice(0, m.index) + rebuilt + tag.slice(m.index + m[0].length);
  }
  return tag;
};

export const processChapterDom = ({
  chapterId,
  chapterBasePath,
  html,
  mapHrefChapterId,
  absoluteBasePath,
}: Props): string => {
  const withLinks = html.replace(/<a\b[^>]*>/gi, (tag) =>
    rewriteFirstAttr(tag, ['href'], (href) => {
      if (!href || SCHEME_RE.test(href)) return null;

      if (href.startsWith('#')) return `chapter://${chapterId}${href}`;

      const [file, fragmentId] = href.split('#');
      const decodedFile = decodeURIComponent(file);
      const resolvedFile = resolvePath(chapterBasePath, decodedFile);

      const cleanResolvedFile = resolvedFile.replace(/^\/+/, '');
      const cleanBasePath = absoluteBasePath.replace(/^\/+/, '');

      const normalizedResolvedFile = cleanResolvedFile.startsWith(cleanBasePath)
        ? cleanResolvedFile.substring(cleanBasePath.length).replace(/^\/+/, '')
        : resolvedFile;

      const matchingChapterId = mapHrefChapterId[normalizedResolvedFile];

      if (matchingChapterId) {
        return fragmentId
          ? `chapter://${matchingChapterId}#${fragmentId}`
          : `chapter://${matchingChapterId}`;
      }

      return null;
    })
  );

  return withLinks.replace(/<(?:img|image)\b[^>]*>/gi, (tag) =>
    rewriteFirstAttr(tag, ['src', 'href', 'xlink:href'], (src) => {
      if (!src || SCHEME_RE.test(src)) return null;

      const decodedSrc = decodeURIComponent(src);
      const resolvedSrc = resolvePath(chapterBasePath, decodedSrc);
      return `file:///${resolvedSrc}`;
    })
  );
};
