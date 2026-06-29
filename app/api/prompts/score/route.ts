import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const websiteId = req.nextUrl.searchParams.get('website_id');
  const promptText = req.nextUrl.searchParams.get('prompt_text');
  if (!websiteId || !promptText) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  // Find the latest audit that used this prompt
  const { data: audit } = await supabase
    .from('audits')
    .select('id, visibility_score')
    .eq('website_id', websiteId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  let mentions: any[] = [];
  if (audit) {
    const { data } = await supabase.from('mentions').select('*').eq('audit_id', audit.id);
    mentions = data || [];
  }

  return NextResponse.json({ score: audit?.visibility_score || 0, mentions });
}