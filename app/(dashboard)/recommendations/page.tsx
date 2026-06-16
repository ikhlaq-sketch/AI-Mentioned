import { createServerSupabase } from '@/lib/supabase/server';
import RecommendationsList from '@/components/RecommendationsList';

export default async function RecommendationsPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: recs } = await supabase
    .from('recommendations')
    .select('*')
    .eq('user_id', user.id)
    .order('impact_score', { ascending: false });

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">All Recommendations</h1>
      <RecommendationsList
        recommendations={recs || []}
        websiteId=""
        userId={user.id}
        githubConnected={false}
      />
    </div>
  );
}