import React, { useState } from 'react';
import { StudentItem, RiskLevel } from '../types/index.js';
import { RiskBadge } from './RiskBadge.js';
import {
  Search,
  Sparkles,
  Mail,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Minus,
  UserPlus,
  Trash2,
} from 'lucide-react';
import { cn } from '../lib/utils.js';

interface StudentTableProps {
  students: StudentItem[];
  onSelectStudent: (studentId: string) => void;
  onOpenAIRiskModal: (student: StudentItem) => void;
  onOpenParentMessageModal: (student: StudentItem) => void;
  onOpenAddStudent?: () => void;
  onDeleteStudent?: (studentId: string) => void;
  minThreshold?: number;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  onSelectStudent,
  onOpenAIRiskModal,
  onOpenParentMessageModal,
  onOpenAddStudent,
  onDeleteStudent,
  minThreshold = 75.0,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'name' | 'percentage' | 'roll'>('percentage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter students
  const filtered = students.filter((s) => {
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.parent_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRisk =
      selectedRisk === 'ALL' || s.metrics?.riskLevel === selectedRisk;

    return matchesSearch && matchesRisk;
  });

  // Sort students
  const sorted = [...filtered].sort((a, b) => {
    if (sortField === 'percentage') {
      const aVal = a.metrics?.attendancePercentage ?? 100;
      const bVal = b.metrics?.attendancePercentage ?? 100;
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }
    if (sortField === 'name') {
      const aName = `${a.first_name} ${a.last_name}`;
      const bName = `${b.first_name} ${b.last_name}`;
      return sortOrder === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
    }
    return sortOrder === 'asc'
      ? a.roll_number.localeCompare(b.roll_number)
      : b.roll_number.localeCompare(a.roll_number);
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search by student name, roll no, or parent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Risk Level Filter Pill Tabs */}
          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/90 p-1 text-xs">
            {['ALL', 'CRITICAL', 'MODERATE', 'LOW'].map((risk) => (
              <button
                key={risk}
                onClick={() => setSelectedRisk(risk)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors',
                  selectedRisk === risk
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {risk === 'ALL' ? 'All' : risk.charAt(0) + risk.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {onOpenAddStudent && (
          <button
            onClick={onOpenAddStudent}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-colors"
          >
            <UserPlus size={15} />
            <span>Add Student</span>
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl backdrop-blur-md">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th
                onClick={() => {
                  setSortField('roll');
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}
                className="py-3.5 px-4 cursor-pointer hover:text-white"
              >
                Roll No
              </th>
              <th
                onClick={() => {
                  setSortField('name');
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}
                className="py-3.5 px-4 cursor-pointer hover:text-white"
              >
                Student Name
              </th>
              <th
                onClick={() => {
                  setSortField('percentage');
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}
                className="py-3.5 px-4 cursor-pointer hover:text-white"
              >
                Attendance Rate
              </th>
              <th className="py-3.5 px-4">Streak & Trend</th>
              <th className="py-3.5 px-4">AI Risk Assessment</th>
              <th className="py-3.5 px-4">Parent Contact</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No students found matching your criteria.
                </td>
              </tr>
            ) : (
              sorted.map((student) => {
                const percentage = student.metrics?.attendancePercentage ?? 100;
                const isUnderThreshold = percentage < minThreshold;
                const riskLevel = student.metrics?.riskLevel || 'LOW';

                return (
                  <tr
                    key={student.id}
                    className={cn(
                      'transition-colors hover:bg-slate-800/40',
                      isUnderThreshold && 'bg-rose-950/5'
                    )}
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-300">
                      {student.roll_number}
                    </td>

                    <td className="py-3.5 px-4">
                      <div
                        onClick={() => onSelectStudent(student.id)}
                        className="cursor-pointer group"
                      >
                        <div className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-[11px] text-slate-400">{student.email || 'No student email'}</div>
                      </div>
                    </td>

                    {/* Attendance Percentage & Progress Bar */}
                    <td className="py-3.5 px-4">
                      <div className="w-36 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={cn(
                              'font-bold',
                              isUnderThreshold ? 'text-rose-400' : 'text-slate-200'
                            )}
                          >
                            {percentage.toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {student.metrics?.attendedSessions || 0}/{student.metrics?.totalSessions || 0}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              percentage < 70
                                ? 'bg-rose-500'
                                : percentage < 80
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            )}
                            style={{ width: `${Math.min(100, Math.max(5, percentage))}%` }}
                          />
                        </div>
                        {isUnderThreshold && (
                          <div className="text-[10px] text-rose-400 font-medium">
                            Below {minThreshold}% threshold
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Trend & Streaks */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          {student.metrics?.trend === 'IMPROVING' && (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                              <TrendingUp size={13} /> Improving
                            </span>
                          )}
                          {student.metrics?.trend === 'DECLINING' && (
                            <span className="flex items-center gap-1 text-[11px] text-rose-400">
                              <TrendingDown size={13} /> Declining
                            </span>
                          )}
                          {(!student.metrics?.trend || student.metrics.trend === 'STABLE') && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Minus size={13} /> Stable
                            </span>
                          )}
                        </div>
                        {student.metrics?.maxConsecutiveAbsence && student.metrics.maxConsecutiveAbsence >= 2 ? (
                          <span className="text-[10px] text-rose-400 font-semibold">
                            {student.metrics.maxConsecutiveAbsence}-day absence streak
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Risk Badge */}
                    <td className="py-3.5 px-4">
                      <RiskBadge level={riskLevel} size="sm" />
                    </td>

                    {/* Parent Contact */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-medium text-slate-300">{student.parent_name}</div>
                        <div className="text-[11px] text-slate-400">{student.parent_email}</div>
                      </div>
                    </td>

                    {/* Action Triggers */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Run AI Analysis */}
                        <button
                          onClick={() => onOpenAIRiskModal(student)}
                          className="flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                          title="Generate Gemini AI Risk Analysis"
                        >
                          <Sparkles size={13} />
                          <span>AI Report</span>
                        </button>

                        {/* Generate Parent Message */}
                        <button
                          onClick={() => onOpenParentMessageModal(student)}
                          className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                          title="Draft Parent Outreach Message"
                        >
                          <Mail size={14} />
                        </button>

                        {/* View Full Profile */}
                        <button
                          onClick={() => onSelectStudent(student.id)}
                          className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                          title="View Profile Details"
                        >
                          <ChevronRight size={14} />
                        </button>

                        {/* Delete Student */}
                        {onDeleteStudent && (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to remove ${student.first_name} ${student.last_name}?`)) {
                                onDeleteStudent(student.id);
                              }
                            }}
                            className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 hover:bg-rose-950/30 hover:border-rose-500/50 hover:text-rose-400 transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
