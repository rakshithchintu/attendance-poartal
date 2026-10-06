import { create } from 'zustand';
import { UserProfile, UserRole } from '../types/index.js';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  setUser: (user: UserProfile | null) => void;
  setRole: (role: UserRole) => void;
  logout: () => void;
}

const DEFAULT_USER: UserProfile = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'teacher@school.edu',
  full_name: 'Dr. Eleanor Vance',
  role: 'TEACHER',
  created_at: '2026-09-01T08:00:00Z',
};

export const useAuthStore = create<AuthState>((set, get) => {
  const saved = localStorage.getItem('edurisk_user');
  let initialUser = DEFAULT_USER;
  if (saved) {
    try {
      initialUser = JSON.parse(saved);
    } catch {
      initialUser = DEFAULT_USER;
    }
  }

  return {
    user: initialUser,
    isAuthenticated: true,
    setUser: (user) => {
      if (user) {
        localStorage.setItem('edurisk_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('edurisk_user');
      }
      set({ user, isAuthenticated: !!user });
    },
    setRole: (role) => {
      const current = get().user || DEFAULT_USER;
      const updated: UserProfile = {
        ...current,
        role,
        full_name: role === 'ADMIN' ? 'Principal Marcus Davis' : 'Dr. Eleanor Vance',
        email: role === 'ADMIN' ? 'admin@school.edu' : 'teacher@school.edu',
        id: role === 'ADMIN' ? '00000000-0000-0000-0000-000000000002' : '00000000-0000-0000-0000-000000000001',
      };
      localStorage.setItem('edurisk_user', JSON.stringify(updated));
      set({ user: updated });
    },
    logout: () => {
      localStorage.removeItem('edurisk_user');
      set({ user: null, isAuthenticated: false });
    },
  };
});
