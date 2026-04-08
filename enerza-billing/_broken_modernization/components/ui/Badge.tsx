import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'indigo';
  size?: 'xs' | 'sm';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'info', size = 'xs' }) => {
  const variants = {
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-100 dark:border-amber-800',
    danger: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-100 dark:border-red-800',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-100 dark:border-blue-800',
    neutral: 'bg-slate-50 text-slate-700 dark:bg-slate-900/50 dark:text-slate-400 border-slate-200 dark:border-slate-800',
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800',
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-3 py-1 text-[12px]',
  };

  return (
    <span className={`inline-flex items-center font-bold uppercase tracking-widest rounded-md border shadow-sm transition-opacity group-hover:opacity-80 ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
};
