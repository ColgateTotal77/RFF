import '@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types.ts';
import { corsHeaders } from '../../corsHeaders.ts';
import { checkWordInDB } from './checkWordInDB.ts';
import { getWordForms, langMap } from './utils.ts';
import { ApiResponse } from './sharedTypes.ts';
import { getCardData } from './getCardData.ts';
import { saveCardInDB } from './saveCardInDB.ts';
import { getDefinition } from './getDefinition.ts';
import { getLemma } from './getLemma.ts';

type WordForm = Database['public']['Tables']['word_forms']['Row'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const deepseekKey = Deno.env.get('DEEPSEEK_KEY');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  if (!deepseekKey) throw new Error('DEEPSEEK_KEY is not set');

  const { word, sentence, word_lang_code, translation_lang_code } = await req.json();

  console.log('word: ', word);
  console.log('sentence: ', sentence);
  console.log('word_lang_code: ', word_lang_code);
  console.log('translation_lang_code: ', translation_lang_code);

  const fromLang = langMap[word_lang_code];
  const toLang = langMap[translation_lang_code];

  const inputWord = word.toLowerCase();

  const lemma = await getLemma(word, fromLang, sentence, deepseekKey);

  const cachedResult = await checkWordInDB(supabase, lemma, word_lang_code, translation_lang_code);

  if (cachedResult) {
    return new Response(JSON.stringify(cachedResult), { headers: corsHeaders });
  }

  let apiResponse: ApiResponse | null = null;
  let definition;

  try {
    [apiResponse, definition] = await Promise.all([
      getCardData(lemma, fromLang, toLang, deepseekKey),
      getDefinition(lemma, fromLang, deepseekKey),
    ]);
  } catch (gptError) {
    console.error('[Error] GPT failed:', gptError);
    return new Response(JSON.stringify({ error: 'Failed to process word via all AI providers' }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  const newWord = await saveCardInDB(
    supabase,
    inputWord,
    apiResponse,
    definition,
    word_lang_code,
    translation_lang_code
  );

  const wordForms = await getWordForms(supabase, newWord.word, word_lang_code);

  const finalResponse = {
    ...newWord,
    wordForms: [
      newWord.word,
      ...wordForms.map((w: WordForm) => w.input_word).filter((w: string) => w !== newWord.word),
    ],
  };

  return new Response(JSON.stringify(finalResponse), { headers: corsHeaders });
});
