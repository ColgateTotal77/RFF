import { createClient } from '@supabase/supabase-js';
import { Database } from 'supabase/types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type GetWordMetadataResponse = Database['public']['Tables']['words']['Row'] & {
  wordForms: string[];
  examples: string[];
  definition?: string;
  synonyms: string[];
};

export const fetchWordMetadata = async (
  word: string,
  sourceLang: string,
  targetLang: string
) => {
  try {
    const { data, error } = await supabase.functions.invoke('get-word-metadata', {
      body: {
        word,
        word_lang_code: sourceLang,
        translation_lang_code: targetLang,
      },
    });

    if (error) {
      if (error.context) {
        const errorBody = await error.context.json();
        console.log('DATABASE ERROR:', JSON.stringify(errorBody, null, 2));
      } else {
        console.log('DATABASE ERROR:', error.message);
      }
    }

    return data as GetWordMetadataResponse;
  } catch (error) {
    console.error('Error fetching word metadata:', JSON.stringify(error));
    return null;
  }
};
