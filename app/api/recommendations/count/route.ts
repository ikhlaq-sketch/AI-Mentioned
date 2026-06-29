import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const websiteId = req.nextUrl.searchParams.get('website_id');
  if (!websiteId) return NextResponse.json({ error: 'Missing website_id' }, { status: 400 });

  const service = createServiceClient();
  const { count } = await service.from('recommendations').select('*', { count: 'exact', head: true }).eq('website_id', websiteId);

  return NextResponse.json({ count: count || 0 });
}