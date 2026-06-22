import { createServerSupabase } from '@/lib/supabase/server';
import RecommendationsList from '@/components/RecommendationsList';
import { CheckCircle } from 'lucide-react';

export default async function RecommendationsPage({ searchParams }: { searchParams?: { website_id?: string } }) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const isFreePlan = profile?.plan === 'free';
  const targetSiteId = searchParams?.website_id;

  const { data: sites } = await supabase
    .from('websites')
    .select('id, domain, brand_name, github_repo, github_token_encrypted, recommendations(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">All Recommendations</h1>
      
      {!sites || sites.length === 0 ? (
        <p className="text-[#94a3b8] text-sm">No sites yet. Add a website to get AI-powered recommendations.</p>
      ) : (
        <div className="space-y-8">
          {sites
            .filter((site: any) => !targetSiteId || site.id === targetSiteId)
            .map((site: any) => (
              <div key={site.id} className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#334155]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                      <span className="text-indigo-400 font-bold text-lg">{site.brand_name?.[0] || site.domain?.[0]}</span>
                    </div>
                    <div>
                      <h2 className="text-white font-semibold">{site.brand_name || site.domain}</h2>
                      <p className="text-xs text-[#94a3b8]">{site.domain}</p>
                    </div>
                  </div>
                  {site.github_token_encrypted ? (
                    <span className="px-3 py-1 text-xs rounded-full bg-green-400/10 text-green-400 flex items-center gap-1">
                      <CheckCircle size={12} />
                      GitHub Connected
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-xs rounded-full bg-gray-400/10 text-gray-400">
                      GitHub Not Connected
                    </span>
                  )}
                </div>
                
                <RecommendationsList
                  recommendations={site.recommendations || []}
                  websiteId={site.id}
                  userId={user.id}
                  githubConnected={!!site.github_token_encrypted}
                  githubRepo={site.github_repo}
                  isFreePlan={isFreePlan}
                  hideGitHub={false}
                />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}