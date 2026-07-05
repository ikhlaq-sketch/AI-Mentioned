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

  // Robustly parse the Paddle webhook signature header components
  const parts = signature.split(';').reduce((acc, part) => {
    const [key, value] = part.split('=');
    if (key && value) acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const ts = parts['ts'];
  const h1 = parts['h1'];

  if (!ts || !h1) {
    return NextResponse.json({ error: 'Invalid signature format' }, { status: 401 });
  }

  // Verify Paddle webhook signature integrity
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

      // Look for price.id (Subscription events) OR price_id (Transaction events)
      const firstItem = eventData.items?.[0];
      const priceId = firstItem?.price?.id || firstItem?.price_id;
      
      if (!priceId) {
        console.error('Missing price_id in payload:', JSON.stringify(firstItem));
        return NextResponse.json({ error: 'Missing price_id' }, { status: 400 });
      }

      const plan = mapPriceToPlan(priceId);
      if (!plan) {
        console.error('Unknown price ID received from webhook:', priceId);
        return NextResponse.json({ error: 'Unknown plan mapped' }, { status: 400 });
      }

      const limits = getPlanLimits(plan);

      // Check if user was previously on free plan
      const { data: oldProfile } = await service.from('profiles').select('plan').eq('id', userId).single();
      const wasFreePlan = !oldProfile?.plan || oldProfile.plan === 'free';

      console.log(`[SUPABASE PADDLE DEBUG] Attempting row update for target User ID: ${userId}`);

      // Update profile records in Supabase with strict row verification logs
      const { data: updateData, error: updateError } = await service
        .from('profiles')
        .update({
          plan,
          sites_limit: limits.sites,
          queries_limit: limits.queries,
          paddle_customer_id: eventData.customer_id,
          paddle_subscription_id: eventData.id,
          subscription_status: 'active',
        })
        .eq('id', userId)
        .select(); 

      if (updateError) {
        console.error(`❌ [SUPABASE UPDATE ERROR]: ${updateError.message} | Details: ${updateError.details}`);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      if (!updateData || updateData.length === 0) {
        console.error(`❌ [SUPABASE ZERO-ROW WARNING]: Database call returned no match for user_id: ${userId}. Possible RLS block or invalid id.`);
        return NextResponse.json({ error: 'Profile row target unmatched' }, { status: 404 });
      }

      console.log(`✅ User ${userId} successfully upgraded and confirmed database-wide as: ${plan}`);

      // 🚀 THE FIX: Run the re-audit loop in the background WITHOUT blocking the webhook!
      if (wasFreePlan) {
        console.log(`[v0] User was on free plan — launching background audits for all websites`);
        
        // Grab the websites but don't await the actual audits
        service.from('websites').select('id').eq('user_id', userId).then(({ data: websites }) => {
          if (websites && websites.length > 0) {
            // Promise.all runs all website audits simultaneously in the background
            Promise.all(websites.map(async (site) => {
              try {
                // Wipe the fake free-tier data
                await service.from('mentions').delete().eq('website_id', site.id);
                await service.from('audits').delete().eq('website_id', site.id);
                await service.from('recommendations').delete().eq('website_id', site.id);
                
                // Trigger the engine. It will detect < 13 prompts, generate the 13 real ones, and run the real LLMs!
                await runAudit(site.id, userId, 'baseline');
                console.log(`[v0] ✅ Background re-audit SUCCESS for site ${site.id} with real AI data`);
              } catch (err: any) {
                console.error(`[v0] ❌ Background re-audit FAILED for site ${site.id}:`, err.message);
              }
            })).catch(err => console.error("Global background loop error:", err));
          }
        });
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

    // Instantly returns 200 OK to Paddle while the audits keep running in the background!
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook error processing failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function mapPriceToPlan(priceId: string): string | null {
  const prices: Record<string, string> = {
    [process.env.NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID!]: 'starter',
    [process.env.NEXT_PUBLIC_PADDLE_GROWTH_PRICE_ID!]: 'growth',
    [process.env.NEXT_PUBLIC_PADDLE_SCALE_PRICE_ID!]: 'scale',
    [process.env.NEXT_PUBLIC_PADDLE_AGENCY_PRO_PRICE_ID!]: 'agency_pro',
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