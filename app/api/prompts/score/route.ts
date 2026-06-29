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

  // Find audits that used this exact prompt (mentions have prompt_text field)
  const { data: mentions } = await supabase
    .from('mentions')
    .select('audit_id')
    .eq('website_id', websiteId)
    .eq('prompt_text', promptText)
    .order('created_at', { ascending: false })
    .limit(1);

  let score = 0;
  let allMentions: any[] = [];

  if (mentions && mentions.length > 0) {
    const auditId = mentions[0].audit_id;

    // Get the audit score
    const { data: audit } = await supabase
      .from('audits')
      .select('visibility_score')
      .eq('id', auditId)
      .single();

    score = audit?.visibility_score || 0;

    // Get all mentions for this audit
    const { data: mentionData } = await supabase
      .from('mentions')
      .select('*')
      .eq('audit_id', auditId);
    allMentions = mentionData || [];
  }

  return NextResponse.json({ score, mentions: allMentions });
}