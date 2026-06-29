'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, MessageSquare, Search, Lightbulb, Loader2, Plus, Edit3, Trash2, Clock, ArrowRight, Lock } from 'lucide-react';
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
  const [promptLastUsed, setPromptLastUsed] = useState<Record<string, string>>({});
  const [promptsLoading, setPromptsLoading] = useState(true);
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [newPrompt, setNewPrompt] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [displayScore, setDisplayScore] = useState(site.visibility_score || 0);
  const [displayMentions, setDisplayMentions] = useState(latestMentions);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const router = useRouter();
  const isFreePlan = userPlan === 'free';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'prompts', label: 'Prompts', icon: MessageSquare },
    { id: 'audits', label: 'Audit History', icon: Search },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
  ];

  useEffect(() => {
    async function fetchPromptsWithScores() {
      setPromptsLoading(true);
      const res = await fetch(`/api/prompts/list?website_id=${site.id}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const scoreRes = await fetch(`/api/prompts/score?website_id=${site.id}&all=true`);
        if (scoreRes.ok) {
          const scoreData = await scoreRes.json();
          const scores: Record<string, number> = {};
          const lastUsed: Record<string, string> = {};
          if (scoreData.prompts) {
            for (const [prompt, info] of Object.entries(scoreData.prompts)) {
              scores[prompt] = (info as any).score || 0;
              lastUsed[prompt] = (info as any).lastUsed || '';
            }
          }
          setPromptScores(scores);
          setPromptLastUsed(lastUsed);
          const sorted = [...data].sort((a, b) => {
            const aTime = lastUsed[a.prompt_text] ? new Date(lastUsed[a.prompt_text]).getTime() : 0;
            const bTime = lastUsed[b.prompt_text] ? new Date(lastUsed[b.prompt_text]).getTime() : 0;
            return bTime - aTime;
          });
          setPrompts(sorted);
        }
      }
      setPromptsLoading(false);
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
    setSelectedPrompt(prompt.prompt_text);
    const res = await fetch(`/api/prompts/score?website_id=${site.id}&prompt_text=${encodeURIComponent(prompt.prompt_text)}`);
    if (res.ok) {
      const data = await res.json();
      setDisplayScore(data.score || 0);
      setDisplayMentions(data.mentions || []);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 animate-pulse"><Loader2 className="w-8 h-8 text-emerald-600 animate-spin" /></div>
        <p className="text-gray-900 font-semibold text-lg">Running AI Analysis...</p>
        <p className="text-sm text-gray-500 mt-2">{isFreePlan ? 'Generating visibility insights...' : 'Querying ChatGPT, Gemini, Claude & Perplexity...'}</p>
        <div className="flex gap-1 mt-4"><span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} /><span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} /><span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} /></div>
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

          {/* Recent Prompts */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Recent Prompts</h3>
              {prompts.length > 0 && <button onClick={() => setActiveTab('prompts')} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Manage prompts →</button>}
            </div>
            {promptsLoading ? (
              <div className="animate-pulse space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}<p className="text-xs text-gray-400 text-center pt-1">Loading prompts...</p></div>
            ) : prompts.length > 0 ? (
              <div className="space-y-1.5">
                {prompts.slice(0, 5).map((prompt: any) => {
                  const isSelected = selectedPrompt === prompt.prompt_text;
                  const promptScore = promptScores[prompt.prompt_text];
                  return (
                    <div key={prompt.id} onClick={() => handlePromptClick(prompt)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-200'}`}>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${promptLastUsed[prompt.prompt_text] ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-700 truncate">{prompt.prompt_text}</p>
                          {promptLastUsed[prompt.prompt_text] && <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Clock size={10} />{new Date(promptLastUsed[prompt.prompt_text]).toLocaleDateString()}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-3 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(prompts.indexOf(prompt) < 4) ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{(prompts.indexOf(prompt) < 4) ? 'Weekly' : 'Daily'}</span>
                        {promptScore !== undefined && <span className={`text-sm font-bold min-w-[3ch] text-right ${promptScore >= 70 ? 'text-emerald-600' : promptScore >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{promptScore}%</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No prompts yet. Prompts appear after audits run.</p>
            )}
          </div>

          {/* Fixes Found Card */}
          {site.recommendations && site.recommendations.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-white border border-emerald-200 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center"><Lightbulb className="w-5 h-5 text-emerald-600" /></div>
                  <div>
                    <p className="text-gray-900 font-semibold">{site.recommendations.length} fix{site.recommendations.length !== 1 ? 'es' : ''} identified</p>
                    <p className="text-sm text-gray-500">We found optimizations that can improve your AI visibility score</p>
                  </div>
                </div>
                {isFreePlan ? (
                  <a href="/?pricing=true#pricing" className="flex items-center gap-1.5 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition-all shadow-sm">
                    <Lock size={14} /> Upgrade to View
                  </a>
                ) : (
                  <button onClick={() => setActiveTab('recommendations')} className="flex items-center gap-1.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-all shadow-sm">
                    Fix Now <ArrowRight size={14} />
                  </button>
                )}
              </div>
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
              <p className="text-sm text-gray-500 mt-0.5">These questions are asked to ChatGPT, Gemini, Claude during each audit.</p>
            </div>
            {isFreePlan ? (
              <a href="/?pricing=true#pricing" className="flex items-center gap-1.5 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition-all shadow-sm">
                <Lock size={14} /> Upgrade to Customize
              </a>
            ) : (
              <button onClick={() => setShowAddPrompt(true)} className="flex items-center gap-1.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-all shadow-sm">
                <Plus size={16} /> Add Prompt
              </button>
            )}
          </div>

          {showAddPrompt && !isFreePlan && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
              <input type="text" value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)} placeholder="e.g. What are the top options for Cloud Hosting?" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm mb-3 focus:outline-none focus:border-emerald-400" />
              <div className="flex gap-2">
                <button onClick={async () => { if (!newPrompt.trim()) return; const res = await fetch('/api/prompts/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ website_id: site.id, user_id: userId, prompt_text: newPrompt }) }); if (res.ok) { const data = await res.json(); setPrompts([...prompts, data]); setNewPrompt(''); setShowAddPrompt(false); } }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Save</button>
                <button onClick={() => setShowAddPrompt(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">Cancel</button>
              </div>
            </div>
          )}

          {isFreePlan && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4 text-center">
              <p className="text-sm text-purple-700 font-medium mb-2">Upgrade to customize prompts</p>
              <p className="text-xs text-purple-500 mb-3">Get 13 high-search-volume prompts tailored to your industry. Edit, add, or remove prompts to track exactly what matters.</p>
              <a href="/?pricing=true#pricing" className="inline-flex items-center gap-1.5 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition-all shadow-sm">
                <Lock size={14} /> Upgrade Plan
              </a>
            </div>
          )}

          {promptsLoading ? (
            <div className="animate-pulse space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}</div>
          ) : prompts.length > 0 ? (
            <div className="space-y-2">
              {prompts.map((prompt: any) => (
                <div key={prompt.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm font-medium truncate">{prompt.prompt_text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${(prompts.indexOf(prompt) < 4) ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{(prompts.indexOf(prompt) < 4) ? '📅 Weekly' : '🔄 Daily'}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${prompt.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>{prompt.is_active ? 'Active' : 'Inactive'}</span>
                        {promptScores[prompt.prompt_text] !== undefined && <span className={`text-xs font-bold ${promptScores[prompt.prompt_text] >= 70 ? 'text-emerald-600' : promptScores[prompt.prompt_text] >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{promptScores[prompt.prompt_text]}%</span>}
                      </div>
                    </div>
                    {!isFreePlan && (
                      <div className="flex items-center gap-2 ml-3">
                        <button onClick={async () => { await fetch('/api/prompts/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt_id: prompt.id, is_active: !prompt.is_active }) }); setPrompts(prompts.map((p: any) => p.id === prompt.id ? { ...p, is_active: !p.is_active } : p)); }} className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${prompt.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>On/Off</button>
                        <button onClick={() => { setEditingId(prompt.id); setEditText(prompt.prompt_text); }} className="text-gray-400 hover:text-emerald-600"><Edit3 size={14} /></button>
                        <button onClick={async () => { await fetch('/api/prompts/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt_id: prompt.id }) }); setPrompts(prompts.filter((p: any) => p.id !== prompt.id)); }} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    )}
                    {isFreePlan && (
                      <div className="flex items-center gap-2 ml-3">
                        <Lock size={14} className="text-gray-300" />
                      </div>
                    )}
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