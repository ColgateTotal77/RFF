import { Database } from '../../types.ts';
import { getWordForms, Supabase } from './utils.ts';

type WordForm = Database['public']['Tables']['word_forms']['Row'];

export const checkWordInDB = async (
  supabase: Supabase,
  lemma: string,
  word_lang_code: string,
  translation_lang_code: string
) => {
  console.log('lemma: ', lemma);
  const { data: cachedWord, error: cachedWordError } = await supabase
    .from('words')
    .select('*')
    .eq('word', lemma)
    .eq('word_lang_code', word_lang_code)
    .eq('translate_lang_code', translation_lang_code)
    .maybeSingle();

  if (cachedWordError) {
    throw new Error(`DB error while reading cached word: ${cachedWordError.message}`);
  }

  if (cachedWord) {
    const wordForms = await getWordForms(supabase, cachedWord.word, word_lang_code);
    return {
      ...cachedWord,
      wordForms: [
        cachedWord.word,
        ...(wordForms
          ?.map((w: WordForm) => w.input_word)
          .filter((w: string) => w !== cachedWord.word) || []),
      ],
    };
  }

  return null;
};
