import React, { useState, useEffect } from 'react';
import { AttendanceStatus } from '../types/index.js';
import { RiskBadge } from './RiskBadge.js';
import {
  CheckCircle,
  XCircle,
  Clock,
  HelpCircle,
  Save,
  CheckCheck,
  Calendar,
  AlertCircle,
  FileText,
  Lock,
} from 'lucide-react';
import { cn } from '../lib/utils.js';

export interface AttendanceRosterStudent {
  studentId: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  parentName: string;
  status: AttendanceStatus;
  remarks?: string;
  currentPercentage: number;
  riskLevel: 'LOW' | 'MODERATE' | 'CRITICAL';
}

interface AttendanceGridProps {
  roster: AttendanceRosterStudent[];
  sessionDate: string;
  notes: string;
  isLocked?: boolean;
  lockDaysRemaining?: number;
  onDateChange: (date: string) => void;
  onNotesChange: (notes: string) => void;
  onSubmit: (records: Array<{ studentId: string; status: AttendanceStatus; remarks?: string }>, notes: string) => Promise<void>;
  isSaving: boolean;
}

export const AttendanceGrid: React.FC<AttendanceGridProps> = ({
  roster,
  sessionDate,
  notes,
  isLocked = false,
  lockDaysRemaining = 14,
  onDateChange,
  onNotesChange,
  onSubmit,
  isSaving,
}) => {
  const [localRecords, setLocalRecords] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>({});
  const [activeRemarkModalStudent, setActiveRemarkModalStudent] = useState<AttendanceRosterStudent | null>(null);
  const [tempRemark, setTempRemark] = useState('');
  const [excusedError, setExcusedError] = useState<string | null>(null);

  // Sync initial records from roster prop
  useEffect(() => {
    const initialMap: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    roster.forEach((s) => {
      initialMap[s.studentId] = {
        status: s.status || 'PRESENT',
        remarks: s.remarks || '',
      };
    });
    setLocalRecords(initialMap);
  }, [roster]);

  const handleStatusChange = (student: AttendanceRosterStudent, newStatus: AttendanceStatus) => {
    if (isLocked) return;

    if (newStatus === 'EXCUSED' && !localRecords[student.studentId]?.remarks) {
      // Open modal to demand excused absence note as per Prompt rule
      setActiveRemarkModalStudent(student);
      setTempRemark(localRecords[student.studentId]?.remarks || '');
    }

    setLocalRecords((prev) => ({
      ...prev,
      [student.studentId]: {
        status: newStatus,
        remarks: prev[student.studentId]?.remarks || '',
      },
    }));
  };

  const markAllPresent = () => {
    if (isLocked) return;
    const updated: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    roster.forEach((s) => {
      updated[s.studentId] = {
        status: 'PRESENT',
        remarks: localRecords[s.studentId]?.remarks || '',
      };
    });
    setLocalRecords(updated);
  };

  const handleSave = async () => {
    setExcusedError(null);
    // Validate EXCUSED rule: require reason notes for EXCUSED absences
    for (const s of roster) {
      const rec = localRecords[s.studentId];
      if (rec?.status === 'EXCUSED' && (!rec.remarks || rec.remarks.trim() === '')) {
        setExcusedError(`Excused Note Required: Please provide an explanation for student ${s.fullName} (${s.rollNumber}).`);
        setActiveRemarkModalStudent(s);
        setTempRemark('');
        return;
      }
    }

    const payload = roster.map((s) => ({
      studentId: s.studentId,
      status: localRecords[s.studentId]?.status || 'PRESENT',
      remarks: localRecords[s.studentId]?.remarks,
    }));

    await onSubmit(payload, notes);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'p' || e.key === 'P') markAllPresent();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localRecords, roster]);

  const total = roster.length;
  const presentCount = Object.values(localRecords).filter((r) => r.status === 'PRESENT').length;
  const absentCount = Object.values(localRecords).filter((r) => r.status === 'ABSENT').length;
  const lateCount = Object.values(localRecords).filter((r) => r.status === 'LATE').length;
  const excusedCount = Object.values(localRecords).filter((r) => r.status === 'EXCUSED').length;

  return (
    <div className="space-y-4">
      {/* Session Header Controls */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Date Input */}
            <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">
              <Calendar className="h-4 w-4 text-indigo-400" />
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer"
              />
            </div>

            {/* Session Notes Input */}
            <input
              type="text"
              placeholder="Session topic or notes (e.g. Lab 4: Binary Trees)..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-indigo-500 w-72"
            />
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={markAllPresent}
              disabled={isLocked || isSaving}
              className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
              title="Shortcut: Press 'P'"
            >
              <CheckCheck size={15} />
              <span>Mark All Present</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isLocked || isSaving}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-all"
            >
              <Save size={15} />
              <span>{isSaving ? 'Saving Records...' : 'Save Attendance'}</span>
            </button>
          </div>
        </div>

        {/* Lock Window or Status Banner */}
        {isLocked ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
            <Lock size={16} />
            <span>This session is past the 14-day modification window. Attendance is locked to preserve academic audit integrity. Contact an administrator to override.</span>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span>Roster: <strong className="text-white">{total}</strong> Students</span>
              <span className="text-emerald-400">● {presentCount} Present</span>
              <span className="text-rose-400">● {absentCount} Absent</span>
              <span className="text-amber-400">● {lateCount} Late</span>
              <span className="text-indigo-400">● {excusedCount} Excused</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Lock Window: 14 days ({lockDaysRemaining} days remaining for updates)
            </div>
          </div>
        )}

        {excusedError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-300">
            <AlertCircle size={15} />
            <span>{excusedError}</span>
          </div>
        )}
      </div>

      {/* Student Attendance Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl backdrop-blur-md">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-3.5 px-4">Roll No</th>
              <th className="py-3.5 px-4">Student Name</th>
              <th className="py-3.5 px-4">Current %</th>
              <th className="py-3.5 px-4">Risk Status</th>
              <th className="py-3.5 px-4 text-center">Attendance Status</th>
              <th className="py-3.5 px-4">Session Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {roster.map((student) => {
              const currentStatus = localRecords[student.studentId]?.status || 'PRESENT';
              const currentRemarks = localRecords[student.studentId]?.remarks || '';

              return (
                <tr
                  key={student.studentId}
                  className={cn(
                    'transition-colors hover:bg-slate-800/30',
                    currentStatus === 'ABSENT' && 'bg-rose-950/10'
                  )}
                >
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-300">
                    {student.rollNumber}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {student.fullName}
                  </td>
                  <td className="py-3.5 px-4 font-medium">
                    <span
                      className={cn(
                        student.currentPercentage < 75 ? 'text-rose-400 font-bold' : 'text-slate-300'
                      )}
                    >
                      {student.currentPercentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <RiskBadge level={student.riskLevel} size="sm" />
                  </td>

                  {/* Status Toggle Button Group */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 w-fit mx-auto">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(student, 'PRESENT')}
                        disabled={isLocked}
                        className={cn(
                          'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all',
                          currentStatus === 'PRESENT'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        )}
                      >
                        <CheckCircle size={13} />
                        <span>Present</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(student, 'ABSENT')}
                        disabled={isLocked}
                        className={cn(
                          'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all',
                          currentStatus === 'ABSENT'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        )}
                      >
                        <XCircle size={13} />
                        <span>Absent</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(student, 'LATE')}
                        disabled={isLocked}
                        className={cn(
                          'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all',
                          currentStatus === 'LATE'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        )}
                      >
                        <Clock size={13} />
                        <span>Late</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(student, 'EXCUSED')}
                        disabled={isLocked}
                        className={cn(
                          'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all',
                          currentStatus === 'EXCUSED'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        )}
                      >
                        <HelpCircle size={13} />
                        <span>Excused</span>
                      </button>
                    </div>
                  </td>

                  {/* Remarks Field & Note Trigger */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={currentStatus === 'EXCUSED' ? 'Reason required...' : 'Add remark...'}
                        value={currentRemarks}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLocalRecords((prev) => ({
                            ...prev,
                            [student.studentId]: {
                              status: prev[student.studentId]?.status || 'PRESENT',
                              remarks: val,
                            },
                          }));
                        }}
                        className={cn(
                          'rounded-md border bg-slate-800/80 px-2 py-1 text-xs text-white placeholder-slate-400 outline-none w-48 transition-colors',
                          currentStatus === 'EXCUSED' && !currentRemarks
                            ? 'border-rose-500/70 focus:border-rose-400'
                            : 'border-slate-700 focus:border-indigo-500'
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setActiveRemarkModalStudent(student);
                          setTempRemark(currentRemarks);
                        }}
                        className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
                        title="Detailed Note"
                      >
                        <FileText size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Excused / Note Modal */}
      {activeRemarkModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="text-indigo-400" size={18} />
              Session Attendance Note
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Student: <strong className="text-white">{activeRemarkModalStudent.fullName}</strong> ({activeRemarkModalStudent.rollNumber})
            </p>

            <div className="mt-4">
              <label className="text-xs font-semibold text-slate-300">
                Reason / Remark {localRecords[activeRemarkModalStudent.studentId]?.status === 'EXCUSED' && <span className="text-rose-400">* (Required for Excused)</span>}
              </label>
              <textarea
                rows={3}
                value={tempRemark}
                onChange={(e) => setTempRemark(e.target.value)}
                placeholder="E.g., Medical certificate submitted, Dean sanctioned competition participation, etc."
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-xs text-white placeholder-slate-400 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveRemarkModalStudent(null)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocalRecords((prev) => ({
                    ...prev,
                    [activeRemarkModalStudent.studentId]: {
                      status: prev[activeRemarkModalStudent.studentId]?.status || 'PRESENT',
                      remarks: tempRemark,
                    },
                  }));
                  setActiveRemarkModalStudent(null);
                }}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
