import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { GraduationCap, UserCheck, Shield } from 'lucide-react';

interface SignupPageProps {
  onNavigateToLogin: () => void;
  onSignupSuccess: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onNavigateToLogin, onSignupSuccess }) => {
  const { setUser } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setSelectedRole] = useState<'TEACHER' | 'ADMIN'>('TEACHER');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email || email,
            full_name: fullName,
            role,
          });
          onSignupSuccess();
          return;
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Supabase signup failed');
      }
    }

    // Default fast signup
    setUser({
      id: Math.random().toString(36).substring(2, 15),
      email,
      full_name: fullName,
      role,
    });
    setLoading(false);
    onSignupSuccess();
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
            Create an Institutional Faculty Account
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-7 shadow-2xl backdrop-blur-md space-y-5">
          <div>
            <h3 className="text-lg font-bold text-white">Register Account</h3>
            <p className="text-xs text-slate-400 mt-0.5">Access predictive attendance insights & class management</p>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Role Tabs */}
            <div>
              <label className="font-semibold text-slate-300">Account Role</label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('TEACHER')}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 font-bold transition-all ${
                    role === 'TEACHER'
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-slate-800 bg-slate-800/60 text-slate-400'
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
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-slate-800 bg-slate-800/60 text-slate-400'
                  }`}
                >
                  <Shield size={16} />
                  <span>Administrator</span>
                </button>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300">Full Name</label>
              <input
                type="text"
                required
                placeholder="Dr. Sarah Connor"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300">Institutional Email</label>
              <input
                type="email"
                required
                placeholder="s.connor@university.edu"
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
                placeholder="••••••••"
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
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>

          <div className="text-center text-xs text-slate-400 border-t border-slate-800 pt-4">
            Already registered?{' '}
            <button
              onClick={onNavigateToLogin}
              className="font-bold text-indigo-400 hover:underline"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
