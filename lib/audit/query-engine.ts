const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID!;
const CF_API_TOKEN = process.env.OPENROUTER_API_KEY!;

console.log("DEBUG: Account ID length is:", CF_ACCOUNT_ID.length);
console.log("DEBUG: Account ID starts with:", CF_ACCOUNT_ID.substring(0, 5));



export async function callOpenRouter(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  // Dynamically map models or fallback to Llama 3.1
  let modelPath = model;
  if (!model.startsWith('@cf/')) {
    modelPath = '@cf/meta/llama-3.1-8b-instruct'; 
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${modelPath}`,
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
        max_tokens: 1000,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare AI HTTP error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Cloudflare AI error: ${JSON.stringify(data.errors)}`);
  }

  // ✅ THE FIX: Bulletproof text extraction
  // Cloudflare changes its response shape depending on the model. This guarantees a string.
  let resultText = '';
  
  if (typeof data.result === 'string') {
    resultText = data.result;
  } else if (data.result && typeof data.result.response === 'string') {
    resultText = data.result.response;
  } else {
    // If it's an array or weird object, forcefully stringify it so .match() never crashes
    resultText = JSON.stringify(data.result || ''); 
  }

  return resultText;
}

export function checkMention(response: string, entityName: string): boolean {
  return response.toLowerCase().includes(entityName.toLowerCase());
}