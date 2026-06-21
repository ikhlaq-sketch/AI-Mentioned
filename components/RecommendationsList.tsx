'use client';

import { useState } from 'react';
import { Copy, GitPullRequest, CheckCircle, Lock, ArrowUpCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export default function RecommendationsList({
  recommendations,
  websiteId,
  userId,
  githubConnected,
  githubRepo,
  isFreePlan = false,
}: {
  recommendations: any[];
  websiteId: string;
  userId: string;
  githubConnected: boolean;
  githubRepo?: string;
  isFreePlan?: boolean;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [creatingPR, setCreatingPR] = useState<string | null>(null);
  const [markingDeployed, setMarkingDeployed] = useState<string | null>(null);
  const [deployedIds, setDeployedIds] = useState<Set<string>>(new Set());
  const [repoName, setRepoName] = useState(githubRepo || '');
  const [connectingGitHub, setConnectingGitHub] = useState(false);

  const copyFixCode = (code: string, id: string) => {
    if (isFreePlan) return;
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const createPR = async (rec: any) => {
    if (isFreePlan || !githubConnected) return;
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

  const markDeployed = async (recId: string) => {
    setMarkingDeployed(recId);
    try {
      await fetch('/api/recommendations/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendation_id: recId, website_id: websiteId }),
      });
      setDeployedIds(prev => new Set(prev).add(recId));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setMarkingDeployed(null);
    }
  };

  const handleConnectGitHub = async () => {
    if (!repoName) { alert('Please enter a repository name (e.g., owner/repo)'); return; }
    setConnectingGitHub(true);
    try {
      const res = await fetch('/api/github/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website_id: websiteId, repo: repoName }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to connect GitHub');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setConnectingGitHub(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* GitHub Repo Input */}
      {!githubConnected && !isFreePlan && (
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4 mb-4">
          <h3 className="text-white font-medium mb-2">Connect GitHub Repository</h3>
          <p className="text-sm text-[#94a3b8] mb-3">Enter your repository to enable automatic Pull Requests for fixes.</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="owner/repository"
              className="flex-1 bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm"
            />
            <button
              onClick={handleConnectGitHub}
              disabled={connectingGitHub}
              className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-white text-sm flex items-center gap-2"
            >
              {connectingGitHub ? <LoadingSpinner size={14} /> : <GitPullRequest size={14} />}
              Connect
            </button>
          </div>
        </div>
      )}

      {githubConnected && (
        <div className="bg-green-400/10 border border-green-400/30 rounded-lg p-3 mb-4 flex items-center gap-2">
          <CheckCircle className="text-green-400" size={16} />
          <span className="text-green-400 text-sm">GitHub Connected: {githubRepo}</span>
        </div>
      )}

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
                {deployedIds.has(rec.id) && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-green-400/10 text-green-400">
                    Deployed
                  </span>
                )}
              </div>

              {rec.fix_code && (
                <div className="mt-3 relative">
                  <pre className={`bg-[#0f172a] p-3 rounded text-xs text-[#94a3b8] overflow-x-auto max-h-32 ${
                    isFreePlan ? 'blur-sm select-none' : ''
                  }`}>
                    {rec.fix_code.substring(0, 300)}...
                  </pre>
                  {isFreePlan && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Lock className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                        <a href="/?pricing=true#pricing" className="text-xs text-purple-400 hover:text-purple-300">
                          Upgrade to unlock
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {rec.fix_instructions && (
                <details className="mt-2">
                  <summary className="text-xs text-indigo-400 cursor-pointer hover:text-indigo-300">
                    View Implementation Steps
                  </summary>
                  <p className="text-xs text-[#94a3b8] mt-1 whitespace-pre-line">{rec.fix_instructions}</p>
                </details>
              )}
            </div>

            <div className="flex flex-col items-end ml-4 space-y-2">
              {rec.fix_code && !isFreePlan && (
                <button onClick={() => copyFixCode(rec.fix_code, rec.id)} className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300">
                  <Copy size={14} />
                  {copiedId === rec.id ? 'Copied' : 'Copy Fix'}
                </button>
              )}

              {githubConnected && !isFreePlan && !deployedIds.has(rec.id) && (
                <button onClick={() => createPR(rec)} disabled={creatingPR === rec.id} className="flex items-center gap-1 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-500 disabled:opacity-50">
                  {creatingPR === rec.id ? <LoadingSpinner size={14} /> : <GitPullRequest size={14} />}
                  Create PR
                </button>
              )}

              {!isFreePlan && !deployedIds.has(rec.id) && (
                <button onClick={() => markDeployed(rec.id)} disabled={markingDeployed === rec.id} className="flex items-center gap-1 text-sm text-green-400 hover:text-green-300">
                  {markingDeployed === rec.id ? <LoadingSpinner size={14} /> : <CheckCircle size={14} />}
                  Mark Deployed
                </button>
              )}

              {isFreePlan && (
                <a href="/?pricing=true#pricing" className="flex items-center gap-1 text-sm bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-500">
                  <ArrowUpCircle size={14} />
                  Upgrade
                </a>
              )}
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