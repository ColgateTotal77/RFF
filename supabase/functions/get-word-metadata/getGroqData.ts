import { ApiResponse } from './sharedTypes.ts';

type AiResponse = {
  lemma: string;
  meanings: {
    translation: string;
    example: string;
  }[];
  synonyms: string[];
};

export const getGroqData = async (
  lemma: string,
  word_lang_code: string,
  translation_lang_code: string,
  groqApiKey: string | undefined
): Promise<ApiResponse> => {
  const aiPrompt = prompt(lemma, word_lang_code, translation_lang_code);

  if (!groqApiKey) throw new Error('GROQ_API_KEY is not set');

  const groqUrl = `https://api.groq.com/openai/v1/chat/completions`;
  const response = await fetch(groqUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: aiPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Groq API error:', JSON.stringify(errorData, null, 2));
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const aiResponse = JSON.parse(data.choices[0].message.content) as AiResponse;

  return {
    lemma: lemma.toLowerCase(),
    synonyms: aiResponse.synonyms.map((s) => s.toLowerCase()),
    translations: aiResponse.meanings
      .map((m) => m.translation)
      .join(',')
      .toLowerCase(),
    examples: aiResponse.meanings.map((m) => m.example),
  };
};

const prompt = (
  word: string,
  fromLang: string,
  toLang: string
) => `Act as a multilingual dictionary API. Return strict JSON.

Task: Extract synonyms and meanings for the provided word based on the context sentence.
Source Language: ${fromLang}
Target Language: ${toLang}
Word: "${word}"

Rules:
1. "meanings": Array of objects for distinct meanings relevant to the context.
2. "synonyms": Array of up to 3 string synonyms in the Source Language.

Expected JSON:
{"synonyms": ["string"], "meanings": [{"translation": "string", "example": "string"}]}`;
