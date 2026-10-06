import React, { useState, useEffect } from 'react';
import { useAttendanceStore } from '../store/useAttendanceStore.js';
import { fetchStudents, createStudent, deleteStudent } from '../lib/api.js';
import { StudentItem } from '../types/index.js';
import { StudentTable } from '../components/StudentTable.js';
import { AIRiskReportModal } from '../components/AIRiskReportModal.js';
import { ParentCommunicationModal } from '../components/ParentCommunicationModal.js';
import { ExportReportModal } from '../components/ExportReportModal.js';
import {
  Users,
  UserPlus,
  FileDown,
  RefreshCw,
  X,
  GraduationCap,
} from 'lucide-react';

interface StudentsPageProps {
  onSelectStudent: (studentId: string) => void;
}

export const StudentsPage: React.FC<StudentsPageProps> = ({ onSelectStudent }) => {
  const { selectedClassId, classes, addToast, minAttendanceThreshold } = useAttendanceStore();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedStudentForAI, setSelectedStudentForAI] = useState<StudentItem | null>(null);
  const [selectedStudentForMessage, setSelectedStudentForMessage] = useState<StudentItem | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Student Form State
  const [newRollNumber, setNewRollNumber] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newParentName, setNewParentName] = useState('');
  const [newParentEmail, setNewParentEmail] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRollNumber || !newFirstName || !newLastName || !newParentName || !newParentEmail) {
      addToast({
        type: 'warning',
        title: 'Missing Required Fields',
        message: 'Please fill in student name, roll number, and parent details.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createStudent({
        classId: selectedClassId,
        rollNumber: newRollNumber,
        firstName: newFirstName,
        lastName: newLastName,
        email: newEmail,
        parentName: newParentName,
        parentEmail: newParentEmail,
        parentPhone: newParentPhone,
      });

      addToast({
        type: 'success',
        title: 'Student Enrolled',
        message: `${newFirstName} ${newLastName} (${newRollNumber}) successfully added to class roster.`,
      });

      setIsAddModalOpen(false);
      // Reset form
      setNewRollNumber('');
      setNewFirstName('');
      setNewLastName('');
      setNewEmail('');
      setNewParentName('');
      setNewParentEmail('');
      setNewParentPhone('');

      loadStudents();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Enrollment Error',
        message: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (studentId: string) => {
    try {
      await deleteStudent(studentId);
      addToast({
        type: 'success',
        title: 'Student Removed',
        message: 'Student record and associated history deleted.',
      });
      loadStudents();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Failed to delete student',
        message: err.message,
      });
    }
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Users size={15} />
            <span>Class Directory & Roster</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-white tracking-tight">
            {selectedClass?.class_name || 'Class Roster'} ({selectedClass?.subject_code})
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {students.length} students enrolled in {selectedClass?.academic_term}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadStudents}
            className="rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            title="Refresh Roster"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <FileDown size={15} />
            <span>Export Roster</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-colors"
          >
            <UserPlus size={15} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Roster Table */}
      <StudentTable
        students={students}
        onSelectStudent={onSelectStudent}
        onOpenAIRiskModal={(st) => setSelectedStudentForAI(st)}
        onOpenParentMessageModal={(st) => setSelectedStudentForMessage(st)}
        onOpenAddStudent={() => setIsAddModalOpen(true)}
        onDeleteStudent={handleDelete}
        minThreshold={minAttendanceThreshold}
      />

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap className="text-indigo-400" size={18} />
                Enroll New Student
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300">Roll Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS101-11"
                    value={newRollNumber}
                    onChange={(e) => setNewRollNumber(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300">Student Email</label>
                  <input
                    type="email"
                    placeholder="student@school.edu"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="First Name"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Last Name"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-2">
                  Parent / Guardian Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="font-semibold text-slate-300">Parent / Guardian Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maria Gonzalez"
                      value={newParentName}
                      onChange={(e) => setNewParentName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-300">Parent Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="parent@example.com"
                        value={newParentEmail}
                        onChange={(e) => setNewParentEmail(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-300">Parent Phone</label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={newParentPhone}
                        onChange={(e) => setNewParentPhone(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Save & Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
