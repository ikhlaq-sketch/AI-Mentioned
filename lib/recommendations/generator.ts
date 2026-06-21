import { createServiceClient } from '@/lib/supabase/server';
import { callOpenRouter } from '@/lib/audit/query-engine';

export async function generateRecommendations(websiteId: string, userId: string) {
  const service = createServiceClient();

  const { data: crawl } = await service
    .from('crawl_data').select('*').eq('website_id', websiteId)
    .order('crawled_at', { ascending: false }).limit(1).single();

  if (!crawl) return [];

  const { data: existingRecs } = await service
    .from('recommendations').select('fix_type').eq('website_id', websiteId);

  const existingTypes = (existingRecs || []).map((r) => r.fix_type);
  const recommendationsToInsert: any[] = [];
  const hasSchema = (type: string) => crawl.schema_markup?.some((s: any) => s['@type'] === type);

  const brandName = (crawl.organization_name || 'Your Company').replace(/"/g, '\\"');
  const category = crawl.products_services?.[0] || 'your industry';

  if (!existingTypes.includes('schema') && !hasSchema('FAQPage')) {
    recommendationsToInsert.push({
      website_id: websiteId, user_id: userId,
      title: 'Add FAQ Schema Markup',
      description: 'AI models like ChatGPT and Perplexity frequently cite FAQ content verbatim.',
      priority: 'high', impact_score: 8, effort_score: 2,
      fix_type: 'schema', estimated_gain: 15, status: 'pending',
    });
  }

  if (!existingTypes.includes('schema') && !hasSchema('Organization')) {
    recommendationsToInsert.push({
      website_id: websiteId, user_id: userId,
      title: 'Add Organization Schema',
      description: 'AI models need clear entity signals. Organization schema with sameAs links builds AI trust.',
      priority: 'high', impact_score: 7, effort_score: 2,
      fix_type: 'schema', estimated_gain: 12, status: 'pending',
    });
  }

  if (!existingTypes.includes('schema') && !hasSchema('Product') && !hasSchema('Service')) {
    recommendationsToInsert.push({
      website_id: websiteId, user_id: userId,
      title: 'Add Product/Service Schema',
      description: 'When users ask AI for recommendations, models look for Product schema with reviews and ratings.',
      priority: 'high', impact_score: 8, effort_score: 3,
      fix_type: 'schema', estimated_gain: 13, status: 'pending',
    });
  }

  if (!existingTypes.includes('content')) {
    recommendationsToInsert.push({
      website_id: websiteId, user_id: userId,
      title: 'Create AI-Optimized Comparison Page',
      description: 'AI models love comparison content for making recommendations.',
      priority: 'medium', impact_score: 6, effort_score: 4,
      fix_type: 'content', estimated_gain: 10, status: 'pending',
    });
  }

  if (!crawl.meta_description || crawl.meta_description.length < 50) {
    recommendationsToInsert.push({
      website_id: websiteId, user_id: userId,
      title: 'Improve Meta Descriptions',
      description: 'Clear meta descriptions help AI models understand your page content.',
      priority: 'low', impact_score: 3, effort_score: 1,
      fix_type: 'content', estimated_gain: 2, status: 'pending',
    });
  }

  const schemaRecs = recommendationsToInsert.filter(r => r.fix_type === 'schema');

  if (schemaRecs.length > 0) {
    try {
      const prompt = `You are a world-class structured data expert. Generate complete, valid JSON-LD schema markup for "${brandName}" in "${category}". Types needed: ${schemaRecs.map(r => r.title).join(', ')}. FAQ must have 5 real buyer questions. Organization must have sameAs array. Product must have aggregateRating. Output ONLY JSON: {"Recommendation Title": "<script>...</script>"}. No markdown.`;

      const aiResponse = await callOpenRouter(
        'anthropic/claude-3-haiku',
        'You are a structured data expert. Output only the requested JSON format.',
        prompt
      );

      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const fixCodes = JSON.parse(jsonMatch[0]);
          for (const rec of schemaRecs) {
            if (fixCodes[rec.title]) {
              rec.fix_code = fixCodes[rec.title];
              rec.fix_instructions = getFixInstructions(rec.title);
            }
          }
        }
      } catch {
        for (const rec of schemaRecs) {
          rec.fix_code = generateFallbackCode(rec.title, brandName, category);
          rec.fix_instructions = getFixInstructions(rec.title);
        }
      }
    } catch {
      for (const rec of schemaRecs) {
        rec.fix_code = generateFallbackCode(rec.title, brandName, category);
        rec.fix_instructions = getFixInstructions(rec.title);
      }
    }
  }

  for (const rec of recommendationsToInsert) {
    if (!rec.fix_instructions) rec.fix_instructions = getFixInstructions(rec.title);
  }

  if (recommendationsToInsert.length > 0) {
    await service.from('recommendations').insert(recommendationsToInsert);
  }

  return recommendationsToInsert;
}

function generateFallbackCode(title: string, brandName: string, category: string): string {
  if (title.includes('FAQ')) {
    return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type": "Question", "name": "What makes ${brandName} the best choice?", "acceptedAnswer": {"@type": "Answer", "text": "${brandName} leads ${category} through innovation and customer success."}},
    {"@type": "Question", "name": "How does pricing work?", "acceptedAnswer": {"@type": "Answer", "text": "${brandName} offers flexible plans. Contact sales for details."}},
    {"@type": "Question", "name": "Does ${brandName} integrate with other tools?", "acceptedAnswer": {"@type": "Answer", "text": "Yes, ${brandName} integrates with popular platforms."}}
  ]
}
</script>`;
  }
  if (title.includes('Organization')) {
    return `<script type="application/ld+json">
{"@context": "https://schema.org", "@type": "Organization", "name": "${brandName}", "url": "https://example.com", "description": "${brandName} is a leader in ${category}.", "sameAs": ["https://www.linkedin.com/company/${brandName.toLowerCase().replace(/\\s+/g, '-')}"]}
</script>`;
  }
  if (title.includes('Product') || title.includes('Service')) {
    return `<script type="application/ld+json">
{"@context": "https://schema.org", "@type": "Product", "name": "${brandName}", "description": "${brandName} delivers ${category} solutions.", "aggregateRating": {"@type": "AggregateRating", "ratingValue": "4.5", "reviewCount": "150"}, "offers": {"@type": "Offer", "price": "49.00", "priceCurrency": "USD", "availability": "https://schema.org/InStock"}}
</script>`;
  }
  return '';
}

function getFixInstructions(title: string): string {
  if (title.includes('FAQ')) return '1. Copy code\n2. Paste in <head>\n3. Replace questions with real FAQs\n4. Verify at search.google.com/test/rich-results';
  if (title.includes('Organization')) return '1. Copy code\n2. Paste in <head>\n3. Update sameAs URLs\n4. Verify at search.google.com/test/rich-results';
  if (title.includes('Product') || title.includes('Service')) return '1. Copy code\n2. Paste in <head> of product pages\n3. Update price and description\n4. Verify at search.google.com/test/rich-results';
  if (title.includes('Comparison')) return '1. Create comparison page\n2. Add feature table\n3. List differentiators\n4. Update quarterly';
  if (title.includes('Meta')) return '1. Write unique meta descriptions\n2. Include keywords\n3. Keep 50-160 characters\n4. Update monthly';
  return 'Follow steps to implement.';
}