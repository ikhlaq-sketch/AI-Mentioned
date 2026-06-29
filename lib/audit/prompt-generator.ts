import { callOpenRouter } from './query-engine';

export async function generatePromptPortfolio(category: string, brandName: string): Promise<string[]> {
  const prompt = `You are an SEO and AI search visibility expert. Generate exactly 13 natural search queries that real users type into AI assistants like ChatGPT, Gemini, and Perplexity when researching "${category}".

CRITICAL RULES:
- Sound exactly like a real human typed them — natural conversational language
- Do NOT include the brand name "${brandName}" in any query — users search for categories not specific brands
- Do NOT repeat the same phrasing across queries
- Cover these 13 different search intents in this exact order:
  1. Best overall: general recommendation query
  2. Comparison: versus or alternative query  
  3. Top providers: listing the top options
  4. Specific use case: for a specific technology or framework
  5. Budget: affordable or cost-effective options
  6. Small business: options for small teams or businesses
  7. Features: specific features users care about
  8. Reviews: real user experiences and opinions
  9. Alternatives: what else exists in this space
  10. Beginners: easiest or simplest options for newcomers
  11. Enterprise: options for large organizations
  12. Trending: what is popular or new right now
  13. Problem-solving: solving a specific pain point in this category

Return ONLY a raw JSON array of exactly 13 strings. Zero markdown. Zero explanation. Zero code fences. Just the array.`;

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