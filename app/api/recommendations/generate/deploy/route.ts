import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { recommendation_id, website_id } = await req.json();
  if (!recommendation_id || !website_id) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

  const service = createServiceClient();
  const { error } = await service
    .from('recommendations')
    .update({ status: 'deployed' })
    .eq('id', recommendation_id)
    .eq('website_id', website_id)
    .eq('user_id', user.id);
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}