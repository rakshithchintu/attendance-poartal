import React from 'react';
import { RiskLevel } from '../types/index.js';
import { getRiskBadgeStyle, cn } from '../lib/utils.js';
import { AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  showIcon?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  showIcon = true,
  className,
  size = 'md',
}) => {
  const style = getRiskBadgeStyle(level);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  const iconSize = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border transition-all duration-200 shadow-sm',
        style.bg,
        style.text,
        style.border,
        sizeClasses[size],
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
      {showIcon && (
        <>
          {level === 'CRITICAL' && <ShieldAlert size={iconSize[size]} className="text-rose-400" />}
          {level === 'MODERATE' && <AlertTriangle size={iconSize[size]} className="text-amber-400" />}
          {level === 'LOW' && <CheckCircle2 size={iconSize[size]} className="text-emerald-400" />}
        </>
      )}
      <span>{style.label}</span>
    </span>
  );
};
