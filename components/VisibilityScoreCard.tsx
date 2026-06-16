import { TrendingUp, TrendingDown } from 'lucide-react';

export default function VisibilityScoreCard({
  score,
  previousScore,
  lastAuditAt,
}: {
  score: number;
  previousScore: number;
  lastAuditAt: string | null;
}) {
  const diff = score - previousScore;
  const trend = diff >= 0;
  const TrendIcon = trend ? TrendingUp : TrendingDown;
  const trendColor = trend ? 'text-green-400' : 'text-red-400';

  let ringColor = 'text-red-400';
  if (score >= 90) ringColor = 'text-indigo-400';
  else if (score >= 70) ringColor = 'text-green-400';
  else if (score >= 40) ringColor = 'text-amber-400';

  return (
    <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-center">
      <p className="text-sm text-[#94a3b8] mb-2">AI Visibility Score</p>
      <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full border-4 ${ringColor} mb-3`}>
        <span className="text-4xl font-bold text-white">{score}</span>
      </div>
      {previousScore > 0 && (
        <div className="flex items-center justify-center gap-1 text-sm">
          <TrendIcon size={16} className={trendColor} />
          <span className={trendColor}>{Math.abs(diff)} points</span>
          <span className="text-[#94a3b8]">since last audit</span>
        </div>
      )}
      {lastAuditAt && (
        <p className="text-xs text-[#64748b] mt-1">
          Last updated: {new Date(lastAuditAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}