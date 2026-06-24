import { createServerSupabase } from '@/lib/supabase/server';
import { Calendar, Activity, Filter } from 'lucide-react';

export default async function AuditsPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: audits } = await supabase
    .from('audits')
    .select('*, websites(domain, brand_name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit History</h1>
          <p className="text-sm text-gray-500 mt-1">
            {audits?.length || 0} total audit{audits?.length !== 1 ? 's' : ''} across all websites
          </p>
        </div>
      </div>

      {/* Audit Table */}
      {audits && audits.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left p-4 text-gray-500 font-semibold">Website</th>
                <th className="text-left p-4 text-gray-500 font-semibold">Type</th>
                <th className="text-left p-4 text-gray-500 font-semibold">Score</th>
                <th className="text-left p-4 text-gray-500 font-semibold">Queries</th>
                <th className="text-left p-4 text-gray-500 font-semibold">Status</th>
                <th className="text-left p-4 text-gray-500 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((audit: any) => (
                <tr key={audit.id} className="border-t border-gray-100 hover:bg-emerald-50/30 transition-colors">
                  <td className="p-4">
                    <p className="text-gray-900 font-semibold">{audit.websites?.brand_name || audit.websites?.domain}</p>
                    <p className="text-xs text-gray-400">{audit.websites?.domain}</p>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs rounded-full font-semibold capitalize ${
                      audit.audit_type === 'baseline' ? 'bg-blue-100 text-blue-700' :
                      audit.audit_type === 'weekly' ? 'bg-purple-100 text-purple-700' :
                      audit.audit_type === 'daily' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{audit.audit_type}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-lg font-extrabold ${
                      audit.visibility_score >= 70 ? 'text-emerald-600' :
                      audit.visibility_score >= 40 ? 'text-amber-500' : 'text-red-500'
                    }`}>{audit.visibility_score}</span>
                  </td>
                  <td className="p-4 text-gray-600 font-medium">{audit.queries_consumed}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-semibold ${
                      audit.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${audit.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                      {audit.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-gray-400" />
                      {new Date(audit.created_at).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-900 font-bold text-lg mb-2">No audits yet</p>
          <p className="text-gray-500 text-sm max-w-md mx-auto">Your audit history will appear here after you add a website and run your first scan.</p>
        </div>
      )}
    </div>
  );
}