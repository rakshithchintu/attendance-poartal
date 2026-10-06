import React from 'react';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  History,
  BrainCircuit,
  Settings,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { cn } from '../lib/utils.js';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  criticalCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  criticalCount = 1,
}) => {
  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      description: 'Overview & metrics',
    },
    {
      name: 'Students Roster',
      path: '/students',
      icon: Users,
      description: 'Profiles & enrollment',
    },
    {
      name: 'Mark Attendance',
      path: '/attendance/mark',
      icon: CheckSquare,
      description: 'Daily & bulk marking',
      badge: 'Live',
    },
    {
      name: 'Attendance History',
      path: '/attendance/history',
      icon: History,
      description: 'Logs & audit trail',
    },
    {
      name: 'AI Risk Center',
      path: '/analytics/risk',
      icon: BrainCircuit,
      description: 'Dropout prevention',
      alertCount: criticalCount,
      highlight: true,
    },
    {
      name: 'Settings & Policy',
      path: '/settings',
      icon: Settings,
      description: 'Thresholds & rules',
    },
  ];

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-slate-800 bg-slate-900/95 p-4 justify-between">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Navigation</p>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path));

              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={cn(
                    'group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-all duration-150',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={18}
                      className={cn(
                        'transition-colors',
                        isActive
                          ? 'text-white'
                          : item.highlight
                          ? 'text-indigo-400 group-hover:text-indigo-300'
                          : 'text-slate-400 group-hover:text-slate-300'
                      )}
                    />
                    <div>
                      <div className="leading-tight">{item.name}</div>
                      <div
                        className={cn(
                          'text-[10px] font-normal',
                          isActive ? 'text-indigo-100' : 'text-slate-400'
                        )}
                      >
                        {item.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                        {item.badge}
                      </span>
                    )}

                    {item.alertCount !== undefined && item.alertCount > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30">
                        <ShieldAlert size={10} />
                        {item.alertCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* AI Predictive Insight Widget */}
        <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-indigo-950/20 p-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-400">
            <BrainCircuit size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">AI Dropout Engine</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
            Continuous scanning of 30-day streak anomalies, Friday spikes, and 75% threshold drops.
          </p>
          <button
            onClick={() => onNavigate('/analytics/risk')}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-all"
          >
            <span>Open Risk Matrix</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Footer System Status */}
      <div className="border-t border-slate-800/80 pt-3 text-[11px] text-slate-400 flex items-center justify-between">
        <span>EduRisk Core v1.0</span>
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Active
        </span>
      </div>
    </aside>
  );
};
