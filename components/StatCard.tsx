import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ icon, label, value, trend }: { icon: ReactNode; label: string; value: string | number; trend?: 'up' | 'down' | 'neutral' | 'active' | 'warning' }) {
  const trendConfig = {
    up: { icon: <TrendingUp size={14} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    down: { icon: <TrendingDown size={14} />, color: 'text-red-500', bg: 'bg-red-50' },
    neutral: { icon: <Minus size={14} />, color: 'text-gray-400', bg: 'bg-gray-50' },
    active: { icon: <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    warning: { icon: <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />, color: 'text-amber-600', bg: 'bg-amber-50' },
  };
  const config = trend ? trendConfig[trend] : null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
          {icon}
        </div>
        {config && (
          <span className={`flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
            {config.icon}
          </span>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-0.5">{value}</p>
      <p className="text-xs sm:text-sm text-gray-500 font-medium">{label}</p>
    </div>
  );
}