import { END_OF_SENTENCE_REGEX_STRING } from 'lib/constants';

const BLOCK_SIZE = 10000;
const MAX_BLOCK_SIZE = 15000; // Hard limit to prevent infinite growth if no punctuation is found

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

const BLOCK_ELEMENTS = new Set([
  'p',
  'div',
  'br',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'li',
  'tr',
  'td',
  'blockquote',
  'article',
  'section',
]);

export const splitHtmlIntoBlocks = (html: string, globalBlockId: number): Response => {
  const blocks: string[] = [];
  let localGlobalBlockId = globalBlockId;
  let currentSize = 0;
  let currentBlock = `<div id="block-${localGlobalBlockId}">`;

  const tokens = html.split(/(<(?:[^>"']|"[^"]*"|'[^']*')*>)/).filter(Boolean);
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
    let isSelfClosing = false;
    let isClosing = false;

    if (!isTag) {
      currentSize += token.trim().length;
    } else if (tagName) {
      isSelfClosing = token.endsWith('/>') || VOID_ELEMENTS.has(tagName);
      isClosing = token.startsWith('</');

      if (!isSelfClosing && isClosing) {
        const idx = unclosedTags.map((t) => t.name).lastIndexOf(tagName);
        if (idx !== -1) unclosedTags.splice(idx);
      } else if (!isSelfClosing) {
        unclosedTags.push({ name: tagName, full: token });
      }
    }

    if (currentSize >= BLOCK_SIZE) {
      let isSafeToSplit = false;

      if (!isTag) {
        if (new RegExp(`[${END_OF_SENTENCE_REGEX_STRING}]$`).test(token.trimEnd())) {
          isSafeToSplit = true;
        }
      } else if (tagName) {
        if (BLOCK_ELEMENTS.has(tagName) && (isClosing || isSelfClosing)) {
          isSafeToSplit = true;
        }
      }

      if (isSafeToSplit || currentSize >= MAX_BLOCK_SIZE) {
        blocks.push(`${currentBlock}${closeTags()}</div>`);
        localGlobalBlockId++;
        currentBlock = `<div id="block-${localGlobalBlockId}">${openTags()}`;
        currentSize = 0;
      }
    }
  }

  const emptyWrapper = `<div id="block-${localGlobalBlockId}">${openTags()}`;
  if (currentBlock !== emptyWrapper && currentBlock !== `<div id="block-${localGlobalBlockId}">`) {
    blocks.push(`${currentBlock}${closeTags()}</div>`);
  }

  return blocks.length > 0
    ? { blocks, finalBlockId: localGlobalBlockId }
    : { blocks: [html], finalBlockId: globalBlockId };
};
