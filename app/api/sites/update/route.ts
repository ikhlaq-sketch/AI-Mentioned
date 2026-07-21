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

  const { website_id, domain, brand_name, category, scan_mode } = await req.json();
  
  if (!website_id) {
    return NextResponse.json({ error: 'Missing website_id' }, { status: 400 });
  }

  try {
    // Verify the user owns this website
    const { data: site, error: siteCheck } = await supabase
      .from('websites')
      .select('user_id')
      .eq('id', website_id)
      .single();

    if (siteCheck || site?.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Build update object (only include fields that are provided)
    const updateData: any = {};
    if (domain !== undefined) updateData.domain = domain;
    if (brand_name !== undefined) updateData.brand_name = brand_name;
    if (category !== undefined) updateData.category = category;
    if (scan_mode !== undefined) updateData.scan_mode = scan_mode;

    // Update the website
    const { data, error } = await supabase
      .from('websites')
      .update(updateData)
      .eq('id', website_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, site: data });
  } catch (err: any) {
    console.error('Update site error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update site' }, { status: 500 });
  }
}