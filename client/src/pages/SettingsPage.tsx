import React, { useState, useEffect } from 'react';
import { useAttendanceStore } from '../store/useAttendanceStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { createClass, fetchClasses, fetchHealth } from '../lib/api.js';
import {
  Settings,
  Sliders,
  Sparkles,
  Database,
  Lock,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    minAttendanceThreshold,
    setMinAttendanceThreshold,
    classes,
    setClasses,
    addToast,
  } = useAttendanceStore();

  const [thresholdInput, setThresholdInput] = useState(minAttendanceThreshold);
  const [defaultTone, setDefaultTone] = useState<'FORMAL' | 'EMPATHETIC' | 'URGENT'>('FORMAL');
  const [healthStatus, setHealthStatus] = useState<any>(null);

  // New Class Form State
  const [newClassName, setNewClassName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newAcademicTerm, setNewAcademicTerm] = useState('Fall Term 2026');
  const [isCreatingClass, setIsCreatingClass] = useState(false);

  useEffect(() => {
    fetchHealth()
      .then(setHealthStatus)
      .catch(console.error);
  }, []);

  const handleSaveThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    setMinAttendanceThreshold(Number(thresholdInput));
    addToast({
      type: 'success',
      title: 'Policy Updated',
      message: `Minimum passing attendance threshold set to ${thresholdInput}%.`,
    });
  };

  const handleCreateNewClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName || !newSubjectCode) return;

    setIsCreatingClass(true);
    try {
      const created = await createClass({
        className: newClassName,
        subjectCode: newSubjectCode,
        academicTerm: newAcademicTerm,
        minAttendancePercentage: thresholdInput,
      });

      addToast({
        type: 'success',
        title: 'New Class Created',
        message: `Course ${created.subject_code} (${created.class_name}) is now available in your workspace.`,
      });

      // Refresh classes list
      const refreshed = await fetchClasses();
      setClasses(refreshed);

      setNewClassName('');
      setNewSubjectCode('');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Failed to create class',
        message: err.message,
      });
    } finally {
      setIsCreatingClass(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
          <Settings size={15} />
          <span>System Configuration & Policy</span>
        </div>
        <h1 className="mt-1 text-2xl font-extrabold text-white tracking-tight">
          Attendance Policies & Institutional Rules
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Configure institutional cutoff limits, AI outreach parameters, and course management.
        </p>
      </div>

      {/* Threshold Configuration */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-md">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sliders className="text-indigo-400" size={16} />
          Attendance Minimum Passing Threshold
        </h3>
        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
          Students dropping below this threshold percentage are automatically tagged with visual risk indicators, flagged in analytics, and prioritized for Gemini AI dropout intervention.
        </p>

        <form onSubmit={handleSaveThreshold} className="mt-5 space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="50"
              max="95"
              step="1"
              value={thresholdInput}
              onChange={(e) => setThresholdInput(Number(e.target.value))}
              className="h-2 w-72 rounded-lg bg-slate-800 accent-indigo-500 cursor-pointer"
            />
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm font-bold text-white">
              <span>{thresholdInput}%</span>
            </div>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors"
          >
            Update Institutional Threshold
          </button>
        </form>
      </div>

      {/* Course & Class Management */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-md">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <GraduationCap className="text-indigo-400" size={16} />
          Create New Course / Section
        </h3>
        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
          Add a new course section to your academic profile.
        </p>

        <form onSubmit={handleCreateNewClass} className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="font-semibold text-slate-300">Course / Class Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Systems"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-300">Subject Code *</label>
            <input
              type="text"
              required
              placeholder="e.g. CS-450"
              value={newSubjectCode}
              onChange={(e) => setNewSubjectCode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-300">Academic Term</label>
            <input
              type="text"
              value={newAcademicTerm}
              onChange={(e) => setNewAcademicTerm(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-3 pt-2">
            <button
              type="submit"
              disabled={isCreatingClass}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              <PlusCircle size={15} />
              <span>{isCreatingClass ? 'Adding...' : 'Create Course'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Rules & Policy Enforcements */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-md">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Lock className="text-amber-400" size={16} />
          Attendance Audit & Locking Policy
        </h3>
        <div className="mt-3 space-y-3 text-xs text-slate-300">
          <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <strong className="text-white">14-Day Lock Window:</strong> Past sessions older than 14 days are locked from regular faculty modification. Modifications require Administrator role credentials.
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <strong className="text-white">Mandatory Excused Absence Documentation:</strong> Whenever an EXCUSED status is selected, a valid administrative reason note must be provided before submission.
            </div>
          </div>
        </div>
      </div>

      {/* System Diagnostics */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-md">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="text-indigo-400" size={16} />
          AI & Backend Infrastructure Diagnostics
        </h3>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 space-y-1">
            <div className="text-slate-400">AI Model Integration</div>
            <div className="font-bold text-white text-sm">Google Gemini 2.5 Flash</div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium pt-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>{healthStatus?.geminiLiveConnected ? 'Connected via Live GEMINI_API_KEY' : 'Deterministic Pattern Analytical Engine Active'}</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 space-y-1">
            <div className="text-slate-400">Database Engine</div>
            <div className="font-bold text-white text-sm">PostgreSQL / Supabase RLS</div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium pt-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>{healthStatus?.supabaseLiveConnected ? 'Supabase Cloud Connected' : 'High-Performance Local RLS Store Active'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
