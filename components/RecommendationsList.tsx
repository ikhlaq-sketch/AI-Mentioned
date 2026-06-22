'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { GitPullRequest, CheckCircle, ArrowUpCircle, X, Shield, Zap, Eye, Unlink } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

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
  const [showRepoSelect, setShowRepoSelect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Auto-open repo picker after OAuth callback
  useEffect(() => {
    if (searchParams.get('select_repo') === 'true' && githubConnected) {
      setShowRepoSelect(true);
      fetchRepos();
    }
  }, [searchParams, githubConnected]);

  const fetchRepos = async () => {
    setLoadingRepos(true);
    try {
      const res = await fetch(`/api/github/repos?website_id=${websiteId}`);
      const data = await res.json();
      if (Array.isArray(data)) setRepos(data);
    } catch {}
    setLoadingRepos(false);
  };

  const handleConnect = () => {
    window.location.href = `/api/github/connect?website_id=${websiteId}`;
  };

  const handleSelectRepo = async () => {
    if (!selectedRepo) return;
    const selected = repos.find(r => r.name === selectedRepo);
    await fetch('/api/github/save-repo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        website_id: websiteId,
        repo: selectedRepo,
        branch: selected?.default_branch || 'main',
      }),
    });
    setShowRepoSelect(false);
    // Clean URL and reload
    window.location.href = window.location.pathname;
  };

  const handlePushAll = async () => {
    if (!githubRepo) {
      alert('Please select a repository first.');
      return;
    }
    setPushingAll(true);
    try {
      const res = await fetch('/api/github/push-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website_id: websiteId }),
      });
      const data = await res.json();
      if (data.pr_url) {
        window.open(data.pr_url, '_blank');
        alert('✅ Pull Request created! Check your GitHub.');
      } else {
        alert(data.error || 'Failed to push fixes');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPushingAll(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    await fetch('/api/github/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ website_id: websiteId }),
    });
    window.location.href = window.location.pathname;
  };

  return (
    <div className="space-y-4">
      {/* Repo Selection Modal */}
      {showRepoSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold text-lg">Select GitHub Repository</h3>
              <button onClick={() => setShowRepoSelect(false)} className="text-[#94a3b8] hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-[#94a3b8] mb-4">
              Choose where to deploy your AI visibility fixes. A Pull Request will be created automatically.
            </p>
            {loadingRepos ? (
              <div className="flex justify-center py-8"><LoadingSpinner size={24} /></div>
            ) : repos.length === 0 ? (
              <p className="text-sm text-[#94a3b8] text-center py-4">No repositories found.</p>
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
                Confirm
              </button>
              <button
                onClick={() => setShowRepoSelect(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2.5 rounded-xl font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-8 max-w-md mx-4 text-center relative">
            <button onClick={() => setShowUpgradeModal(false)} className="absolute top-3 right-3 text-[#94a3b8] hover:text-white"><X size={18} /></button>
            <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4"><Shield className="w-8 h-8 text-purple-400" /></div>
            <h2 className="text-xl font-bold text-white mb-2">Unlock Complete AI Visibility</h2>
            <p className="text-sm text-[#94a3b8] mb-6">Get ready-to-paste schema fixes that boost your brand in ChatGPT, Gemini, Claude, and Perplexity.</p>
            <div className="bg-[#0f172a] rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm text-white"><Zap className="w-4 h-4 text-purple-400" />24/7 AI visibility monitoring</div>
              <div className="flex items-center gap-2 text-sm text-white"><Zap className="w-4 h-4 text-purple-400" />Ready-to-paste schema fixes</div>
              <div className="flex items-center gap-2 text-sm text-white"><Zap className="w-4 h-4 text-purple-400" />Competitor gap analysis</div>
              <div className="flex items-center gap-2 text-sm text-white"><Zap className="w-4 h-4 text-purple-400" />Weekly AI audit reports</div>
            </div>
            <a href="/?pricing=true#pricing" className="block w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-semibold">Upgrade Now - Starting at $49/mo</a>
          </div>
        </div>
      )}

      {/* GitHub Connect / Push Section */}
      {!hideGitHub && websiteId && !isFreePlan && (
        <div className="bg-gradient-to-r from-indigo-600/5 to-purple-600/5 border border-indigo-400/20 rounded-xl p-4">
          {!githubConnected ? (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <GitPullRequest size={18} />
              Connect GitHub to Auto-Deploy Fixes
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-400" size={16} />
                  <span className="text-green-400 text-sm font-medium">GitHub Connected</span>
                </div>
                <button onClick={handleDisconnect} disabled={disconnecting} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                  <Unlink size={12} />Disconnect
                </button>
              </div>

              {githubRepo ? (
                <>
                  <div className="flex items-center justify-between bg-[#0f172a] rounded-lg px-3 py-2">
                    <span className="text-white text-sm">{githubRepo}</span>
                    <button onClick={() => { setSelectedRepo(githubRepo); fetchRepos(); setShowRepoSelect(true); }} className="text-xs text-indigo-400 hover:text-indigo-300">
                      Change
                    </button>
                  </div>
                  <button
                    onClick={handlePushAll}
                    disabled={pushingAll || recommendations.length === 0}
                    className="w-full bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {pushingAll ? <LoadingSpinner size={16} /> : <GitPullRequest size={16} />}
                    Push All Fixes to GitHub
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { fetchRepos(); setShowRepoSelect(true); }}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-semibold"
                >
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

      {/* Recommendation Cards */}
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