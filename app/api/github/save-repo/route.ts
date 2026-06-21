import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { website_id, repo } = await req.json();
  if (!website_id || !repo) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

  const service = createServiceClient();
  const { error } = await service
    .from('websites')
    .update({ github_repo: repo })
    .eq('id', website_id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}