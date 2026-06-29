export function calculateVisibilityScore(mentions: any[]): number {
  if (!mentions || mentions.length === 0) return 0;

  const normalizeLLM = (name: string): string => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('gemini')) return 'Gemini';
    if (lower.includes('openai') || lower.includes('gpt')) return 'ChatGPT';
    if (lower.includes('claude') || lower.includes('anthropic')) return 'Claude';
    if (lower.includes('perplexity') || lower.includes('sonar')) return 'Perplexity';
    return name;
  };

  const normalized = mentions.map(m => ({ ...m, llm_name: normalizeLLM(m.llm_name || '') }));
  const uniqueLLMs = [...new Set(normalized.map(m => m.llm_name))];
  const totalLLMs = uniqueLLMs.length;
  if (totalLLMs === 0) return 0;

  const brandMentions = normalized.filter(m => m.entity_type === 'brand' && m.was_mentioned);
  const competitorMentions = normalized.filter(m => m.entity_type === 'competitor' && m.was_mentioned);
  const llmsWithBrand = new Set(brandMentions.map(m => m.llm_name)).size;

  const uniqueCompetitors = [...new Set(normalized.filter(m => m.entity_type === 'competitor').map(m => m.entity_name))];
  const totalCompetitors = uniqueCompetitors.length;

  // Component A: Brand Reach (0-40)
  const brandReach = (llmsWithBrand / totalLLMs) * 40;

  // Component B: Competitive Position (0-30)
  let competitivePosition = 15;
  if (totalCompetitors > 0) {
    let totalCompetitorLLMShare = 0;
    for (const competitor of uniqueCompetitors) {
      const llmsWithThisCompetitor = new Set(competitorMentions.filter(m => m.entity_name === competitor).map(m => m.llm_name)).size;
      totalCompetitorLLMShare += llmsWithThisCompetitor / totalLLMs;
    }
    const avgCompetitorReach = totalCompetitorLLMShare / totalCompetitors;
    const brandReachRate = llmsWithBrand / totalLLMs;
    const competitiveDelta = brandReachRate - avgCompetitorReach;
    competitivePosition = Math.round(((competitiveDelta + 1) / 2) * 30);
  }

  // Component C: Consistency Bonus (0-20)
  let consistencyBonus = 0;
  if (llmsWithBrand > 0) {
    const consistencyRatios = [0, 0.25, 0.5, 0.8, 1.0];
    consistencyBonus = Math.round((consistencyRatios[Math.min(llmsWithBrand, 4)] || 0) * 20);
  }

  // Component D: Co-mention Bonus (0-10)
  let coMentionBonus = 0;
  if (llmsWithBrand > 0 && totalCompetitors > 0) {
    let coMentionCount = 0;
    for (const llm of uniqueLLMs) {
      const brandInThisLLM = brandMentions.some(m => m.llm_name === llm);
      const competitorInThisLLM = competitorMentions.some(m => m.llm_name === llm);
      if (brandInThisLLM && competitorInThisLLM) coMentionCount++;
    }
    coMentionBonus = Math.round((coMentionCount / totalLLMs) * 10);
  }

  const rawScore = brandReach + competitivePosition + consistencyBonus + coMentionBonus;
  return Math.max(3, Math.min(94, Math.round(rawScore)));
}