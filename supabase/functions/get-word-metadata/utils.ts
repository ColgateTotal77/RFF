export const getWordForms = async (supabase: any, lemma: string, wordLangCode: string) => {
  const { data: wordForms, error: wordFormsError } = await supabase
    .from('word_forms')
    .select('input_word')
    .eq('lemma', lemma)
    .eq('word_lang_code', wordLangCode);

  if (wordFormsError) {
    throw wordFormsError;
  }

  return wordForms;
};

export const langMap: Record<string, string> = {
  en: 'English',
  ru: 'Russian',
  uk: 'Ukrainian',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  sv: 'Swedish',
  no: 'Norwegian',
  da: 'Danish',
  fi: 'Finnish',
  pl: 'Polish',
  tr: 'Turkish',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  ar: 'Arabic',
  hi: 'Hindi',
  cs: 'Czech',
};
