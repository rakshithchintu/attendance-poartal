import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useAttendanceStore } from '../store/useAttendanceStore.js';
import { fetchClassAnalytics, fetchStudents } from '../lib/api.js';
import { ClassAnalytics, StudentItem } from '../types/index.js';
import { StatCard } from '../components/StatCard.js';
import { AttendanceTrendChart, DayOfWeekBarChart } from '../components/AttendanceChart.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { AIRiskReportModal } from '../components/AIRiskReportModal.js';
import { ParentCommunicationModal } from '../components/ParentCommunicationModal.js';
import { ExportReportModal } from '../components/ExportReportModal.js';
import {
  Users,
  Percent,
  ShieldAlert,
  CalendarCheck,
  Sparkles,
  ArrowRight,
  FileDown,
  CheckSquare,
  AlertTriangle,
  Mail,
  RefreshCw,
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (path: string) => void;
  onSelectStudent: (studentId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onSelectStudent }) => {
  const { user } = useAuthStore();
  const { selectedClassId, classes, minAttendanceThreshold } = useAttendanceStore();
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedStudentForAI, setSelectedStudentForAI] = useState<StudentItem | null>(null);
  const [selectedStudentForMessage, setSelectedStudentForMessage] = useState<StudentItem | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [selectedClassId]);

  const loadDashboardData = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const [analyticsData, studentsData] = await Promise.all([
        fetchClassAnalytics(selectedClassId),
        fetchStudents({ classId: selectedClassId }),
      ]);
      setAnalytics(analyticsData);
      setStudents(studentsData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles size={14} />
            <span>AI Attendance Intelligence Platform</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.full_name}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Monitoring <strong className="text-slate-200">{selectedClass?.class_name || 'Class'} ({selectedClass?.subject_code})</strong> — {selectedClass?.academic_term}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('/attendance/mark')}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all hover:-translate-y-0.5"
          >
            <CheckSquare size={16} />
            <span>Mark Today's Attendance</span>
          </button>

          <button
            onClick={() => onNavigate('/analytics/risk')}
            className="flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2.5 text-xs font-bold text-indigo-300 hover:bg-indigo-500/20 transition-all"
          >
            <Sparkles size={15} />
            <span>AI Risk Center</span>
          </button>

          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <FileDown size={15} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Class Average Attendance"
          value={analytics ? `${analytics.averageAttendance}%` : '—'}
          subtitle={`Passing minimum: ${minAttendanceThreshold}%`}
          icon={Percent}
          variant={
            !analytics || analytics.averageAttendance >= 80
              ? 'success'
              : analytics.averageAttendance >= 75
              ? 'warning'
              : 'danger'
          }
          trend={{ value: '1.4%', isPositive: true }}
        />

        <StatCard
          title="Total Enrolled Students"
          value={analytics?.totalStudents || 0}
          subtitle="Active roster count"
          icon={Users}
          variant="primary"
        />

        <StatCard
          title="Flagged At-Risk Students"
          value={analytics?.riskDistribution.critical || 0}
          subtitle={`${analytics?.riskDistribution.moderate || 0} moderate risk students`}
          icon={ShieldAlert}
          variant={analytics?.riskDistribution.critical ? 'danger' : 'neutral'}
          badge={analytics?.riskDistribution.critical ? 'Action Required' : undefined}
        />

        <StatCard
          title="Sessions Conducted"
          value={analytics?.totalSessions || 0}
          subtitle="Term lecture & lab sessions"
          icon={CalendarCheck}
          variant="neutral"
        />
      </div>

      {/* Main Charts & Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Attendance Trend Line Chart (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CalendarCheck size={16} className="text-indigo-400" />
                Historical Attendance Progression
              </h3>
              <p className="text-xs text-slate-400">
                Daily participation rates against the {minAttendanceThreshold}% passing cutoff
              </p>
            </div>
            <button
              onClick={loadDashboardData}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              title="Refresh Analytics"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {analytics?.dailyTrends && analytics.dailyTrends.length > 0 ? (
            <AttendanceTrendChart
              data={analytics.dailyTrends}
              threshold={minAttendanceThreshold}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No session data available yet.
            </div>
          )}
        </div>

        {/* Day of Week Absence Distribution (1 Col) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-md">
          <div className="border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-400" />
              Day-of-Week Absence Patterns
            </h3>
            <p className="text-xs text-slate-400">
              Identifying chronic absenteeism concentrations (e.g. Friday spikes)
            </p>
          </div>

          {analytics?.dayTotals ? (
            <DayOfWeekBarChart dayTotals={analytics.dayTotals} />
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              Calculating pattern aggregates...
            </div>
          )}
        </div>
      </div>

      {/* Critical Dropout Risk Alerts Spotlight */}
      <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-950/20 via-slate-900 to-slate-900 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
              <h3 className="text-base font-bold text-white">Vulnerable Students & Dropout Prevention</h3>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Students breaching the {minAttendanceThreshold}% attendance threshold or exhibiting dangerous absence streaks
            </p>
          </div>

          <button
            onClick={() => onNavigate('/analytics/risk')}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
          >
            <span>View Full Risk Matrix</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics?.flaggedStudents && analytics.flaggedStudents.length > 0 ? (
            analytics.flaggedStudents.map((flagged) => {
              const fullStudent = students.find((s) => s.id === flagged.studentId);

              return (
                <div
                  key={flagged.studentId}
                  className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 transition-all hover:border-slate-700 shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4
                        onClick={() => onSelectStudent(flagged.studentId)}
                        className="font-bold text-white hover:text-indigo-400 cursor-pointer text-sm"
                      >
                        {flagged.name}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-400">{flagged.rollNumber}</p>
                    </div>
                    <RiskBadge level={flagged.riskLevel} size="sm" />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Attendance:</span>
                    <span className="font-extrabold text-rose-400">
                      {flagged.attendancePercentage.toFixed(1)}%
                    </span>
                  </div>

                  {/* Primary Issue Highlight */}
                  <div className="mt-2 rounded-lg bg-rose-500/10 p-2 text-[11px] text-rose-300 leading-tight">
                    {flagged.suggestedRiskFactors[0] || 'Irregular attendance behavior'}
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="mt-3.5 flex items-center gap-2 border-t border-slate-800/80 pt-2.5">
                    <button
                      onClick={() => fullStudent && setSelectedStudentForAI(fullStudent)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20"
                    >
                      <Sparkles size={13} />
                      <span>AI Insights</span>
                    </button>

                    <button
                      onClick={() => fullStudent && setSelectedStudentForMessage(fullStudent)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-800 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                    >
                      <Mail size={13} />
                      <span>Contact Parent</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-8 text-center text-xs text-slate-400">
              No students currently in critical or moderate risk categories.
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AIRiskReportModal
        student={selectedStudentForAI}
        isOpen={!!selectedStudentForAI}
        onClose={() => setSelectedStudentForAI(null)}
        onTriggerParentMessage={(st) => setSelectedStudentForMessage(st)}
      />

      <ParentCommunicationModal
        student={selectedStudentForMessage}
        isOpen={!!selectedStudentForMessage}
        onClose={() => setSelectedStudentForMessage(null)}
      />

      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        classNameTitle={selectedClass?.class_name || 'Class'}
        students={students}
      />
    </div>
  );
};
