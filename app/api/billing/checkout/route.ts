import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/server'; // Added to bypass RLS

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Auth client to safely verify the user's JWT token
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { price_id } = await req.json();
    if (!price_id) {
      return NextResponse.json({ error: 'Missing price_id' }, { status: 400 });
    }

    const targetPlan = mapPriceToPlan(price_id);
    
    if (targetPlan) {
      const targetLimits = getPlanLimits(targetPlan);

      // Use the Service Client to bypass RLS and get the TRUE exact count of websites
      const service = createServiceClient();
      
      const { count: activeSitesCount, error: countError } = await service
        .from('websites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        console.error('Database error checking site limits for checkout:', countError.message);
      }

      const totalSites = activeSitesCount || 0;

      // The exact downgrade blocker logic
      if (totalSites > targetLimits.sites) {
        return NextResponse.json(
          { 
            error: `Downgrade Prevented: You currently have ${totalSites} active websites, but the ${targetPlan} plan only allows up to ${targetLimits.sites}. Please delete ${totalSites - targetLimits.sites} website(s) from your dashboard before switching plans.` 
          }, 
          { status: 400 }
        );
      }
    }

    const apiKey = process.env.PADDLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

 const response = await fetch('https://api.paddle.com/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ price_id, quantity: 1 }],
        custom_data: {
          user_id: user.id,
        },
        // ADD THIS BLOCK: Forces Paddle to return to your custom domain
        checkout: {
          return_url: 'https://sightura.com/dashboard?upgrading=true'
        }
      }),
    });

    const json = await response.json();

    if (!response.ok) {
      console.error('Paddle checkout error:', json);
      return NextResponse.json({ error: json.error?.detail || 'Checkout failed' }, { status: 500 });
    }

    return NextResponse.json({ url: json.data?.checkout?.url });
  } catch (err: any) {
    console.error('Fatal checkout error:', err.message);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

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

function getPlanLimits(plan: string) {
  switch (plan) {
    case 'starter': return { sites: 1, queries: 100 };
    case 'growth': return { sites: 5, queries: 500 };
    case 'scale': return { sites: 10, queries: 1000 };
    case 'agency_pro': return { sites: 20, queries: 2000 };
    default: return { sites: 1, queries: 100 };
  }
}