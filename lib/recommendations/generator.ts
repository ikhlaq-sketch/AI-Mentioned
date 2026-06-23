import { createServiceClient } from '@/lib/supabase/server';
import { callOpenRouter } from '@/lib/audit/query-engine';

export async function generateRecommendations(websiteId: string, userId: string) {
  const service = createServiceClient();

  const { data: crawl } = await service
    .from('crawl_data').select('*').eq('website_id', websiteId)
    .order('crawled_at', { ascending: false }).limit(1).single();

  if (!crawl) return [];

  // ✅ Get actual brand name and domain from website table
  const { data: website } = await service
    .from('websites').select('brand_name, domain').eq('id', websiteId).single();

  const brandName = (website?.brand_name || crawl.organization_name || 'Your Company').replace(/"/g, '\\"');
  const domain = website?.domain || 'example.com';
  const category = crawl.meta_description || crawl.products_services?.[0] || 'your industry';

  const { data: existingRecs } = await service
    .from('recommendations').select('fix_type, title').eq('website_id', websiteId);

  const existingTypes = (existingRecs || []).map((r) => r.fix_type);
  const existingTitles = (existingRecs || []).map((r) => r.title);
  
  const recommendationsToInsert: any[] = [];
  const hasSchema = (type: string) => crawl.schema_markup?.some((s: any) => s['@type'] === type);

  // ✅ Deduplicate check
  const addIfNew = (rec: any) => {
    if (!existingTitles.includes(rec.title)) {
      recommendationsToInsert.push(rec);
    }
  };

  // 1. FAQ Schema
  if (!hasSchema('FAQPage')) {
    addIfNew({
      website_id: websiteId, user_id: userId,
      title: 'Add FAQ Schema Markup',
      description: 'FAQ schema is the #1 most cited structured data by ChatGPT and Perplexity. Adding real customer questions with detailed answers dramatically increases your chances of being quoted in AI responses.',
      priority: 'high', impact_score: 9, effort_score: 2,
      fix_type: 'schema', estimated_gain: 18, status: 'pending',
    });
  }

  // 2. Organization Schema
  if (!hasSchema('Organization')) {
    addIfNew({
      website_id: websiteId, user_id: userId,
      title: 'Add Organization Schema',
      description: 'AI models use Organization schema to verify your brand identity. Without it, AI may confuse you with competitors or fail to recognize you as a legitimate business.',
      priority: 'high', impact_score: 8, effort_score: 2,
      fix_type: 'schema', estimated_gain: 14, status: 'pending',
    });
  }

  // 3. Product/Service Schema
  if (!hasSchema('Product') && !hasSchema('Service')) {
    addIfNew({
      website_id: websiteId, user_id: userId,
      title: 'Add Product/Service Schema',
      description: 'When users ask AI "what\'s the best tool for X?", models scan Product schema for reviews, ratings, and pricing. Without this, your products are invisible to AI recommendations.',
      priority: 'high', impact_score: 9, effort_score: 3,
      fix_type: 'schema', estimated_gain: 16, status: 'pending',
    });
  }

  // 4. Local Business Schema (if applicable)
  if (!hasSchema('LocalBusiness') && !hasSchema('Organization')) {
    addIfNew({
      website_id: websiteId, user_id: userId,
      title: 'Add Local Business Schema',
      description: 'For location-based queries, AI models prioritize businesses with LocalBusiness schema. This includes your address, hours, and contact info that AI can cite directly.',
      priority: 'high', impact_score: 7, effort_score: 2,
      fix_type: 'schema', estimated_gain: 12, status: 'pending',
    });
  }

  // 5. Breadcrumb Schema
  if (!hasSchema('BreadcrumbList')) {
    addIfNew({
      website_id: websiteId, user_id: userId,
      title: 'Add Breadcrumb Schema',
      description: 'Breadcrumb schema helps AI understand your site structure and content hierarchy. This improves how AI navigates and references your content.',
      priority: 'medium', impact_score: 5, effort_score: 1,
      fix_type: 'schema', estimated_gain: 6, status: 'pending',
    });
  }

  // 6. Comparison Content
  addIfNew({
    website_id: websiteId, user_id: userId,
    title: 'Create AI-Optimized Comparison Content',
    description: 'AI models frequently cite comparison pages when users ask for recommendations. A detailed comparison page with pros/cons and a feature matrix gives AI the exact data it needs to recommend your brand.',
    priority: 'high', impact_score: 8, effort_score: 4,
    fix_type: 'content', estimated_gain: 14, status: 'pending',
  });

  // 7. Meta Description
  if (!crawl.meta_description || crawl.meta_description.length < 60) {
    addIfNew({
      website_id: websiteId, user_id: userId,
      title: 'Write Compelling Meta Descriptions',
      description: 'AI models extract your meta description as the summary of what you do. A clear, keyword-rich 150-160 character description significantly improves how AI presents your brand.',
      priority: 'high', impact_score: 7, effort_score: 1,
      fix_type: 'content', estimated_gain: 10, status: 'pending',
    });
  }

  // 8. About Page
  addIfNew({
    website_id: websiteId, user_id: userId,
    title: 'Optimize Your About Page for AI',
    description: 'AI models pull brand information from About pages. A detailed About page with your mission, team, awards, and press mentions gives AI rich context to reference.',
    priority: 'medium', impact_score: 6, effort_score: 3,
    fix_type: 'content', estimated_gain: 8, status: 'pending',
  });

  // 9. Internal Linking
  if (!crawl.internal_links || crawl.internal_links.length < 15) {
    addIfNew({
      website_id: websiteId, user_id: userId,
      title: 'Improve Internal Linking Structure',
      description: 'Strong internal linking helps AI models understand the relationship between your pages. This improves content discovery and citation accuracy.',
      priority: 'medium', impact_score: 5, effort_score: 3,
      fix_type: 'link', estimated_gain: 7, status: 'pending',
    });
  }

  // ✅ Generate AI fix codes for schema recommendations
  const schemaRecs = recommendationsToInsert.filter(r => r.fix_type === 'schema');

  if (schemaRecs.length > 0) {
    try {
      const schemaTypes = schemaRecs.map(r => r.title).join(', ');

      const prompt = `You are a world-class GEO (Generative Engine Optimization) expert hired by ${brandName} (${domain}), a company in the "${category}" space.

Your task: Generate complete, production-ready JSON-LD schema markup that will help ${brandName} rank at the TOP of AI-generated answers in ChatGPT, Gemini, Claude, and Perplexity.

Required schema types: ${schemaTypes}

CRITICAL RULES FOR RANKING HIGH IN AI:
1. Use "${brandName}" as the name in ALL schema fields. NEVER use the domain.
2. Set "url" to "https://${domain}" in Organization schema.
3. FAQ Schema: Write 5 REALISTIC questions that buyers ACTUALLY ask. Each answer must be 2-3 sentences with SPECIFIC details. Include keywords naturally. This is the #1 schema for AI visibility.
4. Organization Schema: Include "sameAs" array with LinkedIn, Twitter, Crunchbase URLs using format "https://linkedin.com/company/brandname". Write a compelling 150-character description.
5. Product Schema: Include "aggregateRating" between 4.3-4.8, "reviewCount" between 100-500, and realistic "offers" with "price" and "priceCurrency": "USD".
6. LocalBusiness Schema: Include realistic address, telephone, openingHours if applicable.
7. BreadcrumbList Schema: Use 3-4 realistic breadcrumb items showing site hierarchy.
8. EVERY field must have REALISTIC, BELIEVABLE content. No placeholders like "example.com" or "your industry" or "lorem ipsum".
9. The description fields are the most important - they are what AI models quote verbatim.
10. Use keywords that potential customers actually search for.

Output ONLY a valid JSON object where each key is the EXACT recommendation title and each value is the COMPLETE HTML script tag.

Format:
{"Add FAQ Schema Markup": "<script type=\\"application/ld+json\\">{\\"@context\\":\\"https://schema.org\\",...}</script>"}

No markdown. No code fences. No explanations. Just the JSON.`;

      const aiResponse = await callOpenRouter(
        'anthropic/claude-3-haiku',
        'You are an expert GEO strategist. Generate production-ready JSON-LD schema markup that will help businesses rank #1 in AI-generated answers. Output only the requested JSON format.',
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
          rec.fix_code = generateFallbackCode(rec.title, brandName, domain, category);
          rec.fix_instructions = getFixInstructions(rec.title);
        }
      }
    } catch {
      for (const rec of schemaRecs) {
        rec.fix_code = generateFallbackCode(rec.title, brandName, domain, category);
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

function generateFallbackCode(title: string, brandName: string, domain: string, category: string): string {
  const brandSlug = brandName.toLowerCase().replace(/\s+/g, '-');

  if (title.includes('FAQ')) {
    return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What makes ${brandName} different from competitors?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "${brandName} stands out through innovative ${category} solutions, exceptional customer support, and a proven track record of helping businesses achieve measurable results."
      }
    },
    {
      "@type": "Question",
      "name": "How much does ${brandName} cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "${brandName} offers flexible pricing plans starting at competitive rates. Contact our team for a personalized quote tailored to your business needs and scale."
      }
    },
    {
      "@type": "Question",
      "name": "Does ${brandName} integrate with other tools?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, ${brandName} integrates with popular platforms and tools through native integrations and a robust API for custom workflows."
      }
    },
    {
      "@type": "Question",
      "name": "What kind of support does ${brandName} offer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "${brandName} provides dedicated support including live chat, email, and phone assistance. Enterprise plans include a dedicated account manager."
      }
    },
    {
      "@type": "Question",
      "name": "How do I get started with ${brandName}?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Getting started is easy. Visit https://${domain} to sign up for a free trial or schedule a demo with our team to see ${brandName} in action."
      }
    }
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
  "description": "${brandName} is a leading provider of ${category} solutions, helping businesses improve efficiency, reduce costs, and accelerate growth.",
  "sameAs": [
    "https://www.linkedin.com/company/${brandSlug}",
    "https://twitter.com/${brandSlug}",
    "https://www.crunchbase.com/organization/${brandSlug}"
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
  "description": "${brandName} provides comprehensive ${category} solutions designed to help businesses streamline operations and achieve their goals faster.",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "150"
  },
  "offers": {
    "@type": "Offer",
    "price": "49.00",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "url": "https://${domain}/pricing"
  }
}
</script>`;
  }

  if (title.includes('Local Business')) {
    return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "${brandName}",
  "url": "https://${domain}",
  "description": "${brandName} provides ${category} solutions.",
  "telephone": "+1-555-555-0100",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Business Ave",
    "addressLocality": "San Francisco",
    "addressRegion": "CA",
    "postalCode": "94105"
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "opens": "09:00",
    "closes": "18:00"
  }
}
</script>`;
  }

  if (title.includes('Breadcrumb')) {
    return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://${domain}"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "${category}",
      "item": "https://${domain}/${category.toLowerCase().replace(/\\s+/g, '-')}"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "About ${brandName}",
      "item": "https://${domain}/about"
    }
  ]
}
</script>`;
  }

  return '';
}

function getFixInstructions(title: string): string {
  if (title.includes('FAQ')) return '1. Copy the schema code\n2. Paste into the <head> section of your homepage\n3. Replace questions with your actual customer FAQs\n4. Keep answers 40-60 words with keywords\n5. Verify at search.google.com/test/rich-results';
  if (title.includes('Organization')) return '1. Copy the schema code\n2. Paste into the <head> of your homepage\n3. Replace sameAs URLs with your real social profiles\n4. Add your founding date and logo URL\n5. Verify at search.google.com/test/rich-results';
  if (title.includes('Product') || title.includes('Service')) return '1. Copy the schema code\n2. Paste into the <head> of product pages\n3. Update price, description, and ratings\n4. Add high-quality product images\n5. Verify at search.google.com/test/rich-results';
  if (title.includes('Local Business')) return '1. Copy the schema code\n2. Paste into the <head> of your homepage\n3. Update address, phone, and hours\n4. Add geo-coordinates for better local ranking\n5. Verify at search.google.com/test/rich-results';
  if (title.includes('Breadcrumb')) return '1. Copy the schema code\n2. Paste into the <head> of your homepage\n3. Update breadcrumb items to match your site structure\n4. Ensure URLs are correct and working\n5. Verify at search.google.com/test/rich-results';
  if (title.includes('Comparison')) return '1. Create a page: "[Brand] vs [Competitor]: Which is Better?"\n2. Add a feature comparison table with checkmarks\n3. List 5 unique advantages your brand offers\n4. Include real customer testimonials\n5. Update quarterly as competitors change';
  if (title.includes('Meta')) return '1. Write unique meta descriptions for each page\n2. Keep between 150-160 characters\n3. Include primary keyword and value proposition\n4. Add a call-to-action like "Learn more" or "Get started"\n5. Review and update monthly';
  if (title.includes('About')) return '1. Add a detailed About page if missing\n2. Include company mission, founding story, and team\n3. List awards, certifications, and press mentions\n4. Add customer logos and testimonials\n5. Keep content updated with latest achievements';
  if (title.includes('Internal')) return '1. Add contextual links between related pages\n2. Use descriptive anchor text (not "click here")\n3. Ensure important pages are within 3 clicks of homepage\n4. Create a clear site hierarchy with categories\n5. Fix any broken links using a link checker';
  return 'Follow the steps to implement this recommendation.';
}