import { ApiResponse } from './sharedTypes.ts';
import { Database } from '../../types.ts';

type Word = Database['public']['Tables']['words']['Row'];

export const saveCardInDB = async (
  supabase: any,
  inputWord: string,
  apiResponse: ApiResponse,
  definition: string,
  word_lang_code: string,
  translation_lang_code: string
): Promise<Word> => {
  const uniqueEntries = new Map();
  uniqueEntries.set(inputWord, { input_word: inputWord, word_lang_code, lemma: apiResponse.lemma });
  uniqueEntries.set(apiResponse.lemma, {
    input_word: apiResponse.lemma,
    word_lang_code,
    lemma: apiResponse.lemma,
  });
  const entries = Array.from(uniqueEntries.values());

  await supabase.from('word_forms').insert(entries, {
    onConflict: 'input_word, word_lang_code, lemma',
    ignoreDuplicates: true,
  });

  const { data: newWord, error: upsertError } = await supabase
    .from('words')
    .upsert(
      {
        word: apiResponse.lemma,
        word_lang_code: word_lang_code,
        translate_lang_code: translation_lang_code,
        translation: apiResponse.translations,
        examples: apiResponse.examples,
        definition: definition,
        synonyms: apiResponse.synonyms,
      },
      { onConflict: 'word, word_lang_code, translate_lang_code' }
    )
    .select()
    .single();

  if (upsertError) {
    throw new Error(`DB error while saving card data: ${JSON.stringify(upsertError, null, 2)}`);
  }

  return newWord;
};
