import { createServerSupabase } from '@/lib/supabase/server';
import { Globe } from 'lucide-react';
import Link from 'next/link';
import AddSiteModal from '@/components/AddSiteModal';

export default async function SitesPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('sites_limit')
    .eq('id', user.id)
    .single();

  const { data: sites } = await supabase
    .from('websites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const canAddSite = (sites?.length ?? 0) < (profile?.sites_limit ?? 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">My Sites</h1>
        {canAddSite && <AddSiteModal />}
      </div>

      {!sites || sites.length === 0 ? (
        <div className="text-center py-16 bg-[#1e293b] rounded-xl border border-[#334155]">
          <Globe className="w-12 h-12 text-[#6366f1] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No sites added yet
          </h3>
          <p className="text-sm text-[#94a3b8] mb-6">
            Add your first website to start monitoring AI visibility.
          </p>
          {canAddSite && <AddSiteModal />}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site: any) => (
            <div
              key={site.id}
              className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 hover:border-indigo-400 transition-colors"
            >
              <p className="text-white font-semibold text-lg mb-1">
                {site.domain}
              </p>
              <p className="text-indigo-400 text-sm mb-3">{site.brand_name}</p>
              <div className="flex justify-between items-center text-sm">
                <span
                  className={`font-medium ${
                    site.visibility_score >= 70
                      ? 'text-green-400'
                      : site.visibility_score >= 40
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {site.visibility_score}%
                </span>
                <span className="text-[#94a3b8] px-2 py-0.5 bg-[#0f172a] rounded-full text-xs">
                  {site.scan_mode}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/sites/${site.id}`}
                  className="flex-1 text-center py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}