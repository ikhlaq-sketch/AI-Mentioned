import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { runAudit } from '@/lib/audit/audit-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  console.log('[v0] Baseline audit API called');

  const supabase = createServerSupabase();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('[v0] Baseline auth error:', authError?.message);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log(`[v0] Baseline auth OK: user=${user.id}, email=${user.email}`);

  const { website_id } = await req.json();
  if (!website_id) {
    console.error('[v0] Missing website_id');
    return NextResponse.json({ error: 'Missing website_id' }, { status: 400 });
  }
  console.log(`[v0] Baseline website_id: ${website_id}`);

  try {
    console.log('[v0] Calling runAudit...');
    const result = await runAudit(website_id, user.id, 'baseline');
    console.log(`[v0] Baseline audit SUCCESS: score=${result.score}, audit_id=${result.audit_id}`);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[v0] Baseline audit ERROR:', err.message, err.stack);
    if (err.message === 'Query limit exceeded') {
      return NextResponse.json(
        { error: 'Query limit exceeded', reset_date: err.resetDate },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: err.message || 'Audit failed' },
      { status: 500 }
    );
  }
}