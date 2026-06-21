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

export const processChapterBlocks = async (props: Props): Promise<Response> => {
  const { blockContents, chapterId, startingBlockId, blocksDir } = props;

  const encoder = new TextEncoder();
  const newBlocks: Block[] = [];
  const chapterBlockIds: number[] = [];
  const chapterAnchors: Record<string, number> = {};
  const writes: Promise<unknown>[] = [];
  let chapterCharCount = 0;

  for (let blockContent of blockContents.blocks) {
    const idMatch = blockContent.match(/id="block-(\d+)"/);
    const blockId = idMatch ? parseInt(idMatch[1]) : startingBlockId;

    const idRegex = /\bid=(["'])(.*?)\1|\bid=([^\s>"']+)/g;
    let match;
    while ((match = idRegex.exec(blockContent)) !== null) {
      const foundId = match[2] ?? match[3];
      if (!foundId.startsWith('block-')) chapterAnchors[foundId] = blockId;
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
    writes.push(Promise.resolve(blockFile.write(encoder.encode(blockContent))));
  }

  await Promise.all(writes);

  return {
    newBlocks,
    chapterBlockIds,
    chapterAnchors,
    chapterCharCount,
  };
};
