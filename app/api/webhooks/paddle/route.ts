import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { runAudit } from '@/lib/audit/audit-engine';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('paddle-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  // Verify Paddle webhook signature
  const ts = signature.split(';')[0]?.split('=')[1];
  const h1 = signature.split(';')[1]?.split('=')[1];

  if (!ts || !h1) {
    return NextResponse.json({ error: 'Invalid signature format' }, { status: 401 });
  }

  const payload = `${ts}:${rawBody}`;
  const hmac = crypto.createHmac('sha256', process.env.PADDLE_WEBHOOK_SECRET!);
  const computed = hmac.update(payload).digest('hex');

  if (h1 !== computed) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const service = createServiceClient();

  try {
    const eventType = event.event_type;
    const eventData = event.data;

    if (
      eventType === 'subscription.created' ||
      eventType === 'subscription.updated' ||
      eventType === 'subscription.activated'
    ) {
      const customData = eventData.custom_data || {};
      const userId = customData.user_id;

      if (!userId) {
        console.error('Missing user_id in custom_data');
        return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
      }

      const priceId = eventData.items?.[0]?.price_id;
      if (!priceId) {
        console.error('Missing price_id');
        return NextResponse.json({ error: 'Missing price_id' }, { status: 400 });
      }

      const plan = mapPriceToPlan(priceId);
      if (!plan) {
        console.error('Unknown price:', priceId);
        return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });
      }

      const limits = getPlanLimits(plan);

      // Check if user was previously on free plan
      const { data: oldProfile } = await service.from('profiles').select('plan').eq('id', userId).single();
      const wasFreePlan = !oldProfile?.plan || oldProfile.plan === 'free';

      // Update profile
      await service
        .from('profiles')
        .update({
          plan,
          sites_limit: limits.sites,
          queries_limit: limits.queries,
          paddle_customer_id: eventData.customer_id,
          paddle_subscription_id: eventData.id,
          subscription_status: 'active',
        })
        .eq('id', userId);

      console.log(`✅ User ${userId} upgraded to ${plan}`);

      // Re-audit if upgrading from free
      if (wasFreePlan) {
        console.log(`[v0] User was on free plan — re-auditing all websites`);
        const { data: websites } = await service.from('websites').select('id').eq('user_id', userId);

        if (websites && websites.length > 0) {
          for (const site of websites) {
            try {
              await service.from('mentions').delete().eq('website_id', site.id);
              await service.from('audits').delete().eq('website_id', site.id);
              await service.from('recommendations').delete().eq('website_id', site.id);
              await runAudit(site.id, userId, 'baseline');
              console.log(`[v0] Re-audited site ${site.id} with real AI data`);
            } catch (err: any) {
              console.error(`[v0] Re-audit failed for site ${site.id}:`, err.message);
            }
          }
        }
      }
    } else if (eventType === 'subscription.canceled') {
      const customData = eventData.custom_data || {};
      const userId = customData.user_id;
      if (userId) {
        await service
          .from('profiles')
          .update({
            plan: 'free',
            sites_limit: 1,
            queries_limit: 100,
            subscription_status: 'cancelled',
          })
          .eq('id', userId);
        console.log(`✅ User ${userId} subscription cancelled`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function mapPriceToPlan(priceId: string): string | null {
  const prices: Record<string, string> = {
    [process.env.PADDLE_STARTER_PRICE_ID!]: 'starter',
    [process.env.PADDLE_GROWTH_PRICE_ID!]: 'growth',
    [process.env.PADDLE_SCALE_PRICE_ID!]: 'scale',
    [process.env.PADDLE_AGENCY_PRO_PRICE_ID!]: 'agency_pro',
  };
  return prices[priceId] || null;
}

function getPlanLimits(plan: string) {
  switch (plan) {
    case 'starter': return { sites: 1, queries: 100 };
    case 'growth': return { sites: 5, queries: 500 };
    case 'scale': return { sites: 10, queries: 1000 };
    case 'agency_pro': return { sites: 20, queries: 2000 };
    default: return { sites: 1, queries: 100 };
  }
}