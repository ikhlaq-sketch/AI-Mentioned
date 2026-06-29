import { AlertCircle, Lightbulb, Search, TrendingDown } from 'lucide-react';

export default function RootCauseList({ crawlData, mentions, brandName, competitors }: { crawlData: any; mentions: any[]; brandName: string; competitors: any[] }) {
  const causes: { icon: any; color: string; text: string }[] = [];
  const totalQueries = mentions.length || 1;
  const brandMentions = mentions.filter(m => m.entity_type === 'brand' && m.was_mentioned).length;
  const competitorMentions = mentions.filter(m => m.entity_type === 'competitor' && m.was_mentioned).length;
  const brandRate = Math.round((brandMentions / totalQueries) * 100);

  if (totalQueries === 0) {
    causes.push({ icon: AlertCircle, color: 'text-gray-500 bg-gray-50', text: 'No mention data available yet. Run an audit to get insights.' });
  } else {
    if (brandRate < 30) {
      causes.push({ icon: TrendingDown, color: 'text-red-500 bg-red-50', text: `Your brand "${brandName}" appeared in only ${brandRate}% of AI responses. Competitors are being recommended more frequently.` });
    }
    if (competitorMentions > brandMentions) {
      const topCompetitor = competitors[0] || 'competitors';
      causes.push({ icon: Search, color: 'text-amber-500 bg-amber-50', text: `${topCompetitor} is mentioned more often than your brand. Consider adding structured data and comparison content to compete.` });
    }
    if (crawlData && (!crawlData.schema_markup || crawlData.schema_markup.length === 0)) {
      causes.push({ icon: AlertCircle, color: 'text-red-500 bg-red-50', text: 'No schema markup detected. Adding FAQ and Organization schema significantly improves AI visibility.' });
    }
    if (brandRate >= 70) {
      causes.push({ icon: Lightbulb, color: 'text-emerald-500 bg-emerald-50', text: 'Your brand is performing well! To reach Dominant status (90+), focus on getting mentioned across all 4 AI models consistently.' });
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Root Cause Insights</h3>
      <div className="space-y-3">
        {causes.map((cause, i) => (
          <div key={i} className="flex gap-3 p-3 rounded-xl bg-gray-50">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cause.color}`}>
              <cause.icon size={16} />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{cause.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}