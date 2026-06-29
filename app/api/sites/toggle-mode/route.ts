import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { website_id, scan_mode } = await req.json();
  if (!website_id || !scan_mode) return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  if (!['auto', 'manual'].includes(scan_mode)) return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });

  const service = createServiceClient();
  const { error } = await service.from('websites').update({ scan_mode }).eq('id', website_id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}