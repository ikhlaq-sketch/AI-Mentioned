import { ReactNode } from 'react';

export default function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-[#1e293b] p-4 rounded-xl border border-[#334155] flex items-center gap-4">
      <div className="text-indigo-400">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-[#94a3b8]">{label}</p>
      </div>
    </div>
  );
}