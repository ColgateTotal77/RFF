import { FIELD_MAPPING_KEYS } from 'types';

const DASHES = ['-', '‐', '‑', '‒', '–', '—', '−'];
export const DASH_REGEX_STRING = DASHES.map((dash) => (dash === '-' ? '\\-' : dash)).join('');

const END_OF_SENTENCE_CHARS = ['.', '!', '?', '。', '！', '？', '।', '॥', '؟', '።'];
export const END_OF_SENTENCE_REGEX_STRING = END_OF_SENTENCE_CHARS.join('');

export const FONT_FAMILY_OPTIONS = [
  { id: 'Book Default', name: 'Book Default' },
  { id: 'system-ui, sans-serif', name: 'System Default' },
  { id: 'Georgia, serif', name: 'Georgia / Serif' },
  { id: 'Literata', name: 'Literata' },
  { id: 'Merriweather', name: 'Merriweather' },
  { id: 'Lora', name: 'Lora' },
  { id: 'PT Serif', name: 'PT Serif' },
  { id: 'Inter', name: 'Inter' },
  { id: 'Open Sans', name: 'Open Sans' },
  { id: 'Nunito', name: 'Nunito' },
  { id: 'Atkinson Hyperlegible', name: 'Atkinson Hyperlegible' },
  { id: 'OpenDyslexic', name: 'OpenDyslexic' },
];
export type FontFamily = (typeof FONT_FAMILY_OPTIONS)[number]['id'];
export const DEFAULT_FONT_FAMILY: FontFamily = 'Georgia, serif';

export const RESET_FIELD_MAPPING = Object.fromEntries(
  FIELD_MAPPING_KEYS.map((k) => [k, undefined])
);
