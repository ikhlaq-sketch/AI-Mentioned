import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabase();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Auth Error:", authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { variant_id } = await req.json();
    if (!variant_id) {
      return NextResponse.json({ error: 'Missing variant_id' }, { status: 400 });
    }

    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;

    if (!storeId || !apiKey) {
      throw new Error("Missing LEMON_SQUEEZY_STORE_ID or LEMON_SQUEEZY_API_KEY in .env");
    }

    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      // ✅ FIX: Restructured the body to match Lemon Squeezy's strict JSON:API format
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: user.email,
              custom: {
                user_id: user.id,
              },
            },
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: storeId.toString(),
              },
            },
            variant: {
              data: {
                type: 'variants',
                id: variant_id.toString(),
              },
            },
          },
        },
      }),
    });

    const json = await response.json();

    if (!response.ok || json.errors) {
      console.log("Lemon Squeezy Error Response:", JSON.stringify(json, null, 2));
      throw new Error(json.errors?.[0]?.detail || json.message || 'Invalid response from Lemon Squeezy');
    }

    if (!json.data || !json.data.attributes) {
      throw new Error('Missing data attributes in Lemon Squeezy response');
    }

    return NextResponse.json({ url: json.data.attributes.url });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}