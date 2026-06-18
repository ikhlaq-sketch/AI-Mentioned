import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Read token from Authorization header
    const authHeader = req.headers.get('authorization');
    console.log("Auth header present:", !!authHeader);

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - no token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // Verify token and get user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log("User auth success:", !!user, "Error:", authError?.message);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized - invalid token' }, { status: 401 });
    }

    const { variant_id } = await req.json();
    console.log("Variant ID:", variant_id);

    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;

    console.log("Store ID exists:", !!storeId, "API Key exists:", !!apiKey);

    if (!storeId || !apiKey) {
      console.error("Missing env vars - STORE_ID:", !!storeId, "API_KEY:", !!apiKey);
      return NextResponse.json(
        { error: 'Server configuration error - missing API keys' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: user.email,
              custom: { user_id: user.id },
            },
          },
          relationships: {
            store: {
              data: { type: 'stores', id: storeId.toString() },
            },
            variant: {
              data: { type: 'variants', id: variant_id.toString() },
            },
          },
        },
      }),
    });

    const json = await response.json();
    console.log("Lemon Squeezy response status:", response.status);

    if (!response.ok || json.errors) {
      console.error("Lemon Squeezy error:", JSON.stringify(json.errors));
      return NextResponse.json(
        { error: json.errors?.[0]?.detail || 'Lemon Squeezy API error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: json.data.attributes.url });
  } catch (err: any) {
    console.error("Fatal checkout error:", err.message, err.stack);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}