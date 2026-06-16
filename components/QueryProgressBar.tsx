export default function QueryProgressBar({
  used,
  limit,
}: {
  used: number;
  limit: number;
}) {
  const percentage = Math.min((used / limit) * 100, 100);
  let color = 'bg-green-500';
  if (percentage >= 90) color = 'bg-red-500';
  else if (percentage >= 70) color = 'bg-amber-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-[#94a3b8]">
        <span>Queries</span>
        <span>
          {used}/{limit}
        </span>
      </div>
      <div className="w-full h-2 bg-[#1e293b] rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}