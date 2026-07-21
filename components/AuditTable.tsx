'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Calendar, Activity } from 'lucide-react';

export default function AuditTable({ audits }: { audits: any[]; websiteId: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!audits || audits.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16 bg-white border border-gray-200 rounded-2xl">
        <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No audits yet</p>
        <p className="text-sm text-gray-400 mt-1">Your audit history will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left p-3 sm:p-4 text-gray-500 font-medium text-xs sm:text-sm">Date</th>
              <th className="text-left p-3 sm:p-4 text-gray-500 font-medium text-xs sm:text-sm">Type</th>
              <th className="text-left p-3 sm:p-4 text-gray-500 font-medium text-xs sm:text-sm">Score</th>
              <th className="text-left p-3 sm:p-4 text-gray-500 font-medium text-xs sm:text-sm">Queries</th>
              <th className="text-left p-3 sm:p-4 text-gray-500 font-medium text-xs sm:text-sm">Status</th>
              <th className="p-3 sm:p-4"></th>
            </tr>
          </thead>
          <tbody>
            {audits.map((audit) => (
              <>
                <tr
                  key={audit.id}
                  className="border-t border-gray-100 hover:bg-emerald-50/30 cursor-pointer transition-colors"
                  onClick={() => setExpandedId(expandedId === audit.id ? null : audit.id)}
                >
                  <td className="p-3 sm:p-4 text-gray-900 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                      {new Date(audit.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-3 sm:p-4">
                    <span className={`px-2 py-1 text-[10px] sm:text-xs rounded-full font-medium capitalize whitespace-nowrap ${
                      audit.audit_type === 'baseline' ? 'bg-blue-100 text-blue-700' :
                      audit.audit_type === 'weekly' ? 'bg-purple-100 text-purple-700' :
                      audit.audit_type === 'daily' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {audit.audit_type}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4">
                    <span className={`font-bold text-base sm:text-lg ${
                      audit.visibility_score >= 70 ? 'text-emerald-600' :
                      audit.visibility_score >= 40 ? 'text-amber-500' : 'text-red-500'
                    }`}>
                      {audit.visibility_score}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-gray-500 text-xs sm:text-sm">{audit.queries_consumed}</td>
                  <td className="p-3 sm:p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] sm:text-xs rounded-full font-medium whitespace-nowrap ${
                      audit.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${audit.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                      {audit.status}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-gray-400">
                    {expandedId === audit.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </td>
                </tr>
                {expandedId === audit.id && (
                  <tr className="bg-gray-50">
                    <td colSpan={6} className="p-4">
                      <p className="text-sm text-gray-500">Full mention details available on the Overview tab.</p>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}