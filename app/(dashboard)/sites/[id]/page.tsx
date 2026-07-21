export const revalidate = 0;

import { createServerSupabase } from '@/lib/supabase/server';
import Link from 'next/link';
import SiteDetailTabs from '@/components/SiteDetailTabs';
import ScanModeToggle from '@/components/ScanModeToggle';

export default async function SiteDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: site, error } = await supabase
    .from('websites')
    .select('*, competitors(*), prompts(*), audits(*), recommendations(*)')
    .eq('id', params.id).eq('user_id', user.id).single();

  if (error || !site) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-900 font-bold text-lg">Site not found.</p>
        <Link href="/sites" className="text-emerald-600 hover:text-emerald-700 font-medium mt-2 inline-block">
          ← Back to Sites
        </Link>
      </div>
    );
  }

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single();

  if (site.audits) site.audits.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  if (site.recommendations) site.recommendations.sort((a: any, b: any) => b.impact_score - a.impact_score);

  let latestAuditMentions: any[] = [];
  if (site.audits && site.audits.length > 0) {
    const { data: mentions } = await supabase.from('mentions').select('*').eq('audit_id', site.audits[0].id);
    latestAuditMentions = mentions || [];
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/sites" className="text-emerald-600 hover:text-emerald-700 font-medium text-sm inline-block">
        ← Back to Sites
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{site.domain}</h1>
          <p className="text-emerald-600 font-medium">{site.brand_name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
          <ScanModeToggle siteId={site.id} currentMode={site.scan_mode} />
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
            site.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {site.status}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <SiteDetailTabs
        site={site}
        latestMentions={latestAuditMentions}
        userId={user.id}
        userPlan={profile?.plan || 'free'}
      />
    </div>
  );
}