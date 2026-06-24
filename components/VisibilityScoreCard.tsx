import { TrendingUp, TrendingDown, Lock, Shield } from 'lucide-react';

export default function VisibilityScoreCard({ score, previousScore, lastAuditAt, isFreePlan = false }: { score: number; previousScore: number; lastAuditAt: string | null; isFreePlan?: boolean }) {
  const diff = score - previousScore;
  const trend = diff >= 0;
  const TrendIcon = trend ? TrendingUp : TrendingDown;
  const trendColor = trend ? 'text-emerald-600' : 'text-red-500';

  let ringColor = 'border-red-400';
  let bgGlow = 'shadow-red-100';
  let label = 'At Risk';
  if (score >= 90) { ringColor = 'border-emerald-500'; bgGlow = 'shadow-emerald-100'; label = 'Dominant'; }
  else if (score >= 70) { ringColor = 'border-emerald-400'; bgGlow = 'shadow-emerald-50'; label = 'Strong'; }
  else if (score >= 40) { ringColor = 'border-amber-400'; bgGlow = 'shadow-amber-50'; label = 'Improving'; }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center relative shadow-sm">
      {isFreePlan && (
        <div className="absolute top-3 right-3">
          <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">Sample Data</span>
        </div>
      )}

      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        {isFreePlan ? 'Estimated Visibility' : 'AI Visibility Score'}
      </p>

      <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full border-4 ${ringColor} mb-4 bg-white shadow-xl ${bgGlow} ${isFreePlan ? 'opacity-80' : ''}`}>
        <span className="text-5xl font-extrabold text-gray-900">{score}</span>
      </div>

      <p className="text-sm font-semibold text-gray-500 mb-2">{label}</p>

      {previousScore > 0 && !isFreePlan && (
        <div className="flex items-center justify-center gap-1.5 text-sm mb-1">
          <TrendIcon size={16} className={trendColor} />
          <span className={`font-semibold ${trendColor}`}>{Math.abs(diff)} points</span>
          <span className="text-gray-400">since last audit</span>
        </div>
      )}

      {lastAuditAt && !isFreePlan && (
        <p className="text-xs text-gray-400">Last updated: {new Date(lastAuditAt).toLocaleDateString()}</p>
      )}

      {isFreePlan && (
        <div className="mt-4 bg-gradient-to-r from-emerald-50 to-white border border-emerald-200 rounded-xl p-4">
          <p className="text-sm text-gray-700 font-medium mb-2">Get accurate, real-time AI visibility analysis</p>
          <a href="/?pricing=true#pricing" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-200">
            <Lock size={14} /> Upgrade to Pro
          </a>
        </div>
      )}
    </div>
  );
}