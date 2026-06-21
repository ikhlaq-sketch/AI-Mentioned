import { createServiceClient } from '@/lib/supabase/server';
import { callMultipleLLMs, checkMention, PLAN_CONFIG, getDisplayName } from './query-engine';
import { calculateVisibilityScore } from './scoring';
import { generateRecommendations } from '@/lib/recommendations/generator';

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
  
  const brandMentionCount = Math.random() < 0.5 ? 2 : 3;
  const brandMentionLLMs = new Set<string>();
  
  while (brandMentionLLMs.size < brandMentionCount) {
    brandMentionLLMs.add(llmNames[Math.floor(Math.random() * llmNames.length)]);
  }
  
  const responses = [
    `${brandName} is a solid choice in this category, offering competitive features.`,
    `While ${competitors[0] || 'others'} leads, ${brandName} has been gaining traction.`,
    `${brandName} stands out for its customer-focused solutions.`,
    `In this space, ${brandName} is emerging as a noteworthy option.`,
  ];

  for (const entity of entities) {
    const isBrand = entity.type === 'brand';
    
    for (const llmName of llmNames) {
      let wasMentioned: boolean;
      
      if (isBrand) {
        wasMentioned = brandMentionLLMs.has(llmName);
      } else {
        wasMentioned = !brandMentionLLMs.has(llmName) && Math.random() < 0.6;
      }
      
      mentions.push({
        audit_id: auditId, website_id: websiteId, user_id: userId,
        llm_name: llmName, prompt_text: primaryPrompt,
        entity_name: entity.name, entity_type: entity.type,
        was_mentioned: wasMentioned,
        full_response: responses[Math.floor(Math.random() * responses.length)],
      });
    }
  }
  
  console.log(`[v0] Generated ${mentions.length} fake mentions. Brand mentioned in ${brandMentionCount}/4 LLMs`);
  return mentions;
}

export async function runAudit(websiteId: string, userId: string, type: AuditType) {
  const service = createServiceClient();

  console.log(`[v0] runAudit START: website=${websiteId}, user=${userId}, type=${type}`);

  const { data: website, error: siteErr } = await service
    .from('websites').select('*, prompts(*), competitors(*)')
    .eq('id', websiteId).single();
  if (siteErr || !website) {
    console.error(`[v0] Website fetch error:`, siteErr?.message);
    throw new Error('Website not found');
  }
  console.log(`[v0] Website found: ${website.domain}`);

  const { data: profile } = await service
    .from('profiles').select('*').eq('id', userId).single();
  if (!profile) {
    console.error(`[v0] Profile not found for user: ${userId}`);
    throw new Error('Profile not found');
  }
  console.log(`[v0] Profile: plan=${profile.plan}, queries_used=${profile.queries_used}/${profile.queries_limit}`);

  const planConfig = PLAN_CONFIG[profile.plan as keyof typeof PLAN_CONFIG] || PLAN_CONFIG.free;
  const isFreePlan = profile.plan === 'free';
  const queriesThisAudit = type === 'daily' ? 2 : (isFreePlan ? 0 : planConfig.llms.length);

  console.log(`[v0] isFreePlan=${isFreePlan}, queriesThisAudit=${queriesThisAudit}`);

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

  // ✅ FREE PLAN: Never skip (no API cost)
  // ✅ PAID PLANS: Skip every 21st day of site's lifecycle for crawl buffer
  const today = new Date().getDate();
  let isSkipDay = false;
  let daysSinceCreation = 0;
  
  if (!isFreePlan && website.created_at) {
    const siteCreatedAt = new Date(website.created_at);
    daysSinceCreation = Math.floor((Date.now() - siteCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
    isSkipDay = daysSinceCreation > 0 && daysSinceCreation % 21 === 0;
  }

  console.log(`[v0] Today=${today}, daysSinceCreation=${daysSinceCreation}, isSkipDay=${isSkipDay}, isFreePlan=${isFreePlan}`);

  const { data: audit, error: auditErr } = await service
    .from('audits').insert({
      website_id: websiteId, user_id: userId, audit_type: type,
      status: isSkipDay ? 'completed' : 'running',
      queries_consumed: isSkipDay ? 0 : queriesThisAudit,
    }).select().single();
  if (auditErr) {
    console.error(`[v0] Audit insert error:`, auditErr.message);
    throw new Error('Failed to create audit');
  }
  console.log(`[v0] Audit created: ${audit.id}`);

  if (isSkipDay) {
    console.log(`[v0] Skip day (site day ${daysSinceCreation}) - returning early`);
    return { audit_id: audit.id, score: website.visibility_score, queries_consumed: 0 };
  }

  const primaryPrompt = website.prompts?.[0]?.prompt_text || `What are the top options for ${website.category}?`;
  const brandName = website.brand_name;
  const competitors = (website.competitors || []).slice(0, 2).map((c: any) => c.brand_name);

  let mentions: any[];

  if (isFreePlan) {
    console.log(`[v0] Generating fake mentions for free plan`);
    mentions = generateFakeMentions(audit.id, websiteId, userId, brandName, competitors, primaryPrompt);
  } else {
    console.log(`[v0] Calling ${planConfig.llms.length} LLMs for paid plan`);
    const entities = [
      { name: brandName, type: 'brand' },
      ...competitors.map((name: string) => ({ name, type: 'competitor' })),
    ];
    const userPrompt = `Question: "${primaryPrompt}"\n\nPlease answer this question comprehensively. Mention these brands if relevant: ${brandName}, ${competitors.join(', ')}.\nProvide specific recommendations with brand names when applicable.`;

    if (type === 'daily') {
      const response = await callMultipleLLMs(['google/gemini-2.0-flash-001'], SYSTEM_PROMPT, userPrompt);
      const llmResponse = response['google/gemini-2.0-flash-001'] || '';
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

  console.log(`[v0] Inserting ${mentions.length} mentions`);
  const { error: mentionError } = await service.from('mentions').insert(mentions);
  if (mentionError) {
    console.error(`[v0] Mention insert error:`, mentionError.message, mentionError.details);
  } else {
    console.log(`[v0] Mentions inserted successfully`);
  }

  if (!isFreePlan && !isSkipDay) {
    console.log(`[v0] Incrementing queries by ${queriesThisAudit}`);
    const { error: rpcErr } = await service.rpc('increment_queries', { uid: userId, count: queriesThisAudit });
    if (rpcErr) console.error(`[v0] RPC error:`, rpcErr.message);
  }

  // ✅ Free plan: random score 40-70 | Paid: calculated from real data
  let score: number;
  if (isFreePlan) {
    score = Math.floor(Math.random() * 31) + 40;
    console.log(`[v0] FREE PLAN - Random score generated: ${score}`);
  } else {
    score = calculateVisibilityScore(mentions);
    console.log(`[v0] PAID PLAN - Calculated score: ${score}`);
  }

  console.log(`[v0] Updating audit ${audit.id} with score=${score}`);
  const { error: auditUpdateErr } = await service.from('audits').update({
    status: 'completed', queries_consumed: queriesThisAudit, visibility_score: score,
  }).eq('id', audit.id);
  if (auditUpdateErr) console.error(`[v0] Audit update error:`, auditUpdateErr.message);
  else console.log(`[v0] Audit updated successfully`);

  const prevScore = website.visibility_score || 0;
  console.log(`[v0] Updating website ${websiteId} score from ${prevScore} to ${score}`);
  const { error: websiteUpdateErr } = await service.from('websites').update({
    visibility_score: score, previous_score: prevScore,
    last_audit_at: new Date().toISOString(),
    next_audit_at: type === 'weekly' || type === 'baseline'
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : website.next_audit_at,
  }).eq('id', websiteId);
  if (websiteUpdateErr) console.error(`[v0] Website update error:`, websiteUpdateErr.message);
  else console.log(`[v0] Website updated successfully`);

  if (type === 'weekly' || type === 'baseline') {
    console.log(`[v0] Generating recommendations`);
    await generateRecommendations(websiteId, userId);
  }

  console.log(`[v0] runAudit COMPLETE - Returning score: ${score}`);
  return { audit_id: audit.id, score, queries_consumed: queriesThisAudit };
}