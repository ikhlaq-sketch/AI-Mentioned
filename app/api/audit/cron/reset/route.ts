import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createServiceClient();
  const now = new Date().toISOString();

  // ✅ Only reset users whose reset date has passed
  const { data: users, error: fetchErr } = await service
    .from('profiles')
    .select('id, queries_reset_at')
    .lte('queries_reset_at', now);

  if (fetchErr) {
    console.error('Error fetching users for reset:', fetchErr);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  let resetCount = 0;
  for (const user of users || []) {
    const { error: updateErr } = await service
      .from('profiles')
      .update({
        queries_used: 0,
        queries_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Next reset in 30 days
      })
      .eq('id', user.id);

    if (!updateErr) resetCount++;
  }

  console.log(`[v0] Reset ${resetCount} users' queries. Next reset in 30 days.`);

  return NextResponse.json({ users_reset: resetCount });
}