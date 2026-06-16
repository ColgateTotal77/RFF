import { ApiResponse } from './sharedTypes.ts';
import { callDeepseek } from './callDeepseek.ts';

type AiResponse = {
  source_synonyms: string[];
  source_examples: string[];
  target_translations: string[];
};

export const getCardData = async (
  lemma: string,
  fromLang: string,
  toLang: string,
  apiKey: string
): Promise<ApiResponse> => {
  const prompt = userPrompt(lemma, fromLang, toLang);

  const flatData = await callDeepseek<AiResponse>(systemPrompt, prompt, apiKey, 'deepseek-v4-pro');

  return {
    lemma: lemma,
    synonyms: flatData.source_synonyms,
    translations: flatData.target_translations.join(', '),
    examples: flatData.source_examples,
    generatedFrom: 'deepseek',
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

Word: "Kühlschrank", Source language: German, Target language: Turkish
{
  "source_synonyms": ["Kühlgerät", "Eisschrank"],
  "source_examples": [
    "Vergiss nicht, die Milch sofort wieder in den Kühlschrank zu stellen."
  ],
  "target_translations": ["buzdolabı"]
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

RULES
- "target_translations" MUST be in the Target Language.
- "source_synonyms" and "source_examples" MUST be written entirely in the Source Language.
- The arrays for "source_examples" and "target_translations" MUST have the same length and their indexes MUST align perfectly.
- Cover 2–4 DISTINCT senses ordered by frequency ONLY if they exist. Do NOT invent fake or tangential meanings to fill a quota. If a word is specific and has only ONE primary meaning, you MUST return arrays of length 1.
- "target_translations": Provide exactly ONE best translation per sense (1-3 words).
- "source_examples": Provide exactly ONE natural sentence (6–14 words) in the Source Language PER SENSE demonstrating that specific meaning. The Word (or its inflected form) MUST appear in the sentence. Vary contexts across meanings.
- "source_synonyms": up to 3 synonyms of the most common sense, in the Source Language. Empty array if none.`;

const userPrompt = (word: string, fromLang: string, toLang: string) =>
  `Word: "${word}", Source language: ${fromLang}, Target language: ${toLang}`;
