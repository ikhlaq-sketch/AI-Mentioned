const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aimentioned.com';

// ✅ FIXED: Correct model names
export const PLAN_CONFIG = {
  free: {
    llms: [],
    max_sites: 1,
    queries_per_month: 100,
    queries_per_site: 100,
    overage_allowed: false,
    overage_cost: 0,
  },
  starter: {
    llms: ['google/gemini-2.0-flash-lite', 'openai/gpt-4o-mini', 'anthropic/claude-3-haiku'],
    max_sites: 1,
    queries_per_month: 100,
    queries_per_site: 100,
    overage_allowed: false,
    overage_cost: 0,
  },
  growth: {
    llms: ['google/gemini-2.0-flash-lite', 'openai/gpt-4o-mini', 'anthropic/claude-3-haiku'],
    max_sites: 5,
    queries_per_month: 500,
    queries_per_site: 100,
    overage_allowed: true,
    overage_cost: 0.05,
  },
  scale: {
    llms: ['google/gemini-2.0-flash-lite', 'openai/gpt-4o-mini', 'anthropic/claude-3-haiku', 'perplexity/sonar-small-online'],
    max_sites: 10,
    queries_per_month: 1000,
    queries_per_site: 100,
    overage_allowed: true,
    overage_cost: 0.05,
  },
  agency_pro: {
    llms: ['google/gemini-2.0-flash-lite', 'openai/gpt-4o-mini', 'anthropic/claude-3-haiku', 'perplexity/sonar-small-online'],
    max_sites: 20,
    queries_per_month: 2000,
    queries_per_site: 100,
    overage_allowed: true,
    overage_cost: 0.05,
  },
};

export async function callOpenRouter(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': APP_URL,
      'X-Title': 'AIMentioned',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter error ${response.status}: ${error.error?.message || 'Unknown'}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function callMultipleLLMs(
  models: string[],
  systemPrompt: string,
  userPrompt: string
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  await Promise.all(
    models.map(async (model) => {
      try {
        results[model] = await callOpenRouter(model, systemPrompt, userPrompt);
      } catch (error) {
        console.error(`Failed: ${model}`, error);
        results[model] = '';
      }
    })
  );
  return results;
}

export function checkMention(response: string, entityName: string): boolean {
  return response.toLowerCase().includes(entityName.toLowerCase());
}

export function getDisplayName(model: string): string {
  const lower = model.toLowerCase();
  if (lower.includes('openai') || lower.includes('gpt')) return 'ChatGPT';
  if (lower.includes('claude') || lower.includes('anthropic')) return 'Claude';
  if (lower.includes('gemini')) return 'Gemini';
  if (lower.includes('perplexity') || lower.includes('sonar') || lower.includes('llama')) return 'Perplexity';
  return model;
}