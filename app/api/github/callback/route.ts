import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { encryptToken } from '@/lib/github/encryption';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');

  if (!code || !stateParam) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/sites?github_error=invalid_request`);
  }

  let state: { websiteId: string; userId: string };
  try {
    state = JSON.parse(decodeURIComponent(stateParam));
  } catch {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/sites?github_error=invalid_state`);
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/sites?github_error=auth_failed`);
  }

  const encrypted = encryptToken(tokenData.access_token);
  const service = createServiceClient();

  await service.from('websites').update({ github_token_encrypted: encrypted }).eq('id', state.websiteId).eq('user_id', state.userId);

  // ✅ Redirect to site detail with repo picker flag
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/sites/${state.websiteId}?github_connected=true&select_repo=true`
  );
}