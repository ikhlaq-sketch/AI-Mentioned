'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { GitPullRequest, CheckCircle, ArrowUpCircle, X, Shield, Zap, Eye, Unlink, Code, ChevronDown, Copy, Check } from 'lucide-react';
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleConnect = () => { window.location.href = `/api/github/connect?website_id=${websiteId}`; };

  const handleSelectRepo = async () => {
    if (!selectedRepo) return;
    const selected = repos.find(r => r.name === selectedRepo);
    await fetch('/api/github/save-repo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ website_id: websiteId, repo: selectedRepo, branch: selected?.default_branch || 'main' }) });
    setShowRepoSelect(false);
    window.location.href = window.location.pathname;
  };

  const handlePushAll = async () => {
    if (!githubRepo) { alert('Please select a repository first.'); return; }
    setPushingAll(true);
    try {
      const res = await fetch('/api/github/push-all', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ website_id: websiteId }) });
      const data = await res.json();
      if (data.pr_url) { window.open(data.pr_url, '_blank'); alert('✅ Pull Request created!'); }
      else alert(data.error || 'Failed');
    } catch (err: any) { alert(err.message); }
    finally { setPushingAll(false); }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    await fetch('/api/github/disconnect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ website_id: websiteId }) });
    window.location.href = window.location.pathname;
  };

  const copyFixCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Repo Selection Modal */}
      {showRepoSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-900 font-bold text-lg">Select Repository</h3>
              <button onClick={() => setShowRepoSelect(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            {loadingRepos ? <div className="flex justify-center py-8"><LoadingSpinner size={24} /></div> :
             repos.length === 0 ? <p className="text-sm text-gray-500 text-center py-4">No repositories found.</p> :
             <select value={selectedRepo} onChange={(e) => setSelectedRepo(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 mb-4 focus:outline-none focus:border-emerald-400">
               <option value="">Select a repository...</option>
               {repos.map((r: any) => <option key={r.name} value={r.name}>{r.name}</option>)}
             </select>}
            <div className="flex gap-3">
              <button onClick={handleSelectRepo} disabled={!selectedRepo} className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-medium">Confirm</button>
              <button onClick={() => setShowRepoSelect(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md mx-4 text-center relative shadow-2xl">
            <button onClick={() => setShowUpgradeModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><Shield className="w-8 h-8 text-emerald-600" /></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Unlock Complete AI Visibility</h2>
            <p className="text-sm text-gray-500 mb-6">Get ready-to-paste schema fixes that boost your brand in ChatGPT, Gemini, Claude, and Perplexity.</p>
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700"><Zap className="w-4 h-4 text-emerald-500" />24/7 AI visibility monitoring</div>
              <div className="flex items-center gap-2 text-sm text-gray-700"><Zap className="w-4 h-4 text-emerald-500" />Ready-to-paste schema fixes</div>
              <div className="flex items-center gap-2 text-sm text-gray-700"><Zap className="w-4 h-4 text-emerald-500" />Competitor gap analysis</div>
              <div className="flex items-center gap-2 text-sm text-gray-700"><Zap className="w-4 h-4 text-emerald-500" />Weekly AI audit reports</div>
            </div>
            <a href="/?pricing=true#pricing" className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold">Upgrade Now - Starting at $49/mo</a>
          </div>
        </div>
      )}

      {/* GitHub Section */}
      {!hideGitHub && websiteId && !isFreePlan && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          {!githubConnected ? (
            <button onClick={handleConnect} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm">
              <GitPullRequest size={18} /> Connect GitHub to Auto-Deploy Fixes
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><CheckCircle className="text-emerald-500" size={16} /><span className="text-emerald-600 text-sm font-medium">GitHub Connected</span></div>
                <button onClick={handleDisconnect} disabled={disconnecting} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"><Unlink size={12} />Disconnect</button>
              </div>
              {githubRepo ? (
                <>
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                    <span className="text-gray-900 text-sm font-medium">{githubRepo}</span>
                    <button onClick={() => { setSelectedRepo(githubRepo); fetchRepos(); setShowRepoSelect(true); }} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Change</button>
                  </div>
                  <button onClick={handlePushAll} disabled={pushingAll || recommendations.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm">
                    {pushingAll ? <LoadingSpinner size={16} /> : <GitPullRequest size={16} />} Push All Fixes to GitHub
                  </button>
                </>
              ) : (
                <button onClick={() => { fetchRepos(); setShowRepoSelect(true); }} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-semibold">Select a Repository</button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Free Plan */}
      {isFreePlan && recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-2xl p-6 text-center">
          <Eye className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-gray-900 font-bold mb-2">{recommendations.length} AI Visibility Fixes Detected</h3>
          <p className="text-sm text-gray-500 mb-4">Upgrade to unlock ready-to-paste schema fixes that boost your AI visibility.</p>
          <button onClick={() => setShowUpgradeModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium">View Complete Analysis & Fixes</button>
        </div>
      )}

      {/* Paid Plan Cards */}
      {!isFreePlan && recommendations.map((rec) => (
        <div key={rec.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-emerald-200 hover:shadow-sm transition-all">
          <div className="flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${rec.priority === 'high' ? 'bg-red-500' : rec.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
            <div className="flex-1 min-w-0">
              <h3 className="text-gray-900 font-semibold">{rec.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{rec.description}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium ${rec.priority === 'high' ? 'bg-red-100 text-red-700' : rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{rec.priority}</span>
                <span className="text-xs text-gray-400">Impact: {rec.impact_score}/10</span>
              </div>
              {rec.fix_code && (
                <details className="mt-3 group">
                  <summary className="text-sm text-emerald-600 hover:text-emerald-700 cursor-pointer font-medium flex items-center gap-1">
                    <Code size={14} /> View Fix Code <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="mt-2 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100 border-b border-gray-200">
                      <span className="text-xs text-gray-400 font-medium">Copy-paste this code into your website</span>
                      <button
                        onClick={(e) => { e.preventDefault(); copyFixCode(rec.fix_code, rec.id); }}
                        className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        {copiedId === rec.id ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Code</>}
                      </button>
                    </div>
                    <pre className="p-3 text-xs text-gray-600 overflow-x-auto overflow-y-auto" style={{ maxHeight: '200px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {rec.fix_code}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}