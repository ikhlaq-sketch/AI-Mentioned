import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { runAudit } from '@/lib/audit/audit-engine';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  const hmac = crypto.createHmac('sha256', process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!);
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
      eventName === 'subscription_updated' ||
      eventName === 'order_created'
    ) {
      const customData = event.meta.custom_data || {};
      const userId = customData.user_id;

      if (!userId) {
        console.error('Missing user_id in custom_data');
        return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
      }

      let variantId: string | null = null;
      let customerId: string | null = null;

      if (eventName === 'order_created') {
        variantId = event.data.attributes.first_order_item?.variant_id?.toString();
        customerId = event.data.attributes.customer_id?.toString();
      } else {
        variantId = event.data.attributes.variant_id?.toString();
        customerId = event.data.attributes.customer_id?.toString();
      }

      if (!variantId) {
        console.error('Missing variant_id');
        return NextResponse.json({ error: 'Missing variant_id' }, { status: 400 });
      }

      const plan = mapVariantToPlan(variantId);
      if (!plan) {
        console.error('Unknown variant:', variantId);
        return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });
      }

      const limits = getPlanLimits(plan);

      // ✅ Check if user was previously on free plan
      const { data: oldProfile } = await service.from('profiles').select('plan').eq('id', userId).single();
      const wasFreePlan = !oldProfile?.plan || oldProfile.plan === 'free';

      // Update profile
      await service
        .from('profiles')
        .update({
          plan,
          sites_limit: limits.sites,
          queries_limit: limits.queries,
          lemon_squeezy_customer_id: customerId,
          lemon_squeezy_subscription_id: event.data.id,
          subscription_status: 'active',
        })
        .eq('id', userId);

      console.log(`✅ User ${userId} upgraded to ${plan}`);

      // ✅ If upgrading from free, re-audit all existing websites to replace dummy data
      if (wasFreePlan) {
        console.log(`[v0] User was on free plan — re-auditing all websites`);
        const { data: websites } = await service.from('websites').select('id').eq('user_id', userId);
        
        if (websites && websites.length > 0) {
          for (const site of websites) {
            try {
              // Delete old fake data
              await service.from('mentions').delete().eq('website_id', site.id);
              await service.from('audits').delete().eq('website_id', site.id);
              await service.from('recommendations').delete().eq('website_id', site.id);
              
              // Run fresh baseline audit with real AI data
              await runAudit(site.id, userId, 'baseline');
              console.log(`[v0] Re-audited site ${site.id} with real AI data`);
            } catch (err: any) {
              console.error(`[v0] Re-audit failed for site ${site.id}:`, err.message);
            }
          }
        }
      }
    } else if (eventName === 'subscription_cancelled') {
      const userId = event.meta.custom_data?.user_id;
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

function mapVariantToPlan(variantId: string): string | null {
  const variants: Record<string, string> = {
    '1796870': 'starter',
    '1796861': 'growth',
    '1796866': 'scale',
    '1796868': 'agency_pro',
  };
  return variants[variantId] || null;
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