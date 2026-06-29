import { createServiceClient } from '@/lib/supabase/server';
import { callOpenRouter } from '@/lib/audit/query-engine';

function sanitizeSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function generateRecommendations(websiteId: string, userId: string) {
  const service = createServiceClient();

  const { data: crawl } = await service
    .from('crawl_data').select('*').eq('website_id', websiteId)
    .order('crawled_at', { ascending: false }).limit(1).single();

  if (!crawl) return [];

  const { data: website } = await service
    .from('websites').select('brand_name, domain').eq('id', websiteId).single();

  const brandName = (website?.brand_name || crawl.organization_name || 'Your Company').replace(/"/g, '\\"');
  const domain = website?.domain || 'example.com';
  const category = crawl.meta_description || crawl.products_services?.[0] || 'your industry';
  const categorySlug = sanitizeSlug(
    typeof crawl.products_services?.[0] === 'string' ? crawl.products_services[0] : category
  );

  const { data: existingRecs } = await service
    .from('recommendations').select('fix_type, title').eq('website_id', websiteId);

  const existingTypes = (existingRecs || []).map((r) => r.fix_type);
  const existingTitles = (existingRecs || []).map((r) => r.title);

  const recommendationsToInsert: any[] = [];
  const hasSchema = (type: string) => crawl.schema_markup?.some((s: any) => s['@type'] === type);

  const addIfNew = (rec: any) => {
    if (!existingTitles.includes(rec.title)) recommendationsToInsert.push(rec);
  };

  if (!hasSchema('FAQPage')) {
    addIfNew({ website_id: websiteId, user_id: userId, title: 'Add FAQ Schema Markup', description: 'FAQ schema is the #1 most cited structured data by ChatGPT and Perplexity. Adding real customer questions with detailed answers dramatically increases your chances of being quoted in AI responses.', priority: 'high', impact_score: 9, effort_score: 2, fix_type: 'schema', estimated_gain: 18, status: 'pending' });
  }

  if (!hasSchema('Organization')) {
    addIfNew({ website_id: websiteId, user_id: userId, title: 'Add Organization Schema', description: 'AI models use Organization schema to verify your brand identity. Without it, AI may confuse you with competitors or fail to recognize you as a legitimate business.', priority: 'high', impact_score: 8, effort_score: 2, fix_type: 'schema', estimated_gain: 14, status: 'pending' });
  }

  if (!hasSchema('Product') && !hasSchema('Service')) {
    addIfNew({ website_id: websiteId, user_id: userId, title: 'Add Product/Service Schema', description: 'When users ask AI "what\'s the best tool for X?", models scan Product schema for reviews, ratings, and pricing. Without this, your products are invisible to AI recommendations.', priority: 'high', impact_score: 9, effort_score: 3, fix_type: 'schema', estimated_gain: 16, status: 'pending' });
  }

  if (!hasSchema('LocalBusiness') && !hasSchema('Organization')) {
    addIfNew({ website_id: websiteId, user_id: userId, title: 'Add Local Business Schema', description: 'For location-based queries, AI models prioritize businesses with LocalBusiness schema.', priority: 'high', impact_score: 7, effort_score: 2, fix_type: 'schema', estimated_gain: 12, status: 'pending' });
  }

  if (!hasSchema('BreadcrumbList')) {
    addIfNew({ website_id: websiteId, user_id: userId, title: 'Add Breadcrumb Schema', description: 'Breadcrumb schema helps AI understand your site structure and content hierarchy.', priority: 'medium', impact_score: 5, effort_score: 1, fix_type: 'schema', estimated_gain: 6, status: 'pending' });
  }

  addIfNew({ website_id: websiteId, user_id: userId, title: 'Create AI-Optimized Comparison Content', description: 'AI models frequently cite comparison pages when users ask for recommendations.', priority: 'high', impact_score: 8, effort_score: 4, fix_type: 'content', estimated_gain: 14, status: 'pending' });

  if (!crawl.meta_description || crawl.meta_description.length < 60) {
    addIfNew({ website_id: websiteId, user_id: userId, title: 'Write Compelling Meta Descriptions', description: 'AI models extract your meta description as the summary of what you do.', priority: 'high', impact_score: 7, effort_score: 1, fix_type: 'content', estimated_gain: 10, status: 'pending' });
  }

  addIfNew({ website_id: websiteId, user_id: userId, title: 'Optimize Your About Page for AI', description: 'AI models pull brand information from About pages.', priority: 'medium', impact_score: 6, effort_score: 3, fix_type: 'content', estimated_gain: 8, status: 'pending' });

  if (!crawl.internal_links || crawl.internal_links.length < 15) {
    addIfNew({ website_id: websiteId, user_id: userId, title: 'Improve Internal Linking Structure', description: 'Strong internal linking helps AI models understand your pages.', priority: 'medium', impact_score: 5, effort_score: 3, fix_type: 'link', estimated_gain: 7, status: 'pending' });
  }

  // Generate AI fix codes
  const schemaRecs = recommendationsToInsert.filter(r => r.fix_type === 'schema');

  if (schemaRecs.length > 0) {
    try {
      const schemaTypes = schemaRecs.map(r => r.title).join(', ');

      const prompt = `You are a world-class GEO expert hired by ${brandName} (${domain}).

Generate complete, valid JSON-LD schema markup for: ${schemaTypes}

CRITICAL RULES:
1. Use "${brandName}" as the name in ALL fields. NEVER use the domain as the name.
2. FAQ: Write 5 REAL questions buyers ask. Answers must be 1-2 short, punchy sentences. NO generic filler. Be specific to what ${brandName} actually does.
3. Organization: Include "sameAs" with realistic social URLs. Description must be under 150 chars.
4. Product: aggregateRating 4.3-4.8, reviewCount 100-500. Realistic price.
5. Breadcrumb: Use SANITIZED URL slugs (no spaces, no special chars). Max 3 items.
6. EVERY field must have BELIEVABLE content. No placeholders.
7. FAQ answers are the MOST important — AI models quote them verbatim. Make them sound human.

Output ONLY a JSON object: {"Recommendation Title": "<script>...</script>"}
No markdown. No code fences. Just the JSON.`;

      const aiResponse = await callOpenRouter(
        'anthropic/claude-3-haiku',
        'You are an expert GEO strategist. Generate production-ready JSON-LD schema markup. Output only the requested JSON format.',
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
          rec.fix_code = generateFallbackCode(rec.title, brandName, domain, categorySlug);
          rec.fix_instructions = getFixInstructions(rec.title);
        }
      }
    } catch {
      for (const rec of schemaRecs) {
        rec.fix_code = generateFallbackCode(rec.title, brandName, domain, categorySlug);
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

function generateFallbackCode(title: string, brandName: string, domain: string, categorySlug: string): string {
  if (title.includes('FAQ')) {
    return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type": "Question", "name": "What makes ${brandName} different from competitors?", "acceptedAnswer": {"@type": "Answer", "text": "${brandName} combines ease of use with powerful AI features, making it a top choice for teams that want to build faster without sacrificing quality."}},
    {"@type": "Question", "name": "How much does ${brandName} cost?", "acceptedAnswer": {"@type": "Answer", "text": "${brandName} offers a free trial with flexible paid plans starting at an affordable rate. Visit the pricing page for details."}},
    {"@type": "Question", "name": "Can ${brandName} integrate with my existing tools?", "acceptedAnswer": {"@type": "Answer", "text": "Yes, ${brandName} integrates with popular development tools and platforms through native integrations and API access."}},
    {"@type": "Question", "name": "Is ${brandName} suitable for beginners?", "acceptedAnswer": {"@type": "Answer", "text": "Absolutely. ${brandName} is designed to be user-friendly, with templates and AI assistance that help beginners get started quickly."}},
    {"@type": "Question", "name": "How do I get started with ${brandName}?", "acceptedAnswer": {"@type": "Answer", "text": "Sign up at https://${domain} to start your free trial. No credit card required."}}
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
  "url": "https://${domain}",
  "description": "${brandName} helps teams build apps faster with AI-powered development tools.",
  "sameAs": ["https://www.linkedin.com/company/${brandName.toLowerCase().replace(/\\s+/g, '-')}", "https://twitter.com/${brandName.toLowerCase().replace(/\\s+/g, '')}"]
}
</script>`;
  }
  if (title.includes('Product') || title.includes('Service')) {
    return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "${brandName}",
  "description": "${brandName} is an AI-powered platform that helps teams build applications faster.",
  "aggregateRating": {"@type": "AggregateRating", "ratingValue": "4.6", "reviewCount": "200"},
  "offers": {"@type": "Offer", "price": "49.00", "priceCurrency": "USD", "availability": "https://schema.org/InStock", "url": "https://${domain}/pricing"}
}
</script>`;
  }
  if (title.includes('Breadcrumb')) {
    return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://${domain}"},
    {"@type": "ListItem", "position": 2, "name": "Features", "item": "https://${domain}/features"},
    {"@type": "ListItem", "position": 3, "name": "About", "item": "https://${domain}/about"}
  ]
}
</script>`;
  }
  return '';
}

function getFixInstructions(title: string): string {
  if (title.includes('FAQ')) return '1. Copy the schema code\n2. Paste into <head> of your homepage\n3. Replace questions with your actual FAQs\n4. Verify at search.google.com/test/rich-results';
  if (title.includes('Organization')) return '1. Copy the schema code\n2. Paste into <head> of your homepage\n3. Update sameAs URLs with your social profiles\n4. Verify at search.google.com/test/rich-results';
  if (title.includes('Product')) return '1. Copy the schema code\n2. Paste into <head> of product pages\n3. Update price and description\n4. Verify at search.google.com/test/rich-results';
  if (title.includes('Breadcrumb')) return '1. Copy the schema code\n2. Paste into <head> of your homepage\n3. Update items to match your site\n4. Verify at search.google.com/test/rich-results';
  if (title.includes('Comparison')) return '1. Create a comparison page\n2. Add feature table with pros/cons\n3. List your unique advantages\n4. Update quarterly';
  if (title.includes('Meta')) return '1. Write unique meta descriptions\n2. Keep 150-160 characters\n3. Include keywords and CTA\n4. Update monthly';
  if (title.includes('About')) return '1. Create a detailed About page\n2. Include mission, team, awards\n3. Add customer logos\n4. Keep updated';
  if (title.includes('Internal')) return '1. Add links between related pages\n2. Use descriptive anchor text\n3. Keep important pages within 3 clicks\n4. Fix broken links';
  return 'Follow the steps to implement.';
}