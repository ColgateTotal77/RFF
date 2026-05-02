import Reverso from 'npm:reverso-api';
import { ApiResponse } from './sharedTypes.ts';

type ReversoContextResponse = {
  translations: string[];
  examples: {
    id: number;
    source: string;
    target: string;
  }[];
};

type ReversoSynonymResponse = {
  ok: boolean;
  text: string;
  source: string;
  synonyms: {
    id: number;
    synonym: string;
  }[];
};

export const getReversoData = async (
  lemma: string,
  word_lang_code: string,
  translation_lang_code: string
): Promise<ApiResponse> => {
  const sourceReversoLang = langMap[word_lang_code] || 'english';
  const targetReversoLang = langMap[translation_lang_code] || 'russian';
  const reverso = new Reverso();

  const [reversoContext, reversoSynonyms] = await Promise.all([
    new Promise<ReversoContextResponse>((resolve, reject) => {
      reverso.getContext(
        lemma,
        sourceReversoLang,
        targetReversoLang,
        (err: any, res: ReversoContextResponse) => {
          if (err) reject(err);
          else resolve(res);
        }
      );
    }),
    new Promise<ReversoSynonymResponse>((resolve) => {
      reverso.getSynonyms(lemma, sourceReversoLang, (err: any, res: ReversoSynonymResponse) => {
        if (err || !res) resolve({ ok: false, text: lemma, source: sourceReversoLang, synonyms: [] });
        else resolve(res);
      });
    }),
  ]);

  console.log('reversoContext: ', JSON.stringify(reversoContext, null, 2));
  console.log('reversoSynonyms: ', JSON.stringify(reversoSynonyms, null, 2));
  if (reversoContext?.translations?.[0]?.trim()) {
    return {
      lemma: lemma.toLowerCase(),
      synonyms: reversoSynonyms.synonyms.map((s) => s.synonym.toLowerCase()),
      translations: reversoContext.translations
        .filter((t) => t)
        .join(', ')
        .toLowerCase(),
      examples: reversoContext.examples.slice(0, 5).map((e) => e.source),
    };
  } else {
    throw new Error('Reverso empty results');
  }
};

const langMap: Record<string, string> = {
  en: 'english',
  ru: 'russian',
  es: 'spanish',
  fr: 'french',
  de: 'german',
  it: 'italian',
};
