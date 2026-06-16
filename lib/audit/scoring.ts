export function calculateVisibilityScore(mentions: any[]): number {
  const total = mentions.length;
  if (total === 0) return 0;

  const brandMentions = mentions.filter(
    (m) => m.entity_type === 'brand' && m.was_mentioned
  ).length;

  const mentionRate = (brandMentions / total) * 35;
  const consistency = 20; // placeholder
  const competitorGap = 15; // placeholder
  const baseline = 30;

  return Math.min(100, Math.round(mentionRate + consistency + competitorGap + baseline));
}
