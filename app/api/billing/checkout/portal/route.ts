import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
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

  const service = createServiceClient();
  const { data: profile } = await service
    .from('profiles')
    .select('paddle_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.paddle_customer_id) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 400 });
  }

  try {
    const response = await fetch('https://api.paddle.com/customers/portal-sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: profile.paddle_customer_id,
      }),
    });

    const json = await response.json();
    const portalUrl = json.data?.url;

    if (!portalUrl) throw new Error('Failed to generate portal URL');

    return NextResponse.json({ url: portalUrl });
  } catch (err: any) {
    console.error('Portal error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}