import { TocItem } from 'types';
import { HTMLElement, NodeType } from 'node-html-parser';
import { Fb2Section } from 'lib/ParseBook/Fb2Parser/extractFb2Sections';

const readTitle = (section: HTMLElement): string => {
  const titleEl = section.childNodes.find(
    (n) => n.nodeType === NodeType.ELEMENT_NODE && n.rawTagName?.toLowerCase() === 'title'
  );
  return titleEl?.text.replace(/\s+/g, ' ').trim() ?? '';
};

export const extractToc = (sections: Fb2Section[]): TocItem[] =>
  sections
    .filter(({ inToc }) => inToc)
    .map(({ section, id, level, parentId }) => ({
      id: `fb2-${id}`,
      title: readTitle(section) || `Chapter ${id + 1}`,
      chapterId: id,
      level,
      parentId: parentId !== undefined ? `fb2-${parentId}` : undefined,
    }));
