import '@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Database } from '../../types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

const commonLanguages = ['en', 'es', 'de', 'fr', 'it', 'pt', 'ru'];

type AiResponse = {
  lemma: string;
  meanings: {
    translation: string;
    example: string;
  }[];
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const apiKey = Deno.env.get('GROQ_API_KEY');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { word, word_lang_code, translation_lang_code } = await req.json();
  const inputWord = word.toLowerCase();

  const { data: formMapping, error: formMappingError } = await supabase
    .from('word_forms')
    .select('lemma')
    .eq('input_word', inputWord)
    .eq('word_lang_code', word_lang_code)
    .maybeSingle();

  if (formMappingError) {
    return new Response(JSON.stringify({ error: formMappingError }), { status: 400, headers: corsHeaders });
  }

  const lemma = formMapping ? formMapping.lemma : inputWord;

  const { data: cachedWord, error: cachedWordError } = await supabase
    .from('words')
    .select('*')
    .eq('name', lemma)
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
    const { data: wordForms } = await supabase
      .from('word_forms')
      .select('input_word')
      .eq('lemma', cachedWord.name)
      .eq('word_lang_code', word_lang_code);

    const response = {
      ...cachedWord,
      wordForms: [
        cachedWord.name,
        ...(wordForms
          ?.map((w: WordForm) => w.input_word)
          .filter((w: WordForm) => w !== cachedWord.name) || []),
      ],
    };
    return new Response(JSON.stringify(response), { headers: corsHeaders });
  }

  let aiResponse: AiResponse;
  try {
    if (commonLanguages.includes(word_lang_code)) {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'user', content: prompt(word, word_lang_code, translation_lang_code) },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      aiResponse = JSON.parse(data.choices[0].message.content) as AiResponse;
    } else {
      return new Response(JSON.stringify({}), { headers: corsHeaders });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to process word' }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  const actualLemma = aiResponse.lemma.toLowerCase();

  const uniqueEntries = new Map();
  uniqueEntries.set(inputWord, { input_word: inputWord, word_lang_code, lemma: actualLemma });
  uniqueEntries.set(actualLemma, { input_word: actualLemma, word_lang_code, lemma: actualLemma });

  const entries = Array.from(uniqueEntries.values());

  await supabase.from('word_forms').insert(entries, {
    onConflict: 'input_word, word_lang_code, lemma',
    ignoreDuplicates: true,
  });

  const { data: newWord, error: upsertError } = await supabase
    .from('words')
    .upsert(
      {
        name: actualLemma,
        word_lang_code: word_lang_code,
        translate_lang_code: translation_lang_code,
        translation: aiResponse.meanings
          .map((m) => m.translation)
          .join(', ')
          .toLowerCase(),
        examples: aiResponse.meanings.map((m) => m.example),
      },
      { onConflict: 'name, word_lang_code, translate_lang_code' }
    )
    .select()
    .single();

  if (upsertError) {
    return new Response(JSON.stringify({ error: upsertError }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const { data: wordForms, error: wordFormsError } = await supabase
    .from('word_forms')
    .select('input_word')
    .eq('lemma', newWord.name)
    .eq('word_lang_code', word_lang_code);

  if (wordFormsError) {
    return new Response(JSON.stringify({ error: wordFormsError }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  type WordForm = Database['public']['Tables']['word_forms']['Row'];

  const response = {
    ...newWord,
    wordForms: [
      newWord.name,
      ...wordForms.map((w: WordForm) => w.input_word).filter((w: WordForm) => w !== newWord.name),
    ],
  };

  return new Response(JSON.stringify(response), { headers: corsHeaders });
});

const prompt = (
  word: string,
  fromLang: string,
  toLang: string
) => `You are a professional dictionary API. Analyze the word "${word}" from the "${fromLang}" language.
Identify all distinct meanings of this word (both common and uncommon).
Rules:
1. "lemma" must be the base/dictionary form of "${word}".
2. "meanings" must be an array of objects, one for each distinct meaning of the word.
3. Inside each meaning object, provide ONE direct "translation" in "${toLang}" and ONE simple "example" sentence in "${fromLang}".
Response JSON structure:
{
  "lemma": "string",
  "meanings": [
    {
      "translation": "string",
      "example": "string"
    }
  ]
}`;

