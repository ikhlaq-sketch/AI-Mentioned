import * as cheerio from 'cheerio';
import { createServiceClient } from '@/lib/supabase/server';
import { callOpenRouter } from '@/lib/audit/query-engine';

export async function crawlWebsite(website: any) {
  const service = createServiceClient();
  const domain = website.domain;
  let crawlMethod = 'standard';
  let needsAIFallback = false;
  let aiFallbackUsed = false;

  let pageTitle = '';
  let metaDesc = '';
  let h1s: string[] = [];
  let h2s: string[] = [];
  let schemas: any[] = [];
  let faqs: any[] = [];
  let internalLinks: string[] = [];
  let organizationName = '';
  let productsServices: any[] = [];

  try {
    await fetch(`https://${domain}/robots.txt`, {
      headers: { 'User-Agent': 'Sightura Bot 1.0 (+Sightura.com)' },
    }).catch(() => {});
    await fetch(`https://${domain}/sitemap.xml`, {
      headers: { 'User-Agent': 'Sightura Bot 1.0 (+Sightura.com)' },
    }).catch(() => {});
  } catch {}

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(`https://${domain}`, {
      headers: { 'User-Agent': 'Sightura Bot 1.0 (+Sightura.com)' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      needsAIFallback = true;
    } else {
      const html = await response.text();
      if (html.length < 500) {
        needsAIFallback = true;
      } else {
        const $ = cheerio.load(html);
        pageTitle = $('title').first().text().trim();
        metaDesc = $('meta[name="description"]').attr('content') || '';
        h1s = $('h1').map((_, el) => $(el).text().trim()).get().filter(Boolean);
        h2s = $('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean);
        schemas = $('script[type="application/ld+json"]').map((_, el) => {
          try { return JSON.parse($(el).html() || ''); } catch { return null; }
        }).get().filter(Boolean);

        $('script[type="application/ld+json"]').each((_, el) => {
          try {
            const data = JSON.parse($(el).html() || '');
            if (data['@type'] === 'FAQPage' && data.mainEntity) {
              data.mainEntity.forEach((item: any) => {
                faqs.push({ question: item.name || '', answer: item.acceptedAnswer?.text || '' });
              });
            }
            if (data['@type'] === 'Organization' && data.name) {
              organizationName = data.name;
            }
          } catch {}
        });

        internalLinks = $('a[href]').map((_, el) => $(el).attr('href')).get()
          .filter((href): href is string => !!href && (href.startsWith('/') || href.includes(domain)))
          .slice(0, 30);

        if (h1s.length === 0 && h2s.length === 0) needsAIFallback = true;
        else if (!metaDesc || metaDesc.length === 0) needsAIFallback = true;
      }
    }
  } catch {
    needsAIFallback = true;
  }

  if (needsAIFallback) {
    try {
      const prompt = `Analyze "${domain}" and extract: company name, description, products/services. Return JSON: {"companyName":"...", "description":"...", "productsServices":[...]}`;
      const aiResponse = await callOpenRouter(
        'google/gemini-2.5-flash-lite',
        'You are a business analyst.',
        prompt
      );
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          organizationName = parsed.companyName || domain;
          metaDesc = parsed.description || '';
          productsServices = parsed.productsServices || [];
        }
      } catch {
        organizationName = domain;
        metaDesc = aiResponse.substring(0, 200);
      }
      crawlMethod = 'deep_search';
      aiFallbackUsed = true;
      await service.rpc('increment_queries', { uid: website.user_id, count: 1 });
    } catch (err: any) {
      console.error('Deep search failed:', err);
    }
  }

  const { error: crawlSaveError } = await service.from('crawl_data').insert({
    website_id: website.id, user_id: website.user_id,
    page_title: pageTitle || organizationName || domain,
    meta_description: metaDesc, h1_headings: h1s, h2_headings: h2s,
    schema_markup: schemas.length > 0 ? schemas : null,
    faqs: faqs.length > 0 ? faqs : null,
    internal_links: internalLinks,
    organization_name: organizationName || domain,
    products_services: productsServices.length > 0 ? productsServices : null,
    crawl_method: crawlMethod, crawled_at: new Date().toISOString(),
  });

  if (crawlSaveError) console.error('[v0] Crawl save error:', crawlSaveError);

  await service.from('websites').update({
    status: 'active', last_crawled_at: new Date().toISOString(),
  }).eq('id', website.id);

  return { success: true, crawl_method: crawlMethod, ai_fallback_used: aiFallbackUsed, pages_found: 1 };
}