export const CARD_MODEL = 'deepseek-flash';
export const CARD_TEMPERATURE = 0.2;
export const CARD_MAX_TOKENS = 2048;

export const systemPrompt = `Write a learner's dictionary entry for the exact complete headword, including particles in a phrase. Return ONLY JSON:
{"senses":[{"part_of_speech":"string","source_definition":"string","source_example":"string","target_translation":"string"}]}

Choose 1–3 genuinely distinct usual meanings, most useful first. Keep important unrelated common uses; stop rather than invent extras. Use ONE entry for one concept: do not split it into narrower applications, different subjects or rewordings.

Each sense must describe one coherent use:
- part_of_speech: its actual grammatical role.
- source_definition: A short plain-word gloss. Where words are naturally separated by spaces, aim for roughly 3–8 words; otherwise use a similarly compact phrase. This is a guide, NEVER a hard limit: use more words rather than omit an identifying feature, change the meaning or lose an essential restriction. Prefer a phrase over an explanatory sentence. Do not repeat the headword.
- source_example: one easy, natural sentence clearly showing that meaning. Use the complete entry or a real inflection, not a lookalike stem or a different expression containing the same words.
- target_translation: one precise, idiomatic dictionary-form equivalent for the entry in that example, preserving its essential conditions and purpose. A short explanation is better than a misleading single word. Do not translate neighbouring words or bundle different meanings.

Write all source fields in the Source Language; only target_translation is in the Target Language. Definitions explain the word in the SOURCE language, not the target language. Keep definition, example and translation consistent within each sense. Use everyday supporting words, not extra idioms or jargon. The app joins the glosses with semicolons in the same order as the examples. Write each gloss without numbering or field labels. Do not generate synonyms or global fields.

FORMAT EXAMPLE (one sense here is not a quota)
Word: "pleased", Source language: English, Target language: Russian
{"senses":[{"part_of_speech":"adjective","source_definition":"Happy about something.","source_example":"I was pleased to see my old friend.","target_translation":"рад"}]}
`;

export const synonymsPrompt = `Find another ordinary way of naming each supplied meaning of the exact entry, not associated vocabulary. Return ONLY JSON: {"senses":[{"id":1,"synonyms":["string"]}]}

Keep every ID exactly once. Return ZERO OR ONE alternative per sense. Choose the strongest established word or short expression whose own meaning matches this definition and grammatical role. Do not fill a slot merely because a related word exists.

The alternative must retain what makes this particular thing, state or action distinct, including its essential purpose, participants and degree. Merely making a plausible sentence is not enough. If it only names a broader class, a particular subtype, a part, a property or an associated activity, return []. Do not guess an equivalent where ordinary language has none.

Keep genuine familiar alternatives where available. No explanatory sentences, repeated entry, spelling variants, inflections or expanded repetitions. Do not revise the senses or explain your choices.

FORMAT EXAMPLE
Input: {"word":"pleased","source_language":"English","senses":[{"id":1,"part_of_speech":"adjective","source_definition":"Happy about something.","source_example":"I was pleased to see my old friend."}]}
Output: {"senses":[{"id":1,"synonyms":["glad"]}]}
`;

export const userPrompt = (word: string, fromLang: string, toLang: string) =>
  `Word: "${word}", Source language: ${fromLang}, Target language: ${toLang}`;

export const cardUserPrompt = (word: string, fromLang: string, toLang: string) =>
  `${userPrompt(word, fromLang, toLang)}\n\nWrite part_of_speech, source_definition and source_example in ${fromLang}.\nWrite only target_translation in ${toLang}.`;
