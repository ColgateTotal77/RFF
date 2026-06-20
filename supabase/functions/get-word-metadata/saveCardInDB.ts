import { CardData } from './sharedTypes.ts';
import { Database } from '../../types.ts';
import { Supabase } from './utils.ts';

type Word = Database['public']['Tables']['words']['Row'];

export const saveCardInDB = async (
  supabase: Supabase,
  inputWord: string,
  cardData: CardData,
  word_lang_code: string,
  translation_lang_code: string
): Promise<Word> => {
  const uniqueEntries = new Map();
  uniqueEntries.set(inputWord, { input_word: inputWord, word_lang_code, lemma: cardData.lemma });
  uniqueEntries.set(cardData.lemma, {
    input_word: cardData.lemma,
    word_lang_code,
    lemma: cardData.lemma,
  });
  const entries = Array.from(uniqueEntries.values());

  const { error: wordFormsError } = await supabase.from('word_forms').upsert(entries, {
    onConflict: 'input_word,word_lang_code,lemma',
    ignoreDuplicates: true,
  });

  if (wordFormsError) {
    throw new Error(`DB error while saving word forms: ${wordFormsError.message}`);
  }
  const { data: newWord, error: upsertError } = await supabase
    .from('words')
    .upsert(
      {
        word: cardData.lemma,
        word_lang_code: word_lang_code,
        translate_lang_code: translation_lang_code,
        translation: cardData.translations,
        examples: cardData.examples,
        definition: cardData.definition,
        synonyms: cardData.synonyms,
        generated_from: cardData.generatedFrom,
      },
      { onConflict: 'word, word_lang_code, translate_lang_code' }
    )
    .select()
    .single();

  if (upsertError) {
    throw new Error(`DB error while saving card data: ${upsertError.message}`);
  }

  return newWord;
};
