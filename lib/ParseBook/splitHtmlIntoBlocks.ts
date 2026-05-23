const BLOCK_SIZE = 5000;

interface Response {
  blocks: string[];
  finalBlockId: number;
}

interface OpenTag {
  name: string;
  full: string;
}

const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

export const splitHtmlIntoBlocks = (html: string, globalBlockId: number): Response => {
  const blocks: string[] = [];
  let localGlobalBlockId = globalBlockId;
  let currentSize = 0;
  let currentBlock = `<div id="block-${localGlobalBlockId}">`;

  const tokens = html.split(/(<[^>]+>)/).filter(Boolean);
  const unclosedTags: OpenTag[] = [];

  const closeTags = () =>
    unclosedTags
      .map((t) => `</${t.name}>`)
      .reverse()
      .join('');
  const openTags = () => unclosedTags.map((t) => t.full).join('');

  for (const token of tokens) {
    currentBlock += token;

    const isTag = token.startsWith('<') && token.endsWith('>');
    const tagName = isTag ? /^<\/?([a-z0-9]+)/i.exec(token)?.[1]?.toLowerCase() : null;

    if (!isTag) {
      currentSize += token.trim().length;
    } else if (tagName) {
      const isSelfClosing = token.endsWith('/>') || VOID_ELEMENTS.has(tagName);
      const isClosing = token.startsWith('</');

      if (!isSelfClosing && isClosing) {
        const idx = unclosedTags.map((t) => t.name).lastIndexOf(tagName);
        if (idx !== -1) unclosedTags.splice(idx);
      } else if (!isSelfClosing) {
        unclosedTags.push({ name: tagName, full: token });
      }
    }

    if (currentSize >= BLOCK_SIZE) {
      blocks.push(`${currentBlock}${closeTags()}</div>`);
      localGlobalBlockId++;
      currentBlock = `<div id="block-${localGlobalBlockId}">${openTags()}`;
      currentSize = 0;
    }
  }

  if (currentBlock !== `<div id="block-${localGlobalBlockId}">`) {
    blocks.push(`${currentBlock}${closeTags()}</div>`);
  }

  return blocks.length > 0
    ? { blocks, finalBlockId: localGlobalBlockId }
    : { blocks: [html], finalBlockId: globalBlockId };
};
