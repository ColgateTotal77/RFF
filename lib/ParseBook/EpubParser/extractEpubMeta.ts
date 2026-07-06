import { File } from 'expo-file-system';
import { XMLParser } from 'fast-xml-parser';
import { LanguageCode, normalizeLanguageCode } from 'lib/langHelper';

interface Response {
  title: string;
  author: string;
  coverPath: string | undefined;
  language: LanguageCode | null;
  absoluteBasePath: string;
  basePath: string;
  opfDirName: string;
  spineItems: any[];
  tocId: string;
  manifestMap: Record<string, string>;
  cssPaths: string[];
  navHref?: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
});

export const extractEpubMeta = async (unzippedPath: string): Promise<Response> => {
  const containerFile = new File(unzippedPath, 'META-INF', 'container.xml');

  if (!containerFile.exists) throw new Error('This EPUB file appears to be corrupted or invalid.');

  const containerXml = await containerFile.text();
  const containerData = parser.parse(containerXml);

  const rootFilePath = containerData.container.rootfiles.rootfile['@_full-path'];

  const opfFile = new File(unzippedPath, rootFilePath);
  const opfXml = await opfFile.text();
  const opfData = parser.parse(opfXml);
  const packageData = opfData.package;
  if (!packageData) throw new Error('This EPUB file appears to be corrupted or invalid.');
  const opfDirName = rootFilePath.substring(0, rootFilePath.lastIndexOf('/'));

  const absoluteBasePath = (opfDirName ? `${unzippedPath}/${opfDirName}` : unzippedPath).replace(
    'file:///',
    '/'
  );
  const basePath = 'file://' + absoluteBasePath;

  const metadata = packageData.metadata;
  const title = typeof metadata.title === 'object' ? metadata.title['#text'] : metadata.title;

  const author =
    typeof metadata.creator === 'object' ? metadata.creator['#text'] : metadata.creator;

  const manifestRaw = packageData.manifest.item;
  const manifestItems = Array.isArray(manifestRaw) ? manifestRaw : manifestRaw ? [manifestRaw] : [];

  const spineRaw = packageData.spine.itemref;
  const spineItems = Array.isArray(spineRaw) ? spineRaw : spineRaw ? [spineRaw] : [];

  const tocId = packageData.spine['@_toc'];

  const manifestMap: Record<string, string> = {};
  manifestItems.forEach((item: any) => {
    manifestMap[item['@_id']] = item['@_href'];
  });

  const metaRaw = metadata.meta;
  const metaItems = Array.isArray(metaRaw) ? metaRaw : metaRaw ? [metaRaw] : [];
  const coverMeta = metaItems.find((m: any) => m['@_name'] === 'cover');
  let coverPath;

  if (coverMeta) {
    const coverId = coverMeta['@_content'];
    const coverHref = manifestMap[coverId];
    if (coverHref) coverPath = `file://${absoluteBasePath}/${coverHref}`;
  }

  if (!coverPath) {
    const epub3CoverItem = manifestItems.find((item: any) =>
      (item['@_properties'] || '').split(/\s+/).includes('cover-image')
    );
    if (epub3CoverItem) coverPath = `file://${absoluteBasePath}/${epub3CoverItem['@_href']}`;
  }

  let language = normalizeLanguageCode(
    typeof metadata.language === 'object' ? metadata.language['#text'] : metadata.language
  );

  const cssPaths = manifestItems
    .filter((item: any) => item['@_media-type'] === 'text/css')
    .map((item: any) => `file://${absoluteBasePath}/${item['@_href']}`);

  const navItem = manifestItems.find((item: any) =>
    (item['@_properties'] || '').split(/\s+/).includes('nav')
  );
  const navHref: string | undefined = navItem?.['@_href'];

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
    cssPaths,
    navHref,
  };
};
