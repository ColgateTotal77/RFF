import { Directory, File } from 'expo-file-system';
import { Block } from 'types';

interface Props {
  blockContents: { blocks: string[]; finalBlockId: number };
  chapterId: number;
  startingBlockId: number;
  blocksDir: Directory;
}

interface Response {
  newBlocks: Block[];
  chapterBlockIds: number[];
  chapterAnchors: Record<string, number>;
  chapterCharCount: number;
}

export const processChapterBlocks = (props: Props): Response => {
  const { blockContents, chapterId, startingBlockId, blocksDir } = props;

  const encoder = new TextEncoder();
  const newBlocks: Block[] = [];
  const chapterBlockIds: number[] = [];
  const chapterAnchors: Record<string, number> = {};
  let chapterCharCount = 0;

  for (let blockContent of blockContents.blocks) {
    const idMatch = blockContent.match(/id="block-(\d+)"/);
    const blockId = idMatch ? parseInt(idMatch[1]) : startingBlockId;

    const idRegex = /id=(["'])(.*?)\1/g;
    let match;
    while ((match = idRegex.exec(blockContent)) !== null) {
      const foundId = match[2];
      if (!foundId.startsWith('block-')) {
        chapterAnchors[foundId] = blockId;
      }
    }

    const isLastBlock = blockId === blockContents.finalBlockId;
    if (isLastBlock) {
      blockContent = blockContent.replace(
        /<div id="block-\d+">/,
        `<div id="block-${blockId}" data-last-block-of-chapter="true">`
      );
    }

    const blockFileName = `block_${blockId}.html`;
    const blockFile = new File(blocksDir, blockFileName);
    blockFile.write(encoder.encode(blockContent));
    const blockPath = blockFile.uri.replace('file://', '');

    const textOnly = blockContent
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    newBlocks.push({
      id: blockId,
      chapterId,
      fullPath: blockPath,
      charCount: textOnly.length,
      charOffset: 0,
    });

    chapterCharCount += textOnly.length;
    chapterBlockIds.push(blockId);
  }

  return {
    newBlocks,
    chapterBlockIds,
    chapterAnchors,
    chapterCharCount,
  };
};
