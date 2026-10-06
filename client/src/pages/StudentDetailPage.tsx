import React, { useEffect, useState } from 'react';
import { fetchStudentById, createIntervention, updateIntervention } from '../lib/api.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { AIRiskReportModal } from '../components/AIRiskReportModal.js';
import { ParentCommunicationModal } from '../components/ParentCommunicationModal.js';
import { useAttendanceStore } from '../store/useAttendanceStore.js';
import { getStatusBadgeStyle } from '../lib/utils.js';
import {
  ArrowLeft,
  Mail,
  Phone,
  Sparkles,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  XCircle,
  TrendingDown,
  TrendingUp,
  Minus,
  PlusCircle,
  FileText,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';

interface StudentDetailPageProps {
  studentId: string;
  onBack: () => void;
}

export const StudentDetailPage: React.FC<StudentDetailPageProps> = ({ studentId, onBack }) => {
  const { addToast, minAttendanceThreshold } = useAttendanceStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isParentMessageModalOpen, setIsParentMessageModalOpen] = useState(false);

  // New intervention modal
  const [isAddInterventionOpen, setIsAddInterventionOpen] = useState(false);
  const [newActionPlan, setNewActionPlan] = useState('');
  const [newInterventionNotes, setNewInterventionNotes] = useState('');
  const [newInterventionStatus, setNewInterventionStatus] = useState<any>('IN_PROGRESS');

  useEffect(() => {
    loadStudentDetail();
  }, [studentId]);

  const loadStudentDetail = async () => {
    setLoading(true);
    try {
      const res = await fetchStudentById(studentId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionPlan) return;

    try {
      await createIntervention({
        studentId,
        actionPlan: newActionPlan,
        notes: newInterventionNotes,
        status: newInterventionStatus,
      });

      addToast({
        type: 'success',
        title: 'Intervention Logged',
        message: 'Action plan recorded successfully in timeline.',
      });

      setIsAddInterventionOpen(false);
      setNewActionPlan('');
      setNewInterventionNotes('');
      loadStudentDetail();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error Logging Intervention',
        message: err.message,
      });
    }
  };

  const handleUpdateStatus = async (interventionId: string, status: any) => {
    try {
      await updateIntervention(interventionId, { status });
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: `Intervention moved to ${status}`,
      });
      loadStudentDetail();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message,
      });
    }
  };

  if (loading || !data) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="mt-3 text-xs text-slate-400">Loading student profile & attendance logs...</p>
      </div>
    );
  }

  const percentage = data.metrics.attendancePercentage;
  const isUnderThreshold = percentage < minAttendanceThreshold;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button & Profile Header */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          <span>Back to Roster</span>
        </button>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-2xl font-bold text-white shadow-lg shadow-indigo-600/30">
              {data.first_name[0]}{data.last_name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-white">
                  {data.first_name} {data.last_name}
                </h1>
                <RiskBadge level={data.metrics.riskLevel} size="md" />
              </div>
              <p className="mt-1 text-xs text-slate-400 flex items-center gap-3">
                <span>Roll: <strong className="text-slate-200">{data.roll_number}</strong></span>
                <span>•</span>
                <span>Class: <strong className="text-slate-200">{data.classInfo?.class_name} ({data.classInfo?.subject_code})</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-500/20 shadow-md transition-all"
            >
              <Sparkles size={15} />
              <span>Run Gemini AI Analysis</span>
            </button>

            <button
              onClick={() => setIsParentMessageModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-colors"
            >
              <Mail size={15} />
              <span>Draft Parent Communication</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Attendance Percentage</div>
          <div className="mt-2 text-2xl font-extrabold text-white flex items-baseline gap-2">
            <span className={isUnderThreshold ? 'text-rose-400' : 'text-emerald-400'}>
              {percentage.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400 font-normal">/ 100%</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {isUnderThreshold ? `Breaching ${minAttendanceThreshold}% minimum` : 'Above passing requirement'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sessions Attended</div>
          <div className="mt-2 text-2xl font-extrabold text-white">
            {data.metrics.attendedSessions} <span className="text-xs text-slate-400 font-normal">/ {data.metrics.totalSessions} sessions</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {data.metrics.presentCount} on-time, {data.metrics.lateCount} late
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Unexcused Absences</div>
          <div className="mt-2 text-2xl font-extrabold text-rose-400">
            {data.metrics.absentCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {data.metrics.maxConsecutiveAbsence >= 2 ? `${data.metrics.maxConsecutiveAbsence} max consecutive streak` : 'No consecutive streaks'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Parent / Guardian Contact</div>
          <div className="mt-2 font-bold text-white text-sm">
            {data.parent_name}
          </div>
          <div className="mt-1 text-[11px] text-indigo-300 truncate">
            {data.parent_email}
          </div>
        </div>
      </div>

      {/* Gemini AI Risk Insights Card (if generated) */}
      {data.latestAssessment && (
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-slate-900 to-slate-900 p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="text-indigo-400" size={16} />
              Gemini 2.5 Flash Predictive Assessment
            </h3>
            <span className="text-[11px] text-slate-400">
              Assessed on {new Date(data.latestAssessment.assessed_at).toLocaleDateString()}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Summary</span>
                <p className="mt-1 text-xs text-slate-200 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                  {data.latestAssessment.analysis_summary}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Identified Risk Drivers</span>
                <div className="mt-1.5 space-y-1.5">
                  {data.latestAssessment.primary_risk_factors.map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Recommended Steps</span>
              <div className="space-y-2">
                {data.latestAssessment.recommended_actions.map((act: string, i: number) => (
                  <div key={i} className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-2.5 text-xs text-emerald-200">
                    {act}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two Columns: Attendance History & Interventions Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance History */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar size={16} className="text-indigo-400" />
              Session Attendance History
            </h3>
            <span className="text-xs text-slate-400">{data.attendanceHistory?.length || 0} sessions</span>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {data.attendanceHistory?.map((item: any, idx: number) => {
              const statusStyle = getStatusBadgeStyle(item.status);

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-800/40 p-3 text-xs"
                >
                  <div>
                    <div className="font-semibold text-white">
                      {item.date} <span className="text-slate-400 font-normal">({item.dayOfWeek})</span>
                    </div>
                    {item.sessionNotes && (
                      <div className="text-[11px] text-slate-400">{item.sessionNotes}</div>
                    )}
                    {item.remarks && (
                      <div className="mt-0.5 text-[11px] text-indigo-300 italic">
                        Remark: "{item.remarks}"
                      </div>
                    )}
                  </div>

                  <span
                    className={`rounded-full border px-2.5 py-0.5 font-semibold text-[11px] ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                  >
                    {item.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interventions Log & Action History */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText size={16} className="text-indigo-400" />
              Intervention Action Timeline
            </h3>
            <button
              onClick={() => setIsAddInterventionOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600/30 border border-indigo-500/40 px-3 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/50"
            >
              <PlusCircle size={13} />
              <span>Log Action</span>
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
            {data.interventions && data.interventions.length > 0 ? (
              data.interventions.map((interv: any) => (
                <div
                  key={interv.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">
                      {new Date(interv.created_at).toLocaleDateString()}
                    </span>
                    <select
                      value={interv.status}
                      onChange={(e) => handleUpdateStatus(interv.id, e.target.value)}
                      className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-bold text-white outline-none cursor-pointer"
                    >
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="PARENT_CONTACTED">Parent Contacted</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  </div>

                  <p className="font-medium text-slate-200 leading-relaxed">
                    {interv.action_plan}
                  </p>

                  {interv.parent_communication_draft && (
                    <div className="rounded-lg bg-slate-800/80 p-2 text-[11px] text-slate-300">
                      <span className="font-semibold text-indigo-300">Communication Draft: </span>
                      {interv.parent_communication_draft}
                    </div>
                  )}

                  {interv.notes && (
                    <div className="text-[11px] text-slate-400 italic">
                      Notes: {interv.notes}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No intervention records logged yet. Use "Log Action" or draft parent communication to record outreach.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Intervention Modal */}
      {isAddInterventionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">Log Academic Intervention</h3>
            <p className="mt-1 text-xs text-slate-400">
              Student: <strong className="text-white">{data.first_name} {data.last_name}</strong>
            </p>

            <form onSubmit={handleCreateIntervention} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300">Action Plan / Commitment *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="E.g. Met with student, established attendance contract with weekly check-ins..."
                  value={newActionPlan}
                  onChange={(e) => setNewActionPlan(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300">Intervention Status</label>
                <select
                  value={newInterventionStatus}
                  onChange={(e) => setNewInterventionStatus(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none"
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="PARENT_CONTACTED">Parent Contacted</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300">Additional Administrative Notes</label>
                <input
                  type="text"
                  placeholder="Optional context or counselor details..."
                  value={newInterventionNotes}
                  onChange={(e) => setNewInterventionNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddInterventionOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-500"
                >
                  Save Intervention
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals */}
      <AIRiskReportModal
        student={data}
        isOpen={isAIModalOpen}
        onClose={() => {
          setIsAIModalOpen(false);
          loadStudentDetail();
        }}
        onTriggerParentMessage={() => setIsParentMessageModalOpen(true)}
      />

      <ParentCommunicationModal
        student={data}
        isOpen={isParentMessageModalOpen}
        onClose={() => {
          setIsParentMessageModalOpen(false);
          loadStudentDetail();
        }}
      />
    </div>
  );
};
