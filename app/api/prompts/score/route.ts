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
  const allPrompts = req.nextUrl.searchParams.get('all') === 'true';

  if (!websiteId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  // ✅ Single call: return all prompt scores at once
  if (allPrompts) {
    const { data: audits } = await supabase
      .from('audits')
      .select('id, visibility_score, created_at')
      .eq('website_id', websiteId)
      .order('created_at', { ascending: false })
      .limit(30);

    const { data: allMentions } = await supabase
      .from('mentions')
      .select('audit_id, prompt_text, entity_name, entity_type, was_mentioned, created_at')
      .eq('website_id', websiteId)
      .in('audit_id', (audits || []).map(a => a.id));

    // Group scores by prompt
    const promptData: Record<string, { score: number; lastUsed: string }> = {};
    for (const audit of (audits || [])) {
      const auditMentions = (allMentions || []).filter(m => m.audit_id === audit.id);
      const promptsInAudit = [...new Set(auditMentions.map(m => m.prompt_text))];
      for (const prompt of promptsInAudit) {
        if (!promptData[prompt] || new Date(audit.created_at) > new Date(promptData[prompt].lastUsed)) {
          promptData[prompt] = { score: audit.visibility_score, lastUsed: audit.created_at };
        }
      }
    }

    return NextResponse.json({ prompts: promptData });
  }

  // Single prompt lookup (existing)
  if (!promptText) return NextResponse.json({ error: 'Missing prompt_text' }, { status: 400 });

  const { data: mentions } = await supabase
    .from('mentions')
    .select('audit_id')
    .eq('website_id', websiteId)
    .eq('prompt_text', promptText)
    .order('created_at', { ascending: false })
    .limit(1);

  let score = 0;
  let allMentionsData: any[] = [];

  if (mentions && mentions.length > 0) {
    const { data: audit } = await supabase.from('audits').select('visibility_score').eq('id', mentions[0].audit_id).single();
    score = audit?.visibility_score || 0;
    const { data: mentionData } = await supabase.from('mentions').select('*').eq('audit_id', mentions[0].audit_id);
    allMentionsData = mentionData || [];
  }

  return NextResponse.json({ score, mentions: allMentionsData });
}