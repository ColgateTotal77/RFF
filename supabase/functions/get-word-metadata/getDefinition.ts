import { callDeepseek } from './callDeepseek.ts';

type AiResponse = {
  definition: string;
};

export const getDefinition = async (
  lemma: string,
  fromLang: string,
  apiKey: string
): Promise<string> => {
  const prompt = userPrompt(lemma, fromLang);

  const flatData = await callDeepseek<AiResponse>(
    systemPrompt,
    prompt,
    apiKey,
    'deepseek-v4-flash'
  );

  return flatData.definition.trim();
};

const systemPrompt = `You are a multilingual dictionary backend producing concise definitions for flashcards.

Return STRICT JSON (no markdown, no commentary):
{"definition": "string"}

Given a dictionary headword (lemma) in the Source Language, return a short, clear definition of its meaning(s), written entirely in the Source Language.

EXAMPLES

Word: "bank", Source language: English
{"definition": "A financial institution that accepts deposits and lends money; also, the raised ground along the edge of a river."}

Word: "Kühlschrank", Source language: German
{"definition": "Ein elektrisches Gerät zur Aufbewahrung und Kühlung von Lebensmitteln."}

RULES
- The definition MUST be written entirely in the Source Language.
- Keep it to one or two sentences. Cover 2-3 distinct senses ONLY if they are genuinely common; do NOT invent or pad with rare/tangential meanings if the word only has one primary meaning.
- Do not include translations into other languages.
- Do not include usage examples, only the definition itself.`;

const userPrompt = (word: string, fromLang: string) =>
  `Word: "${word}", Source language: ${fromLang}`;
