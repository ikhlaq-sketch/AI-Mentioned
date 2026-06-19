import { createServiceClient } from '@/lib/supabase/server';
import { callOpenRouter } from '@/lib/audit/query-engine';

export async function generateRecommendations(websiteId: string, userId: string) {
  const service = createServiceClient();
  const { data: crawl } = await service.from('crawl_data').select('*').eq('website_id', websiteId).order('crawled_at', { ascending: false }).limit(1).single();
  if (!crawl) return [];

  const { data: existingRecs } = await service.from('recommendations').select('fix_type').eq('website_id', websiteId);
  const existingTypes = (existingRecs || []).map((r) => r.fix_type);
  const recommendationsToInsert: any[] = [];
  const hasSchema = (type: string) => crawl.schema_markup?.some((s: any) => s['@type'] === type);

  if (!existingTypes.includes('schema') && !hasSchema('FAQPage')) {
    recommendationsToInsert.push({ website_id: websiteId, user_id: userId, title: 'Add FAQ Schema Markup', description: 'AI models often cite FAQ content.', priority: 'high', impact_score: 8, effort_score: 2, fix_type: 'schema', estimated_gain: 15, status: 'pending' });
  }
  if (!existingTypes.includes('schema') && !hasSchema('Organization')) {
    recommendationsToInsert.push({ website_id: websiteId, user_id: userId, title: 'Add Organization Schema', description: 'Clearly tells AI models who you are.', priority: 'high', impact_score: 7, effort_score: 2, fix_type: 'schema', estimated_gain: 12, status: 'pending' });
  }
  if (!existingTypes.includes('content')) {
    recommendationsToInsert.push({ website_id: websiteId, user_id: userId, title: 'Create AI-Optimized Comparison Page', description: 'Help AI models compare your offering.', priority: 'medium', impact_score: 6, effort_score: 4, fix_type: 'content', estimated_gain: 10, status: 'pending' });
  }

  for (const rec of recommendationsToInsert) {
    if (rec.fix_type === 'schema' && !rec.fix_code) {
      const brandName = (crawl.organization_name || 'Your Company').replace(/"/g, '\\"');
      const prompt = rec.title.includes('FAQ') ? `Generate FAQPage JSON-LD for ${brandName}.` : `Generate Organization JSON-LD for ${brandName}.`;
      // Change line 22 from 'llama-2-7b' to your working gemma model
rec.fix_code = await callOpenRouter(
  '@cf/google/gemma-2b-it-lora', 
  'You are a structured data expert. Output only the raw HTML script tag. No markdown.', 
  prompt
);
      rec.fix_code = rec.fix_code.trim();
    }
  }
  if (recommendationsToInsert.length > 0) await service.from('recommendations').insert(recommendationsToInsert);
  return recommendationsToInsert;
}