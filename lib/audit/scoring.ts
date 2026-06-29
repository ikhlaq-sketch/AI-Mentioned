export function calculateVisibilityScore(mentions: any[]): number {
  if (!mentions || mentions.length === 0) return 0;

  const normalizeLLM = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('gemini')) return 'Gemini';
    if (lower.includes('openai') || lower.includes('gpt')) return 'ChatGPT';
    if (lower.includes('claude') || lower.includes('anthropic')) return 'Claude';
    if (lower.includes('perplexity') || lower.includes('sonar')) return 'Perplexity';
    return name;
  };

  const normalized = mentions.map(m => ({ ...m, llm_name: normalizeLLM(m.llm_name || '') }));

  const brandMentions = normalized.filter(m => m.entity_type === 'brand' && m.was_mentioned);
  const competitorMentions = normalized.filter(m => m.entity_type === 'competitor' && m.was_mentioned);

  const uniqueLLMs = [...new Set(normalized.map(m => m.llm_name))];
  const llmsThatMentionedBrand = [...new Set(brandMentions.map(m => m.llm_name))];

  if (uniqueLLMs.length === 0) return 0;

  const brandVisibility = (llmsThatMentionedBrand.length / uniqueLLMs.length) * 100;

  let competitorVisibility = 0;
  if (competitorMentions.length > 0) {
    const llmsThatMentionedCompetitors = [...new Set(competitorMentions.map(m => m.llm_name))];
    competitorVisibility = (llmsThatMentionedCompetitors.length / uniqueLLMs.length) * 100;
  }

  let score = Math.min(brandVisibility, 100);
  if (competitorVisibility > brandVisibility) {
    score = score * (1 - (competitorVisibility - brandVisibility) / 100);
  }

  return Math.round(Math.max(0, score));
}