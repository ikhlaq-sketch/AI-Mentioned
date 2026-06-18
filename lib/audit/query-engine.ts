import axios from 'axios';

const GEMINI_API_KEY = process.env.OPENROUTER_API_KEY!;

export async function callOpenRouter(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [{
        parts: [{ text: userPrompt }]
      }]
    },
    {
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );
  return response.data.candidates[0].content.parts[0].text;
}

export function checkMention(response: string, entityName: string): boolean {
  return response.toLowerCase().includes(entityName.toLowerCase());
}