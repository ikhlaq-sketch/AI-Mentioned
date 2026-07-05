import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const service = createServiceClient();
  
  // Get user session
  const { data: { user } } = await service.auth.getUser();
  if (!user) return NextResponse.json({ ready: false }, { status: 401 });

  // Count the prompts for this user's websites
  const { count } = await service
    .from('prompts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // If the user has 13 or more prompts, the AI generation is fully complete!
  const isReady = count !== null && count >= 13;

  return NextResponse.json({ ready: isReady });
}