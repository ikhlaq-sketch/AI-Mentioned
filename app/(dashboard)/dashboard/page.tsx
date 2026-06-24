import { createServerSupabase } from '@/lib/supabase/server';
import { BarChart3, Globe, Search, TrendingUp, Sparkles, ArrowRight, Zap, Activity } from 'lucide-react';
import StatCard from '@/components/StatCard';
import UpgradeButton from '@/components/UpgradeButton';
import Link from 'next/link';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getGreetingEmoji() {
  const hour = new Date().getHours();
  if (hour < 12) return '☀️';
  if (hour < 17) return '🌤️';
  return '🌙';
}

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

  const greeting = getGreeting();
  const emoji = getGreetingEmoji();
  const firstName = profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'there';
  const isFreePlan = profile?.plan === 'free';

  return (
    <div className="p-6">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{emoji}</span>
            <h1 className="text-2xl font-bold text-gray-900">
              {greeting}, <span className="text-emerald-600">{firstName}</span>
            </h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            {isFreePlan
              ? 'Ready to see your AI visibility? Upgrade to unlock real-time monitoring.'
              : `Here's your AI visibility overview. ${siteCount && siteCount > 0 ? `${siteCount} site${siteCount > 1 ? 's' : ''} monitored.` : ''}`}
          </p>
        </div>
        <UpgradeButton />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard icon={<Globe className="text-emerald-600" />} label="Websites" value={siteCount ?? 0} trend={siteCount && siteCount > 0 ? 'active' : undefined} />
        <StatCard icon={<Search className="text-emerald-600" />} label="Audits" value={auditCount ?? 0} trend={auditCount && auditCount > 0 ? 'active' : undefined} />
        <StatCard icon={<TrendingUp className="text-emerald-600" />} label="Avg Visibility Score" value={`${avgScore}%`} trend={avgScore >= 70 ? 'up' : avgScore >= 40 ? 'neutral' : 'down'} />
        <StatCard icon={<BarChart3 className="text-emerald-600" />} label="Queries Used" value={`${profile?.queries_used ?? 0}/${profile?.queries_limit ?? 0}`} trend={profile && profile.queries_used / profile.queries_limit > 0.7 ? 'warning' : undefined} />
      </div>

      {/* Websites Section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Your Websites</h2>
          {sites && sites.length > 0 && <Link href="/sites" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">View All <ArrowRight size={14} /></Link>}
        </div>
        {sites && sites.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((site: any) => (
              <Link key={site.id} href={`/sites/${site.id}`} className="group bg-white border border-gray-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300 hover:-translate-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">{site.domain}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{site.brand_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${site.scan_mode === 'auto' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{site.scan_mode}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${site.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-extrabold ${site.visibility_score >= 70 ? 'text-emerald-600' : site.visibility_score >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{site.visibility_score}</span>
                    <p className="text-xs text-gray-400">Score</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><Globe className="w-8 h-8 text-emerald-600" /></div>
            <p className="text-gray-900 font-bold text-lg mb-2">No websites yet</p>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">Add your first website to start monitoring how AI chatbots mention your brand.</p>
            <Link href="/sites" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-semibold transition-all shadow-lg shadow-emerald-200"><Zap size={16} />Add Your First Website</Link>
          </div>
        )}
      </section>

      {/* Recent Audits */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Recent Audits</h2>
          {recentAudits && recentAudits.length > 0 && <Link href="/audits" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">View All <ArrowRight size={14} /></Link>}
        </div>
        {recentAudits && recentAudits.length > 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200"><th className="text-left p-4 text-gray-500 font-semibold">Website</th><th className="text-left p-4 text-gray-500 font-semibold">Type</th><th className="text-left p-4 text-gray-500 font-semibold">Score</th><th className="text-left p-4 text-gray-500 font-semibold">Queries</th><th className="text-left p-4 text-gray-500 font-semibold">Date</th></tr></thead>
              <tbody>
                {recentAudits.map((audit: any) => (
                  <tr key={audit.id} className="border-t border-gray-100 hover:bg-emerald-50/30 transition-colors">
                    <td className="p-4 text-gray-900 font-semibold">{audit.websites?.brand_name || audit.websites?.domain}</td>
                    <td className="p-4"><span className={`px-2.5 py-1 text-xs rounded-full font-semibold capitalize ${audit.audit_type === 'baseline' ? 'bg-blue-100 text-blue-700' : audit.audit_type === 'weekly' ? 'bg-purple-100 text-purple-700' : audit.audit_type === 'daily' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{audit.audit_type}</span></td>
                    <td className="p-4"><span className={`font-extrabold text-lg ${audit.visibility_score >= 70 ? 'text-emerald-600' : audit.visibility_score >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{audit.visibility_score}</span></td>
                    <td className="p-4 text-gray-600 font-medium">{audit.queries_consumed}</td>
                    <td className="p-4 text-gray-500">{new Date(audit.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl"><Activity className="w-8 h-8 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm">No audits yet. Your first audit runs when you add a website.</p></div>
        )}
      </section>

      {/* Top Recommendations */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Top Recommendations</h2>
          {topRecs && topRecs.length > 0 && <Link href="/recommendations" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">View All <ArrowRight size={14} /></Link>}
        </div>
        {topRecs && topRecs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topRecs.map((rec: any) => (
              <div key={rec.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-md transition-all duration-300">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${rec.priority === 'high' ? 'bg-red-500' : rec.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  <div><h3 className="font-semibold text-gray-900">{rec.title}</h3><p className="text-sm text-gray-500 mt-1 line-clamp-2">{rec.description}</p></div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3"><span className="flex items-center gap-1 text-gray-500"><TrendingUp size={12} className="text-emerald-500" />Impact: {rec.impact_score}/10</span><span className="text-gray-400">Effort: {rec.effort_score}/10</span></div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${rec.priority === 'high' ? 'bg-red-100 text-red-700' : rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{rec.priority}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl"><Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm">No recommendations yet. Complete an audit to get AI-powered fixes.</p></div>
        )}
      </section>
    </div>
  );
}