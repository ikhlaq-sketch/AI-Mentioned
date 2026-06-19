import * as cheerio from 'cheerio';
import { createServiceClient } from '@/lib/supabase/server';
import { callOpenRouter } from '@/lib/audit/query-engine';

export async function crawlWebsite(website: any) {
  const service = createServiceClient();
  const domain = website.domain;
  try {
    const response = await fetch(`https://${domain}`, {
      headers: { 'User-Agent': 'AIMentioned Bot 1.0 (+aimentioned.com)' },
    });
    const html = await response.text();
    if (html.length < 500) return await deepSearchFallback(website, service, domain);

    const $ = cheerio.load(html);
    const pageTitle = $('title').first().text().trim();
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const h1s = $('h1').map((_, el) => $(el).text().trim()).get();
    const h2s = $('h2').map((_, el) => $(el).text().trim()).get();
    const schemas = $('script[type="application/ld+json"]').map((_, el) => {
      try { return JSON.parse($(el).html() || ''); } catch { return null; }
    }).get().filter(Boolean);

    await service.from('crawl_data').insert({
      website_id: website.id, user_id: website.user_id,
      page_title: pageTitle, meta_description: metaDesc,
      h1_headings: h1s, h2_headings: h2s,
      schema_markup: schemas, crawl_method: 'standard',
    });
    await service.from('websites').update({ status: 'active', last_crawled_at: new Date().toISOString() }).eq('id', website.id);
    return { success: true, crawl_method: 'standard', pages_found: 1 };
  } catch {
    return await deepSearchFallback(website, service, domain);
  }
}

async function deepSearchFallback(website: any, service: any, domain: string, existingData?: any) {
  try {
    const aiResponse = await callOpenRouter('gemini-2.0-flash',
      'Extract all publicly available information about this website.',
      `Website domain: ${domain}. Extract: company name, description, main products or services.`
    );
    await service.from('crawl_data').insert({
      website_id: website.id, user_id: website.user_id,
      crawl_method: 'deep_search', products_services: [aiResponse],
    });
    await service.rpc('increment_queries', { uid: website.user_id, count: 1 });
  } catch (err) {
    console.error('Deep search failed:', err);
  }
  await service.from('websites').update({ status: 'active', last_crawled_at: new Date().toISOString() }).eq('id', website.id);
  return { success: true, crawl_method: 'deep_search', pages_found: 1 };
}