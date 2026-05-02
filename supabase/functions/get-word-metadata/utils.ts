import { corsHeaders } from '../../corsHeaders.ts';

export const getWordForms = async (supabase: any, lemma: string, wordLangCode: string) => {
  const { data: wordForms, error: wordFormsError } = await supabase
    .from('word_forms')
    .select('input_word')
    .eq('lemma', lemma)
    .eq('word_lang_code', wordLangCode);

  if (wordFormsError) {
    throw wordFormsError;
  }

  return wordForms;
}

export const getLemma = async (supabase: any, inputWord: string, word_lang_code: string) => {
  const { data: formMapping, error: formMappingError } = await supabase
    .from('word_forms')
    .select('lemma')
    .eq('input_word', inputWord)
    .eq('word_lang_code', word_lang_code)
    .maybeSingle();

  if (formMappingError) {
    return new Response(JSON.stringify({ error: formMappingError }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  return formMapping ? formMapping.lemma : inputWord;
}
