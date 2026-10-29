import '@supabase/functions-js/edge-runtime.d.ts';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../types.ts';
import { corsHeaders } from '../../corsHeaders.ts';
import { checkWordInDB } from './checkWordInDB.ts';
import { getWordForms } from './utils.ts';
import { langMap } from './languagesMappings.ts';
import { getCardData } from './getCardData.ts';
import { saveCardInDB } from './saveCardInDB.ts';
import { getLemma } from './getLemma.ts';
import { saveWordFormsInDB } from './saveWordFormsInDB.ts';

type QuotaResult = {
  ok: boolean;
  status?: number;
  i18key?: string;
  error?: string;
  generation_id?: number;
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

const errorResponse = (i18key: string, error: string, status: number) =>
  jsonResponse({ i18key, error }, status);

class HttpError extends Error {
  constructor(
    public status: number,
    public i18key: string,
    message: string
  ) {
    super(message);
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseRequest = (value: unknown) => {
  if (!isRecord(value))
    throw new HttpError(400, 'wordMetadata.invalidRequest', 'Expected JSON object');

  const { word, sentence, word_lang_code, translation_lang_code } = value;
  if (typeof word !== 'string') throw new HttpError(400, 'wordMetadata.invalidWord', 'Word is not a string');
  if (typeof sentence !== 'string') throw new HttpError(400, 'wordMetadata.invalidSentence', 'Sentence is not a string');
  if (typeof word_lang_code !== 'string' || typeof translation_lang_code !== 'string')
    throw new HttpError(400, 'wordMetadata.invalidRequest', 'Language code is not a string');

  const inputWord = word.trim().toLowerCase();
  if (!inputWord || inputWord.length > 50 || /[\u0000-\u001f\u007f<>]/u.test(inputWord))
    throw new HttpError(400, 'wordMetadata.invalidWord', 'Word is empty, too long, or contains invalid characters');
  if (sentence.length > 2000 || sentence.includes('\0'))
    throw new HttpError(400, 'wordMetadata.invalidSentence', 'Sentence is too long or contains invalid characters');
  if (word_lang_code === translation_lang_code) throw new HttpError(400, 'wordMetadata.sameLanguage', 'Source and target languages match');

  const fromLang = langMap[word_lang_code];
  const toLang = langMap[translation_lang_code];
  if (!fromLang || !toLang) throw new HttpError(400, 'wordMetadata.unsupportedLanguage', 'Unsupported language code');

  return { inputWord, sentence, word_lang_code, translation_lang_code, fromLang, toLang };
};

const quotaFailure = (result: QuotaResult | null | undefined, fallback: string) =>
  errorResponse(
    result?.i18key ?? fallback,
    result?.error ?? 'Quota request was rejected',
    result?.status ?? 429
  );

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('wordMetadata.invalidMethod', 'Expected POST request', 405);

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return errorResponse('wordMetadata.authRequired', 'Authorization token is missing', 401);

  let supabase: SupabaseClient<Database> | null = null;
  let activeGeneration: { userId: string; id: number } | null = null;
  const requestId = crypto.randomUUID();

  try {
    const contentLength = Number(req.headers.get('content-length') ?? '0');
    if (!Number.isFinite(contentLength) || contentLength > 24000)
      throw new HttpError(413, 'wordMetadata.invalidRequest', 'Request body is too large');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) throw new HttpError(503, 'wordMetadata.serverError', 'Supabase service configuration is missing');

    supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) return errorResponse('wordMetadata.invalidSession', 'Supabase user verification failed', 401);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, 'wordMetadata.invalidRequest', 'Request body is not valid JSON');
    }
    const input = parseRequest(body);

    const { data: rateData, error: rateError } = await supabase.rpc('check_metadata_request_rate', {
      p_user_id: authData.user.id,
    });
    if (rateError) {
      console.error('rate_quota_failed', { request_id: requestId, error: rateError });
      throw new HttpError(503, 'wordMetadata.quotaUnavailable', 'Rate quota RPC failed');
    }
    const rateResult = rateData as QuotaResult;
    if (!rateResult?.ok) return quotaFailure(rateResult, 'wordMetadata.quotaUnavailable');

    const cachedResult = await checkWordInDB(
      supabase,
      input.inputWord,
      input.word_lang_code,
      input.translation_lang_code
    );
    if (cachedResult) return jsonResponse(cachedResult);

    const { data: generationData, error: generationError } = await supabase.rpc(
      'start_ai_generation',
      { p_user_id: authData.user.id }
    );
    if (generationError) {
      console.error('generation_quota_failed', { request_id: requestId, error: generationError });
      throw new HttpError(503, 'wordMetadata.quotaUnavailable', 'Generation quota RPC failed');
    }
    const generationResult = generationData as QuotaResult;
    if (!generationResult?.ok || generationResult.generation_id == null) return quotaFailure(generationResult, 'wordMetadata.quotaUnavailable');

    activeGeneration = { userId: authData.user.id, id: generationResult.generation_id };

    const deepseekKey = Deno.env.get('DEEPSEEK_KEY');
    if (!deepseekKey) throw new HttpError(503, 'wordMetadata.aiUnavailable', 'DeepSeek key is not configured');

    let lemma: string;
    try {
      lemma = await getLemma(input.inputWord, input.fromLang, input.sentence, deepseekKey);
    } catch (error) {
      console.error('lemma_generation_failed', { request_id: requestId, error });
      return errorResponse('wordMetadata.aiUnavailable', 'DeepSeek lemma generation failed', 502);
    }

    let cardData;
    try {
      cardData = await getCardData(lemma, input.fromLang, input.toLang, deepseekKey);
    } catch (error) {
      console.error('card_generation_failed', { request_id: requestId, error });
      return errorResponse('wordMetadata.aiUnavailable', 'DeepSeek card generation failed', 502);
    }

    const newWord = await saveCardInDB(
      supabase,
      cardData,
      input.word_lang_code,
      input.translation_lang_code
    );
    await saveWordFormsInDB(supabase, input.inputWord, input.word_lang_code, lemma);

    const wordForms = await getWordForms(supabase, newWord.word, input.word_lang_code);
    return jsonResponse({
      ...newWord,
      wordForms: [
        newWord.word,
        ...wordForms
          .map((form) => form.input_word)
          .filter((form) => form !== newWord.word.toLowerCase()),
      ],
    });
  } catch (error) {
    if (error instanceof HttpError) return errorResponse(error.i18key, error.message, error.status);
    console.error('metadata_request_failed', { request_id: requestId, error });
    return errorResponse('wordMetadata.serverError', 'Unhandled metadata request error', 500);
  } finally {
    if (supabase && activeGeneration) {
      const { error } = await supabase.rpc('finish_ai_generation', {
        p_user_id: activeGeneration.userId,
        p_generation_id: activeGeneration.id,
      });
      if (error) console.error('generation_slot_release_failed', { request_id: requestId, error });
    }
  }
});
