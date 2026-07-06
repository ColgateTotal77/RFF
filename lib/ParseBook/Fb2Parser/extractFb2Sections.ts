import { HTMLElement, Node, NodeType } from 'node-html-parser';

export interface Fb2Section {
  section: HTMLElement;
  id: number;
  level: number;
  parentId?: number;
  inToc: boolean;
}

const isNestedSection = (n: Node): boolean =>
  n.nodeType === NodeType.ELEMENT_NODE && n.rawTagName?.toLowerCase() === 'section';

export const extractFb2Sections = (dom: HTMLElement): Fb2Section[] => {
  const sections: Fb2Section[] = [];
  const directSections = (section: HTMLElement) =>
    section.childNodes.filter((n): n is HTMLElement => isNestedSection(n));

  const visit = (section: HTMLElement, level: number, inToc: boolean, parentId?: number) => {
    const id = sections.length;
    sections.push({ section, id, level, parentId, inToc });
    for (const child of directSections(section)) visit(child, level + 1, inToc, id);
  };

  dom.querySelectorAll('body').forEach((body, index) => {
    const inToc = index === 0 || !body.getAttribute('name');
    const tops = directSections(body);
    if (tops.length) tops.forEach((s) => visit(s, 0, inToc));
    else if (body.text.trim())
      sections.push({ section: body, id: sections.length, level: 0, inToc });
  });
  return sections;
};
