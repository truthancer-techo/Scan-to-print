import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  badgeText?: string;
  icon: LucideIcon;
  variant?: 'amber' | 'blue' | 'emerald' | 'purple';
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  badgeText = 'Live',
  icon: Icon,
  variant = 'amber',
  onClick,
}) => {
  const colorStyles = {
    amber: 'bg-amber-500/10 text-amber-600 border-amber-200',
    blue: 'bg-blue-500/10 text-blue-600 border-blue-200',
    emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    purple: 'bg-purple-500/10 text-purple-600 border-purple-200',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm transition-all hover:shadow-md ${
        onClick ? 'cursor-pointer hover:border-amber-400' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {badgeText}
        </span>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
          {value}
        </div>

        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 ${colorStyles[variant]}`}>
          <Icon className="w-5 h-5 stroke-[2.2]" />
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-2 font-medium truncate">
        {subtitle}
      </p>
    </div>
  );
};
