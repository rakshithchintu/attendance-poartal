import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { GraduationCap, Sparkles, UserCheck, Shield, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onNavigateToSignup: () => void;
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToSignup, onLoginSuccess }) => {
  const { setUser, setRole } = useAuthStore();
  const [email, setEmail] = useState('teacher@school.edu');
  const [password, setPassword] = useState('password123');
  const [role, setSelectedRole] = useState<'TEACHER' | 'ADMIN'>('TEACHER');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    // If Supabase is configured
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email || email,
            full_name: data.user.user_metadata?.full_name || (role === 'ADMIN' ? 'Principal Marcus Davis' : 'Dr. Eleanor Vance'),
            role,
          });
          onLoginSuccess();
          return;
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Supabase authentication failed');
      }
    }

    // Default fast-login
    setUser({
      id: role === 'ADMIN' ? '00000000-0000-0000-0000-000000000002' : '00000000-0000-0000-0000-000000000001',
      email,
      full_name: role === 'ADMIN' ? 'Principal Marcus Davis' : 'Dr. Eleanor Vance',
      role,
    });
    setLoading(false);
    onLoginSuccess();
  };

  const handleQuickDemo = (demoRole: 'TEACHER' | 'ADMIN') => {
    setRole(demoRole);
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-xl shadow-indigo-600/30">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">EduRisk AI</h2>
          <p className="text-xs text-slate-400">
            Student Attendance Management & Predictive Risk Assistant
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-7 shadow-2xl backdrop-blur-md space-y-5">
          <div>
            <h3 className="text-lg font-bold text-white">Sign In to Faculty Portal</h3>
            <p className="text-xs text-slate-400 mt-0.5">Select your institutional role and credentials</p>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Role Tabs */}
            <div>
              <label className="font-semibold text-slate-300">Select Role</label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('TEACHER')}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 font-bold transition-all ${
                    role === 'TEACHER'
                      ? 'border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserCheck size={16} />
                  <span>Teacher</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('ADMIN')}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 font-bold transition-all ${
                    role === 'ADMIN'
                      ? 'border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Shield size={16} />
                  <span>Administrator</span>
                </button>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300">Institutional Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-white outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In with Supabase Auth'}
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="border-t border-slate-800 pt-4 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 block text-center uppercase tracking-wider">
              Quick Test Demo Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('TEACHER')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
              >
                <span>Dr. Eleanor Vance (Teacher)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('ADMIN')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors"
              >
                <span>Principal Marcus (Admin)</span>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400">
            Don't have an institutional account?{' '}
            <button
              onClick={onNavigateToSignup}
              className="font-bold text-indigo-400 hover:underline"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
