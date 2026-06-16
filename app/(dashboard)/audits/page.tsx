import { createServerSupabase } from '@/lib/supabase/server';
import AuditTable from '@/components/AuditTable';

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
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Audit History</h1>
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0f172a]">
            <tr>
              <th className="text-left p-3 text-[#94a3b8]">Website</th>
              <th className="text-left p-3 text-[#94a3b8]">Type</th>
              <th className="text-left p-3 text-[#94a3b8]">Score</th>
              <th className="text-left p-3 text-[#94a3b8]">Queries</th>
              <th className="text-left p-3 text-[#94a3b8]">Date</th>
            </tr>
          </thead>
          <tbody>
            {(audits || []).map((audit: any) => (
              <tr key={audit.id} className="border-t border-[#334155]">
                <td className="p-3 text-white">{audit.websites?.brand_name || audit.websites?.domain}</td>
                <td className="p-3 capitalize text-[#94a3b8]">{audit.audit_type}</td>
                <td className="p-3 text-white">{audit.visibility_score}</td>
                <td className="p-3 text-[#94a3b8]">{audit.queries_consumed}</td>
                <td className="p-3 text-[#94a3b8]">{new Date(audit.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}