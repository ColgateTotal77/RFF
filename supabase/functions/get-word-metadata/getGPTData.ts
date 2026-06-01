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
      model: 'gpt-5.4-mini',
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
      temperature: 0.2,
      prompt_cache_key: 'card_data_generator',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('OpenAI API error:', JSON.stringify(errorData, null, 2));
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();

  console.log(
    'Token Usage:',
    JSON.stringify(
      {
        total_prompt_tokens: data.usage?.prompt_tokens,
        cached_tokens: data.usage?.prompt_tokens_details?.cached_tokens,
      },
      null,
      2
    )
  );

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

EXAMPLES

Word: "bank", Source language: English, Target language: Russian
{
  "source_synonyms": ["financial institution", "shore"],
  "source_examples": [
    "She deposited her salary in the bank after work yesterday.",
    "We had a picnic on the grassy bank of the river.",
    "The pilot had to bank the aircraft sharply to the left."
  ],
  "target_translations": ["банк", "берег", "наклонять"]
}

Word: "vol", Source language: French, Target language: German
{
  "source_synonyms": ["larcin", "trajet"],
  "source_examples": [
    "Le vol de Paris à New York dure environ huit heures.",
    "La police a arrêté l'homme responsable du vol de la voiture."
  ],
  "target_translations": ["Flug", "Diebstahl"]
}

Word: "muñeca", Source language: Spanish, Target language: Portuguese
{
  "source_synonyms": [],
  "source_examples": [
    "Me duele mucho la muñeca después de jugar al tenis.",
    "La niña recibió una hermosa muñeca por su cumpleaños."
  ],
  "target_translations": ["pulso", "boneca"]
}

Word: "Kühlschrank", Source language: German, Target language: Turkish
{
  "source_synonyms": ["Kühlgerät", "Eisschrank"],
  "source_examples": [
    "Vergiss nicht, die Milch sofort wieder in den Kühlschrank zu stellen."
  ],
  "target_translations": ["buzdolabı"]
}

Word: "piano", Source language: Italian, Target language: Dutch
{
  "source_synonyms": ["progetto", "lentamente", "livello"],
  "source_examples": [
    "Parla più piano per favore, i bambini stanno dormendo.",
    "Il mio ufficio si trova al terzo piano dell'edificio.",
    "Dobbiamo elaborare un nuovo piano per risolvere questo problema."
  ],
  "target_translations": ["zachtjes / langzaam", "verdieping", "plan"]
}

Word: "мир", Source language: Russian, Target language: Chinese (Simplified)
{
  "source_synonyms": ["вселенная", "перемирие"],
  "source_examples": [
    "Они мечтают отправиться в долгое путешествие и увидеть весь мир.",
    "После долгих переговоров две страны наконец-то заключили мир."
  ],
  "target_translations": ["世界", "和平"]
}

Word: "голова", Source language: Ukrainian, Target language: Polish
{
  "source_synonyms": ["керівник", "очільник"],
  "source_examples": [
    "Після вчорашньої довгої поїздки у мене дуже сильно болить голова.",
    "Голова сільської ради скликав термінове засідання для вирішення цього питання."
  ],
  "target_translations": ["głowa", "przewodniczący / szef"]
}

Word: "gift", Source language: Swedish, Target language: Spanish
{
  "source_synonyms": ["giftämne", "toxin"],
  "source_examples": [
    "Hon har varit gift med sin man i över tjugo år.",
    "Den lilla grodan utsöndrar ett farligt gift från sin fuktiga hud."
  ],
  "target_translations": ["casado", "veneno"]
}

Word: "約束", Source language: Japanese, Target language: English
{
  "source_synonyms": ["契り", "誓い"],
  "source_examples": [
    "明日一緒に映画に行くという約束を絶対に忘れないでね。"
  ],
  "target_translations": ["promise / appointment"]
}

Word: "kuusi", Source language: Finnish, Target language: English
{
  "source_synonyms": [],
  "source_examples": [
    "Pihallamme kasvaa valtava kuusi, joka on yli sata vuotta vanha.",
    "Lapsi oppi eilen laskemaan numeroon kuusi asti täysin itse."
  ],
  "target_translations": ["spruce / fir", "six"]
}

Word: "saudade", Source language: Portuguese, Target language: French
{
  "source_synonyms": [],
  "source_examples": [
    "Sinto muita saudade da minha terra natal e da minha avó."
  ],
  "target_translations": ["nostalgie / manque"]
}

Word: "fiets", Source language: Dutch, Target language: Italian
{
  "source_synonyms": ["rijwiel", "tweewieler"],
  "source_examples": [
    "Ik ga elke ochtend met de fiets naar mijn werk."
  ],
  "target_translations": ["bicicletta / bici"]
}

RULES
- "target_translations" MUST be in the Target Language.
- "source_synonyms" and "source_examples" MUST be written entirely in the Source Language.
- The arrays for "source_examples" and "target_translations" MUST have the same length and their indexes MUST align perfectly.
- Cover 2–4 DISTINCT senses ordered by frequency ONLY if they exist. Do NOT invent fake or tangential meanings to fill a quota. If a word is specific and has only ONE primary meaning, you MUST return arrays of length 1.
- "target_translations": Provide exactly ONE best translation per sense (1-4 words). ONLY use " / " to join alternatives if they are perfectly interchangeable for that specific meaning. Do NOT overuse " / ".
- "source_examples": Provide exactly ONE natural sentence (6–14 words) in the Source Language PER SENSE demonstrating that specific meaning. The Word (or its inflected form) MUST appear in the sentence. Vary contexts across meanings.
- "source_synonyms": up to 3 synonyms of the most common sense, in the Source Language. Empty array if none.`;

const userPrompt = (word: string, fromLang: string, toLang: string) =>
  `Word: "${word}", Source language: ${fromLang}, Target language: ${toLang}`;
