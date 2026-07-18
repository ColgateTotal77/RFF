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

export const BOOK_LANGUAGE = {
  ...APP_LANGUAGE,
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  nl: 'Nederlands',
  pl: 'Polski',
  tr: 'Türkçe',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
  ar: 'العربية',
  hi: 'हिन्दी',
  sv: 'Svenska',
  da: 'Dansk',
  no: 'Norsk',
  fi: 'Suomi',
} as const;
export type LanguageCode = keyof typeof BOOK_LANGUAGE;
export const BOOK_LANGUAGE_OPTIONS = Object.entries(BOOK_LANGUAGE).map(([code, name]) => ({
  id: code as LanguageCode,
  name,
}));

const RTL_LANGUAGES: LanguageCode[] = ['ar'];
export const checkIsRTL = (lang: string): boolean => {
  return RTL_LANGUAGES.includes(lang as LanguageCode);
};

export const ISO_639_3_TO_2: Record<string, LanguageCode> = {
  eng: 'en',
  spa: 'es',
  fra: 'fr',
  deu: 'de',
  rus: 'ru',
  ita: 'it',
  por: 'pt',
  nld: 'nl',
  pol: 'pl',
  tur: 'tr',
  jpn: 'ja',
  kor: 'ko',
  zho: 'zh',
  cmn: 'zh',
  wuu: 'zh',
  ara: 'ar',
  arb: 'ar',
  hin: 'hi',
  ukr: 'uk',
  swe: 'sv',
  dan: 'da',
  fin: 'fi',
  nor: 'no',
  nob: 'no',
  nno: 'no',
};

export const isBookLanguage = (lang: string): lang is LanguageCode => lang in BOOK_LANGUAGE;

export const normalizeLanguageCode = (lang?: string): LanguageCode | null => {
  if (!lang) return FALLBACK_LANGUAGE;

  const normalized = lang.toLowerCase().trim();

  const candidate = /^[a-z]{3}$/.test(normalized)
    ? ISO_639_3_TO_2[normalized]
    : normalized.split(/[-_]/)[0];

  return candidate && isBookLanguage(candidate) ? candidate : FALLBACK_LANGUAGE;
};

export const FALLBACK_LANGUAGE: AppLanguageCode = 'en';
