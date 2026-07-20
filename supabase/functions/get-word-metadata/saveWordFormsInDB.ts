import { Supabase } from './utils.ts';

export const saveWordFormsInDB = async (
  supabase: Supabase,
  inputWord: string,
  word_lang_code: string,
  rawLemma: string
): Promise<void> => {
  const lemma = rawLemma.toLowerCase();
  const uniqueEntries = new Map();
  uniqueEntries.set(inputWord, { input_word: inputWord, word_lang_code, lemma: lemma });
  uniqueEntries.set(lemma, {
    input_word: lemma,
    word_lang_code,
    lemma: lemma,
  });
  const entries = Array.from(uniqueEntries.values());

  const { error: wordFormsError } = await supabase.from('word_forms').upsert(entries, {
    onConflict: 'input_word,word_lang_code,lemma',
    ignoreDuplicates: true,
  });

  if (wordFormsError) {
    throw new Error(`DB error while saving word forms: ${wordFormsError.message}`);
  }
};
