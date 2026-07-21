import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../types.ts';

export type Supabase = SupabaseClient<Database>;

export const getWordForms = async (supabase: Supabase, rawlemma: string, wordLangCode: string) => {
  const lemma = rawlemma.toLowerCase();
  const { data: wordForms, error: wordFormsError } = await supabase
    .from('word_forms')
    .select('input_word')
    .eq('lemma', lemma)
    .eq('word_lang_code', wordLangCode);

  if (wordFormsError) {
    throw wordFormsError;
  }

  return wordForms;
};

export const dedupeArray = (array: string[]): string[] => {
  const seen = new Set<string>();
  const deduplicatedArray: string[] = [];
  for (const item of array) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduplicatedArray.push(trimmed);
  }
  return deduplicatedArray;
};
