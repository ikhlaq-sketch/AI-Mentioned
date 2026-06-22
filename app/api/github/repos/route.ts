import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceClient } from '@/lib/supabase/server';
import { decryptToken } from '@/lib/github/encryption';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const websiteId = req.nextUrl.searchParams.get('website_id');
  if (!websiteId) return NextResponse.json({ error: 'Missing website_id' }, { status: 400 });

  const service = createServiceClient();
  const { data: website } = await service.from('websites').select('github_token_encrypted').eq('id', websiteId).single();
  if (!website?.github_token_encrypted) return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 });

  const token = decryptToken(website.github_token_encrypted);
  const res = await fetch('https://api.github.com/user/repos?per_page=50&sort=updated', {
    headers: { Authorization: `token ${token}` },
  });
  const repos = await res.json();

  return NextResponse.json(repos.map((r: any) => ({ name: r.full_name, default_branch: r.default_branch })));
}