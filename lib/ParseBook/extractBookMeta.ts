import { File } from 'expo-file-system';
import { XMLParser } from 'fast-xml-parser';
import { normalizeLanguageCode } from 'lib/utils';

interface Response {
  title: string;
  author: string;
  coverPath: string | undefined;
  language: string;
  absoluteBasePath: string;
  basePath: string;
  opfDirName: string;
  spineItems: any[];
  tocId: string;
  manifestMap: Record<string, string>;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

export const extractBookMeta = async (unzippedPath: string): Promise<Response> => {
  const containerFile = new File(unzippedPath, 'META-INF', 'container.xml');

  if (!containerFile.exists) throw new Error('INVALID_EPUB: container.xml not found');

  const containerXml = await containerFile.text();
  const containerData = parser.parse(containerXml);

  const rootFilePath = containerData.container.rootfiles.rootfile['@_full-path'];

  const opfFile = new File(unzippedPath, rootFilePath);
  const opfXml = await opfFile.text();
  const opfData = parser.parse(opfXml);
  const packageData = opfData.package;
  const opfDirName = rootFilePath.substring(0, rootFilePath.lastIndexOf('/'));

  const absoluteBasePath = (opfDirName ? `${unzippedPath}/${opfDirName}` : unzippedPath).replace(
    'file:///',
    '/'
  );
  const basePath = 'file://' + absoluteBasePath;

  const metadata = packageData.metadata;
  const title =
    typeof metadata['dc:title'] === 'object' ? metadata['dc:title']['#text'] : metadata['dc:title'];

  const author =
    typeof metadata['dc:creator'] === 'object'
      ? metadata['dc:creator']['#text']
      : metadata['dc:creator'];

  const manifestItems = packageData.manifest.item;
  const spineItems = packageData.spine.itemref;
  const tocId = packageData.spine['@_toc'];

  const manifestMap: Record<string, string> = {};
  manifestItems.forEach((item: any) => {
    manifestMap[item['@_id']] = item['@_href'];
  });

  let coverPath;
  const metaItems = metadata.meta;
  const coverMeta = metaItems.find((m: any) => m['@_name'] === 'cover');

  if (coverMeta) {
    const coverId = coverMeta['@_content'];
    const coverHref = manifestMap[coverId];
    if (coverHref) {
      coverPath = `file://${absoluteBasePath}/${coverHref}`;
    }
  }

  let language = normalizeLanguageCode(
    typeof metadata['dc:language'] === 'object'
      ? metadata['dc:language']['#text']
      : metadata['dc:language']
  );

  return {
    title,
    author,
    coverPath,
    language,
    absoluteBasePath,
    basePath,
    opfDirName,
    spineItems,
    tocId,
    manifestMap,
  };
};
