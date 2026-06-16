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
  const { error } = await service
    .from('profiles')
    .update({ queries_used: 0 })
    .neq('plan', 'free'); // resets all non‑free; free users reset automatically by their own 30‑day cycle
  if (error) {
    console.error('Error resetting queries:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Queries reset for all users' });
}
