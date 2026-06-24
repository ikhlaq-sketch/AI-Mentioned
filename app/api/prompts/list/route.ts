import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const websiteId = req.nextUrl.searchParams.get('website_id');
  if (!websiteId) return NextResponse.json({ error: 'Missing website_id' }, { status: 400 });

  const { data } = await supabase.from('prompts').select('*').eq('website_id', websiteId).order('created_at', { ascending: false });
  return NextResponse.json(data || []);
}