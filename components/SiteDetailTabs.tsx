'use client';

import { useState } from 'react';
import { BarChart3, MessageSquare, Search, Lightbulb } from 'lucide-react';
import VisibilityScoreCard from './VisibilityScoreCard';
import CompetitorTable from './CompetitorTable';
import RootCauseList from './RootCauseList';
import AuditTable from './AuditTable';
import RecommendationsList from './RecommendationsList';

export default function SiteDetailTabs({
  site,
  latestMentions,
  userId,
}: {
  site: any;
  latestMentions: any[];
  userId: string;
}) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'prompts', label: 'Prompts', icon: MessageSquare },
    { id: 'audits', label: 'Audit History', icon: Search },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
  ];

  return (
    <div>
      {/* Tab navigation */}
      <div className="flex border-b border-[#334155] mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-[#94a3b8] hover:text-white hover:border-gray-600'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* ✅ FIX: Fallback values for score and previousScore */}
          <VisibilityScoreCard
            score={site.visibility_score || 0}
            previousScore={site.previous_score || 0}
            lastAuditAt={site.last_audit_at}
          />
          <CompetitorTable
            competitors={site.competitors || []}
            brandName={site.brand_name}
            mentions={latestMentions}
          />
          <RootCauseList
            crawlData={site.crawl_data?.[0] || null}
            mentions={latestMentions}
            brandName={site.brand_name}
            competitors={site.competitors || []}
          />
        </div>
      )}

      {activeTab === 'prompts' && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Active Prompts</h3>
          {site.prompts && site.prompts.length > 0 ? (
            <ul className="space-y-3">
              {site.prompts.map((prompt: any) => (
                <li key={prompt.id} className="bg-[#1e293b] p-4 rounded-lg border border-[#334155] flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm">{prompt.prompt_text}</p>
                    <span className={`text-xs ${prompt.is_active ? 'text-green-400' : 'text-gray-500'}`}>
                      {prompt.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[#94a3b8] text-sm">No prompts configured. Add one to customize audit questions.</p>
          )}
        </div>
      )}

      {activeTab === 'audits' && (
        <AuditTable audits={site.audits || []} websiteId={site.id} />
      )}

      {activeTab === 'recommendations' && (
        <RecommendationsList
          recommendations={site.recommendations || []}
          websiteId={site.id}
          userId={userId}
          githubConnected={!!site.github_token_encrypted}
          githubRepo={site.github_repo}
        />
      )}
    </div>
  );
}