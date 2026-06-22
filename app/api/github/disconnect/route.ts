import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { website_id } = await req.json();
  const service = createServiceClient();
  await service.from('websites').update({ github_token_encrypted: null, github_repo: null }).eq('id', website_id).eq('user_id', user.id);

  return NextResponse.json({ success: true });
}