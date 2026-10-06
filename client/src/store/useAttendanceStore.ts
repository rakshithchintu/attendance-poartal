import { create } from 'zustand';
import { ClassItem } from '../types/index.js';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface AttendanceStoreState {
  selectedClassId: string;
  selectedDate: string;
  classes: ClassItem[];
  minAttendanceThreshold: number;
  toasts: ToastMessage[];
  setSelectedClassId: (classId: string) => void;
  setSelectedDate: (date: string) => void;
  setClasses: (classes: ClassItem[]) => void;
  setMinAttendanceThreshold: (threshold: number) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useAttendanceStore = create<AttendanceStoreState>((set) => ({
  selectedClassId: '11111111-1111-1111-1111-111111111111',
  selectedDate: '2026-10-06',
  classes: [],
  minAttendanceThreshold: 75.0,
  toasts: [],
  setSelectedClassId: (selectedClassId) => set({ selectedClassId }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setClasses: (classes) => set({ classes }),
  setMinAttendanceThreshold: (minAttendanceThreshold) => set({ minAttendanceThreshold }),
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4500);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
