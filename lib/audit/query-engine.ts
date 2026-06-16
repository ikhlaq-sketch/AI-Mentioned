import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function callOpenRouter(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': APP_URL,
        'X-Title': 'AIMentioned',
      },
    }
  );
  return response.data.choices[0].message.content;
}

export function checkMention(response: string, entityName: string): boolean {
  return response.toLowerCase().includes(entityName.toLowerCase());
}
