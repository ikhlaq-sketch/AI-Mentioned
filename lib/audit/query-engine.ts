const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID!;
const CF_API_TOKEN = process.env.OPENROUTER_API_KEY!;

export async function callOpenRouter(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 500,
      }),
    }
  );

  const data = await response.json();
  if (!data.success) {
    throw new Error(`Cloudflare AI error: ${JSON.stringify(data.errors)}`);
  }
  return data.result.response;
}

export function checkMention(response: string, entityName: string): boolean {
  return response.toLowerCase().includes(entityName.toLowerCase());
}