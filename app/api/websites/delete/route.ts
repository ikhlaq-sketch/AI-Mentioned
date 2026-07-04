import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabase();
    
    // 1. Authenticate User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { website_id } = await req.json();
    if (!website_id) {
      return NextResponse.json({ error: 'Missing website_id' }, { status: 400 });
    }

    // 2. Fetch the specific website to verify ownership and creation date
    const { data: site, error: siteError } = await supabase
      .from('websites')
      .select('created_at, user_id')
      .eq('id', website_id)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    if (site.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. THE ANTI-ABUSE TIME LOCK (72 Hours)
    // Prevents users from deleting a site immediately after adding it to save API queries.
    const hoursSinceCreation = (new Date().getTime() - new Date(site.created_at).getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceCreation < 72) {
      const remainingHours = Math.ceil(72 - hoursSinceCreation);
      return NextResponse.json(
        { error: `Anti-abuse lock: Newly added websites cannot be deleted immediately. Please wait ${remainingHours} more hours to delete this site, or upgrade your plan to add more slots.` }, 
        { status: 403 }
      );
    }

    // 4. Proceed with safe deletion
    const { error: deleteError } = await supabase
      .from('websites')
      .delete()
      .eq('id', website_id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true, message: 'Website deleted successfully' });

  } catch (err: any) {
    console.error('Delete website error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}