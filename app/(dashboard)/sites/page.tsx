import { createServerSupabase } from '@/lib/supabase/server';
import { Globe, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import AddSiteModal from '@/components/AddSiteModal';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function SitesPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('sites_limit').eq('id', user.id).single();
  const { data: sites } = await supabase.from('websites').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  const canAddSite = (sites?.length ?? 0) < (profile?.sites_limit ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Sites</h1>
          <p className="text-sm text-gray-500 mt-1">
            {sites?.length || 0} / {profile?.sites_limit || 0} sites used
          </p>
        </div>
        <div className="flex-shrink-0">
          {canAddSite && <AddSiteModal />}
        </div>
      </div>

      {!sites || sites.length === 0 ? (
        <div className="text-center py-16 sm:py-20 bg-white border border-gray-200 rounded-2xl">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-gray-900 font-bold text-lg mb-2">No sites added yet</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto px-4">
            Add your first website to start monitoring AI visibility.
          </p>
          {canAddSite && <AddSiteModal />}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site: any) => (
            <Link
              key={site.id}
              href={`/sites/${site.id}`}
              className="group bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-3 gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors truncate">
                    {site.domain}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{site.brand_name}</p>
                </div>
                <span className={`text-2xl font-extrabold flex-shrink-0 ${
                  site.visibility_score >= 70 ? 'text-emerald-600' :
                  site.visibility_score >= 40 ? 'text-amber-500' : 'text-red-500'
                }`}>
                  {site.visibility_score}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    site.scan_mode === 'auto' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {site.scan_mode}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full ${site.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                </div>
                <span className="text-emerald-600 group-hover:translate-x-1 transition-transform text-sm font-medium flex items-center gap-1">
                  View <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 