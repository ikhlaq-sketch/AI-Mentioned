import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { price_id } = await req.json();
    if (!price_id) {
      return NextResponse.json({ error: 'Missing price_id' }, { status: 400 });
    }

    const apiKey = process.env.PADDLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const response = await fetch('https://api.paddle.com/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ price_id, quantity: 1 }],
        customer: {
          email: user.email,
        },
        custom_data: {
          user_id: user.id,
        },
        settings: {
          allow_coupons: false,
        },
      }),
    });

    const json = await response.json();

    if (!response.ok) {
      console.error('Paddle checkout error:', json);
      return NextResponse.json({ error: json.error?.detail || 'Checkout failed' }, { status: 500 });
    }

    return NextResponse.json({ url: json.data?.checkout_url || json.data?.url });
  } catch (err: any) {
    console.error('Fatal checkout error:', err.message);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}