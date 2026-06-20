import { CardData } from './sharedTypes.ts';
import { callDeepseek } from './callDeepseek.ts';
import { dedupeArray } from './utils.ts';

type Sense = {
  target_translation: string;
  source_example: string;
};

type AiResponse = {
  senses: Sense[];
  source_synonyms: string[];
  source_definition: string;
};

export const getCardData = async (
  lemma: string,
  fromLang: string,
  toLang: string,
  apiKey: string
): Promise<CardData> => {
  const prompt = userPrompt(lemma, fromLang, toLang);

  const data = await callDeepseek<AiResponse>(systemPrompt, prompt, apiKey, 'deepseek-v4-pro');

  const senses = data.senses ?? [];

  return {
    lemma,
    translations: dedupeArray(senses.map((s) => s.target_translation)).join(', '),
    examples: dedupeArray(senses.map((s) => s.source_example)),
    synonyms: dedupeArray(data.source_synonyms ?? []),
    definition: data.source_definition?.trim() ?? '',
    generatedFrom: 'deepseek',
  };
};

const systemPrompt = `You are a multilingual dictionary backend producing data for Anki flashcards.

Return STRICT JSON (no markdown, no commentary):
{
  "senses": [
    {
      "target_translation": "string",
      "source_example": "string"
    }
  ],
  "source_synonyms": ["string"],
  "source_definition": "string"
}

EXAMPLES

Word: "bank", Source language: English, Target language: Russian
{
  "senses": [
    {
      "target_translation": "банк",
      "source_example": "She deposited her salary in the bank after work yesterday."
    },
    {
      "target_translation": "берег",
      "source_example": "We had a picnic on the grassy bank of the river."
    },
    {
      "target_translation": "наклонять",
      "source_example": "The pilot had to bank the aircraft sharply to the left."
    }
  ],
  "source_synonyms": ["financial institution"],
  "source_definition": "A place that keeps and lends money; the land along a river; or to tilt a plane to one side."
}

Word: "Kühlschrank", Source language: German, Target language: Turkish
{
  "senses": [
    {
      "target_translation": "buzdolabı",
      "source_example": "Vergiss nicht, die Milch sofort wieder in den Kühlschrank zu stellen."
    }
  ],
  "source_synonyms": ["Kühlgerät", "Eisschrank"],
  "source_definition": "Ein Gerät, das Essen kühl und frisch hält."
}

Word: "muñeca", Source language: Spanish, Target language: Portuguese
{
  "senses": [
    {
      "target_translation": "pulso",
      "source_example": "Me duele mucho la muñeca después de jugar al tenis."
    },
    {
      "target_translation": "boneca",
      "source_example": "La niña recibió una hermosa muñeca por su cumpleaños."
    }
  ],
  "source_synonyms": [],
  "source_definition": "La parte del cuerpo entre la mano y el brazo; también, un juguete con forma de persona."
}

RULES
- "target_translation" MUST be in the Target Language. "source_example", "source_synonyms" and "source_definition" MUST be written entirely in the Source Language.
- Cover 1–3 DISTINCT senses ordered by frequency, ONLY if they genuinely exist. Do NOT invent rare, archaic, or tangential meanings to fill a quota — if a word has only ONE primary meaning, return exactly ONE sense.
- Do NOT invent loanword/calque/transliteration translations that are not attested standard dictionary entries in the Target Language. If no natural standard translation for a sense exists, drop that sense entirely.
- For each sense, "source_example" must be ONE natural sentence (6–14 words) using the word in the meaning of that sense's "target_translation". Use whatever word form reads most naturally. If no natural example fits the sense, drop that sense. Vary contexts across senses.
- "target_translation": exactly ONE best translation per sense (1–3 words).
- "source_synonyms": 0–4 common synonyms in the Source Language (single words or short fixed expressions) that could replace the headword with no change in meaning. No broader, narrower, related, or paraphrased terms. Prefer [] — many words have none.
- "source_definition": a SHORT, simple gloss in the Source Language using common, everyday words (easy enough for a language learner), briefly covering each sense listed above. A few words per sense — not a formal dictionary definition.`;

const userPrompt = (word: string, fromLang: string, toLang: string) =>
  `Word: "${word}", Source language: ${fromLang}, Target language: ${toLang}`;
