import React, { useState } from 'react';
import { useAuthStore } from './store/useAuthStore.js';
import { useAttendanceStore } from './store/useAttendanceStore.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { Dashboard } from './pages/Dashboard.js';
import { StudentsPage } from './pages/StudentsPage.js';
import { StudentDetailPage } from './pages/StudentDetailPage.js';
import { AttendanceMarkPage } from './pages/AttendanceMarkPage.js';
import { AttendanceHistoryPage } from './pages/AttendanceHistoryPage.js';
import { AnalyticsRiskPage } from './pages/AnalyticsRiskPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { SignupPage } from './pages/SignupPage.js';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { toasts, removeToast } = useAttendanceStore();
  const [currentPath, setCurrentPath] = useState<string>('/dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // If not authenticated, show login or signup
  if (!isAuthenticated) {
    if (currentPath === '/signup') {
      return (
        <SignupPage
          onNavigateToLogin={() => setCurrentPath('/login')}
          onSignupSuccess={() => setCurrentPath('/dashboard')}
        />
      );
    }
    return (
      <LoginPage
        onNavigateToSignup={() => setCurrentPath('/signup')}
        onLoginSuccess={() => setCurrentPath('/dashboard')}
      />
    );
  }

  const navigateTo = (path: string) => {
    setSelectedStudentId(null);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCurrentPath(`/students/${studentId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar onOpenQuickScan={() => navigateTo('/analytics/risk')} />

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Responsive Left Sidebar */}
        <Sidebar currentPath={currentPath} onNavigate={navigateTo} />

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {selectedStudentId ? (
            <StudentDetailPage
              studentId={selectedStudentId}
              onBack={() => navigateTo('/students')}
            />
          ) : currentPath === '/dashboard' ? (
            <Dashboard onNavigate={navigateTo} onSelectStudent={handleSelectStudent} />
          ) : currentPath === '/students' ? (
            <StudentsPage onSelectStudent={handleSelectStudent} />
          ) : currentPath === '/attendance/mark' ? (
            <AttendanceMarkPage />
          ) : currentPath === '/attendance/history' ? (
            <AttendanceHistoryPage />
          ) : currentPath === '/analytics/risk' ? (
            <AnalyticsRiskPage onSelectStudent={handleSelectStudent} />
          ) : currentPath === '/settings' ? (
            <SettingsPage />
          ) : (
            <Dashboard onNavigate={navigateTo} onSelectStudent={handleSelectStudent} />
          )}
        </main>
      </div>

      {/* Global Toast Notifications Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-md transition-all duration-300 animate-slide-up ${
              toast.type === 'success'
                ? 'border-emerald-500/30 bg-slate-900/95 text-emerald-300 shadow-emerald-950/20'
                : toast.type === 'error'
                ? 'border-rose-500/30 bg-slate-900/95 text-rose-300 shadow-rose-950/20'
                : toast.type === 'warning'
                ? 'border-amber-500/30 bg-slate-900/95 text-amber-300 shadow-amber-950/20'
                : 'border-indigo-500/30 bg-slate-900/95 text-indigo-300 shadow-indigo-950/20'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'success' && <CheckCircle2 size={18} className="text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle size={18} className="text-rose-400" />}
              {toast.type === 'warning' && <AlertTriangle size={18} className="text-amber-400" />}
              {toast.type === 'info' && <Info size={18} className="text-indigo-400" />}
            </div>

            <div className="flex-1 text-xs">
              <div className="font-bold text-white">{toast.title}</div>
              {toast.message && (
                <div className="mt-0.5 text-slate-300 leading-relaxed">{toast.message}</div>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="rounded p-1 text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
