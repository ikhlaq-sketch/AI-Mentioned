export default function CompetitorTable({
  competitors,
  brandName,
  mentions,
}: {
  competitors: any[];
  brandName: string;
  mentions: any[];
}) {
  const totalQueries = mentions.length || 1;
  const brandMentions = mentions.filter(m => m.entity_type === 'brand' && m.was_mentioned).length;
  const competitorStats = competitors.map((comp) => {
    const compMentions = mentions.filter(m => m.entity_type === 'competitor' && m.entity_name === comp.brand_name && m.was_mentioned).length;
    return { ...comp, mentions: compMentions, percentage: Math.round((compMentions / totalQueries) * 100) };
  });

  return (
    <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Competitor Comparison</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#334155]">
              <th className="text-left p-2 text-[#94a3b8]">Brand</th>
              <th className="text-left p-2 text-[#94a3b8]">Mentions</th>
              <th className="text-left p-2 text-[#94a3b8]">Visibility</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#334155] bg-indigo-400/5">
              <td className="p-2 text-white font-medium">{brandName} (You)</td>
              <td className="p-2 text-white">{brandMentions}/{totalQueries}</td>
              <td className="p-2 text-indigo-400 font-medium">{Math.round((brandMentions / totalQueries) * 100)}%</td>
            </tr>
            {competitorStats.map((comp) => (
              <tr key={comp.id} className="border-b border-[#334155]">
                <td className="p-2 text-white">{comp.brand_name}</td>
                <td className="p-2 text-[#94a3b8]">{comp.mentions}/{totalQueries}</td>
                <td className="p-2 text-[#94a3b8]">{comp.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}