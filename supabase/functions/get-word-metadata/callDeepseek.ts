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
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Deepseek API error:', JSON.stringify(errorData, null, 2));
    throw new Error(`Deepseek API error: ${response.status}`);
  }

  const data = await response.json();

  console.log(
    'Token Usage:',
    JSON.stringify(
      {
        total_prompt_tokens: data.usage?.prompt_tokens,
        cached_tokens: data.usage?.prompt_tokens_details?.cached_tokens,
      },
      null,
      2
    )
  );

  return JSON.parse(data.choices[0].message.content) as T;
};
