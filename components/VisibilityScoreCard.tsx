'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Lock } from 'lucide-react';

export default function VisibilityScoreCard({ score, previousScore, lastAuditAt, isFreePlan = false }: { score: number; previousScore: number; lastAuditAt: string | null; isFreePlan?: boolean }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const diff = score - previousScore;
  const trend = diff >= 0;
  const percentage = Math.min(score, 100);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (percentage / 100) * circumference;

  let strokeColor = '#ef4444';
  let glowColor = 'rgba(239,68,68,0.15)';
  let label = 'At Risk';
  if (score >= 90) { strokeColor = '#10b981'; glowColor = 'rgba(16,185,129,0.2)'; label = 'Dominant'; }
  else if (score >= 70) { strokeColor = '#10b981'; glowColor = 'rgba(16,185,129,0.15)'; label = 'Strong'; }
  else if (score >= 40) { strokeColor = '#f59e0b'; glowColor = 'rgba(245,158,11,0.15)'; label = 'Improving'; }

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 200);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 text-center relative shadow-sm">
      <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        {isFreePlan ? 'Estimated Visibility' : 'AI Visibility Score'}
      </p>

      <div className="relative inline-flex items-center justify-center mb-4">
        <div className="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px]">
          <svg width="100%" height="100%" viewBox="0 0 140 140" className="-rotate-90">
            <circle cx="70" cy="70" r="54" fill="none" stroke="#f1f5f9" strokeWidth="10" />
            <circle 
              cx="70" cy="70" r="54" fill="none" stroke={strokeColor} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1.2s ease-out', filter: `drop-shadow(0 0 8px ${glowColor})` }} 
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">{animatedScore}</span>
            <span className="text-[10px] sm:text-xs text-gray-400 font-medium">/100</span>
          </div>
        </div>
      </div>

      <p className="text-xs sm:text-sm font-semibold text-gray-500 mb-2">{label}</p>

      {previousScore > 0 && !isFreePlan && (
        <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm mb-1">
          {trend ? <TrendingUp size={16} className="text-emerald-600" /> : <TrendingDown size={16} className="text-red-500" />}
          <span className={`font-semibold ${trend ? 'text-emerald-600' : 'text-red-500'}`}>{Math.abs(diff)} points</span>
          <span className="text-gray-400">since last audit</span>
        </div>
      )}

      {lastAuditAt && !isFreePlan && (
        <p className="text-[10px] sm:text-xs text-gray-400">Last updated: {new Date(lastAuditAt).toLocaleDateString()}</p>
      )}

      {isFreePlan && (
        <div className="mt-4 bg-gradient-to-r from-emerald-50 to-white border border-emerald-200 rounded-xl p-4">
          <p className="text-xs sm:text-sm text-gray-700 font-medium mb-2">
            <span className="text-emerald-600"></span> Upgrade for automated fixes + custom prompts tailored to your brand.
          </p>
          <a href="/?pricing=true#pricing" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 sm:px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-200 w-full sm:w-auto justify-center">
            <Lock size={14} /> Upgrade to Pro
          </a>
        </div>
      )}
    </div>
  );
}