import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  delta?: {
    value: string;
    type: 'up' | 'down' | 'neutral';
  };
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'indigo';
  icon?: LucideIcon;
}

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, subValue, delta, variant = 'default', icon: Icon }) => {
  const variants = {
    default: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950',
    success: 'border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20',
    warning: 'border-amber-100 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20',
    danger: 'border-red-100 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20',
    indigo: 'border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20',
  };

  const deltaColors = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-rose-600 dark:text-rose-400',
    neutral: 'text-slate-400 dark:text-slate-500',
  };

  return (
    <div className={`group relative p-4 rounded-xl border shadow-sm shadow-slate-100/50 transition-all hover:shadow-md hover:-translate-y-0.5 ${variants[variant]}`}>
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</span>
        {Icon && (
          <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-colors group-hover:border-indigo-600/30">
            <Icon size={14} className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 transition-colors" />
          </div>
        )}
      </div>
      
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{value}</div>
        {delta && (
          <div className={`flex items-center text-[11px] font-bold ${deltaColors[delta.type]}`}>
            {delta.type === 'up' ? '↑' : delta.type === 'down' ? '↓' : ''}
            <span className="ml-0.5 whitespace-nowrap">{delta.value}</span>
          </div>
        )}
      </div>

      <div className="mt-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 truncate">
        {subValue}
      </div>
    </div>
  );
};
