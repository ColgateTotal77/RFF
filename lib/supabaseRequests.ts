import * as SecureStore from 'expo-secure-store';
import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { Database } from 'supabase/types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: (key) => SecureStore.getItemAsync(key),
      setItem: (key, value) => SecureStore.setItemAsync(key, value),
      removeItem: (key) => SecureStore.deleteItemAsync(key),
    },
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

type GetWordMetadataResponse = Database['public']['Tables']['words']['Row'] & {
  wordForms: string[];
  examples: string[];
  definition?: string;
  synonyms: string[];
};

type ErrorBody = { i18key?: string; error?: string };

export class WordMetadataError extends Error {
  constructor(
    public i18key: string,
    message: string
  ) {
    super(message);
  }
}

let accessTokenPromise: Promise<string> | undefined;

const getAccessToken = () => {
  accessTokenPromise ??= (async (): Promise<string> => {
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;
    if (data.session) return data.session.access_token;

    const result = await supabase.auth.signInAnonymously();
    if (result.error || !result.data.session) throw result.error ?? new Error('Could not create anonymous session');

    return result.data.session.access_token;
  })().finally(() => {
    accessTokenPromise = undefined;
  });

  return accessTokenPromise;
};

let refreshTokenPromise: Promise<string> | undefined;

const refreshAccessToken = () => {
  refreshTokenPromise ??= (async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) {
      throw new WordMetadataError('wordMetadata.invalidSession', error?.message ?? 'Could not refresh session');
    }

    return data.session.access_token;
  })().finally(() => {
    refreshTokenPromise = undefined;
  });

  return refreshTokenPromise;
};

export const fetchWordMetadata = async (
  word: string,
  sentence: string,
  sourceLang: string,
  targetLang: string
) => {
  try {
    const request = (accessToken: string) =>
      supabase.functions.invoke('get-word-metadata', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: {
          word,
          sentence,
          word_lang_code: sourceLang,
          translation_lang_code: targetLang,
        },
      });

    let result = await request(await getAccessToken());
    if (result.error?.context?.status === 401) result = await request(await refreshAccessToken());

    const { data, error } = result;
    if (!error) return data as GetWordMetadataResponse;

    const body = (error.context ? await error.context.json().catch(() => null) : null) as ErrorBody | null;
    throw new WordMetadataError(
      body?.i18key ?? 'wordMetadata.serverError',
      body?.error ?? error.message
    );
  } catch (error) {
    if (error instanceof WordMetadataError) throw error;
    throw new WordMetadataError(
      'wordMetadata.serverError',
      error instanceof Error ? error.message : 'Unknown metadata request error'
    );
  }
};
