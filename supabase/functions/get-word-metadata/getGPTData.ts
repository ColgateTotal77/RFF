import { ApiResponse } from './sharedTypes.ts';
import { langMap } from './utils.ts';

type AiResponse = {
  source_synonyms: string[];
  source_examples: string[];
  target_translations: string[];
};

export const getGPTData = async (
  lemma: string,
  fromLang: string,
  toLang: string,
  gptApiKey: string | undefined
): Promise<ApiResponse> => {
  if (!gptApiKey) throw new Error('OPENAI_API_KEY is not set');

  const prompt = userPrompt(lemma, langMap[fromLang], langMap[toLang]);

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
              source_synonyms: {
                type: 'array',
                items: { type: 'string' },
                description:
                  'Up to 3 synonyms written entirely in the SOURCE Language. Empty array if none.',
              },
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
            required: ['source_synonyms', 'source_examples', 'target_translations'],
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
    synonyms: flatData.source_synonyms.map((s) => s.toLowerCase()),
    translations: flatData.target_translations.join(', ').toLowerCase(),
    examples: flatData.source_examples,
    generatedFrom: 'gpt',
  };
};

const systemPrompt = `You are a multilingual dictionary backend producing data for Anki flashcards.

Return STRICT JSON (no markdown, no commentary):
{"source_synonyms": ["string"], "source_examples": ["string"], "target_translations": ["string"]}

RULES
- "target_translations" MUST be in the Target Language.
- "source_synonyms" and "source_examples" MUST be written entirely in the Source Language. DO NOT translate synonyms or examples into the Target Language.
- The arrays for "source_examples" and "target_translations" MUST have the same length and their indexes MUST align perfectly.
- Cover 2–4 DISTINCT senses ordered by frequency. If only one sense exists, return 1.
- "target_translations": short idiomatic equivalent (1–4 words). Use " / " to join alternatives.
- "source_examples": Provide exactly ONE natural sentence (6–14 words) in the Source Language PER SENSE demonstrating that specific meaning. The Word (or its inflected form) MUST appear in the sentence. Vary contexts across meanings.
- "source_synonyms": up to 3 synonyms of the most common sense, in the Source Language. Empty array if none.

EXAMPLES

Word: "bank", Source: english Target: russian
{
  "source_synonyms": ["financial institution", "shore"],
  "source_examples": [
    "She deposited her salary in the bank after work yesterday.",
    "We had a picnic on the grassy bank of the river.",
    "The pilot had to bank the aircraft sharply to the left."
  ],
  "target_translations": ["банк", "берег", "наклонять"]
}

Word: "залог", Source: russian, Target: english
{
  "source_synonyms": ["обеспечение", "гарантия"],
  "source_examples": [
    "Банк выдал кредит под залог квартиры.",
    "Подозреваемого отпустили под залог в миллион рублей.",
    "Хорошая подготовка — залог успеха на экзамене."
  ],
  "target_translations": ["collateral", "bail", "guarantee"]
}

Word: "run", Source: english Target: spanish
{
  "source_synonyms": ["sprint", "operate"],
  "source_examples": [
    "She likes to run in the park every morning before work.",
    "He runs a small bakery in the center of the city.",
    "This old computer still runs surprisingly well after ten years."
  ],
  "target_translations": ["correr", "dirigir", "funcionar"]
}

Word: "léger", Source: french, Target: russian
{
  "source_synonyms": ["faible", "doux"],
  "source_examples": [
    "Cette valise est très légère, je peux la porter facilement.",
    "Un vent léger soufflait depuis la mer ce matin.",
    "Sa réponse était trop légère pour un sujet aussi sérieux."
  ],
  "target_translations": ["лёгкий", "слабый", "несерьёзный"]
}

Word: "tomar", Source: spanish, Target: english
{
  "source_synonyms": ["coger", "agarrar"],
  "source_examples": [
    "Voy a tomar el tren de las ocho mañana por la mañana.",
    "¿Te gustaría tomar un café antes de la reunión?",
    "Toma este libro, creo que te va a gustar mucho."
  ],
  "target_translations": ["to take", "to drink", "to grab"]
}

Word: "Gewicht", Source: german, Target: english
{
  "source_synonyms": ["Masse", "Bedeutung"],
  "source_examples": [
    "Das Gewicht des Koffers darf zwanzig Kilogramm nicht überschreiten.",
    "Seine Meinung hat in dieser Firma großes Gewicht."
  ],
  "target_translations": ["weight", "importance"]
}

Word: "однако", Source: russian, Target: english
{
  "source_synonyms": ["тем не менее", "всё же"],
  "source_examples": [
    "Задача казалась простой, однако решить её не удалось."
  ],
  "target_translations": ["however"]
}

Word: "bright", Source: english Target: russian
{
  "source_synonyms": ["luminous", "vivid", "smart"],
  "source_examples": [
    "The bright sun made it hard to see the road ahead.",
    "She is one of the brightest students in the whole school.",
    "The company has a bright future in the renewable energy market."
  ],
  "target_translations": ["яркий", "умный", "радужный"]
}

Word: "board", Source: english Target: german
{
  "source_synonyms": ["plank", "panel"],
  "source_examples": [
    "He cut the wooden board in half to build the new bookshelf.",
    "The board of directors will meet tomorrow to discuss the annual budget.",
    "Passengers must wait for the announcement before they can board the plane."
  ],
  "target_translations": ["Brett", "Vorstand", "einsteigen"]
}
`;

const userPrompt = (word: string, fromLang: string, toLang: string) =>
  `Word: "${word}", Source: ${fromLang.toUpperCase()} (Write synonyms and examples STRICTLY in ${fromLang.toUpperCase()}), Target: ${toLang.toUpperCase()}`;
