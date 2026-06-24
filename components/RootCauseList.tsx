import { AlertCircle, Lightbulb, Search } from 'lucide-react';

export default function RootCauseList({ crawlData, mentions, brandName, competitors }: { crawlData: any; mentions: any[]; brandName: string; competitors: any[] }) {
  const causes: { icon: any; color: string; text: string }[] = [];

  const brandMentions = mentions.filter(m => m.entity_type === 'brand' && m.was_mentioned).length;
  const totalQueries = mentions.length || 1;

  if (brandMentions < totalQueries * 0.3) {
    causes.push({
      icon: AlertCircle,
      color: 'text-red-500 bg-red-50',
      text: `Your brand "${brandName}" appeared in only ${brandMentions} out of ${totalQueries} AI answers. This indicates low entity recognition across AI models.`,
    });
  }

  if (crawlData && (!crawlData.schema_markup || crawlData.schema_markup.length === 0)) {
    causes.push({
      icon: Search,
      color: 'text-amber-500 bg-amber-50',
      text: 'No structured data (schema markup) detected on your website. Competitors with FAQ and Organization schema are significantly more likely to be cited by AI models.',
    });
  }

  if (crawlData && (!crawlData.h1_headings || crawlData.h1_headings.length === 0)) {
    causes.push({
      icon: Lightbulb,
      color: 'text-blue-500 bg-blue-50',
      text: 'Missing H1 headings make it harder for AI models to understand your page structure and main topics.',
    });
  }

  if (causes.length === 0) {
    causes.push({
      icon: Lightbulb,
      color: 'text-emerald-500 bg-emerald-50',
      text: 'Your brand is performing well! Continue optimizing structured data and publishing fresh content to maintain and improve your AI visibility.',
    });
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