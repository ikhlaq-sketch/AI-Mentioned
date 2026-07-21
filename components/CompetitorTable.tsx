import { TrendingUp, TrendingDown, Medal } from 'lucide-react';

export default function CompetitorTable({ competitors, brandName, mentions }: { competitors: any[]; brandName: string; mentions: any[] }) {
  const totalQueries = mentions.length || 1;
  const brandMentions = mentions.filter(m => m.entity_type === 'brand' && m.was_mentioned).length;
  const brandPercentage = Math.round((brandMentions / totalQueries) * 100);
  const competitorStats = competitors.map((comp) => {
    const compMentions = mentions.filter(m => m.entity_type === 'competitor' && m.entity_name === comp.brand_name && m.was_mentioned).length;
    return { ...comp, mentions: compMentions, percentage: Math.round((compMentions / totalQueries) * 100) };
  });

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Competitor Comparison</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[400px]">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-2 sm:p-3 text-gray-500 font-medium text-xs sm:text-sm">Brand</th>
              <th className="text-center p-2 sm:p-3 text-gray-500 font-medium text-xs sm:text-sm">Mentions</th>
              <th className="text-center p-2 sm:p-3 text-gray-500 font-medium text-xs sm:text-sm">Visibility</th>
              <th className="text-center p-2 sm:p-3 text-gray-500 font-medium text-xs sm:text-sm">vs You</th>
            </tr>
          </thead>
          <tbody>
            {/* Your Brand */}
            <tr className="border-b border-emerald-100 bg-emerald-50/50">
              <td className="p-2 sm:p-3">
                <div className="flex items-center gap-2">
                  <Medal size={14} className="text-emerald-500 flex-shrink-0" />
                  <span className="font-semibold text-gray-900 truncate">{brandName}</span>
                  <span className="text-[10px] sm:text-xs text-emerald-600 font-medium whitespace-nowrap">(You)</span>
                </div>
              </td>
              <td className="p-2 sm:p-3 text-center font-semibold text-gray-900 text-xs sm:text-sm">
                {brandMentions}/{totalQueries}
              </td>
              <td className="p-2 sm:p-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-12 sm:w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${brandPercentage}%` }} />
                  </div>
                  <span className="font-bold text-emerald-600 text-xs sm:text-sm">{brandPercentage}%</span>
                </div>
              </td>
              <td className="p-2 sm:p-3 text-center text-emerald-600 font-bold text-xs sm:text-sm">—</td>
            </tr>

            {/* Competitors */}
            {competitorStats.map((comp) => (
              <tr key={comp.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="p-2 sm:p-3 text-gray-700 truncate text-xs sm:text-sm">{comp.brand_name}</td>
                <td className="p-2 sm:p-3 text-center text-gray-600 text-xs sm:text-sm">{comp.mentions}/{totalQueries}</td>
                <td className="p-2 sm:p-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-12 sm:w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-400 rounded-full" style={{ width: `${comp.percentage}%` }} />
                    </div>
                    <span className="text-gray-600 font-medium text-xs sm:text-sm">{comp.percentage}%</span>
                  </div>
                </td>
                <td className="p-2 sm:p-3 text-center">
                  {comp.percentage > brandPercentage ? (
                    <span className="inline-flex items-center gap-1 text-red-500 font-medium text-xs sm:text-sm whitespace-nowrap">
                      <TrendingUp size={14} /> +{comp.percentage - brandPercentage}%
                    </span>
                  ) : comp.percentage < brandPercentage ? (
                    <span className="inline-flex items-center gap-1 text-emerald-500 font-medium text-xs sm:text-sm whitespace-nowrap">
                      <TrendingDown size={14} /> {comp.percentage - brandPercentage}%
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs sm:text-sm whitespace-nowrap">Tie</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}