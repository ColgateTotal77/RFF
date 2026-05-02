import '@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types.ts';
import { corsHeaders } from '../../corsHeaders.ts';
import { checkWordInDB } from './checkWordInDB.ts';
import { getWiktionaryData } from './getWiktionaryData.ts';
import { getLemma, getWordForms } from './utils.ts';
import { getReversoData } from './getReversoData.ts';
import { ApiResponse } from './sharedTypes.ts';
import { getGeminiData } from './getGeminiData.ts';
import { getGroqData } from './getGroqData.ts';
import { saveCardInDB } from './saveCardInDB.ts';

type WordForm = Database['public']['Tables']['word_forms']['Row'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const groqApiKey = Deno.env.get('GROQ_API_KEY');
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { word, word_lang_code, translation_lang_code } = await req.json();
  const inputWord = word.toLowerCase();

  let lemma = await getLemma(supabase, inputWord, word_lang_code)

  await checkWordInDB(supabase, word, word_lang_code, translation_lang_code);

  const { lemma: wikiLemma, definition } = await getWiktionaryData(lemma, word_lang_code);
  lemma = wikiLemma;

  let apiResponse: ApiResponse | null = null;

  try {
    apiResponse = await getReversoData(lemma, word_lang_code, translation_lang_code);
  } catch (reversoError) {
    console.error('[Error] Reverso failed, calling LLM:', reversoError);
    try {
      apiResponse = await getGeminiData(lemma, word_lang_code, translation_lang_code, geminiApiKey);
    } catch (geminiError) {
      console.error('[Error] Gemini failed, falling back to Groq:', geminiError);
      try {
        apiResponse = await getGroqData(lemma, word_lang_code, translation_lang_code, groqApiKey);
      } catch (groqError) {
        console.error('[Error] Both Gemini and Groq failed:', groqError);
        return new Response(
          JSON.stringify({ error: 'Failed to process word via all AI providers' }),
          {
            status: 500,
            headers: corsHeaders,
          }
        );
      }
    }
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
