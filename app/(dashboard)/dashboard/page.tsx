import { createServerSupabase } from '@/lib/supabase/server';
import { BarChart3, Globe, Search, TrendingUp } from 'lucide-react';
import StatCard from '@/components/StatCard';
import UpgradeButton from '@/components/UpgradeButton';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const { count: siteCount } = await supabase.from('websites').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
  const { count: auditCount } = await supabase.from('audits').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
  const { data: sites } = await supabase.from('websites').select('*').eq('user_id', user.id);
  const avgScore = sites?.length ? Math.round(sites.reduce((sum, s) => sum + s.visibility_score, 0) / sites.length) : 0;

  const { data: recentAudits } = await supabase.from('audits').select('*, websites(domain, brand_name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5);
  const { data: topRecs } = await supabase.from('recommendations').select('*').eq('user_id', user.id).order('impact_score', { ascending: false }).limit(3);

  return (
    <div className="p-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <UpgradeButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard icon={<Globe />} label="Websites" value={siteCount ?? 0} />
        <StatCard icon={<Search />} label="Audits" value={auditCount ?? 0} />
        <StatCard icon={<TrendingUp />} label="Avg Score" value={`${avgScore}%`} />
        <StatCard icon={<BarChart3 />} label="Queries" value={`${profile?.queries_used ?? 0}/${profile?.queries_limit ?? 0}`} />
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">Your Websites</h2>
        {sites && sites.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((site: any) => (
              <Link key={site.id} href={`/sites/${site.id}`} className="group bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-purple-400/50 transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] backdrop-blur-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-white">{site.domain}</p>
                    <p className="text-sm text-gray-400">{site.brand_name}</p>
                  </div>
                  <span className={`text-sm font-medium ${site.visibility_score >= 70 ? 'text-green-400' : site.visibility_score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                    {site.visibility_score}%
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
            <Globe className="w-10 h-10 text-purple-400 mx-auto mb-3" />
            <p className="text-white font-medium mb-2">No websites yet</p>
            <p className="text-sm text-gray-400 mb-4">Add your first website to start monitoring AI visibility.</p>
            <Link href="/sites" className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-full transition-all">
              Add Website
            </Link>
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Audits</h2>
        {recentAudits && recentAudits.length > 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left p-3 text-gray-400">Website</th>
                  <th className="text-left p-3 text-gray-400">Type</th>
                  <th className="text-left p-3 text-gray-400">Score</th>
                  <th className="text-left p-3 text-gray-400">Queries</th>
                  <th className="text-left p-3 text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentAudits.map((audit: any) => (
                  <tr key={audit.id} className="border-t border-white/5">
                    <td className="p-3 text-white">{audit.websites?.brand_name || audit.websites?.domain}</td>
                    <td className="p-3"><span className="px-2 py-1 text-xs rounded-full bg-white/5 text-gray-300 capitalize">{audit.audit_type}</span></td>
                    <td className="p-3 text-white">{audit.visibility_score}</td>
                    <td className="p-3 text-gray-400">{audit.queries_consumed}</td>
                    <td className="p-3 text-gray-400">{new Date(audit.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-gray-400 text-sm">No audits yet.</p>}
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Top Recommendations</h2>
        {topRecs && topRecs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topRecs.map((rec: any) => (
              <div key={rec.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-purple-400/50 transition-all">
                <h3 className="font-medium text-white mb-1">{rec.title}</h3>
                <p className="text-sm text-gray-400 mb-3">{rec.description}</p>
                <div className="flex justify-between text-xs">
                  <span className="text-purple-400">Impact: {rec.impact_score}/10</span>
                  <span className="text-gray-500">Effort: {rec.effort_score}/10</span>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-gray-400 text-sm">No recommendations yet.</p>}
      </section>
    </div>
  );
}