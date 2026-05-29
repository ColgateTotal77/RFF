const DASHES = ['-', '‐', '‑', '‒', '–', '—', '−'];
export const DASH_REGEX_STRING = DASHES.map((dash) => (dash === '-' ? '\\-' : dash)).join('');

const END_OF_SENTENCE_CHARS = ['.', '!', '?', '。', '！', '？', '।', '॥', '؟', '።'];
export const END_OF_SENTENCE_REGEX_STRING = END_OF_SENTENCE_CHARS.join('');
