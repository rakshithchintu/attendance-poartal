import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentItem, AttendanceLogItem } from '../types/index.js';
import { exportToCSV } from '../lib/utils.js';
import { FileDown, X, FileText, Table, CheckCircle2 } from 'lucide-react';
import { useAttendanceStore } from '../store/useAttendanceStore.js';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classNameTitle: string;
  students: StudentItem[];
  logs?: AttendanceLogItem[];
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  classNameTitle,
  students,
  logs = [],
}) => {
  const { addToast } = useAttendanceStore();
  const [reportType, setReportType] = useState<'ROSTER' | 'RISK' | 'LOGS'>('ROSTER');
  const [format, setFormat] = useState<'PDF' | 'CSV'>('PDF');

  if (!isOpen) return null;

  const handleExport = () => {
    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'CSV') {
      if (reportType === 'ROSTER') {
        const rows = students.map((s) => ({
          'Roll Number': s.roll_number,
          'First Name': s.first_name,
          'Last Name': s.last_name,
          'Attendance %': s.metrics?.attendancePercentage?.toFixed(1) || '100.0',
          'Attended Sessions': s.metrics?.attendedSessions || 0,
          'Total Sessions': s.metrics?.totalSessions || 0,
          'Absences': s.metrics?.absentCount || 0,
          'Late Arrivals': s.metrics?.lateCount || 0,
          'Excused': s.metrics?.excusedCount || 0,
          'Risk Level': s.metrics?.riskLevel || 'LOW',
          'Parent Name': s.parent_name,
          'Parent Email': s.parent_email,
        }));
        exportToCSV(`${classNameTitle}_Roster_${timestamp}`, rows);
      } else if (reportType === 'RISK') {
        const rows = students.map((s) => ({
          'Roll Number': s.roll_number,
          'Student Name': `${s.first_name} ${s.last_name}`,
          'Attendance Rate': `${s.metrics?.attendancePercentage?.toFixed(1)}%`,
          'Assessed Risk': s.metrics?.riskLevel || 'LOW',
          'Max Absence Streak': s.metrics?.maxConsecutiveAbsence || 0,
          'Primary Risk Drivers': (s.metrics?.suggestedRiskFactors || []).join('; '),
          'Parent Contact': `${s.parent_name} (${s.parent_email})`,
        }));
        exportToCSV(`${classNameTitle}_AI_Risk_Report_${timestamp}`, rows);
      } else {
        const rows = logs.map((l) => ({
          'Date': l.sessionDate,
          'Roll Number': l.rollNumber,
          'Student Name': l.studentName,
          'Status': l.status,
          'Remarks': l.remarks || '',
          'Session Notes': l.sessionNotes || '',
        }));
        exportToCSV(`${classNameTitle}_Attendance_Logs_${timestamp}`, rows);
      }

      addToast({
        type: 'success',
        title: 'CSV Export Generated',
        message: 'File downloaded successfully.',
      });
      onClose();
    } else {
      // PDF Export via jsPDF & autoTable
      try {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setTextColor(40, 44, 52);
        doc.text('EduRisk AI — Academic Attendance Report', 14, 20);

        doc.setFontSize(11);
        doc.setTextColor(100, 116, 139);
        doc.text(`Class: ${classNameTitle} | Date: ${new Date().toLocaleDateString()}`, 14, 28);
        doc.text(`Report Type: ${reportType} | System: Gemini 2.5 Flash Analytical Suite`, 14, 34);

        if (reportType === 'ROSTER') {
          const bodyData = students.map((s) => [
            s.roll_number,
            `${s.first_name} ${s.last_name}`,
            `${s.metrics?.attendancePercentage?.toFixed(1) || '100.0'}%`,
            s.metrics?.riskLevel || 'LOW',
            `${s.metrics?.attendedSessions || 0}/${s.metrics?.totalSessions || 0}`,
            s.parent_name,
          ]);

          autoTable(doc, {
            startY: 42,
            head: [['Roll No', 'Student Name', 'Attendance %', 'Risk Category', 'Attended', 'Parent Contact']],
            body: bodyData,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [248, 250, 252] },
          });
        } else if (reportType === 'RISK') {
          const bodyData = students.map((s) => [
            s.roll_number,
            `${s.first_name} ${s.last_name}`,
            `${s.metrics?.attendancePercentage?.toFixed(1)}%`,
            s.metrics?.riskLevel || 'LOW',
            (s.metrics?.suggestedRiskFactors || ['None detected'])[0] || 'Nominal',
          ]);

          autoTable(doc, {
            startY: 42,
            head: [['Roll No', 'Student Name', 'Attendance %', 'Risk Level', 'Primary Identified Driver']],
            body: bodyData,
            theme: 'grid',
            headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [255, 241, 242] },
          });
        } else {
          const bodyData = logs.slice(0, 50).map((l) => [
            l.sessionDate,
            l.rollNumber,
            l.studentName,
            l.status,
            l.remarks || '—',
          ]);

          autoTable(doc, {
            startY: 42,
            head: [['Date', 'Roll No', 'Student Name', 'Status', 'Remarks']],
            body: bodyData,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
          });
        }

        doc.save(`${classNameTitle}_${reportType}_Report_${timestamp}.pdf`);

        addToast({
          type: 'success',
          title: 'PDF Export Complete',
          message: 'Official report saved as PDF.',
        });
        onClose();
      } catch (err: any) {
        addToast({
          type: 'error',
          title: 'PDF Export Failed',
          message: err.message,
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileDown className="text-indigo-400" size={18} />
            Export Academic Reports
          </h3>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Report Type Selector */}
          <div>
            <label className="font-semibold text-slate-300">Select Report Type</label>
            <div className="mt-1.5 space-y-2">
              {[
                { id: 'ROSTER', title: 'Student Roster & Attendance Summary', desc: 'Complete breakdown of attendance percentages, totals, and parent info' },
                { id: 'RISK', title: 'AI Predictive Risk Assessment Matrix', desc: 'Gemini risk levels, chronic absence drivers, and streak flags' },
                { id: 'LOGS', title: 'Session Attendance Audit Trail', desc: 'Chronological session marks with timestamps and teacher remarks' },
              ].map((r) => (
                <div
                  key={r.id}
                  onClick={() => setReportType(r.id as any)}
                  className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                    reportType === r.id
                      ? 'border-indigo-500 bg-indigo-950/30'
                      : 'border-slate-800 bg-slate-800/50 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold text-white">{r.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{r.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Format Selector */}
          <div>
            <label className="font-semibold text-slate-300">File Format</label>
            <div className="mt-1.5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('PDF')}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2 font-semibold transition-colors ${
                  format === 'PDF'
                    ? 'border-indigo-500 bg-indigo-600 text-white'
                    : 'border-slate-700 bg-slate-800 text-slate-300'
                }`}
              >
                <FileText size={15} />
                <span>PDF Document</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('CSV')}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2 font-semibold transition-colors ${
                  format === 'CSV'
                    ? 'border-indigo-500 bg-indigo-600 text-white'
                    : 'border-slate-700 bg-slate-800 text-slate-300'
                }`}
              >
                <Table size={15} />
                <span>CSV Spreadsheet</span>
              </button>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-colors"
          >
            <FileDown size={14} />
            <span>Download {format}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
