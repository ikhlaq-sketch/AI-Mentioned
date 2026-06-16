import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { generateRecommendations } from '@/lib/recommendations/generator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { website_id } = await req.json();
  if (!website_id) {
    return NextResponse.json({ error: 'Missing website_id' }, { status: 400 });
  }

  try {
    const recs = await generateRecommendations(website_id, session.user.id);
    return NextResponse.json({ count: recs.length, recommendations: recs });
  } catch (err: any) {
    console.error('Recommendations generation error:', err);
    return NextResponse.json(
      { error: err.message || 'Generation failed' },
      { status: 500 }
    );
  }
}
