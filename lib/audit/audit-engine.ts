import { createServiceClient } from '@/lib/supabase/server';
import { callOpenRouter, checkMention } from './query-engine';
import { calculateVisibilityScore } from './scoring';
import { generateRecommendations } from '@/lib/recommendations/generator';
import { sendWeeklyReport, sendScoreDropAlert } from '@/lib/email/alerts';

type AuditType = 'daily' | 'weekly' | 'baseline' | 'manual';

const SYSTEM_PROMPT =
  "You are an AI search visibility analyst. Answer only with the requested JSON format, no extra text.";

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

  const primaryPrompt = website.prompts?.[0]?.prompt_text ||
    `What are the top options for ${website.category}?`;
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

  // ✅ Honest JSON prompt – no roleplay
  const prompt = `Analyze the AI search visibility for the brand "${brandName}" for the query: "${primaryPrompt}"

Based on your training knowledge, provide an honest analysis of how likely this brand is to appear when users ask this question in different AI systems.

Return ONLY this exact JSON with no other text:
{
  "gemini": {
    "mentioned": true,
    "confidence": "high",
    "reasoning": "one sentence explanation"
  },
  "chatgpt": {
    "mentioned": false,
    "confidence": "medium",
    "reasoning": "one sentence explanation"
  },
  "claude": {
    "mentioned": false,
    "confidence": "low",
    "reasoning": "one sentence explanation"
  },
  "perplexity": {
    "mentioned": true,
    "confidence": "medium",
    "reasoning": "one sentence explanation"
  },
  "competitors": {
    "${competitors[0] || 'competitor1'}": {
      "gemini": true, "chatgpt": true, "claude": false, "perplexity": true
    }${
      competitors[1]
        ? `,\n    "${competitors[1]}": {
      "gemini": true, "chatgpt": false, "claude": true, "perplexity": true
    }`
        : ''
    }
  }
}`;

  const response = await callOpenRouter('llama-3.1-8b', SYSTEM_PROMPT, prompt);

  // ✅ Safe JSON parsing
  let parsedResult: any = {};
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsedResult = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e);
    // Fallback: mark all as not mentioned rather than crash
    parsedResult = {
      gemini: { mentioned: false, confidence: 'low', reasoning: 'Parse error' },
      chatgpt: { mentioned: false, confidence: 'low', reasoning: 'Parse error' },
      claude: { mentioned: false, confidence: 'low', reasoning: 'Parse error' },
      perplexity: { mentioned: false, confidence: 'low', reasoning: 'Parse error' },
    };
  }

  // Build mentions from parsed JSON
  const llmNames = ['gemini', 'chatgpt', 'claude', 'perplexity'];
  const mentions: any[] = [];

  // Brand mentions
  for (const llmName of llmNames) {
    const llmData = parsedResult[llmName] || {};
    mentions.push({
      audit_id: audit.id,
      website_id: websiteId,
      user_id: userId,
      llm_name: llmName,
      prompt_text: primaryPrompt,
      entity_name: brandName,
      entity_type: 'brand',
      was_mentioned: llmData.mentioned || false,
      full_response: llmData.reasoning || '',
    });
  }

  // Competitor mentions
  for (const comp of competitors) {
    const compData = parsedResult.competitors?.[comp] || {};
    for (const llmName of llmNames) {
      mentions.push({
        audit_id: audit.id,
        website_id: websiteId,
        user_id: userId,
        llm_name: llmName,
        prompt_text: primaryPrompt,
        entity_name: comp,
        entity_type: 'competitor',
        was_mentioned: compData[llmName] || false,
        full_response: '',
      });
    }
  }

  await service.from('mentions').insert(mentions);
  await service.rpc('increment_queries', { uid: userId, count: totalQueries }); // ✅ Now exists after running SQL

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