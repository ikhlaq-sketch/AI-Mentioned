'use client';

import { useState, useEffect } from 'react';
import { GitPullRequest, CheckCircle, ArrowUpCircle, X, Shield, Zap, Eye, Unlink } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { useSearchParams } from 'next/navigation';

export default function RecommendationsList({
  recommendations, websiteId, userId, githubConnected, githubRepo, isFreePlan = false, hideGitHub = false,
}: {
  recommendations: any[]; websiteId: string; userId: string; githubConnected: boolean; githubRepo?: string; isFreePlan?: boolean; hideGitHub?: boolean;
}) {
  const searchParams = useSearchParams();
  const [pushingAll, setPushingAll] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState(githubRepo || '');
  const [showRepoSelect, setShowRepoSelect] = useState(searchParams.get('select_repo') === 'true');
  const [disconnecting, setDisconnecting] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);

  useEffect(() => {
    if (githubConnected && websiteId && showRepoSelect) {
      setLoadingRepos(true);
      fetch(`/api/github/repos?website_id=${websiteId}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setRepos(data);
        })
        .finally(() => setLoadingRepos(false));
    }
  }, [githubConnected, websiteId, showRepoSelect]);

  const handleConnect = async () => {
    const res = await fetch(`/api/github/connect?website_id=${websiteId}`);
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  const handleSelectRepo = async () => {
    if (!selectedRepo) return;
    const selected = repos.find(r => r.name === selectedRepo);
    await fetch('/api/github/save-repo', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ website_id: websiteId, repo: selectedRepo, branch: selected?.default_branch || 'main' }),
    });
    setShowRepoSelect(false);
    window.location.href = window.location.pathname; // Refresh without query params
  };

  const handlePushAll = async () => {
    setPushingAll(true);
    try {
      const res = await fetch('/api/github/push-all', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website_id: websiteId }),
      });
      const data = await res.json();
      if (data.pr_url) window.open(data.pr_url, '_blank');
      else alert(data.error || 'Failed');
    } catch (err: any) { alert(err.message); }
    finally { setPushingAll(false); }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    await fetch('/api/github/disconnect', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ website_id: websiteId }),
    });
    window.location.href = window.location.pathname;
  };

  return (
    <div className="space-y-4">
      {/* Repo Selection Modal */}
      {showRepoSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-white font-semibold mb-2">Select GitHub Repository</h3>
            <p className="text-sm text-[#94a3b8] mb-4">Choose where to deploy your AI visibility fixes.</p>
            {loadingRepos ? (
              <div className="flex justify-center py-8"><LoadingSpinner size={24} /></div>
            ) : (
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-3 text-white mb-4"
              >
                <option value="">Select a repository...</option>
                {repos.map((r: any) => (
                  <option key={r.name} value={r.name}>{r.name}</option>
                ))}
              </select>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleSelectRepo}
                disabled={!selectedRepo}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-medium"
              >
                Confirm & Connect
              </button>
              <button
                onClick={() => setShowRepoSelect(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2.5 rounded-xl font-medium"
              >
                Skip for Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GitHub Section */}
      {!hideGitHub && websiteId && !isFreePlan && (
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          {!githubConnected ? (
            <button onClick={handleConnect} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
              <GitPullRequest size={18} /> Connect GitHub to Auto-Deploy Fixes
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-400" size={16} />
                  <span className="text-green-400 text-sm">{githubRepo || 'Connected — No repo selected'}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowRepoSelect(true)} className="text-xs text-[#94a3b8] hover:text-white">Change Repo</button>
                  <button onClick={handleDisconnect} disabled={disconnecting} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><Unlink size={12} />Disconnect</button>
                </div>
              </div>
              {githubRepo && (
                <button onClick={handlePushAll} disabled={pushingAll || recommendations.length === 0} className="w-full bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                  {pushingAll ? <LoadingSpinner size={16} /> : <GitPullRequest size={16} />}
                  Push All Fixes to GitHub
                </button>
              )}
              {!githubRepo && (
                <button onClick={() => setShowRepoSelect(true)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-semibold">
                  Select a Repository
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Free Plan */}
      {isFreePlan && recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-purple-600/10 to-indigo-600/10 border border-purple-400/20 rounded-xl p-6 text-center">
          <Eye className="w-8 h-8 text-purple-400 mx-auto mb-3" />
          <h3 className="text-white font-semibold mb-2">{recommendations.length} AI Visibility Fixes Detected</h3>
          <p className="text-sm text-[#94a3b8] mb-4">Upgrade to unlock ready-to-paste schema fixes that boost your AI visibility.</p>
          <button onClick={() => setShowUpgradeModal(true)} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl font-medium">View Complete Analysis & Fixes</button>
        </div>
      )}

      {/* Recommendations */}
      {!isFreePlan && recommendations.map((rec) => (
        <div key={rec.id} className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <h3 className="text-white font-semibold text-sm">{rec.title}</h3>
          <p className="text-xs text-[#94a3b8] mt-1">{rec.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-2 py-0.5 text-xs rounded-full ${rec.priority === 'high' ? 'bg-red-400/10 text-red-400' : rec.priority === 'medium' ? 'bg-amber-400/10 text-amber-400' : 'bg-blue-400/10 text-blue-400'}`}>{rec.priority}</span>
            <span className="text-xs text-[#94a3b8]">Impact: {rec.impact_score}/10</span>
          </div>
          {rec.fix_code && (
            <details className="mt-2">
              <summary className="text-xs text-indigo-400 cursor-pointer">View Fix Code</summary>
              <pre className="bg-[#0f172a] p-2 rounded text-xs text-[#94a3b8] mt-1 max-h-24 overflow-hidden">{rec.fix_code.substring(0, 200)}...</pre>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}