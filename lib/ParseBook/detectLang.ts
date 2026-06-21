import { franc } from 'franc';
import { LanguageCode, normalizeLanguageCode } from 'lib/langHelper';

export const detectLanguage = (sampleText: string): LanguageCode | null => {
  if (!sampleText) return null;
  const francLang = franc(sampleText.slice(0, 5000));
  if (francLang === 'und') return null;
  return normalizeLanguageCode(francLang);
};
