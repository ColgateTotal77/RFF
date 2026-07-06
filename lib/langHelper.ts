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
  ara: 'ar',
  hin: 'hi',
  ukr: 'uk',
};

export const normalizeLanguageCode = (lang?: string): LanguageCode | null => {
  if (!lang) return 'en';

  const normalized = lang.toLowerCase().trim();

  if (/^[a-z]{2}$/.test(normalized)) return normalized as LanguageCode;

  if (/^[a-z]{3}$/.test(normalized)) return ISO_639_3_TO_2[normalized] || normalized;

  const twoLetterCode = normalized.split(/[-_]/)[0];
  if (/^[a-z]{2}$/.test(twoLetterCode)) return twoLetterCode as LanguageCode;

  return null;
};

export const FALLBACK_LANGUAGE: AppLanguageCode = 'en';
