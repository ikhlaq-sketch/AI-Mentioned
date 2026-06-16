import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

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

  // Fetch the user's Lemon Squeezy customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('lemon_squeezy_customer_id')
    .eq('id', session.user.id)
    .single();

  if (!profile?.lemon_squeezy_customer_id) {
    return NextResponse.json(
      { error: 'No active subscription' },
      { status: 400 }
    );
  }

  try {
    // Create a customer portal session
    const response = await fetch('https://api.lemonsqueezy.com/v1/customers/portal-sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'portal-sessions',
          attributes: {
            customer_id: profile.lemon_squeezy_customer_id,
          },
        },
      }),
    });

    const json = await response.json();
    const portalUrl = json.data?.attributes?.url;

    if (!portalUrl) {
      throw new Error('Failed to generate portal URL');
    }

    return NextResponse.json({ url: portalUrl });
  } catch (err: any) {
    console.error('Portal error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}