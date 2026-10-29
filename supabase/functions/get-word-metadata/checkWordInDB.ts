import { getWordForms, Supabase } from './utils.ts';

export const checkWordInDB = async (
  supabase: Supabase,
  inputWord: string,
  wordLangCode: string,
  translationLangCode: string
) => {
  const { data: forms, error: formsError } = await supabase
    .from('word_forms')
    .select('lemma')
    .eq('input_word', inputWord)
    .eq('word_lang_code', wordLangCode)
    .limit(2);
  if (formsError) throw new Error(`DB error while reading word forms: ${formsError.message}`);

  const lemmas = [...new Set(forms.map((form) => form.lemma))];
  if (lemmas.length !== 1) return null;

  const { data: cachedWord, error: cachedWordError } = await supabase
    .from('words')
    .select('*')
    .eq('word', lemmas[0])
    .eq('word_lang_code', wordLangCode)
    .eq('translate_lang_code', translationLangCode)
    .maybeSingle();
  if (cachedWordError)
    throw new Error(`DB error while reading cached word: ${cachedWordError.message}`);
  if (!cachedWord) return null;

  const wordForms = await getWordForms(supabase, cachedWord.word, wordLangCode);
  return {
    ...cachedWord,
    wordForms: [
      cachedWord.word,
      ...wordForms
        .map((form) => form.input_word)
        .filter((form) => form !== cachedWord.word.toLowerCase()),
    ],
  };
};
