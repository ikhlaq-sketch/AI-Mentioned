'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, MessageSquare, Search, Lightbulb, Loader2, Plus, Edit3, Trash2, TrendingUp } from 'lucide-react';
import VisibilityScoreCard from './VisibilityScoreCard';
import CompetitorTable from './CompetitorTable';
import RootCauseList from './RootCauseList';
import AuditTable from './AuditTable';
import RecommendationsList from './RecommendationsList';

export default function SiteDetailTabs({ site, latestMentions, userId, userPlan = 'free' }: { site: any; latestMentions: any[]; userId: string; userPlan?: string }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(!site.last_audit_at);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [promptScores, setPromptScores] = useState<Record<string, number>>({});
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [newPrompt, setNewPrompt] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [displayScore, setDisplayScore] = useState(site.visibility_score || 0);
  const [displayMentions, setDisplayMentions] = useState(latestMentions);
  const router = useRouter();
  const isFreePlan = userPlan === 'free';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'prompts', label: 'Prompts', icon: MessageSquare },
    { id: 'audits', label: 'Audit History', icon: Search },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
  ];

  // Fetch prompts and their latest scores
  useEffect(() => {
    async function fetchPromptsWithScores() {
      const res = await fetch(`/api/prompts/list?website_id=${site.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setPrompts(data);
        // Fetch scores for all prompts
        const scores: Record<string, number> = {};
        for (const p of data) {
          const scoreRes = await fetch(`/api/prompts/score?website_id=${site.id}&prompt_text=${encodeURIComponent(p.prompt_text)}`);
          if (scoreRes.ok) {
            const scoreData = await scoreRes.json();
            scores[p.prompt_text] = scoreData.score || 0;
          }
        }
        setPromptScores(scores);
      }
    }
    fetchPromptsWithScores();
  }, [site.id]);

  useEffect(() => {
    if (!site.last_audit_at) {
      const interval = setInterval(() => router.refresh(), 3000);
      return () => clearInterval(interval);
    } else {
      setIsLoading(false);
    }
  }, [site.last_audit_at, router]);

  const handlePromptClick = async (prompt: any) => {
    const res = await fetch(`/api/prompts/score?website_id=${site.id}&prompt_text=${encodeURIComponent(prompt.prompt_text)}`);
    if (res.ok) {
      const data = await res.json();
      setDisplayScore(data.score || 0);
      setDisplayMentions(data.mentions || []);
    }
  };

  const addPrompt = async () => {
    if (!newPrompt.trim()) return;
    const res = await fetch('/api/prompts/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ website_id: site.id, user_id: userId, prompt_text: newPrompt }) });
    if (res.ok) { const data = await res.json(); setPrompts([...prompts, data]); setNewPrompt(''); setShowAddPrompt(false); }
  };

  const updatePrompt = async (id: string) => {
    await fetch('/api/prompts/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt_id: id, prompt_text: editText }) });
    setPrompts(prompts.map((p: any) => p.id === id ? { ...p, prompt_text: editText } : p));
    setEditingId(null);
  };

  const togglePrompt = async (id: string, isActive: boolean) => {
    await fetch('/api/prompts/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt_id: id, is_active: !isActive }) });
    setPrompts(prompts.map((p: any) => p.id === id ? { ...p, is_active: !isActive } : p));
  };

  const deletePrompt = async (id: string) => {
    await fetch('/api/prompts/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt_id: id }) });
    setPrompts(prompts.filter((p: any) => p.id !== id));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
        <p className="text-gray-900 font-semibold text-lg">Running AI Analysis...</p>
        <p className="text-sm text-gray-500 mt-2">{isFreePlan ? 'Generating visibility insights...' : 'Querying ChatGPT, Gemini, Claude & Perplexity...'}</p>
        <div className="flex gap-1 mt-4">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${activeTab === tab.id ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <VisibilityScoreCard score={displayScore} previousScore={site.previous_score || 0} lastAuditAt={site.last_audit_at} isFreePlan={isFreePlan} />

          {/* ✅ Recent Prompts Section */}
          {prompts.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Recent Prompts</h3>
                <button onClick={() => setActiveTab('prompts')} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                  Manage prompts →
                </button>
              </div>
              <div className="space-y-2">
                {prompts.slice(0, 5).map((prompt: any, index: number) => (
                  <div
                    key={prompt.id}
                    onClick={() => handlePromptClick(prompt)}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-emerald-50 cursor-pointer transition-colors border border-transparent hover:border-emerald-200"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${index < 4 ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                      <p className="text-sm text-gray-700 truncate">{prompt.prompt_text}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-3 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${index < 4 ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {index < 4 ? 'Weekly' : 'Daily'}
                      </span>
                      {promptScores[prompt.prompt_text] !== undefined && (
                        <span className={`text-sm font-bold ${promptScores[prompt.prompt_text] >= 70 ? 'text-emerald-600' : promptScores[prompt.prompt_text] >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                          {promptScores[prompt.prompt_text]}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {prompts.length > 5 && (
                <p className="text-xs text-gray-400 text-center mt-3">
                  +{prompts.length - 5} more prompts — <button onClick={() => setActiveTab('prompts')} className="text-emerald-600 hover:text-emerald-700">view all</button>
                </p>
              )}
            </div>
          )}

          <CompetitorTable competitors={site.competitors || []} brandName={site.brand_name} mentions={displayMentions} />
          <RootCauseList crawlData={site.crawl_data?.[0] || null} mentions={displayMentions} brandName={site.brand_name} competitors={site.competitors || []} />
        </div>
      )}

      {activeTab === 'prompts' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">AI Audit Prompts</h3>
              <p className="text-sm text-gray-500 mt-0.5">Manage the questions our AI models ask about your brand.</p>
            </div>
            <button onClick={() => setShowAddPrompt(true)} className="flex items-center gap-1.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-all shadow-sm">
              <Plus size={16} /> Add Prompt
            </button>
          </div>

          {showAddPrompt && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
              <input type="text" value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="e.g. What are the top options for Cloud Hosting?"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm mb-3 focus:outline-none focus:border-emerald-400" />
              <div className="flex gap-2">
                <button onClick={addPrompt} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Save</button>
                <button onClick={() => setShowAddPrompt(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">Cancel</button>
              </div>
            </div>
          )}

          {prompts.length > 0 ? (
            <div className="space-y-2">
              {prompts.map((prompt: any, index: number) => (
                <div key={prompt.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm font-medium truncate">{prompt.prompt_text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${index < 4 ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {index < 4 ? '📅 Weekly' : '🔄 Daily'}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${prompt.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                          {prompt.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <button onClick={() => togglePrompt(prompt.id, prompt.is_active)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${prompt.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>On/Off</button>
                      <button onClick={() => { setEditingId(prompt.id); setEditText(prompt.prompt_text); }} className="text-gray-400 hover:text-emerald-600"><Edit3 size={14} /></button>
                      <button onClick={() => deletePrompt(prompt.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No prompts saved yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'audits' && <AuditTable audits={site.audits || []} websiteId={site.id} />}

      {activeTab === 'recommendations' && (
        <RecommendationsList recommendations={site.recommendations || []} websiteId={site.id} userId={userId} githubConnected={!!site.github_token_encrypted} githubRepo={site.github_repo} isFreePlan={isFreePlan} />
      )}
    </div>
  );
}