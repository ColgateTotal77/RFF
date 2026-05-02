import { corsHeaders } from '../../corsHeaders.ts';
import { Database } from '../../types.ts';
import { getWordForms } from './utils.ts';

type WordForm = Database['public']['Tables']['word_forms']['Row'];

export const checkWordInDB = async (
  supabase: any,
  word: string,
  word_lang_code: string,
  translation_lang_code: string
) => {
  const { data: cachedWord, error: cachedWordError } = await supabase
    .from('words')
    .select('*')
    .eq('word', word)
    .eq('word_lang_code', word_lang_code)
    .eq('translate_lang_code', translation_lang_code)
    .maybeSingle();

  if (cachedWordError) {
    return new Response(JSON.stringify({ error: cachedWordError }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  if (cachedWord) {
    const wordForms = await getWordForms(supabase, cachedWord.word, word_lang_code);
    const response = {
      ...cachedWord,
      wordForms: [
        cachedWord.word,
        ...(wordForms
          ?.map((w: WordForm) => w.input_word)
          .filter((w: string) => w !== cachedWord.word) || []),
      ],
    };
    return new Response(JSON.stringify(response), { headers: corsHeaders });
  }
};
