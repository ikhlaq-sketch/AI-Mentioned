import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  const hmac = crypto.createHmac(
    'sha256',
    process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!
  );
  const digest = hmac.update(rawBody).digest('hex');

  if (signature !== digest) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const service = createServiceClient();

  try {
    const eventName = event.meta.event_name;

    if (
      eventName === 'subscription_created' ||
      eventName === 'subscription_updated'
    ) {
      const attributes = event.data.attributes;
      const userId = event.meta.custom_data.user_id;
      const variantId = attributes.variant_id;

      const plan = mapVariantToPlan(variantId);
      if (!plan)
        return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });

      const limits = getPlanLimits(plan);

      await service
        .from('profiles')
        .update({
          plan,
          sites_limit: limits.sites,
          queries_limit: limits.queries,
          lemon_squeezy_customer_id: attributes.customer_id,
          lemon_squeezy_subscription_id: attributes.id,
          subscription_status: 'active',
        })
        .eq('id', userId);
    } else if (eventName === 'subscription_cancelled') {
      const userId = event.meta.custom_data.user_id;
      await service
        .from('profiles')
        .update({
          plan: 'free',
          sites_limit: 1,
          queries_limit: 100,
          subscription_status: 'cancelled',
        })
        .eq('id', userId);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function mapVariantToPlan(variantId: string): string | null {
  const {
    LEMON_SQUEEZY_STARTER_VARIANT_ID: STARTER,
    LEMON_SQUEEZY_GROWTH_VARIANT_ID: GROWTH,
    LEMON_SQUEEZY_SCALE_VARIANT_ID: SCALE,
    LEMON_SQUEEZY_AGENCY_PRO_VARIANT_ID: AGENCY_PRO,
  } = process.env as Record<string, string>;

  if (variantId === STARTER) return 'starter';
  if (variantId === GROWTH) return 'growth';
  if (variantId === SCALE) return 'scale';
  if (variantId === AGENCY_PRO) return 'agency_pro';
  return null;
}

function getPlanLimits(plan: string) {
  switch (plan) {
    case 'starter':
      return { sites: 1, queries: 100 };
    case 'growth':
      return { sites: 5, queries: 500 };
    case 'scale':
      return { sites: 10, queries: 1000 };
    case 'agency_pro':
      return { sites: 20, queries: 2000 };
    default:
      return { sites: 1, queries: 100 };
  }
}
