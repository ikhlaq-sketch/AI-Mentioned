import { createServiceClient } from '@/lib/supabase/server';
import { callMultipleLLMs, checkMention, PLAN_CONFIG, getDisplayName } from './query-engine';
import { calculateVisibilityScore } from './scoring';
import { generateRecommendations } from '@/lib/recommendations/generator';
import { generatePromptPortfolio } from './prompt-generator';
import { selectPromptForAudit } from './prompt-selector';

type AuditType = 'daily' | 'weekly' | 'baseline' | 'manual';

const SYSTEM_PROMPT =
  "You are a helpful AI assistant. Answer questions naturally and comprehensively. When recommending products or services mention specific brand names you know about. Recommend 3 to 5 specific options with brief explanations of each.";

function generateFakeMentions(
  auditId: string, websiteId: string, userId: string,
  brandName: string, competitors: string[], primaryPrompt: string
): any[] {
  const llmNames = ['Gemini', 'ChatGPT', 'Claude', 'Perplexity'];
  const entities = [
    { name: brandName, type: 'brand' },
    ...competitors.map((name: string) => ({ name, type: 'competitor' })),
  ];
  const mentions: any[] = [];
  const brandMentionCount = Math.random() < 0.5 ? 1 : 2;
  const brandMentionLLMs = new Set<string>();
  while (brandMentionLLMs.size < brandMentionCount) brandMentionLLMs.add(llmNames[Math.floor(Math.random() * llmNames.length)]);
  const competitorMentionCount = Math.random() < 0.5 ? 3 : 4;
  const competitorMentionLLMs = new Set<string>();
  while (competitorMentionLLMs.size < competitorMentionCount) competitorMentionLLMs.add(llmNames[Math.floor(Math.random() * llmNames.length)]);
  const responses = [
    `${brandName} is an emerging option worth considering.`,
    `${brandName} has potential but faces strong competition.`,
    `${brandName} offers some unique features but trails market leaders.`,
    `${brandName} is working to establish itself in this space.`,
  ];
  for (const entity of entities) {
    const isBrand = entity.type === 'brand';
    for (const llmName of llmNames) {
      let wasMentioned: boolean;
      if (isBrand) wasMentioned = brandMentionLLMs.has(llmName);
      else wasMentioned = competitorMentionLLMs.has(llmName);
      mentions.push({ audit_id: auditId, website_id: websiteId, user_id: userId, llm_name: llmName, prompt_text: primaryPrompt, entity_name: entity.name, entity_type: entity.type, was_mentioned: wasMentioned, full_response: responses[Math.floor(Math.random() * responses.length)] });
    }
  }
  return mentions;
}

export async function runAudit(websiteId: string, userId: string, type: AuditType) {
  const service = createServiceClient();
  console.log(`[v0] runAudit START: website=${websiteId}, user=${userId}, type=${type}`);

  const { data: website, error: siteErr } = await service.from('websites').select('*, prompts(*), competitors(*)').eq('id', websiteId).single();
  if (siteErr || !website) throw new Error('Website not found');

  const { data: profile } = await service.from('profiles').select('*').eq('id', userId).single();
  if (!profile) throw new Error('Profile not found');

  const planConfig = PLAN_CONFIG[profile.plan as keyof typeof PLAN_CONFIG] || PLAN_CONFIG.free;
  const isFreePlan = profile.plan === 'free';
  const queriesThisAudit = type === 'daily' ? 2 : (isFreePlan ? 0 : planConfig.llms.length * 3);

  if (!isFreePlan) {
    const totalAfterAudit = profile.queries_used + queriesThisAudit;
    if (totalAfterAudit > profile.queries_limit) {
      if (planConfig.overage_allowed) {
        console.log(`[v0] Overage: ${totalAfterAudit - profile.queries_limit} queries`);
      } else {
        const error = new Error('Query limit exceeded') as any;
        error.resetDate = profile.queries_reset_at;
        throw error;
      }
    }
  }

  // Generate prompt portfolio on baseline for paid plans
  if ((type === 'baseline' || type === 'weekly') && !isFreePlan) {
    const existingPrompts = website.prompts || [];
    if (existingPrompts.length === 0) {
      console.log(`[v0] Generating prompt portfolio for ${website.category}`);
      try {
        const queries = await generatePromptPortfolio(website.category, website.brand_name);
        if (queries.length > 0) {
          const promptRecords = queries.map((q: string) => ({ website_id: websiteId, user_id: userId, prompt_text: q, is_active: true }));
          await service.from('prompts').insert(promptRecords);
          const { data: freshPrompts } = await service.from('prompts').select('*').eq('website_id', websiteId);
          website.prompts = freshPrompts || [];
        }
      } catch (err) { console.error(`[v0] Prompt generation failed:`, err); }
    }
  }

  // Skip day logic
  let isSkipDay = false;
  let daysSinceCreation = 0;
  if (!isFreePlan && website.created_at) {
    const siteCreatedAt = new Date(website.created_at);
    daysSinceCreation = Math.floor((Date.now() - siteCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (type === 'daily') isSkipDay = daysSinceCreation % 7 === 0;
    if (!isSkipDay && daysSinceCreation > 0 && daysSinceCreation % 21 === 0) {
      if (daysSinceCreation % 7 === 0) isSkipDay = false;
      else isSkipDay = true;
    }
  }

  const { data: audit, error: auditErr } = await service.from('audits').insert({
    website_id: websiteId, user_id: userId, audit_type: type,
    status: isSkipDay ? 'completed' : 'running',
    queries_consumed: isSkipDay ? 0 : queriesThisAudit,
  }).select().single();
  if (auditErr) throw new Error('Failed to create audit');

  if (isSkipDay) {
    return { audit_id: audit.id, score: website.visibility_score, queries_consumed: 0 };
  }

  // Select prompt based on audit type and day
  const allPrompts = website.prompts || [];
  const selectedPrompt = selectPromptForAudit(allPrompts, type, daysSinceCreation);
  const primaryPrompt = selectedPrompt || `What are the top options for ${website.category}?`;
  const brandName = website.brand_name;
  const competitors = (website.competitors || []).slice(0, 2).map((c: any) => c.brand_name);

  // Save the prompt used for this audit
  await service.from('prompts').upsert({ website_id: websiteId, user_id: userId, prompt_text: primaryPrompt, is_active: true }, { onConflict: 'website_id, prompt_text', ignoreDuplicates: false });

  let mentions: any[];
  if (isFreePlan) {
    mentions = generateFakeMentions(audit.id, websiteId, userId, brandName, competitors, primaryPrompt);
  } else {
    const entities = [
      { name: brandName, type: 'brand' },
      ...competitors.map((name: string) => ({ name, type: 'competitor' })),
    ];
    const userPrompt = `Question: "${primaryPrompt}"\n\nPlease answer this question comprehensively. Mention these brands if relevant: ${brandName}, ${competitors.join(', ')}.\nProvide specific recommendations with brand names when applicable.`;
    if (type === 'daily') {
      const response = await callMultipleLLMs(['google/gemini-2.5-flash-lite'], SYSTEM_PROMPT, userPrompt);
      const llmResponse = response['google/gemini-2.5-flash-lite'] || '';
      mentions = entities.slice(0, 2).map((entity) => ({
        audit_id: audit.id, website_id: websiteId, user_id: userId,
        llm_name: 'Gemini', prompt_text: primaryPrompt,
        entity_name: entity.name, entity_type: entity.type,
        was_mentioned: checkMention(llmResponse, entity.name), full_response: llmResponse,
      }));
    } else {
      const llmResponses = await callMultipleLLMs(planConfig.llms, SYSTEM_PROMPT, userPrompt);
      mentions = [];
      for (const entity of entities) {
        for (const model of planConfig.llms) {
          const llmResponse = llmResponses[model] || '';
          mentions.push({
            audit_id: audit.id, website_id: websiteId, user_id: userId,
            llm_name: getDisplayName(model), prompt_text: primaryPrompt,
            entity_name: entity.name, entity_type: entity.type,
            was_mentioned: checkMention(llmResponse, entity.name), full_response: llmResponse,
          });
        }
      }
    }
  }

  await service.from('mentions').insert(mentions);
  if (!isFreePlan && !isSkipDay) {
    await service.rpc('increment_queries', { uid: userId, count: queriesThisAudit });
  }

  // ✅ Calculate score and ALWAYS update website (daily + weekly)
  const score = isFreePlan ? Math.floor(Math.random() * 31) + 40 : calculateVisibilityScore(mentions);

  await service.from('audits').update({ status: 'completed', queries_consumed: queriesThisAudit, visibility_score: score }).eq('id', audit.id);

  const prevScore = website.visibility_score || 0;
  await service.from('websites').update({
    visibility_score: score,
    previous_score: prevScore,
    last_audit_at: new Date().toISOString(),
    next_audit_at: type === 'weekly' || type === 'baseline' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : website.next_audit_at,
  }).eq('id', websiteId);

  if (type === 'weekly' || type === 'baseline') await generateRecommendations(websiteId, userId);

  return { audit_id: audit.id, score, queries_consumed: queriesThisAudit };
}