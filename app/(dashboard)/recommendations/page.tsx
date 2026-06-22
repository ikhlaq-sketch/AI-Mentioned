import { createServerSupabase } from '@/lib/supabase/server';
import RecommendationsList from '@/components/RecommendationsList';
import { CheckCircle, ChevronDown } from 'lucide-react';

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
        <div className="grid gap-4">
          {sites
            .filter((site: any) => !targetSiteId || site.id === targetSiteId)
            .map((site: any) => {
              const recCount = site.recommendations?.length || 0;
              const highCount = site.recommendations?.filter((r: any) => r.priority === 'high').length || 0;
              
              return (
                <details
                  key={site.id}
                  className="bg-[#1e293b] rounded-xl border border-[#334155] group"
                  open={targetSiteId === site.id}
                >
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                        <span className="text-indigo-400 font-bold text-lg">
                          {site.brand_name?.[0] || site.domain?.[0]}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-white font-semibold">{site.brand_name || site.domain}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-[#94a3b8]">{site.domain}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-400/10 text-indigo-400">
                            {recCount} fix{recCount !== 1 ? 'es' : ''}
                          </span>
                          {highCount > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-400/10 text-red-400">
                              {highCount} high priority
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {site.github_token_encrypted ? (
                        <span className="px-3 py-1 text-xs rounded-full bg-green-400/10 text-green-400 flex items-center gap-1">
                          <CheckCircle size={12} />
                          GitHub
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs rounded-full bg-gray-400/10 text-gray-400">
                          No GitHub
                        </span>
                      )}
                      <ChevronDown className="text-[#94a3b8] group-open:rotate-180 transition-transform" size={18} />
                    </div>
                  </summary>
                  
                  <div className="px-5 pb-5 border-t border-[#334155] pt-4">
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
                </details>
              );
            })}
        </div>
      )}
    </div>
  );
}