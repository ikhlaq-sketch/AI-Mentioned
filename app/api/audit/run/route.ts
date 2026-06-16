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

  const { website_id, audit_type } = await req.json();

  if (!website_id || !audit_type) {
    return NextResponse.json(
      { error: 'Missing website_id or audit_type' },
      { status: 400 }
    );
  }

  // Validate audit type
  const validTypes = ['manual', 'weekly', 'daily', 'baseline'];
  if (!validTypes.includes(audit_type)) {
    return NextResponse.json({ error: 'Invalid audit type' }, { status: 400 });
  }

  try {
    const result = await runAudit(website_id, session.user.id, audit_type);
    return NextResponse.json(result);
  } catch (err: any) {
    if (err.message === 'Query limit exceeded') {
      return NextResponse.json(
        { error: 'Query limit exceeded', reset_date: err.resetDate },
        { status: 429 }
      );
    }
    console.error('Audit error:', err);
    return NextResponse.json(
      { error: err.message || 'Audit failed' },
      { status: 500 }
    );
  }
}
