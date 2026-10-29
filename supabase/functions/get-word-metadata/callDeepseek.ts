export const callDeepseek = async <T>(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  model: string,
  temperature = 0.2,
  maxTokens?: number
): Promise<T> => {
  const timeout = AbortSignal.timeout(40_000);

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    signal: timeout,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature,
      max_tokens: maxTokens,
      thinking: { type: 'disabled' },
    }),
  });

  const data = await response.json();

  const logTokenUsage = (label: string) =>
    console.log(
      `${label}:`,
      JSON.stringify(
        {
          total_prompt_tokens: data.usage?.prompt_tokens,
          cached_tokens:
            data.usage?.prompt_tokens_details?.cached_tokens ?? data.usage?.prompt_cache_hit_tokens,
          completion_tokens: data.usage?.completion_tokens,
          reasoning_tokens: data.usage?.completion_tokens_details?.reasoning_tokens,
        },
        null,
        2
      )
    );

  if (!response.ok) {
    console.error('Deepseek API error:', JSON.stringify(data, null, 2));
    logTokenUsage('Token Usage (failed)');
    throw new Error(`Deepseek API error: ${response.status}`);
  }

  logTokenUsage('Token Usage');

  const choice = data.choices?.[0];
  if (choice?.finish_reason === 'length')
    throw new Error('DeepSeek completion-token limit reached.');
  if (typeof choice?.message?.content !== 'string') {
    throw new Error('DeepSeek returned no final content.');
  }
  return JSON.parse(choice.message.content) as T;
};
