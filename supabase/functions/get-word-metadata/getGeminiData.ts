import { ApiResponse } from './sharedTypes.ts';

type AiResponse = {
  lemma: string;
  meanings: {
    translation: string;
    example: string;
  }[];
  synonyms: string[];
};

export const getGeminiData = async (
  lemma: string,
  word_lang_code: string,
  translation_lang_code: string,
  geminiApiKey: string | undefined
): Promise<ApiResponse> => {
  const aiPrompt = prompt(lemma, word_lang_code, translation_lang_code);

  if (!geminiApiKey) throw new Error('GEMINI_API_KEY is not set');

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`;
  const response = await fetch(geminiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: aiPrompt }] }],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.6,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Gemini API error:', JSON.stringify(errorData, null, 2));
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const aiResponse = JSON.parse(data.candidates[0].content.parts[0].text) as AiResponse;

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
