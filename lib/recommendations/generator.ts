import { createServiceClient } from '@/lib/supabase/server';
import { callOpenRouter } from '@/lib/audit/query-engine';

export async function generateRecommendations(websiteId: string, userId: string) {
  const service = createServiceClient();

  const { data: crawl } = await service
    .from('crawl_data').select('*').eq('website_id', websiteId)
    .order('crawled_at', { ascending: false }).limit(1).single();

  if (!crawl) return [];

  // ✅ Get actual brand name from website table
  const { data: website } = await service
    .from('websites').select('brand_name').eq('id', websiteId).single();

  const { data: existingRecs } = await service
    .from('recommendations').select('fix_type').eq('website_id', websiteId);

  const existingTypes = (existingRecs || []).map((r) => r.fix_type);
  const recommendationsToInsert: any[] = [];
  const hasSchema = (type: string) => crawl.schema_markup?.some((s: any) => s['@type'] === type);

  // ✅ Use actual brand name, not domain
  const brandName = (website?.brand_name || crawl.organization_name || 'Your Company').replace(/"/g, '\\"');
  const category = crawl.products_services?.[0] || crawl.meta_description || 'your industry';

  if (!existingTypes.includes('schema') && !hasSchema('FAQPage')) {
    recommendationsToInsert.push({
      website_id: websiteId, user_id: userId,
      title: 'Add FAQ Schema Markup',
      description: 'AI models like ChatGPT and Perplexity frequently cite FAQ content verbatim. This schema helps your answers appear directly in AI responses.',
      priority: 'high', impact_score: 8, effort_score: 2,
      fix_type: 'schema', estimated_gain: 15, status: 'pending',
    });
  }

  if (!existingTypes.includes('schema') && !hasSchema('Organization')) {
    recommendationsToInsert.push({
      website_id: websiteId, user_id: userId,
      title: 'Add Organization Schema',
      description: 'AI models need clear entity signals to recognize your brand. Organization schema with sameAs links builds AI trust in your identity.',
      priority: 'high', impact_score: 7, effort_score: 2,
      fix_type: 'schema', estimated_gain: 12, status: 'pending',
    });
  }

  if (!existingTypes.includes('schema') && !hasSchema('Product') && !hasSchema('Service')) {
    recommendationsToInsert.push({
      website_id: websiteId, user_id: userId,
      title: 'Add Product/Service Schema',
      description: 'When users ask AI for recommendations, models look for Product schema with reviews, ratings, and pricing. This directly impacts whether AI recommends you.',
      priority: 'high', impact_score: 8, effort_score: 3,
      fix_type: 'schema', estimated_gain: 13, status: 'pending',
    });
  }

  if (!existingTypes.includes('content')) {
    recommendationsToInsert.push({
      website_id: websiteId, user_id: userId,
      title: 'Create AI-Optimized Comparison Page',
      description: 'AI models love comparison content. A dedicated page comparing your solution to competitors gives AI the exact data it needs to recommend you.',
      priority: 'medium', impact_score: 6, effort_score: 4,
      fix_type: 'content', estimated_gain: 10, status: 'pending',
    });
  }

  if (!crawl.meta_description || crawl.meta_description.length < 50) {
    recommendationsToInsert.push({
      website_id: websiteId, user_id: userId,
      title: 'Improve Meta Descriptions',
      description: 'Clear, keyword-rich meta descriptions help AI models understand your page content and cite it accurately in responses.',
      priority: 'low', impact_score: 3, effort_score: 1,
      fix_type: 'content', estimated_gain: 2, status: 'pending',
    });
  }

  const schemaRecs = recommendationsToInsert.filter(r => r.fix_type === 'schema');

  if (schemaRecs.length > 0) {
    try {
      const schemaTypes = schemaRecs.map(r => r.title).join(', ');

      // ✅ IMPROVED PROMPT: Forces specific, realistic content
      const prompt = `You are a world-class GEO (Generative Engine Optimization) expert. Generate complete, valid JSON-LD schema markup for "${brandName}" which is a "${category}" company.

IMPORTANT: Use the brand name "${brandName}" (not domain) in all schema fields.

Required schema types: ${schemaTypes}

CRITICAL RULES:
1. FAQ Schema: Include 5 REAL questions that actual buyers ask about ${category}. Each answer must be 2-3 sentences with SPECIFIC details about features, pricing, or benefits. Do NOT use generic filler text.
2. Organization Schema: Include sameAs array with realistic social URLs. Use format "https://linkedin.com/company/brandname". Description must explain what ${brandName} actually does in ${category}.
3. Product Schema: Include realistic aggregateRating (4.0-4.8 range), realistic review count (50-500 range), and a realistic priceRange like "$10-$500". Description must be specific to ${category}.
4. NEVER use "your industry" or "example.com" - always use specific, believable content.
5. Every schema must be complete, valid JSON-LD with NO placeholder text.

Output ONLY a valid JSON object where each key is the exact recommendation title and each value is the COMPLETE HTML script tag string.

Format:
{"Add FAQ Schema Markup": "<script type=\\"application/ld+json\\">...</script>"}

No markdown. No code fences. No explanations. Just the JSON.`;

      const aiResponse = await callOpenRouter(
        'anthropic/claude-3-haiku',
        'You are a structured data expert specializing in GEO and AEO optimization. Generate complete valid JSON-LD schema markup with specific, realistic content. Output only the requested JSON format.',
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
    {"@type": "Question", "name": "What makes ${brandName} different from competitors?", "acceptedAnswer": {"@type": "Answer", "text": "${brandName} stands out in ${category} through its commitment to quality, innovative features, and exceptional customer support that helps businesses achieve better results."}},
    {"@type": "Question", "name": "How much does ${brandName} cost?", "acceptedAnswer": {"@type": "Answer", "text": "${brandName} offers flexible pricing plans designed to fit businesses of all sizes. Contact our team for a personalized quote based on your specific needs."}},
    {"@type": "Question", "name": "Does ${brandName} offer integrations?", "acceptedAnswer": {"@type": "Answer", "text": "Yes, ${brandName} integrates seamlessly with popular tools and platforms. Our API allows custom integrations with your existing workflow."}},
    {"@type": "Question", "name": "What kind of support does ${brandName} provide?", "acceptedAnswer": {"@type": "Answer", "text": "${brandName} provides 24/7 customer support via email, chat, and phone. Enterprise customers get a dedicated account manager."}},
    {"@type": "Question", "name": "How do I get started with ${brandName}?", "acceptedAnswer": {"@type": "Answer", "text": "Getting started is easy. Sign up for a free trial on our website, schedule a demo with our team, or contact sales to discuss your requirements."}}
  ]
}
</script>`;
  }
  if (title.includes('Organization')) {
    return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "${brandName}",
  "url": "https://example.com",
  "description": "${brandName} is a leading provider of ${category} solutions, helping businesses achieve their goals through innovative technology and exceptional service.",
  "sameAs": [
    "https://www.linkedin.com/company/${brandName.toLowerCase().replace(/\\s+/g, '-')}",
    "https://twitter.com/${brandName.toLowerCase().replace(/\\s+/g, '')}",
    "https://www.crunchbase.com/organization/${brandName.toLowerCase().replace(/\\s+/g, '-')}"
  ]
}
</script>`;
  }
  if (title.includes('Product') || title.includes('Service')) {
    return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "${brandName}",
  "description": "${brandName} delivers comprehensive ${category} solutions designed to help businesses improve efficiency, reduce costs, and drive growth.",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "150"
  },
  "offers": {
    "@type": "Offer",
    "price": "49.00",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  }
}
</script>`;
  }
  return '';
}

function getFixInstructions(title: string): string {
  if (title.includes('FAQ')) return '1. Copy the schema code above\n2. Paste it into the <head> section of your homepage or FAQ page\n3. Replace the example questions with your actual customer FAQs\n4. Keep answers between 40-60 words for optimal AI citation\n5. Verify using Google Rich Results Test at search.google.com/test/rich-results';
  if (title.includes('Organization')) return '1. Copy the schema code above\n2. Paste it into the <head> section of your homepage\n3. Replace the sameAs URLs with your actual social media profiles\n4. Add your real founding date and logo URL for better AI recognition\n5. Verify using Google Rich Results Test';
  if (title.includes('Product') || title.includes('Service')) return '1. Copy the schema code above\n2. Paste it into the <head> section of your product pages\n3. Update with your actual pricing, ratings, and availability\n4. Add high-quality product images for better AI understanding\n5. Verify using Google Rich Results Test';
  if (title.includes('Comparison')) return '1. Create a new page titled "[Your Brand] vs [Competitor]: Which is Right for You?"\n2. Include a feature comparison table with specific data points\n3. List 3-5 key differentiators that make your solution unique\n4. Use clear H2 headings for each competitor section\n5. Keep content factual and updated quarterly';
  if (title.includes('Meta')) return '1. Write unique meta descriptions (50-160 characters) for each page\n2. Include your primary keyword naturally\n3. Add a compelling value proposition that makes users click\n4. Ensure every page has a unique meta description\n5. Update outdated descriptions monthly';
  return 'Follow the implementation steps to apply this recommendation.';
}