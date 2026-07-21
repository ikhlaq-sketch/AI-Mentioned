import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { generatePDFReport } from '@/lib/pdf/report-generator';

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

  const { website_id, date_from, date_to } = await req.json();
  if (!website_id || !date_from || !date_to) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // ==========================================
  // 🔒 FREE PLAN CHECK - Block report generation
  // ==========================================
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', session.user.id)
    .single();

  const isFreePlan = profile?.plan === 'free' || !profile?.plan;

  if (isFreePlan) {
    return NextResponse.json(
      { error: 'Upgrade required to generate reports. Please upgrade your plan.' },
      { status: 403 }
    );
  }

  try {
    const pdfBuffer = await generatePDFReport(website_id, date_from, date_to);
    
    // Convert Node.js Buffer to Uint8Array
    const responseBody = new Uint8Array(pdfBuffer);
    
    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Sightura-report-${website_id}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('PDF generation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}