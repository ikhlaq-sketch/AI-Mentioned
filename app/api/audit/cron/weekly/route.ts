import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { runAudit } from '@/lib/audit/audit-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createServiceClient();
  const now = new Date().toISOString();

  const { data: websites, error } = await service
    .from('websites')
    .select('*')
    .eq('status', 'active')
    .or(`next_audit_at.is.null,next_audit_at.lte.${now}`);

  if (error) {
    console.error('Error fetching websites for weekly cron:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  let processed = 0;
  for (const site of websites || []) {
    try {
      await runAudit(site.id, site.user_id, 'weekly');
      processed++;
    } catch (err: any) {
      console.error(`Weekly audit failed for site ${site.id}:`, err.message);
    }
  }

  return NextResponse.json({ sites_processed: processed });
}
