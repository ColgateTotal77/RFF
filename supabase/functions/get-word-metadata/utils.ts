import { corsHeaders } from '../../corsHeaders.ts';

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

export const getLemma = async (supabase: any, inputWord: string, word_lang_code: string) => {
  const { data: formMapping, error: formMappingError } = await supabase
    .from('word_forms')
    .select('lemma')
    .eq('input_word', inputWord)
    .eq('word_lang_code', word_lang_code)
    .limit(1)
    .maybeSingle();

  if (formMappingError) {
    console.error('formMappingError: ', formMappingError);
    throw formMappingError;
  }

  console.log('formMapping: ', JSON.stringify(formMapping, null, 2));

  return formMapping ? formMapping.lemma : inputWord;
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
