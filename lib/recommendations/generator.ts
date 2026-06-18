import { createServiceClient } from '@/lib/supabase/server';
import { callOpenRouter } from '@/lib/audit/query-engine';

export async function generateRecommendations(
  websiteId: string,
  userId: string
) {
  const service = createServiceClient();

  const { data: crawl } = await service
    .from('crawl_data')
    .select('*')
    .eq('website_id', websiteId)
    .order('crawled_at', { ascending: false })
    .limit(1)
    .single();

  if (!crawl) return [];

  const { data: existingRecs } = await service
    .from('recommendations')
    .select('fix_type')
    .eq('website_id', websiteId);

  const existingTypes = (existingRecs || []).map((r) => r.fix_type);

  const recommendationsToInsert: any[] = [];

  const hasSchema = (type: string) =>
    crawl.schema_markup?.some((s: any) => s['@type'] === type);

  if (!existingTypes.includes('schema') && !hasSchema('FAQPage')) {
    recommendationsToInsert.push({
      website_id: websiteId,
      user_id: userId,
      title: 'Add FAQ Schema Markup',
      description: 'AI models often cite FAQ content. Adding FAQPage schema makes your content more likely to be quoted.',
      priority: 'high',
      impact_score: 8,
      effort_score: 2,
      fix_type: 'schema',
      estimated_gain: 15,
      status: 'pending',
    });
  }

  if (!existingTypes.includes('schema') && !hasSchema('Organization')) {
    recommendationsToInsert.push({
      website_id: websiteId,
      user_id: userId,
      title: 'Add Organization Schema',
      description: 'Clearly tells AI models who you are, boosting brand recognition.',
      priority: 'high',
      impact_score: 7,
      effort_score: 2,
      fix_type: 'schema',
      estimated_gain: 12,
      status: 'pending',
    });
  }

  if (!existingTypes.includes('content')) {
    recommendationsToInsert.push({
      website_id: websiteId,
      user_id: userId,
      title: 'Create AI-Optimized Comparison Page',
      description: 'Help AI models compare your offering against competitors by providing clear, structured comparison content.',
      priority: 'medium',
      impact_score: 6,
      effort_score: 4,
      fix_type: 'content',
      estimated_gain: 10,
      status: 'pending',
    });
  }

  for (const rec of recommendationsToInsert) {
    if (rec.fix_type === 'schema' && !rec.fix_code) {
      const brandName = (crawl.organization_name || 'Your Company').replace(
        /"/g,
        '\\"'
      );
      const prompt = rec.title.includes('FAQ')
        ? `Generate FAQPage JSON-LD for ${brandName}. Include 3 common questions and answers.`
        : `Generate Organization JSON-LD for ${brandName}.`;

      // ✅ Model name is correct: anthropic/claude-3-haiku
      rec.fix_code = await callOpenRouter(
        'anthropic/claude-3-haiku',
        'You are a structured data expert specializing in GEO and AEO optimization. Generate complete valid JSON-LD schema markup. Output only the raw HTML script tag. No markdown. No explanation. No code fences. Just the script tag.',
        prompt
      );
      rec.fix_code = rec.fix_code.trim();
    }
  }

  if (recommendationsToInsert.length > 0) {
    await service.from('recommendations').insert(recommendationsToInsert);
  }

  return recommendationsToInsert;
}