const BLOCK_SIZE = 5000;

interface Response {
  blocks: string[];
  finalBlockId: number;
}

export const splitHtmlIntoBlocks = (html: string, globalBlockId: number): Response => {
  const blocks: string[] = [];

  let localGlobalBlockId = globalBlockId;

  const paragraphs = html.split(/(<\/p>\s*)/i);
  let currentBlock = `<div id="block-${localGlobalBlockId}">`;
  let currentSize = 0;

  for (const p of paragraphs) {
    const pText = p.replace(/<[^>]*>/g, ' ');
    const pSize = pText.length;

    if (currentSize + pSize > BLOCK_SIZE && currentSize > 0) {
      currentBlock += '</div>';
      localGlobalBlockId++;
      blocks.push(currentBlock);
      currentBlock = `<div id="block-${localGlobalBlockId}">`;
      currentSize = 0;
    }
    currentBlock += p;
    currentSize += pSize;
  }

  if (currentSize > 0) {
    currentBlock += '</div>';
    blocks.push(currentBlock);
  }

  return blocks.length > 0
    ? { blocks, finalBlockId: localGlobalBlockId }
    : { blocks: [html], finalBlockId: globalBlockId };
};
