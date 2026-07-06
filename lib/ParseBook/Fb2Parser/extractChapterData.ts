import { SourceChapter } from 'lib/ParseBook/types';
import { Node, NodeType } from 'node-html-parser';
import { fb2NodeToHtml } from 'lib/ParseBook/Fb2Parser/fb2NodeToHtml';
import { Fb2Section } from 'lib/ParseBook/Fb2Parser/extractFb2Sections';

const isNestedSection = (n: Node): boolean =>
  n.nodeType === NodeType.ELEMENT_NODE && n.rawTagName?.toLowerCase() === 'section';

export const extractChapterData = (
  sections: Fb2Section[],
  imageMap: Record<string, string>
): SourceChapter[] => {
  const idToChapter: Record<string, number> = {};
  for (const { section, id } of sections) {
    const own = section.getAttribute('id');
    if (own) idToChapter[own] = id;
    for (const e of section.querySelectorAll('[id]')) {
      const eid = e.getAttribute('id');
      if (eid) idToChapter[eid] = id;
    }
  }

  return sections.map(({ section, id }) => {
    const inner = section.childNodes
      .filter((n) => !isNestedSection(n))
      .map((n) => fb2NodeToHtml(n, imageMap, idToChapter))
      .join('');

    const ownId = section.getAttribute('id');
    return { id, html: `<div id="${ownId ?? `fb2-sec-${id}`}">${inner}</div>` };
  });
};
