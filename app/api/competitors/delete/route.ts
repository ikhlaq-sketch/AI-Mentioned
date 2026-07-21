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

  const { competitor_id } = await req.json();
  
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

    // 3. Delete the competitor
    const { error } = await supabase
      .from('competitors')
      .delete()
      .eq('id', competitor_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Delete competitor error:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete competitor' }, { status: 500 });
  }
}