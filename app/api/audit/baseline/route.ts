import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { runAudit } from '@/lib/audit/audit-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { website_id } = await req.json();
  if (!website_id) {
    return NextResponse.json({ error: 'Missing website_id' }, { status: 400 });
  }

  try {
    const result = await runAudit(website_id, session.user.id, 'baseline');
    return NextResponse.json(result);
  } catch (err: any) {
    if (err.message === 'Query limit exceeded') {
      return NextResponse.json(
        { error: 'Query limit exceeded', reset_date: err.resetDate },
        { status: 429 }
      );
    }
    console.error('Baseline audit error:', err);
    return NextResponse.json(
      { error: err.message || 'Audit failed' },
      { status: 500 }
    );
  }
}
