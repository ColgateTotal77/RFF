import { File } from 'expo-file-system';
import { franc } from 'franc';
import { normalizeLanguageCode } from 'lib/utils';

export const detectLanguage = async (blocksPaths: string[]): Promise<(string | null)> => {
  let sampleText = '';
  for (const blockPath of blocksPaths) {
    const blockFile = new File('file://' + blockPath);
    const text = await blockFile.text();
    const textOnly = text
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (textOnly.length > 0) {
      sampleText += textOnly + '\n';
      if (sampleText.length > 2000) break;
    }
  }

  if (!sampleText) return null;
  const francLang = franc(sampleText.slice(0, 5000));
  if (francLang === 'und') return null;

  return normalizeLanguageCode(francLang);
};
