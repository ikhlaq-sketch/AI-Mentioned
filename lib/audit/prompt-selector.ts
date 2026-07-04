export function selectPromptForAudit(
  prompts: any[],
  type: 'daily' | 'weekly' | 'baseline' | 'manual',
  dayIndex: number
): string | null {
  if (!prompts || prompts.length === 0) return null;

  const activePrompts = prompts.filter((p: any) => p.is_active);
  if (activePrompts.length === 0) return null;

  const weeklyPrompts = activePrompts.slice(0, 4);
  const dailyPrompts = activePrompts.slice(4);

  if (weeklyPrompts.length === 0) return activePrompts[0].prompt_text;
  if (dailyPrompts.length === 0 && type === 'daily') return activePrompts[0].prompt_text;

  // Strict 30-day cycle (Indexes 0 through 29)
  const cycleDay = dayIndex % 30;

  // 1. WEEKLY / BASELINE LOGIC (Exactly 4 times per 30-day cycle)
  if (type === 'weekly' || type === 'baseline') {
    const weekNumber = Math.min(Math.floor(cycleDay / 7), 3); // Caps at 3
    return weeklyPrompts[weekNumber % weeklyPrompts.length].prompt_text;
  }

  // 2. DAILY SCAN LOGIC (Exactly 26 times per 30-day cycle)
  if (type === 'daily' || type === 'manual') {
    const fullMonths = Math.floor(dayIndex / 30);

    // Calculate how many Weekly scans have triggered in the current 30-day block
    let weeklyScansThisMonth = 0;
    if (cycleDay >= 0) weeklyScansThisMonth = 1;
    if (cycleDay >= 7) weeklyScansThisMonth = 2;
    if (cycleDay >= 14) weeklyScansThisMonth = 3;
    if (cycleDay >= 21) weeklyScansThisMonth = 4;

    const totalWeeklyScansEver = (fullMonths * 4) + weeklyScansThisMonth;
    const totalDailyScansEver = (dayIndex + 1) - totalWeeklyScansEver;

    // Use total daily scans to loop smoothly through the 9 daily prompts
    const safeIndex = Math.max(0, totalDailyScansEver - 1);
    return dailyPrompts[safeIndex % dailyPrompts.length].prompt_text;
  }

  return activePrompts[0].prompt_text;
}