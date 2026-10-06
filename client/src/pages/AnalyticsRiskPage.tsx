import React, { useState, useEffect } from 'react';
import { useAttendanceStore } from '../store/useAttendanceStore.js';
import { fetchStudents, analyzeClassRisk } from '../lib/api.js';
import { StudentItem } from '../types/index.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { AIRiskReportModal } from '../components/AIRiskReportModal.js';
import { ParentCommunicationModal } from '../components/ParentCommunicationModal.js';
import {
  BrainCircuit,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Mail,
  RefreshCw,
  TrendingDown,
  Layers,
  Search,
} from 'lucide-react';

interface AnalyticsRiskPageProps {
  onSelectStudent: (studentId: string) => void;
}

export const AnalyticsRiskPage: React.FC<AnalyticsRiskPageProps> = ({ onSelectStudent }) => {
  const { selectedClassId, classes, addToast, minAttendanceThreshold } = useAttendanceStore();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanningClass, setIsScanningClass] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRiskTab, setSelectedRiskTab] = useState<'ALL' | 'CRITICAL' | 'MODERATE' | 'LOW'>('ALL');

  // Modals
  const [selectedStudentForAI, setSelectedStudentForAI] = useState<StudentItem | null>(null);
  const [selectedStudentForMessage, setSelectedStudentForMessage] = useState<StudentItem | null>(null);

  useEffect(() => {
    loadStudents();
  }, [selectedClassId]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await fetchStudents({ classId: selectedClassId });
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScanWholeClass = async () => {
    setIsScanningClass(true);
    try {
      const res = await analyzeClassRisk(selectedClassId);
      addToast({
        type: 'success',
        title: 'Class-Wide AI Scan Complete',
        message: `Successfully evaluated ${res.count} students using Gemini 2.5 Flash predictive models.`,
      });
      loadStudents();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'AI Batch Scan Failed',
        message: err.message,
      });
    } finally {
      setIsScanningClass(false);
    }
  };

  const criticalCount = students.filter((s) => s.metrics?.riskLevel === 'CRITICAL').length;
  const moderateCount = students.filter((s) => s.metrics?.riskLevel === 'MODERATE').length;
  const lowCount = students.filter((s) => s.metrics?.riskLevel === 'LOW').length;

  const filteredStudents = students.filter((s) => {
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRisk =
      selectedRiskTab === 'ALL' || s.metrics?.riskLevel === selectedRiskTab;

    return matchesSearch && matchesRisk;
  });

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <BrainCircuit size={16} />
            <span>Predictive Analytics & Chronic Absenteeism Prevention</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-white tracking-tight">
            AI Student Risk Command Center
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Powered by <strong className="text-indigo-300">Google Gemini 2.5 Flash</strong>. Multi-variable pattern analysis across streaks, day spikes, and {minAttendanceThreshold}% threshold boundaries.
          </p>
        </div>

        <button
          onClick={handleScanWholeClass}
          disabled={isScanningClass}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 transition-all disabled:opacity-50 hover:-translate-y-0.5"
        >
          <Sparkles size={16} className={isScanningClass ? 'animate-spin' : ''} />
          <span>{isScanningClass ? 'Evaluating All Records...' : 'Run Full-Class AI Risk Scan'}</span>
        </button>
      </div>

      {/* Risk Category Distribution Matrices */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Critical Card */}
        <div
          onClick={() => setSelectedRiskTab('CRITICAL')}
          className={`cursor-pointer rounded-2xl border p-5 shadow-lg transition-all ${
            selectedRiskTab === 'CRITICAL'
              ? 'border-rose-500 bg-rose-950/30 ring-2 ring-rose-500/30'
              : 'border-rose-500/20 bg-slate-900/90 hover:border-rose-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <ShieldAlert size={16} />
              Critical Risk
            </span>
            <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-extrabold text-rose-400 border border-rose-500/30">
              {criticalCount} Students
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-300 leading-relaxed">
            Attendance &lt; 70% or 3+ consecutive unexcused absences. Immediate administrative intervention required.
          </div>
        </div>

        {/* Moderate Card */}
        <div
          onClick={() => setSelectedRiskTab('MODERATE')}
          className={`cursor-pointer rounded-2xl border p-5 shadow-lg transition-all ${
            selectedRiskTab === 'MODERATE'
              ? 'border-amber-500 bg-amber-950/30 ring-2 ring-amber-500/30'
              : 'border-amber-500/20 bg-slate-900/90 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <AlertTriangle size={16} />
              Moderate Risk
            </span>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-extrabold text-amber-400 border border-amber-500/30">
              {moderateCount} Students
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-300 leading-relaxed">
            Attendance 70% – 79% or irregular absenteeism patterns (e.g. repeated Friday or Monday drops).
          </div>
        </div>

        {/* Low Card */}
        <div
          onClick={() => setSelectedRiskTab('LOW')}
          className={`cursor-pointer rounded-2xl border p-5 shadow-lg transition-all ${
            selectedRiskTab === 'LOW'
              ? 'border-emerald-500 bg-emerald-950/30 ring-2 ring-emerald-500/30'
              : 'border-emerald-500/20 bg-slate-900/90 hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={16} />
              Low Risk
            </span>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-extrabold text-emerald-400 border border-emerald-500/30">
              {lowCount} Students
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-300 leading-relaxed">
            Attendance &gt;= 80% with stable trend lines and healthy participation.
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search student risk matrix..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-indigo-500"
          />
        </div>

        {selectedRiskTab !== 'ALL' && (
          <button
            onClick={() => setSelectedRiskTab('ALL')}
            className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium self-end sm:self-center"
          >
            Show All Students ({students.length})
          </button>
        )}
      </div>

      {/* Student Risk Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-400">
            No students found in this category.
          </div>
        ) : (
          filteredStudents.map((student) => {
            const percentage = student.metrics?.attendancePercentage ?? 100;
            const isUnderThreshold = percentage < minAttendanceThreshold;
            const assessment = student.latestAssessment;
            const riskLevel = student.metrics?.riskLevel || 'LOW';

            return (
              <div
                key={student.id}
                className={`relative overflow-hidden rounded-2xl border bg-slate-900/90 p-5 shadow-xl transition-all hover:border-slate-700 ${
                  riskLevel === 'CRITICAL'
                    ? 'border-rose-500/30 shadow-rose-950/20'
                    : riskLevel === 'MODERATE'
                    ? 'border-amber-500/30 shadow-amber-950/20'
                    : 'border-slate-800'
                }`}
              >
                {/* Top Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3
                      onClick={() => onSelectStudent(student.id)}
                      className="text-base font-bold text-white hover:text-indigo-400 cursor-pointer transition-colors"
                    >
                      {student.first_name} {student.last_name}
                    </h3>
                    <p className="text-xs font-mono text-slate-400">{student.roll_number}</p>
                  </div>
                  <RiskBadge level={riskLevel} size="md" />
                </div>

                {/* Percentage Progress Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Attendance Percentage:</span>
                    <span
                      className={`font-extrabold ${
                        isUnderThreshold ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        percentage < 70
                          ? 'bg-rose-500'
                          : percentage < 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, percentage))}%` }}
                    />
                  </div>
                </div>

                {/* Detected Risk Factors */}
                <div className="mt-4 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Observed Behavioral Patterns:
                  </span>
                  <div className="space-y-1">
                    {(student.metrics?.suggestedRiskFactors || ['Consistent attendance recorded']).slice(0, 2).map((factor, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Summary Snippet (if available) */}
                {assessment && (
                  <div className="mt-3.5 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-[11px] text-slate-300 leading-relaxed">
                    <span className="font-semibold text-indigo-300">Gemini Synthesis: </span>
                    {assessment.analysis_summary.length > 120
                      ? `${assessment.analysis_summary.substring(0, 120)}...`
                      : assessment.analysis_summary}
                  </div>
                )}

                {/* Parent Contact Info */}
                <div className="mt-3.5 border-t border-slate-800/80 pt-3 text-xs text-slate-400">
                  Guardian: <strong className="text-slate-200">{student.parent_name}</strong>
                  <div className="text-[11px] text-indigo-300 truncate">{student.parent_email}</div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedStudentForAI(student)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                  >
                    <Sparkles size={14} />
                    <span>AI Deep Dive</span>
                  </button>

                  <button
                    onClick={() => setSelectedStudentForMessage(student)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition-colors"
                  >
                    <Mail size={14} />
                    <span>Intervene</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <AIRiskReportModal
        student={selectedStudentForAI}
        isOpen={!!selectedStudentForAI}
        onClose={() => {
          setSelectedStudentForAI(null);
          loadStudents();
        }}
        onTriggerParentMessage={(st) => setSelectedStudentForMessage(st)}
      />

      <ParentCommunicationModal
        student={selectedStudentForMessage}
        isOpen={!!selectedStudentForMessage}
        onClose={() => {
          setSelectedStudentForMessage(null);
          loadStudents();
        }}
      />
    </div>
  );
};
