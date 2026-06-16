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

  const { variant_id } = await req.json();
  if (!variant_id) {
    return NextResponse.json({ error: 'Missing variant_id' }, { status: 400 });
  }

  try {
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            store_id: parseInt(process.env.LEMON_SQUEEZY_STORE_ID!, 10),
            variant_id: parseInt(variant_id, 10),
            checkout_data: {
              email: session.user.email,
              custom: {
                user_id: session.user.id,
              },
            },
          },
        },
      }),
    });

    const json = await response.json();
    if (!json.data || !json.data.attributes) {
      throw new Error('Invalid response from Lemon Squeezy');
    }

    return NextResponse.json({ url: json.data.attributes.url });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
