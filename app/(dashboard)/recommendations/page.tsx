import { createServerSupabase } from '@/lib/supabase/server';
import RecommendationsList from '@/components/RecommendationsList';
import { CheckCircle, ChevronDown, Lightbulb } from 'lucide-react';

export default async function RecommendationsPage({ searchParams }: { searchParams?: { website_id?: string } }) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
  const isFreePlan = profile?.plan === 'free';
  const targetSiteId = searchParams?.website_id;

  const { data: sites } = await supabase
    .from('websites')
    .select('id, domain, brand_name, github_repo, github_token_encrypted, recommendations(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">All Recommendations</h1>
        <p className="text-sm text-gray-500 mt-1">
          {sites?.length || 0} site{sites?.length !== 1 ? 's' : ''} · AI-powered fixes to improve your visibility
        </p>
      </div>

      {!sites || sites.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-gray-900 font-bold text-lg mb-2">No sites yet</p>
          <p className="text-gray-500 text-sm max-w-md mx-auto">Add a website to get AI-powered recommendations for improving your visibility.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sites
            .filter((site: any) => !targetSiteId || site.id === targetSiteId)
            .map((site: any) => {
              const recCount = site.recommendations?.length || 0;
              const highCount = site.recommendations?.filter((r: any) => r.priority === 'high').length || 0;

              return (
                <details key={site.id} className="bg-white border border-gray-200 rounded-2xl group shadow-sm" open={targetSiteId === site.id}>
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-gray-50 rounded-2xl transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <span className="text-emerald-700 font-bold text-lg">{site.brand_name?.[0] || site.domain?.[0]}</span>
                      </div>
                      <div>
                        <h2 className="text-gray-900 font-bold">{site.brand_name || site.domain}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{site.domain}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">{recCount} fix{recCount !== 1 ? 'es' : ''}</span>
                          {highCount > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">{highCount} high</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {site.github_token_encrypted ? (
                        <span className="px-3 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center gap-1"><CheckCircle size={12} />GitHub</span>
                      ) : (
                        <span className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-500 font-semibold">No GitHub</span>
                      )}
                      <ChevronDown className="text-gray-400 group-open:rotate-180 transition-transform" size={18} />
                    </div>
                  </summary>
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                    <RecommendationsList recommendations={site.recommendations || []} websiteId={site.id} userId={user.id} githubConnected={!!site.github_token_encrypted} githubRepo={site.github_repo} isFreePlan={isFreePlan} hideGitHub={false} />
                  </div>
                </details>
              );
            })}
        </div>
      )}
    </div>
  );
}