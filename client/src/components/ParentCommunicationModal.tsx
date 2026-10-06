import React, { useState, useEffect } from 'react';
import { StudentItem, CommunicationTone, AIParentMessageDraft } from '../types/index.js';
import { generateParentMessage, createIntervention } from '../lib/api.js';
import {
  Mail,
  X,
  Copy,
  Check,
  Sparkles,
  Send,
  Calendar,
  AlertCircle,
  ShieldAlert,
  HeartHandshake,
  FileCheck2,
} from 'lucide-react';
import { useAttendanceStore } from '../store/useAttendanceStore.js';
import { cn } from '../lib/utils.js';

interface ParentCommunicationModalProps {
  student: StudentItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ParentCommunicationModal: React.FC<ParentCommunicationModalProps> = ({
  student,
  isOpen,
  onClose,
}) => {
  const { addToast } = useAttendanceStore();
  const [tone, setTone] = useState<CommunicationTone>('URGENT');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoggingIntervention, setIsLoggingIntervention] = useState(false);

  // Editable draft fields
  const [subjectLine, setSubjectLine] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [meetingPoints, setMeetingPoints] = useState<string[]>([]);

  useEffect(() => {
    if (student && isOpen) {
      // Pick initial tone based on risk level
      const initialTone = student.metrics?.riskLevel === 'CRITICAL'
        ? 'URGENT'
        : student.metrics?.riskLevel === 'MODERATE'
        ? 'EMPATHETIC'
        : 'FORMAL';
      setTone(initialTone);
      generateDraft(initialTone);
    }
  }, [student, isOpen]);

  const generateDraft = async (selectedTone: CommunicationTone) => {
    if (!student) return;
    setLoading(true);
    try {
      const res = await generateParentMessage({
        studentId: student.id,
        tone: selectedTone,
      });

      setSubjectLine(res.output.subjectLine);
      setMessageBody(res.output.messageBody);
      setMeetingPoints(res.output.suggestedMeetingPoints || []);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Failed to generate draft',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = `Subject: ${subjectLine}\n\n${messageBody}\n\nSuggested Discussion Points:\n- ${meetingPoints.join('\n- ')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    addToast({
      type: 'success',
      title: 'Copied to Clipboard',
      message: 'Email draft is ready to paste into your mail client.',
    });
  };

  const handleLogIntervention = async () => {
    if (!student) return;
    setIsLoggingIntervention(true);
    try {
      await createIntervention({
        studentId: student.id,
        actionPlan: `Drafted and staged parent communication (${tone} tone). Follow-up meeting points identified.`,
        parentCommunicationDraft: `${subjectLine}\n\n${messageBody}`,
        notes: `Target parent: ${student.parent_name} (${student.parent_email})`,
        status: 'PARENT_CONTACTED',
      });

      addToast({
        type: 'success',
        title: 'Intervention Logged',
        message: `Official outreach recorded for ${student.first_name} ${student.last_name}`,
      });
      onClose();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Failed to log intervention',
        message: err.message,
      });
    } finally {
      setIsLoggingIntervention(false);
    }
  };

  const handleMailTo = () => {
    if (!student) return;
    const mailto = `mailto:${encodeURIComponent(student.parent_email)}?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(messageBody)}`;
    window.open(mailto, '_blank');
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Mail size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">AI Parent Communication Draft</h3>
                <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                  Gemini Generated
                </span>
              </div>
              <p className="text-xs text-slate-400">
                To: <strong className="text-white">{student.parent_name}</strong> ({student.parent_email})
              </p>
            </div>
          </div>

          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Tone Selector Pills */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="text-xs font-semibold text-slate-400">Communication Tone:</div>
          <div className="flex items-center gap-2">
            {[
              { id: 'URGENT', label: 'Urgent', icon: ShieldAlert, color: 'text-rose-400' },
              { id: 'EMPATHETIC', label: 'Empathetic', icon: HeartHandshake, color: 'text-emerald-400' },
              { id: 'FORMAL', label: 'Formal', icon: FileCheck2, color: 'text-indigo-400' },
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = tone === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    const newTone = t.id as CommunicationTone;
                    setTone(newTone);
                    generateDraft(newTone);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  )}
                >
                  <Icon size={14} className={isSelected ? 'text-white' : t.color} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor Area */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Sparkles className="mx-auto h-7 w-7 text-indigo-400 animate-spin" />
            <h4 className="text-sm font-semibold text-white">Drafting Personalized Communication...</h4>
            <p className="text-xs text-slate-400">Applying selected tone and synthesizing academic metrics.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Subject Line */}
            <div>
              <label className="text-xs font-semibold text-slate-400">Subject Line</label>
              <input
                type="text"
                value={subjectLine}
                onChange={(e) => setSubjectLine(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-indigo-500"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="text-xs font-semibold text-slate-400">Message Body</label>
              <textarea
                rows={9}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-xs text-slate-200 outline-none focus:border-indigo-500 leading-relaxed font-sans"
              />
            </div>

            {/* Suggested Meeting Points */}
            {meetingPoints.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Calendar size={13} className="text-indigo-400" />
                  Suggested Meeting Discussion Points
                </h5>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {meetingPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-indigo-400 font-bold">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy Message'}</span>
                </button>

                <button
                  onClick={handleMailTo}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
                >
                  <Send size={14} />
                  <span>Open Email Client</span>
                </button>
              </div>

              <button
                onClick={handleLogIntervention}
                disabled={isLoggingIntervention}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-colors disabled:opacity-50"
              >
                <Check size={15} />
                <span>{isLoggingIntervention ? 'Saving...' : 'Log as Official Intervention'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
