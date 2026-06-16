export default function RootCauseList({
  crawlData,
  mentions,
  brandName,
  competitors,
}: {
  crawlData: any;
  mentions: any[];
  brandName: string;
  competitors: any[];
}) {
  const causes: string[] = [];

  const brandMentions = mentions.filter(m => m.entity_type === 'brand' && m.was_mentioned).length;
  if (brandMentions < mentions.length * 0.3) {
    causes.push(`Your brand "${brandName}" appeared in only ${brandMentions} out of ${mentions.length} AI answers, indicating low entity recognition.`);
  }

  if (crawlData && (!crawlData.schema_markup || crawlData.schema_markup.length === 0)) {
    causes.push('Your website has no structured data (schema markup) detected. Competitors with FAQ or Organization schema are more likely to be cited by AI models.');
  }

  if (causes.length === 0) {
    causes.push('Your brand is performing well, but continue optimizing structured data and content to maintain visibility.');
  }

  return (
    <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Root Cause Insights</h3>
      <ul className="space-y-3">
        {causes.map((cause, i) => (
          <li key={i} className="text-sm text-[#94a3b8] flex gap-2">
            <span className="text-indigo-400 font-bold">•</span>
            {cause}
          </li>
        ))}
      </ul>
    </div>
  );
}