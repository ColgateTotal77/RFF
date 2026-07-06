import { HTMLElement, Node, NodeType } from 'node-html-parser';

interface TagSpec {
  tag: string;
  class?: string;
  attrs?: string[];
}

const CELL_ATTRS = ['colspan', 'rowspan', 'align', 'valign'];

const TAG_MAP: Record<string, TagSpec> = {
  section: { tag: 'div' },
  p: { tag: 'p' },
  // Inline formatting
  emphasis: { tag: 'em' },
  strong: { tag: 'strong' },
  strikethrough: { tag: 's' },
  sub: { tag: 'sub' },
  sup: { tag: 'sup' },
  code: { tag: 'code' },
  // Citations / notes / attribution
  cite: { tag: 'blockquote', class: 'fb2-cite' },
  epigraph: { tag: 'blockquote', class: 'fb2-epigraph' },
  annotation: { tag: 'blockquote', class: 'fb2-annotation' },
  'text-author': { tag: 'p', class: 'fb2-text-author' },
  date: { tag: 'span', class: 'fb2-date' },
  // Verse
  poem: { tag: 'div', class: 'fb2-poem' },
  stanza: { tag: 'div', class: 'fb2-stanza' },
  v: { tag: 'p', class: 'fb2-verse' },
  // Tables
  tr: { tag: 'tr' },
  td: { tag: 'td', attrs: CELL_ATTRS },
  th: { tag: 'th', attrs: CELL_ATTRS },
};

const escapeText = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escapeAttr = (s: string) => escapeText(s).replace(/"/g, '&quot;');

const getHref = (el: HTMLElement) =>
  el.getAttribute('l:href') ?? el.getAttribute('xlink:href') ?? el.getAttribute('href') ?? '';

const buildAttrs = (el: HTMLElement, spec?: TagSpec): string => {
  let out = '';
  const id = el.getAttribute('id');
  if (id) out += ` id="${escapeAttr(id)}"`;
  if (spec?.class) out += ` class="${spec.class}"`;
  for (const name of spec?.attrs ?? []) {
    const v = el.getAttribute(name);
    if (v != null) out += ` ${name}="${escapeAttr(v)}"`;
  }
  return out;
};

export const fb2NodeToHtml = (
  node: Node,
  imageMap: Record<string, string>,
  idToChapter: Record<string, number>
): string => {
  if (node.nodeType === NodeType.TEXT_NODE) return escapeText(node.text);
  if (node.nodeType !== NodeType.ELEMENT_NODE) return '';

  const el = node as HTMLElement;
  const tag = el.rawTagName?.toLowerCase() ?? '';
  const id = el.getAttribute('id');
  const idAttr = id ? ` id="${escapeAttr(id)}"` : '';

  if (tag === 'image') {
    const ref = getHref(el).replace(/^#/, '');
    const src = imageMap[ref];
    return src ? `<img${idAttr} src="${src}"/>` : '';
  }

  if (tag === 'empty-line') return '<br/>';

  const inner = el.childNodes.map((c) => fb2NodeToHtml(c, imageMap, idToChapter)).join('');

  if (tag === 'a') {
    const rawHref = getHref(el);
    const targetId = rawHref.replace(/^#/, '');
    const chId = idToChapter[targetId];
    const href = chId !== undefined ? `chapter://${chId}#${targetId}` : rawHref;
    return `<a${idAttr} href="${href}">${inner}</a>`;
  }

  if (tag === 'title' || tag === 'subtitle') {
    const htmlTag = tag === 'title' ? 'h2' : 'h3';
    const flattened = inner
      .replace(/<p[^>]*>/g, '')
      .replace(/<\/p>/g, '<br/>')
      .replace(/(<br\/>)+$/, '');
    return `<${htmlTag}${idAttr}>${flattened}</${htmlTag}>`;
  }

  if (tag === 'table') {
    return `<div class="fb2-table-wrap"><table${idAttr} class="fb2-table">${inner}</table></div>`;
  }

  const spec = TAG_MAP[tag];
  const htmlTag = spec?.tag ?? 'span';
  return `<${htmlTag}${buildAttrs(el, spec)}>${inner}</${htmlTag}>`;
};
