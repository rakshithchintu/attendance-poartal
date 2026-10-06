import React from 'react';
import { cn } from '../lib/utils.js';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'primary',
  trend,
  className,
  badge,
}) => {
  const variantStyles = {
    primary: {
      border: 'border-indigo-500/20 hover:border-indigo-500/40',
      iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      glow: 'from-indigo-500/5 to-transparent',
    },
    success: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      glow: 'from-emerald-500/5 to-transparent',
    },
    warning: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      glow: 'from-amber-500/5 to-transparent',
    },
    danger: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      glow: 'from-rose-500/5 to-transparent',
    },
    neutral: {
      border: 'border-slate-700/60 hover:border-slate-600',
      iconBg: 'bg-slate-800 text-slate-300 border-slate-700',
      glow: 'from-slate-700/5 to-transparent',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-slate-900/80 p-5 shadow-lg backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5',
        style.border,
        className
      )}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br pointer-events-none opacity-50', style.glow)} />
      
      <div className="relative flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
            {badge && (
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                {badge}
              </span>
            )}
          </div>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-white">{value}</h3>
          
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          )}

          {trend && (
            <div className="mt-2 flex items-center gap-1 text-xs">
              <span className={trend.isPositive ? 'font-medium text-emerald-400' : 'font-medium text-rose-400'}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-slate-500">vs last term</span>
            </div>
          )}
        </div>

        <div className={cn('rounded-lg border p-2.5', style.iconBg)}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
};
