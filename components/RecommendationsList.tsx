'use client';

import { useState } from 'react';
import { Copy, GitPullRequest, CheckCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export default function RecommendationsList({
  recommendations,
  websiteId,
  userId,
  githubConnected,
  githubRepo,
}: {
  recommendations: any[];
  websiteId: string;
  userId: string;
  githubConnected: boolean;
  githubRepo?: string;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [creatingPR, setCreatingPR] = useState<string | null>(null);

  const copyFixCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const createPR = async (rec: any) => {
    setCreatingPR(rec.id);
    try {
      const res = await fetch('/api/github/create-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendation_id: rec.id, website_id: websiteId }),
      });
      const data = await res.json();
      if (data.pr_url) {
        window.open(data.pr_url, '_blank');
      } else {
        alert(data.error || 'Failed to create PR');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreatingPR(null);
    }
  };

  return (
    <div className="space-y-4">
      {recommendations.map((rec) => (
        <div key={rec.id} className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold">{rec.title}</h3>
              <p className="text-sm text-[#94a3b8] mt-1">{rec.description}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  rec.priority === 'high' ? 'bg-red-400/10 text-red-400' :
                  rec.priority === 'medium' ? 'bg-amber-400/10 text-amber-400' :
                  'bg-blue-400/10 text-blue-400'
                }`}>
                  {rec.priority}
                </span>
                <span className="text-xs text-[#94a3b8]">
                  Impact: {rec.impact_score}/10 · Effort: {rec.effort_score}/10
                </span>
              </div>
              {rec.fix_code && (
                <div className="mt-3">
                  <pre className="bg-[#0f172a] p-3 rounded text-xs text-[#94a3b8] overflow-x-auto max-h-32">
                    {rec.fix_code.substring(0, 300)}...
                  </pre>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end ml-4">
              {rec.fix_code && (
                <button
                  onClick={() => copyFixCode(rec.fix_code, rec.id)}
                  className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 mb-2"
                >
                  <Copy size={14} />
                  {copiedId === rec.id ? 'Copied' : 'Copy Fix'}
                </button>
              )}
              {githubConnected && (
                <button
                  onClick={() => createPR(rec)}
                  disabled={creatingPR === rec.id}
                  className="flex items-center gap-1 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-500 disabled:opacity-50"
                >
                  {creatingPR === rec.id ? <LoadingSpinner size={14} /> : <GitPullRequest size={14} />}
                  Create PR
                </button>
              )}
              <button
                className="flex items-center gap-1 text-sm text-green-400 hover:text-green-300 mt-2"
                onClick={() => {/* mark deployed logic */}}
              >
                <CheckCircle size={14} />
                Deployed
              </button>
            </div>
          </div>
        </div>
      ))}
      {recommendations.length === 0 && (
        <p className="text-[#94a3b8] text-sm">No recommendations yet.</p>
      )}
    </div>
  );
}