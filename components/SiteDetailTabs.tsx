'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, MessageSquare, Search, Lightbulb, Loader2, Plus } from 'lucide-react';
import VisibilityScoreCard from './VisibilityScoreCard';
import CompetitorTable from './CompetitorTable';
import RootCauseList from './RootCauseList';
import AuditTable from './AuditTable';
import RecommendationsList from './RecommendationsList';

export default function SiteDetailTabs({ site, latestMentions, userId, userPlan = 'free' }: { site: any; latestMentions: any[]; userId: string; userPlan?: string }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(!site.last_audit_at);
  const [prompts, setPrompts] = useState(site.prompts || []);
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [newPrompt, setNewPrompt] = useState('');
  const router = useRouter();
  const isFreePlan = userPlan === 'free';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'prompts', label: 'Prompts', icon: MessageSquare },
    { id: 'audits', label: 'Audit History', icon: Search },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
  ];

  useEffect(() => {
    if (!site.last_audit_at) {
      const interval = setInterval(() => router.refresh(), 3000);
      return () => clearInterval(interval);
    } else {
      setIsLoading(false);
    }
  }, [site.last_audit_at, router]);

  const addPrompt = async () => {
    if (!newPrompt.trim()) return;
    const res = await fetch('/api/prompts/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ website_id: site.id, user_id: userId, prompt_text: newPrompt }),
    });
    if (res.ok) {
      const data = await res.json();
      setPrompts([...prompts, data]);
      setNewPrompt('');
      setShowAddPrompt(false);
    }
  };

  const togglePrompt = async (id: string, isActive: boolean) => {
    await fetch('/api/prompts/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt_id: id, is_active: !isActive }),
    });
    setPrompts(prompts.map((p: any) => p.id === id ? { ...p, is_active: !isActive } : p));
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
          <VisibilityScoreCard score={site.visibility_score || 0} previousScore={site.previous_score || 0} lastAuditAt={site.last_audit_at} isFreePlan={isFreePlan} />
          <CompetitorTable competitors={site.competitors || []} brandName={site.brand_name} mentions={latestMentions} />
          <RootCauseList crawlData={site.crawl_data?.[0] || null} mentions={latestMentions} brandName={site.brand_name} competitors={site.competitors || []} />
        </div>
      )}

      {activeTab === 'prompts' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Active Prompts</h3>
              <p className="text-xs text-gray-500 mt-0.5">These prompts are used when auditing your site.</p>
            </div>
            <button onClick={() => setShowAddPrompt(true)} className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700">
              <Plus size={16} /> Add Custom Prompt
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

          {/* ✅ Always show default prompt if no custom prompts */}
          {prompts.length > 0 ? (
            <div className="space-y-3">
              {prompts.map((prompt: any) => (
                <div key={prompt.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                  <p className="text-gray-900 text-sm font-medium">{prompt.prompt_text}</p>
                  <button onClick={() => togglePrompt(prompt.id, prompt.is_active)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${prompt.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                    {prompt.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-gray-900 text-sm font-medium">
                What are the top options for {site.category || 'your industry'}?
              </p>
              <p className="text-xs text-gray-400 mt-1">Default prompt — used for all audits. Add a custom prompt above to customize.</p>
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