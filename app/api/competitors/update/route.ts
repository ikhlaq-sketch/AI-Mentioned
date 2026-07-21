import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { competitor_id, domain, brand_name } = await req.json();
  
  if (!competitor_id) {
    return NextResponse.json({ error: 'Missing competitor_id' }, { status: 400 });
  }

  try {
    // 1. Get competitor's website_id
    const { data: competitor, error: compErr } = await supabase
      .from('competitors')
      .select('website_id')
      .eq('id', competitor_id)
      .single();

    if (compErr || !competitor) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
    }

    // 2. Verify the website belongs to the authenticated user
    const { data: website, error: webErr } = await supabase
      .from('websites')
      .select('user_id')
      .eq('id', competitor.website_id)
      .single();

    if (webErr || website?.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 3. Update the competitor
    const updateData: any = {};
    if (domain !== undefined) updateData.domain = domain;
    if (brand_name !== undefined) updateData.brand_name = brand_name;

    const { data, error } = await supabase
      .from('competitors')
      .update(updateData)
      .eq('id', competitor_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, competitor: data });
  } catch (err: any) {
    console.error('Update competitor error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update competitor' }, { status: 500 });
  }
}