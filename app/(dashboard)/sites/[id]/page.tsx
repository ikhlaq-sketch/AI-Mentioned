export const revalidate = 0;

import { createServerSupabase } from '@/lib/supabase/server';
import Link from 'next/link';
import SiteDetailTabs from '@/components/SiteDetailTabs';

export default async function SiteDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: site, error } = await supabase
    .from('websites')
    .select('*, competitors(*), prompts(*), audits(*), recommendations(*)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (error || !site) {
    return (
      <div className="text-center py-16">
        <p className="text-white text-lg">Site not found.</p>
        <Link href="/sites" className="text-indigo-400 mt-2 inline-block">← Back to Sites</Link>
      </div>
    );
  }

  // ✅ Fetch profile plan for free plan UI
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  if (site.audits) site.audits.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  if (site.recommendations) site.recommendations.sort((a: any, b: any) => b.impact_score - a.impact_score);

  let latestAuditMentions: any[] = [];
  if (site.audits && site.audits.length > 0) {
    const { data: mentions } = await supabase
      .from('mentions')
      .select('*')
      .eq('audit_id', site.audits[0].id);
    latestAuditMentions = mentions || [];
  }

  return (
    <div>
      <Link href="/sites" className="text-indigo-400 text-sm mb-4 inline-block">← Back to Sites</Link>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{site.domain}</h1>
          <p className="text-indigo-400">{site.brand_name}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${
          site.status === 'active' ? 'bg-green-400/10 text-green-400' : 'bg-gray-400/10 text-gray-400'
        }`}>
          {site.status}
        </span>
      </div>

      {/* ✅ Pass userPlan */}
      <SiteDetailTabs
        site={site}
        latestMentions={latestAuditMentions}
        userId={user.id}
        userPlan={profile?.plan || 'free'}
      />
    </div>
  );
}