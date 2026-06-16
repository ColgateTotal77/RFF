import { callDeepseek } from './callDeepseek.ts';

type AiResponse = {
  lemma: string;
};

export const getLemma = async (
  word: string,
  fromLang: string,
  sentence: string,
  apiKey: string
): Promise<string> => {
  const prompt = userPrompt(word, fromLang, sentence);

  const flatData = await callDeepseek<AiResponse>(
    systemPrompt,
    prompt,
    apiKey,
    'deepseek-v4-flash'
  );

  return flatData.lemma.trim();
};

const systemPrompt = `You are a multilingual lemmatizer for a dictionary backend.

Return STRICT JSON (no markdown, no commentary):
{"lemma": "string"}

Given a Word (possibly inflected) in the Source Language, return its dictionary headword (lemma): singular nominative for nouns, infinitive for verbs, positive form for adjectives/adverbs. A Sentence may be provided to disambiguate forms that could map to more than one lemma.

EXAMPLES

Word: "lay", Source language: English, Sentence: "She lay on the grass and watched the clouds drift by."
{"lemma": "lie"}

Word: "lay", Source language: English, Sentence: "He lay the book on the table before leaving the room."
{"lemma": "lay"}

Word: "fueron", Source language: Spanish, Sentence: "Ellos fueron al cine ayer por la noche."
{"lemma": "ir"}

Word: "Männer", Source language: German, Sentence: ""
{"lemma": "Mann"}

RULES
- "lemma" MUST be written entirely in the Source Language, using its standard dictionary spelling and casing.
- If Sentence is empty, return the most common lemma for that surface form.
- If Sentence is provided and the surface form is ambiguous, pick the lemma that matches the meaning used in that Sentence.
- Always return a single dictionary headword, never a phrase.`;

const userPrompt = (word: string, fromLang: string, sentence: string) =>
  `Word: "${word}", Source language: ${fromLang}, Sentence: "${sentence}"`;
