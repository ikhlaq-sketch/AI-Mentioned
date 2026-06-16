import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceClient } from '@/lib/supabase/server';
import { crawlWebsite } from '@/lib/crawler/web-crawler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { website_id } = await req.json();

  if (!website_id) {
    return NextResponse.json({ error: 'Missing website_id' }, { status: 400 });
  }

  // Verify website ownership
  const service = createServiceClient();
  const { data: website, error } = await service
    .from('websites')
    .select('*')
    .eq('id', website_id)
    .eq('user_id', session.user.id)
    .single();

  if (error || !website) {
    return NextResponse.json({ error: 'Website not found' }, { status: 404 });
  }

  try {
    const result = await crawlWebsite(website);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Crawl error:', err);
    return NextResponse.json(
      { error: err.message || 'Crawl failed' },
      { status: 500 }
    );
  }
}
