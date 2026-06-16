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

  try {
    const pdfBuffer = await generatePDFReport(website_id, date_from, date_to);
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="aimentioned-report-${website_id}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('PDF generation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
