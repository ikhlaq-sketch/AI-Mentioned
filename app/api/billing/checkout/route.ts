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

    // --- NEW: SITE COUNT LOGIC FOR DOWNGRADE PROTECTION ---
    const targetPlan = mapPriceToPlan(price_id);
    
    if (targetPlan) {
      const targetLimits = getPlanLimits(targetPlan);

      // Query the actual exact row count of active websites owned by the user
      const { count: activeSitesCount, error: countError } = await supabase
        .from('websites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        console.error('Database error checking site limits for checkout:', countError.message);
      }

      const totalSites = activeSitesCount || 0;

      // Check if current assets breach target tier allocations
      if (totalSites > targetLimits.sites) {
        return NextResponse.json(
          { 
            error: `Plan Limit Mismatch: You currently have ${totalSites} active website slots used, but the ${targetPlan} plan only allows a maximum of ${targetLimits.sites}. Please delete ${totalSites - targetLimits.sites} website(s) from your dashboard before switching plans.` 
          }, 
          { status: 400 }
        );
      }
    }
    // --- END OF SITE COUNT LOGIC ---

    const apiKey = process.env.PADDLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // IMPORTANT: Paddle Billing uses /transactions, not /checkouts
    const response = await fetch('https://api.paddle.com/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      // Paddle only requires items and your custom_data tracking ID here
      body: JSON.stringify({
        items: [{ price_id, quantity: 1 }],
        custom_data: {
          user_id: user.id,
        }
      }),
    });

    const json = await response.json();

    if (!response.ok) {
      console.error('Paddle checkout error:', json);
      return NextResponse.json({ error: json.error?.detail || 'Checkout failed' }, { status: 500 });
    }

    // Paddle returns the URL nested inside data.checkout.url
    return NextResponse.json({ url: json.data?.checkout?.url });
  } catch (err: any) {
    console.error('Fatal checkout error:', err.message);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

// Helper mapping matching webhook configuration to identify upcoming tiers safely
function mapPriceToPlan(priceId: string): string | null {
  if (!priceId) return null;
  const starterId = process.env.NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID;
  const growthId = process.env.NEXT_PUBLIC_PADDLE_GROWTH_PRICE_ID;
  const scaleId = process.env.NEXT_PUBLIC_PADDLE_SCALE_PRICE_ID;
  const agencyId = process.env.NEXT_PUBLIC_PADDLE_AGENCY_PRO_PRICE_ID;

  if (starterId && priceId === starterId) return 'starter';
  if (growthId && priceId === growthId) return 'growth';
  if (scaleId && priceId === scaleId) return 'scale';
  if (agencyId && priceId === agencyId) return 'agency_pro';

  return null;
}

// Plan definitions mapping constraints directly
function getPlanLimits(plan: string) {
  switch (plan) {
    case 'starter': return { sites: 1, queries: 100 };
    case 'growth': return { sites: 5, queries: 500 };
    case 'scale': return { sites: 10, queries: 1000 };
    case 'agency_pro': return { sites: 20, queries: 2000 };
    default: return { sites: 1, queries: 100 };
  }
}