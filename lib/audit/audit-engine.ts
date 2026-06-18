import { createServiceClient } from '@/lib/supabase/server';
import { callOpenRouter, checkMention } from './query-engine';
import { calculateVisibilityScore } from './scoring';
import { generateRecommendations } from '@/lib/recommendations/generator';
import { sendWeeklyReport, sendScoreDropAlert } from '@/lib/email/alerts';

type AuditType = 'daily' | 'weekly' | 'baseline' | 'manual';

const SYSTEM_PROMPT =
  "You are a helpful AI assistant. Answer questions naturally and comprehensively. When recommending products or services mention specific brand names you know about. Recommend 3 to 5 specific options with brief explanations of each.";

export async function runAudit(
  websiteId: string,
  userId: string,
  type: AuditType
) {
  const service = createServiceClient();

  const { data: website, error: siteErr } = await service
    .from('websites')
    .select('*, prompts(*), competitors(*)')
    .eq('id', websiteId)
    .single();
  if (siteErr || !website) throw new Error('Website not found');

  const { data: profile } = await service
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (!profile) throw new Error('Profile not found');

  const plan = profile.plan;
  const models = getModels(plan, type);
  const primaryPrompt =
    website.prompts?.[0]?.prompt_text ||
    `What are the top options for ${website.category}?`;
  const entities = [
    { name: website.brand_name, type: 'brand' },
    ...(website.competitors || []).slice(0, 2).map((c: any) => ({
      name: c.brand_name,
      type: 'competitor',
    })),
  ];

  const totalQueries = models.length * entities.length;

  const canAfford = await checkQueryBudget(userId, totalQueries);
  if (!canAfford.allowed) {
    const error = new Error('Query limit exceeded') as any;
    error.resetDate = canAfford.resetDate;
    throw error;
  }

  const { data: audit, error: auditErr } = await service
    .from('audits')
    .insert({
      website_id: websiteId,
      user_id: userId,
      audit_type: type,
      status: 'running',
      queries_consumed: 0,
    })
    .select()
    .single();
  if (auditErr) throw new Error('Failed to create audit');

  const lookupPromises = models.flatMap((model) =>
    entities.map(async (entity) => {
      const response = await callOpenRouter(model, SYSTEM_PROMPT, primaryPrompt);
      const wasMentioned = checkMention(response, entity.name);
      return {
        audit_id: audit.id,
        website_id: websiteId,
        user_id: userId,
        llm_name: model,
        prompt_text: primaryPrompt,
        entity_name: entity.name,
        entity_type: entity.type,
        was_mentioned: wasMentioned,
        full_response: response,
      };
    })
  );

  const mentions = await Promise.all(lookupPromises);
  await service.from('mentions').insert(mentions);
  await service.rpc('increment_queries', { uid: userId, count: totalQueries });

  const score = calculateVisibilityScore(mentions);
  await service
    .from('audits')
    .update({
      status: 'completed',
      queries_consumed: totalQueries,
      visibility_score: score,
    })
    .eq('id', audit.id);

  const prevScore = website.visibility_score;
  const updateData: any = {
    visibility_score: score,
    previous_score: prevScore,
    last_audit_at: new Date().toISOString(),
  };
  if (type === 'weekly' || type === 'baseline') {
    updateData.next_audit_at = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();
  }
  await service.from('websites').update(updateData).eq('id', websiteId);

  if (type === 'weekly' || type === 'baseline') {
    await generateRecommendations(websiteId, userId);
    await sendWeeklyReport(website, score, profile.email);
  }

  if (prevScore > 0 && score < prevScore - 10) {
    await sendScoreDropAlert(website, prevScore, score, [], profile.email);
  }

  return { audit_id: audit.id, score, queries_consumed: totalQueries };
}

async function checkQueryBudget(
  userId: string,
  needed: number
): Promise<{ allowed: boolean; resetDate?: string }> {
  const service = createServiceClient();
  const { data: profile } = await service
    .from('profiles')
    .select('queries_limit, queries_used, queries_reset_at, plan')
    .eq('id', userId)
    .single();
  if (!profile) throw new Error('Profile not found');

  if (
    profile.plan === 'starter' &&
    profile.queries_used + needed > profile.queries_limit
  ) {
    return { allowed: false, resetDate: profile.queries_reset_at };
  }

  if (profile.queries_used + needed > profile.queries_limit) {
    return { allowed: false, resetDate: profile.queries_reset_at };
  }

  return { allowed: true };
}

// ✅ FREE MODEL for launch
function getModels(plan: string, type: AuditType): string[] {
  return ['google/gemini-2.0-flash-exp:free'];
}