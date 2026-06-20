import '@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types.ts';
import { corsHeaders } from '../../corsHeaders.ts';
import { checkWordInDB } from './checkWordInDB.ts';
import { getWordForms, langMap } from './utils.ts';
import { getCardData } from './getCardData.ts';
import { saveCardInDB } from './saveCardInDB.ts';
import { getLemma } from './getLemma.ts';

type WordForm = Database['public']['Tables']['word_forms']['Row'];

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const deepseekKey = Deno.env.get('DEEPSEEK_KEY');
    if (!deepseekKey) throw new Error('DEEPSEEK_KEY is not set');

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    const { word, sentence, word_lang_code, translation_lang_code } = await req.json();

    console.log('word: ', word);
    console.log('sentence: ', sentence);
    console.log('word_lang_code: ', word_lang_code);
    console.log('translation_lang_code: ', translation_lang_code);

    const fromLang = langMap[word_lang_code];
    const toLang = langMap[translation_lang_code];

    const inputWord = word.toLowerCase();

    let lemma;
    try {
      lemma = await getLemma(word, fromLang, sentence, deepseekKey);
    } catch (aiError) {
      console.error('[Error] AI provider failed (lemma):', aiError);
      return jsonResponse({ error: 'Failed to process word via AI provider' }, 502);
    }

    const cachedResult = await checkWordInDB(
      supabase,
      lemma,
      word_lang_code,
      translation_lang_code
    );

    if (cachedResult) {
      return jsonResponse(cachedResult);
    }

    let cardData;
    try {
      cardData = await getCardData(lemma, fromLang, toLang, deepseekKey);
    } catch (aiError) {
      console.error('[Error] AI provider failed:', aiError);
      return jsonResponse({ error: 'Failed to process word via AI provider' }, 502);
    }

    const newWord = await saveCardInDB(
      supabase,
      inputWord,
      cardData,
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

    return jsonResponse(finalResponse);
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonResponse({ error: err.message }, err.status);
    }
    console.error('[Error] Unhandled:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return jsonResponse({ error: message }, 500);
  }
});
