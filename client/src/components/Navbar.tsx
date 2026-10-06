import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useAttendanceStore } from '../store/useAttendanceStore.js';
import { fetchHealth, fetchClasses } from '../lib/api.js';
import {
  Sparkles,
  GraduationCap,
  Calendar,
  Layers,
  UserCheck,
  Shield,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  onOpenQuickScan?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenQuickScan }) => {
  const { user, setRole } = useAuthStore();
  const { selectedClassId, setSelectedClassId, classes, setClasses } = useAttendanceStore();
  const [aiStatus, setAiStatus] = useState<{ live: boolean; model: string }>({
    live: false,
    model: 'gemini-2.5-flash',
  });
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  useEffect(() => {
    // Load health status
    fetchHealth()
      .then((res) => {
        setAiStatus({ live: res.geminiLiveConnected, model: res.model });
      })
      .catch(() => {
        // Fallback
      });

    // Load classes
    fetchClasses()
      .then((data) => {
        setClasses(data);
        if (data.length > 0 && !selectedClassId) {
          setSelectedClassId(data[0].id);
        }
      })
      .catch(console.error);
  }, []);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 backdrop-blur-md">
      {/* Brand & Class Selector */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-md shadow-indigo-500/20">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-white text-lg">EduRisk</span>
              <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300 border border-indigo-500/30">
                AI
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400">Attendance & Risk Assistant</p>
          </div>
        </div>

        {/* Active Class Selector Dropdown */}
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-800/60 px-3 py-1.5">
          <Layers className="h-4 w-4 text-indigo-400" />
          <span className="text-xs text-slate-400 font-medium">Class:</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id} className="bg-slate-900 text-slate-200">
                {cls.subject_code} — {cls.class_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center / Right Control Cluster */}
      <div className="flex items-center gap-4">
        {/* Date Display */}
        <div className="hidden lg:flex items-center gap-2 rounded-lg border border-slate-800/80 bg-slate-800/40 px-3 py-1.5 text-xs text-slate-300">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>

        {/* AI Agent Status Indicator */}
        <div
          className="flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3 py-1 text-xs text-indigo-200 cursor-default"
          title={aiStatus.live ? 'Connected to live Google Gemini 2.5 Flash' : 'Analytical Pattern Engine Active (Ready for Gemini Key)'}
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
          <span className="font-medium">Gemini 2.5 Flash</span>
          <span className={`h-2 w-2 rounded-full ${aiStatus.live ? 'bg-emerald-400 ring-2 ring-emerald-500/20' : 'bg-emerald-400'}`} />
        </div>

        {/* User Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/60 p-1.5 pl-2.5 hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-tight">{user?.full_name}</span>
              <span className="text-[10px] text-indigo-400 font-medium">{user?.role}</span>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-700 text-slate-200">
              {user?.role === 'ADMIN' ? <Shield className="h-4 w-4 text-amber-400" /> : <UserCheck className="h-4 w-4 text-emerald-400" />}
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-700 bg-slate-800 p-2 shadow-xl z-50">
              <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Switch Simulated Role
              </div>
              <button
                onClick={() => {
                  setRole('TEACHER');
                  setIsRoleDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                  user?.role === 'TEACHER' ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/30' : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <UserCheck className="h-4 w-4 text-emerald-400" />
                <div className="text-left">
                  <div className="font-semibold text-white">Dr. Eleanor Vance</div>
                  <div className="text-[10px] text-slate-400">Teacher / Course Instructor</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setRole('ADMIN');
                  setIsRoleDropdownOpen(false);
                }}
                className={`w-full mt-1 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                  user?.role === 'ADMIN' ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/30' : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Shield className="h-4 w-4 text-amber-400" />
                <div className="text-left">
                  <div className="font-semibold text-white">Principal Marcus Davis</div>
                  <div className="text-[10px] text-slate-400">Administrator / Dean</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
