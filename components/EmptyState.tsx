import { ReactNode } from 'react';

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-[#1e293b] rounded-xl border border-[#334155]">
      <div className="text-[#6366f1] mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-[#94a3b8] text-center max-w-md mb-6">
        {description}
      </p>
      {action}
    </div>
  );
}