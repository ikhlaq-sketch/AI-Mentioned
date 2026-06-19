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

  const primaryPrompt = website.prompts?.[0]?.prompt_text || `What are the top options for ${website.category}?`;
  const brandName = website.brand_name;
  const competitors = (website.competitors || []).slice(0, 2).map((c: any) => c.brand_name);

  const totalQueries = 1;

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

  const prompt = `Question: "${primaryPrompt}"

Answer this question as FOUR different AI assistants would: Gemini, ChatGPT, Claude, and Perplexity.

For each AI assistant, provide their answer in this exact format:

---GEMINI---
[Gemini's answer here. Mention these brands if relevant: ${brandName}, ${competitors.join(', ')}]
---END---

---CHATGPT---
[ChatGPT's answer here. Mention these brands if relevant: ${brandName}, ${competitors.join(', ')}]
---END---

---CLAUDE---
[Claude's answer here. Mention these brands if relevant: ${brandName}, ${competitors.join(', ')}]
---END---

---PERPLEXITY---
[Perplexity's answer here. Mention these brands if relevant: ${brandName}, ${competitors.join(', ')}]
---END---`;

  const response = await callOpenRouter('llama-3.1-8b-instruct', SYSTEM_PROMPT, prompt);

  const llmResponses: Record<string, string> = {};
  const sections = response.split('---');

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim().toUpperCase();
    if (['GEMINI', 'CHATGPT', 'CLAUDE', 'PERPLEXITY'].includes(section)) {
      const nextSection = sections[i + 1]?.trim();
      if (nextSection && nextSection !== 'END') {
        llmResponses[section.toLowerCase()] = nextSection;
      }
    }
  }

  const llmNames = ['Gemini', 'ChatGPT', 'Claude', 'Perplexity'];
  const entities = [
    { name: brandName, type: 'brand' },
    ...competitors.map((name: string) => ({ name, type: 'competitor' })),
  ];

  const mentions: any[] = [];

  for (const entity of entities) {
    for (const llmName of llmNames) {
      const llmResponse = llmResponses[llmName.toLowerCase()] || '';
      const wasMentioned = checkMention(llmResponse, entity.name);
      mentions.push({
        audit_id: audit.id,
        website_id: websiteId,
        user_id: userId,
        llm_name: llmName,
        prompt_text: primaryPrompt,
        entity_name: entity.name,
        entity_type: entity.type,
        was_mentioned: wasMentioned,
        full_response: llmResponse,
      });
    }
  }

  await service.from('mentions').insert(mentions);
  await service.rpc('increment_queries', { uid: userId, count: totalQueries });

  const score = calculateVisibilityScore(mentions);
  await service
    .from('audits')
    .update({ status: 'completed', queries_consumed: totalQueries, visibility_score: score })
    .eq('id', audit.id);

  const prevScore = website.visibility_score;
  const updateData: any = {
    visibility_score: score,
    previous_score: prevScore,
    last_audit_at: new Date().toISOString(),
  };
  if (type === 'weekly' || type === 'baseline') {
    updateData.next_audit_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
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

async function checkQueryBudget(userId: string, needed: number): Promise<{ allowed: boolean; resetDate?: string }> {
  const service = createServiceClient();
  const { data: profile } = await service
    .from('profiles')
    .select('queries_limit, queries_used, queries_reset_at, plan')
    .eq('id', userId)
    .single();
  if (!profile) throw new Error('Profile not found');
  if (profile.queries_used + needed > profile.queries_limit) {
    return { allowed: false, resetDate: profile.queries_reset_at };
  }
  return { allowed: true };
}