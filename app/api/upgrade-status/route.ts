import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const supabase = createServerSupabase();
    
    // 1. Get user from cookies
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ ready: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check if the 13 prompts have been generated
    const { count: promptCount } = await supabase
      .from('prompts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // 3. Check if there are ANY currently running audits
    const { count: runningCount } = await supabase
      .from('audits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'running');

    // 4. Check if there is at least one completed audit 
    // (Since the webhook wipes the fake ones, this means the REAL one finished)
    const { count: completedCount } = await supabase
      .from('audits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed');

    // THE MAGIC LOGIC:
    // The process is ONLY fully finished when ALL 3 of these are true:
    // - 1. We have the 13+ prompts
    // - 2. There are exactly 0 audits stuck in the 'running' state
    // - 3. We have at least 1 successfully 'completed' audit
    const hasPrompts = promptCount !== null && promptCount >= 13;
    const isAuditFinished = (runningCount === 0) && (completedCount !== null && completedCount > 0);

    const isReady = hasPrompts && isAuditFinished;
    
    return NextResponse.json({ ready: isReady });
    
  } catch (err) {
    console.error("[Status API] Critical failure:", err);
    return NextResponse.json({ ready: false }, { status: 500 });
  }
}