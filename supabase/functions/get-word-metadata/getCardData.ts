import { CardData } from './sharedTypes.ts';
import { callDeepseek } from './callDeepseek.ts';
import {
  CARD_MAX_TOKENS,
  MODEL,
  TEMPERATURE,
  cardSystemPrompt,
  cardUserPrompt,
  synonymSystemPrompt,
  synonymUserPrompt,
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
    cardSystemPrompt,
    cardUserPrompt(lemma, fromLang, toLang),
    apiKey,
    MODEL,
    TEMPERATURE,
    CARD_MAX_TOKENS
  );
  const synonyms = await callDeepseek<Synonyms>(
    synonymSystemPrompt,
    synonymUserPrompt(
      lemma,
      fromLang,
      core.senses.map(({ part_of_speech, source_definition, source_example }, i) => ({
        id: i + 1,
        part_of_speech,
        source_definition,
        source_example,
      }))
    ),
    apiKey,
    MODEL,
    TEMPERATURE,
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
