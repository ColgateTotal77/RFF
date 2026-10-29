import { callDeepseek } from './callDeepseek.ts';
import {
  LEMMA_MAX_TOKENS,
  MODEL,
  TEMPERATURE,
  lemmaSystemPrompt,
  lemmaUserPrompt,
} from './cardPrompt.ts';

type AiResponse = {
  lemma: string;
};

export const getLemma = async (
  word: string,
  fromLang: string,
  sentence: string,
  apiKey: string
): Promise<string> => {
  const flatData = await callDeepseek<AiResponse>(
    lemmaSystemPrompt,
    lemmaUserPrompt(word, fromLang, sentence),
    apiKey,
    MODEL,
    TEMPERATURE,
    LEMMA_MAX_TOKENS
  );

  return flatData.lemma.toLowerCase().trim();
};
