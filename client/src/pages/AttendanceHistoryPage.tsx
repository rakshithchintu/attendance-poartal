import React, { useState, useEffect } from 'react';
import { useAttendanceStore } from '../store/useAttendanceStore.js';
import { fetchAttendanceHistory } from '../lib/api.js';
import { AttendanceLogItem } from '../types/index.js';
import { getStatusBadgeStyle } from '../lib/utils.js';
import { ExportReportModal } from '../components/ExportReportModal.js';
import {
  History,
  Search,
  Filter,
  FileDown,
  Calendar,
  RefreshCw,
  FileText,
} from 'lucide-react';

export const AttendanceHistoryPage: React.FC = () => {
  const { selectedClassId, classes } = useAttendanceStore();
  const [logs, setLogs] = useState<AttendanceLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Export Modal
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [selectedClassId, selectedStatus, dateFrom, dateTo]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetchAttendanceHistory({
        classId: selectedClassId,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setLogs(res.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      log.studentName.toLowerCase().includes(q) ||
      log.rollNumber.toLowerCase().includes(q) ||
      log.remarks?.toLowerCase().includes(q) ||
      log.sessionNotes?.toLowerCase().includes(q)
    );
  });

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <History size={15} />
            <span>Attendance Audit Trail & Logs</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-white tracking-tight">
            Historical Session Registers
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {selectedClass?.class_name} ({selectedClass?.subject_code}) — {filteredLogs.length} Records Logged
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadLogs}
            className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white"
            title="Refresh Logs"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-colors"
          >
            <FileDown size={15} />
            <span>Export Log Report</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search student or remark..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs">
            <Filter size={13} className="text-slate-400" />
            <span className="text-slate-400">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent font-semibold text-white outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Statuses</option>
              <option value="PRESENT" className="bg-slate-900">Present Only</option>
              <option value="ABSENT" className="bg-slate-900">Absent Only</option>
              <option value="LATE" className="bg-slate-900">Late Only</option>
              <option value="EXCUSED" className="bg-slate-900">Excused Only</option>
            </select>
          </div>

          {/* Date Range Filters */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-slate-300">
              <Calendar size={13} className="text-indigo-400" />
              <span>From:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-transparent text-white outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-slate-300">
              <Calendar size={13} className="text-indigo-400" />
              <span>To:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-transparent text-white outline-none"
              />
            </div>

            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
                className="text-[11px] text-slate-400 hover:text-white underline"
              >
                Clear Dates
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl backdrop-blur-md">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-3.5 px-4">Session Date</th>
              <th className="py-3.5 px-4">Roll No</th>
              <th className="py-3.5 px-4">Student Name</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Reason / Remark</th>
              <th className="py-3.5 px-4">Session Topic / Notes</th>
              <th className="py-3.5 px-4 text-right">Audit Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No attendance records found matching filters.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const badge = getStatusBadgeStyle(log.status);

                return (
                  <tr key={log.recordId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                      {log.sessionDate}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-300">
                      {log.rollNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {log.studentName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {log.remarks ? (
                        <span className="italic">"{log.remarks}"</span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {log.sessionNotes || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right text-[11px] text-slate-400 font-mono">
                      {new Date(log.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        classNameTitle={selectedClass?.class_name || 'Class'}
        students={[]}
        logs={filteredLogs}
      />
    </div>
  );
};
