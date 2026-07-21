import { BOOK_LANGUAGE, ISO_639_1_TO_3 } from 'lib/languagesMappings';

export const APP_LANGUAGE = {
  en: 'English',
  uk: 'Українська',
  ru: 'Русский',
} as const;
export type AppLanguageCode = keyof typeof APP_LANGUAGE;
export const APP_LANGUAGE_OPTIONS = Object.entries(APP_LANGUAGE).map(([code, name]) => ({
  id: code as AppLanguageCode,
  name,
}));

export type LanguageCode = keyof typeof BOOK_LANGUAGE;
export const BOOK_LANGUAGE_OPTIONS = Object.entries(BOOK_LANGUAGE)
  .map(([code, name]) => ({ id: code as LanguageCode, name }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const FALLBACK_APP_LANGUAGE: AppLanguageCode = 'en';
export const FALLBACK_BOOK_LANGUAGE: LanguageCode = 'eng';

const APP_TO_BOOK_LANGUAGE: Record<AppLanguageCode, LanguageCode> = {
  en: 'eng',
  uk: 'ukr',
  ru: 'rus',
};
export const appLanguageToBookLanguage = (lang: string): LanguageCode =>
  APP_TO_BOOK_LANGUAGE[lang as AppLanguageCode] ?? FALLBACK_BOOK_LANGUAGE;

const RTL_APP_LANGUAGES: AppLanguageCode[] = [];
export const checkIsRTL = (lang: AppLanguageCode): boolean => RTL_APP_LANGUAGES.includes(lang);

const ISO_639_3_TO_1: Record<string, string> = Object.fromEntries(
  Object.entries(ISO_639_1_TO_3).map(([two, three]) => [three, two])
);
export const bookLanguageToLocaleTag = (lang: LanguageCode): string => ISO_639_3_TO_1[lang] ?? lang;

export const isBookLanguage = (lang: string): lang is LanguageCode => lang in BOOK_LANGUAGE;

export const normalizeLanguageCode = (lang?: string): LanguageCode | null => {
  if (!lang) return null;

  const base = lang.toLowerCase().trim().split(/[-_]/)[0];
  const candidate = base.length === 2 ? ISO_639_1_TO_3[base] : base;

  return candidate && isBookLanguage(candidate) ? candidate : null;
};
