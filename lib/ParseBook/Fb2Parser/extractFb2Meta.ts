import { HTMLElement } from 'node-html-parser';
import { normalizeLanguageCode } from 'lib/langHelper';
import { extractFb2Binaries } from 'lib/ParseBook/Fb2Parser/extractFb2Binaries';

export const extractFb2Meta = async (dom: HTMLElement, unzippedPath: string) => {
  const info = dom.querySelector('title-info');

  const title = info?.querySelector('book-title')?.text.trim() || 'Unknown';

  const author = info?.querySelector('author');
  const first = author?.querySelector('first-name')?.text.trim() ?? '';
  const last = author?.querySelector('last-name')?.text.trim() ?? '';
  const authorName = [first, last].filter(Boolean).join(' ') || 'Unknown';

  const bookLanguage = normalizeLanguageCode(info?.querySelector('lang')?.text.trim());

  const coverImg = info?.querySelector('coverpage image');
  const coverHref = coverImg?.getAttribute('l:href') ?? coverImg?.getAttribute('xlink:href');
  const coverId = coverHref?.replace(/^#/, '');

  const { coverPath, imageMap } = await extractFb2Binaries(dom, unzippedPath, coverId);

  return { title, author: authorName, bookLanguage, coverPath, imageMap };
};
