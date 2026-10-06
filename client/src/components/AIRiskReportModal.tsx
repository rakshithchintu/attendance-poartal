import React, { useState, useEffect } from 'react';
import { StudentItem, AIRiskAssessment } from '../types/index.js';
import { analyzeStudentRisk } from '../lib/api.js';
import { RiskBadge } from './RiskBadge.js';
import {
  Sparkles,
  X,
  AlertTriangle,
  CheckCircle2,
  BrainCircuit,
  Mail,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { useAttendanceStore } from '../store/useAttendanceStore.js';

interface AIRiskReportModalProps {
  student: StudentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onTriggerParentMessage: (student: StudentItem) => void;
}

export const AIRiskReportModal: React.FC<AIRiskReportModalProps> = ({
  student,
  isOpen,
  onClose,
  onTriggerParentMessage,
}) => {
  const { addToast } = useAttendanceStore();
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<AIRiskAssessment | null>(null);

  useEffect(() => {
    if (student && isOpen) {
      if (student.latestAssessment) {
        setAssessment(student.latestAssessment);
      } else {
        runAnalysis();
      }
    }
  }, [student, isOpen]);

  const runAnalysis = async () => {
    if (!student) return;
    setLoading(true);
    try {
      const res = await analyzeStudentRisk(student.id);
      setAssessment(res.assessment);
      addToast({
        type: 'success',
        title: 'Gemini AI Assessment Complete',
        message: `Evaluated risk profile for ${student.first_name} ${student.last_name}`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'AI Analysis Failed',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <BrainCircuit size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">AI Predictive Risk Evaluation</h3>
                <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                  Gemini 2.5 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Student: <strong className="text-white">{student.first_name} {student.last_name}</strong> ({student.roll_number})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="mx-auto h-8 w-8 text-indigo-400 animate-spin" />
            <h4 className="text-sm font-semibold text-white">Synthesizing 30-Day Attendance Records...</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Gemini 2.5 Flash is analyzing day-of-week absence patterns, consecutive absence streaks, and predicting dropout risk factors.
            </p>
          </div>
        ) : assessment ? (
          <div className="mt-5 space-y-5">
            {/* Risk Level & Attendance Banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-800/50 p-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400">Assessed Risk Category:</span>
                <RiskBadge level={assessment.risk_level} size="lg" />
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Calculated Attendance: </span>
                  <strong className={assessment.calculated_percentage < 75 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {assessment.calculated_percentage.toFixed(1)}%
                  </strong>
                </div>
                <div className="text-slate-400">
                  Assessed: <span className="text-slate-300">{new Date(assessment.assessed_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Analysis Summary */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2 flex items-center gap-1.5">
                <Sparkles size={14} /> Analytical Summary
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {assessment.analysis_summary}
              </p>
            </div>

            {/* Primary Risk Factors */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-400" /> Primary Risk Drivers
              </h4>
              <div className="space-y-2">
                {assessment.primary_risk_factors.map((factor, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 rounded-lg border border-slate-800/80 bg-slate-800/30 p-2.5 text-xs text-slate-200"
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-[10px] font-bold text-rose-400">
                      {idx + 1}
                    </span>
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Interventions */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Lightbulb size={14} className="text-emerald-400" /> Recommended Action Plan
              </h4>
              <div className="space-y-2">
                {assessment.recommended_actions.map((action, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-2.5 text-xs text-emerald-200"
                  >
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-400" />
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <button
                onClick={runAnalysis}
                className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <RefreshCw size={13} />
                <span>Re-evaluate With AI</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onTriggerParentMessage(student);
                }}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-colors"
              >
                <Mail size={14} />
                <span>Draft Parent Outreach Message</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-xs text-slate-400">No assessment data generated yet.</p>
            <button
              onClick={runAnalysis}
              className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
            >
              Start Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
