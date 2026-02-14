import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const fetchWordMetadata = async (
  word: string,
  sourceLang: string = 'en',
  targetLang: string = 'ru'
) => {
  try {
    const { data, error } = await supabase.functions.invoke('get-word-metadata', {
      body: {
        word,
        word_lang_code: sourceLang,
        translation_lang_code: targetLang,
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching word metadata:', error);
    return null;
  }
};
