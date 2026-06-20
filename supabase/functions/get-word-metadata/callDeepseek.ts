export const callDeepseek = async <T>(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  model: string,
  temperature = 0.2
): Promise<T> => {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
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
          cached_tokens: data.usage?.prompt_tokens_details?.cached_tokens,
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

  return JSON.parse(data.choices[0].message.content) as T;
};
