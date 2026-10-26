import { CardData } from './sharedTypes.ts';
import { callDeepseek } from './callDeepseek.ts';
import {
  CARD_MAX_TOKENS,
  CARD_MODEL,
  CARD_TEMPERATURE,
  cardUserPrompt,
  synonymsPrompt,
  systemPrompt,
} from './cardPrompt.ts';
import { dedupeArray } from './utils.ts';

type Sense = {
  part_of_speech: string;
  source_definition: string;
  source_example: string;
  target_translation: string;
};

type Core = { senses: Sense[] };
type Synonyms = { senses: { id: number; synonyms: string[] }[] };

export const getCardData = async (
  lemma: string,
  fromLang: string,
  toLang: string,
  apiKey: string
): Promise<CardData> => {
  const core = await callDeepseek<Core>(
    systemPrompt,
    cardUserPrompt(lemma, fromLang, toLang),
    apiKey,
    CARD_MODEL,
    CARD_TEMPERATURE,
    CARD_MAX_TOKENS
  );
  const synonyms = await callDeepseek<Synonyms>(
    synonymsPrompt,
    JSON.stringify({
      word: lemma,
      source_language: fromLang,
      senses: core.senses.map(
        ({ part_of_speech, source_definition, source_example }, i) => ({
          id: i + 1,
          part_of_speech,
          source_definition,
          source_example,
        })
      ),
    }),
    apiKey,
    CARD_MODEL,
    CARD_TEMPERATURE,
    CARD_MAX_TOKENS
  );

  return {
    lemma,
    translations: dedupeArray(core.senses.map((s) => s.target_translation)).join(', '),
    examples: dedupeArray(core.senses.map((s) => s.source_example)),
    synonyms: dedupeArray(
      [...synonyms.senses].sort((a, b) => a.id - b.id).flatMap((s) => s.synonyms)
    ),
    definition: core.senses.map((s) => s.source_definition).join('; '),
    generatedFrom: 'deepseek',
  };
};
