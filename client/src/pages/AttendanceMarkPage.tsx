import React, { useState, useEffect } from 'react';
import { useAttendanceStore } from '../store/useAttendanceStore.js';
import { fetchSessionAttendance, submitBulkAttendance } from '../lib/api.js';
import { AttendanceGrid, AttendanceRosterStudent } from '../components/AttendanceGrid.js';
import { CheckSquare, RefreshCw, Layers } from 'lucide-react';

export const AttendanceMarkPage: React.FC = () => {
  const { selectedClassId, setSelectedClassId, classes, selectedDate, setSelectedDate, addToast } = useAttendanceStore();
  const [roster, setRoster] = useState<AttendanceRosterStudent[]>([]);
  const [sessionNotes, setSessionNotes] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockDaysRemaining, setLockDaysRemaining] = useState(14);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSession();
  }, [selectedClassId, selectedDate]);

  const loadSession = async () => {
    if (!selectedClassId || !selectedDate) return;
    setLoading(true);
    try {
      const data = await fetchSessionAttendance(selectedClassId, selectedDate);
      setRoster(data.roster || []);
      setSessionNotes(data.notes || '');
      setIsLocked(data.isLocked || false);
      setLockDaysRemaining(data.lockDaysRemaining ?? 14);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Failed to load session attendance',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAttendance = async (
    records: Array<{ studentId: string; status: any; remarks?: string }>,
    notes: string
  ) => {
    setIsSaving(true);
    try {
      const res = await submitBulkAttendance({
        classId: selectedClassId,
        sessionDate: selectedDate,
        notes,
        records,
      });

      addToast({
        type: 'success',
        title: 'Attendance Recorded',
        message: res.message || 'Records saved and student percentages recalculated.',
      });

      // Reload fresh metrics
      loadSession();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Failed to Save Attendance',
        message: err.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <CheckSquare size={15} />
            <span>Interactive Attendance Marking Tool</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-white tracking-tight">
            Record Class Session Attendance
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {selectedClass?.class_name} ({selectedClass?.subject_code}) — {roster.length} Active Students
          </p>
        </div>

        {/* Class Selection Dropdown in Page Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs">
            <Layers size={14} className="text-indigo-400" />
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id} className="bg-slate-900 text-white">
                  {cls.subject_code} — {cls.class_name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={loadSession}
            className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white"
            title="Reload Roster"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="mt-3 text-xs text-slate-400">Loading session roster...</p>
        </div>
      ) : (
        <AttendanceGrid
          roster={roster}
          sessionDate={selectedDate}
          notes={sessionNotes}
          isLocked={isLocked}
          lockDaysRemaining={lockDaysRemaining}
          onDateChange={(d) => setSelectedDate(d)}
          onNotesChange={(n) => setSessionNotes(n)}
          onSubmit={handleSaveAttendance}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};
