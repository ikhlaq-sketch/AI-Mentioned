import { callOpenRouter } from './query-engine';

export async function generatePromptPortfolio(category: string, brandName: string): Promise<string[]> {
  const prompt = `You are an SEO and AI visibility expert. Generate exactly 13 high-search-volume queries that potential customers would ask AI chatbots about "${category}" related to "${brandName}".

CRITICAL RULES:
- Return ONLY a JSON array of 13 strings. No markdown, no explanation.
- First 4 queries: High-intent buying queries (best, top, compare, vs)
- Next 9 queries: Diverse search intents (affordable, for small business, features, reviews, alternatives, beginners, enterprise, trending, most popular)
- Each query must be a natural question someone would actually type
- Make each query unique and cover different angles
- Include "${brandName}" or "${category}" naturally in each query

Example format: ["What are the top options for Cloud Hosting?","Best cloud hosting for startups","..."]

Generate the 13 queries now:`;

  const response = await callOpenRouter(
    'google/gemini-2.5-flash-lite',
    'You are an SEO expert. Output only the requested JSON format. No markdown.',
    prompt
  );

  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const queries = JSON.parse(jsonMatch[0]);
      return Array.isArray(queries) ? queries.slice(0, 13) : [];
    }
  } catch {}

  return [];
}