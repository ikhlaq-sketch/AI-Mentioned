'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function AuditTable({ audits }: { audits: any[]; websiteId: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[#0f172a]">
          <tr>
            <th className="text-left p-3 text-[#94a3b8]">Date</th>
            <th className="text-left p-3 text-[#94a3b8]">Type</th>
            <th className="text-left p-3 text-[#94a3b8]">Score</th>
            <th className="text-left p-3 text-[#94a3b8]">Queries</th>
            <th className="text-left p-3 text-[#94a3b8]">Status</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {audits.map((audit) => (
            <>
              <tr
                key={audit.id}
                className="border-t border-[#334155] hover:bg-[#0f172a] cursor-pointer"
                onClick={() => setExpandedId(expandedId === audit.id ? null : audit.id)}
              >
                <td className="p-3 text-white">{new Date(audit.created_at).toLocaleDateString()}</td>
                <td className="p-3">
                  <span className="px-2 py-1 text-xs rounded-full bg-[#0f172a] text-[#94a3b8] capitalize">
                    {audit.audit_type}
                  </span>
                </td>
                <td className="p-3 text-white">{audit.visibility_score}</td>
                <td className="p-3 text-[#94a3b8]">{audit.queries_consumed}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    audit.status === 'completed' ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'
                  }`}>
                    {audit.status}
                  </span>
                </td>
                <td className="p-3 text-[#94a3b8]">
                  {expandedId === audit.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </td>
              </tr>
              {expandedId === audit.id && (
                <tr className="bg-[#0f172a]">
                  <td colSpan={6} className="p-4">
                    <p className="text-sm text-[#94a3b8]">Full mention details will be shown here (coming in next update).</p>
                  </td>
                </tr>
              )}
            </>
          ))}
          {audits.length === 0 && (
            <tr>
              <td colSpan={6} className="p-4 text-center text-[#94a3b8]">No audits yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}