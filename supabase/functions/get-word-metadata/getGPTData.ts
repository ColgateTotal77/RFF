import { ApiResponse } from './sharedTypes.ts';

type AiResponse = {
  synonyms: string[];
  source_examples: string[];
  target_translations: string[];
};

export const getGPTData = async (
  lemma: string,
  word_lang_code: string,
  translation_lang_code: string,
  gptApiKey: string | undefined
): Promise<ApiResponse> => {
  if (!gptApiKey) throw new Error('OPENAI_API_KEY is not set');

  const prompt = userPrompt(lemma, word_lang_code, translation_lang_code);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${gptApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'dictionary_response',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              synonyms: { type: 'array', items: { type: 'string' } },
              source_examples: {
                type: 'array',
                items: { type: 'string' },
                description: 'Example sentences written entirely in the SOURCE Language.',
              },
              target_translations: {
                type: 'array',
                items: { type: 'string' },
                description: 'The translations written in the TARGET Language.',
              },
            },
            required: ['synonyms', 'source_examples', 'target_translations'],
            additionalProperties: false,
          },
        },
      },
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('OpenAI API error:', JSON.stringify(errorData, null, 2));
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const flatData = JSON.parse(data.choices[0].message.content) as AiResponse;

  return {
    lemma: lemma.toLowerCase(),
    synonyms: flatData.synonyms.map((s) => s.toLowerCase()),
    translations: flatData.target_translations.join(', ').toLowerCase(),
    examples: flatData.source_examples,
    generatedFrom: 'gpt',
  };
};

const systemPrompt = `You are a multilingual dictionary backend producing data for Anki flashcards.

Return STRICT JSON (no markdown, no commentary):
{"synonyms": ["string"], "source_examples": ["string"], "target_translations": ["string"]}

RULES
- "target_translations" are in Target Language; "synonyms" and "source_examples" are in Source Language.
- The arrays for "source_examples" and "target_translations" MUST have the same length and their indexes MUST align perfectly.
- Lowercase everything except proper nouns and sentence starts.
- If the Word is not real, return empty arrays.
- Cover 2–4 DISTINCT senses ordered by frequency. If only one sense exists, return 1.
- "target_translations": short idiomatic equivalent (1–4 words). Use " / " to join alternatives.
- "source_examples": one natural sentence (6–14 words) in the Source Language demonstrating that sense. The Word (or its inflected form) MUST appear in the sentence. Vary contexts across meanings.
- "synonyms": up to 3 synonyms of the most common sense, in Source Language. Empty array if none.

EXAMPLES

Word: "bank", Source: en, Target: ru
{
  "synonyms": ["financial institution", "shore"],
  "source_examples": [
    "She deposited her salary in the bank after work yesterday.",
    "We had a picnic on the grassy bank of the river.",
    "The pilot had to bank the aircraft sharply to the left."
  ],
  "target_translations": ["банк", "берег", "наклонять"]
}

Word: "залог", Source: ru, Target: en
{
  "synonyms": ["обеспечение", "гарантия"],
  "source_examples": [
    "Банк выдал кредит под залог квартиры.",
    "Подозреваемого отпустили под залог в миллион рублей.",
    "Хорошая подготовка — залог успеха на экзамене."
  ],
  "target_translations": ["collateral", "bail", "guarantee"]
}

Word: "run", Source: en, Target: es
{
  "synonyms": ["sprint", "operate"],
  "source_examples": [
    "She likes to run in the park every morning before work.",
    "He runs a small bakery in the center of the city.",
    "This old computer still runs surprisingly well after ten years."
  ],
  "target_translations": ["correr", "dirigir", "funcionar"]
}

Word: "léger", Source: fr, Target: ru
{
  "synonyms": ["faible", "doux"],
  "source_examples": [
    "Cette valise est très légère, je peux la porter facilement.",
    "Un vent léger soufflait depuis la mer ce matin.",
    "Sa réponse était trop légère pour un sujet aussi sérieux."
  ],
  "target_translations": ["лёгкий", "слабый", "несерьёзный"]
}

Word: "tomar", Source: es, Target: en
{
  "synonyms": ["coger", "agarrar"],
  "source_examples": [
    "Voy a tomar el tren de las ocho mañana por la mañana.",
    "¿Te gustaría tomar un café antes de la reunión?",
    "Toma este libro, creo que te va a gustar mucho."
  ],
  "target_translations": ["to take", "to drink", "to grab"]
}

Word: "Gewicht", Source: de, Target: en
{
  "synonyms": ["Masse", "Bedeutung"],
  "source_examples": [
    "Das Gewicht des Koffers darf zwanzig Kilogramm nicht überschreiten.",
    "Seine Meinung hat in dieser Firma großes Gewicht."
  ],
  "target_translations": ["weight", "importance"]
}

Word: "однако", Source: ru, Target: en
{
  "synonyms": ["тем не менее", "всё же"],
  "source_examples": [
    "Задача казалась простой, однако решить её не удалось."
  ],
  "target_translations": ["however"]
}

Word: "bright", Source: en, Target: ru
{
  "synonyms": ["luminous", "vivid", "smart"],
  "source_examples": [
    "The bright sun made it hard to see the road ahead.",
    "She is one of the brightest students in the whole school.",
    "The company has a bright future in the renewable energy market."
  ],
  "target_translations": ["яркий", "умный", "радужный"]
}
`;

const userPrompt = (word: string, fromLang: string, toLang: string) => `Word: "${word}"
Source Language: ${fromLang}
Target Language: ${toLang}`;
