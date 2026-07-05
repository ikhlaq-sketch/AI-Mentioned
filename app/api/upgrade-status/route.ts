import { NextResponse } from 'next/server';
// 1. IMPORT THE CORRECT CLIENT (The same one your dashboard uses)
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    // 2. USE THE CORRECT CLIENT
    const supabase = createServerSupabase();
    
    // 3. Get the user from the browser cookies
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("[Status API] Auth Error:", authError);
      return NextResponse.json({ ready: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 4. Check if the prompts are finished generating
    const { count, error } = await supabase
      .from('prompts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (error) {
      console.error("[Status API] DB error:", error);
      return NextResponse.json({ ready: false }, { status: 500 });
    }

    const isReady = count !== null && count >= 13;
    
    return NextResponse.json({ ready: isReady });
    
  } catch (err) {
    console.error("[Status API] Critical failure:", err);
    return NextResponse.json({ ready: false }, { status: 500 });
  }
}