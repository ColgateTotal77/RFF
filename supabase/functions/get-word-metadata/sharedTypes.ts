export type ApiResponse = {
  lemma: string;
  translations: string;
  examples: string[];
  synonyms: string[];
  generatedFrom: 'reverso' | 'gemini' | 'groq' | 'gpt';
};
