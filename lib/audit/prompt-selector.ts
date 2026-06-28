export function selectPromptForAudit(
  prompts: any[],
  type: 'daily' | 'weekly' | 'baseline' | 'manual',
  dayIndex: number
): string | null {
  if (!prompts || prompts.length === 0) return null;

  const activePrompts = prompts.filter((p: any) => p.is_active);
  if (activePrompts.length === 0) return null;

  // Weekly/Baseline/Manual: Use first 4 prompts in rotation
  if (type === 'weekly' || type === 'baseline' || type === 'manual') {
    const weeklyPrompts = activePrompts.slice(0, 4);
    if (weeklyPrompts.length === 0) return activePrompts[0].prompt_text;
    const index = dayIndex % weeklyPrompts.length;
    return weeklyPrompts[index].prompt_text;
  }

  // Daily: Use remaining 9 prompts in rotation
  if (type === 'daily') {
    const dailyPrompts = activePrompts.slice(4);
    if (dailyPrompts.length === 0) return activePrompts[0].prompt_text;
    const index = dayIndex % dailyPrompts.length;
    return dailyPrompts[index].prompt_text;
  }

  return activePrompts[0].prompt_text;
}