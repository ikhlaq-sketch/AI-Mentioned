export default function QueryProgressBar({ used, limit }: { used: number; limit: number }) {
  const percentage = Math.min((used / limit) * 100, 100);
  let barColor = 'bg-emerald-500';
  let textColor = 'text-emerald-600';
  if (percentage >= 90) { barColor = 'bg-red-500'; textColor = 'text-red-500'; }
  else if (percentage >= 70) { barColor = 'bg-amber-500'; textColor = 'text-amber-500'; }

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">Queries Used</span>
        <span className={`font-semibold ${textColor}`}>{used}/{limit}</span>
      </div>
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all duration-700 ease-out`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}