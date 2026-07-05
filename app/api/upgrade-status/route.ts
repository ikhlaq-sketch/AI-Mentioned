import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Force dynamic and bypass cache entirely
export const dynamic = 'force-dynamic';
export const revalidate = 0; 

export async function GET(req: Request) {
  const service = createServiceClient();
  
  const { data: { user } } = await service.auth.getUser();
  if (!user) return NextResponse.json({ ready: false }, { status: 401 });

  // Add a cache-busting timestamp or logic if needed, 
  // but 'revalidate = 0' should suffice for Next.js 14.
  const { count } = await service
    .from('prompts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const isReady = count !== null && count >= 13;

  return NextResponse.json({ ready: isReady });
}