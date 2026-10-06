import {
  ClassItem,
  StudentItem,
  BulkAttendancePayload,
  AIRiskAssessment,
  AIParentMessageDraft,
  Intervention,
  AttendanceLogItem,
  ClassAnalytics,
  CommunicationTone,
} from '../types/index.js';

const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Pass active user id for demo / auth context
  const storedUser = localStorage.getItem('edurisk_user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      if (user.id) {
        headers.set('x-user-id', user.id);
      }
    } catch {
      // ignore
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

// Classes
export async function fetchClasses(): Promise<ClassItem[]> {
  return request<ClassItem[]>('/classes');
}

export async function fetchClassById(id: string): Promise<ClassItem> {
  return request<ClassItem>(`/classes/${id}`);
}

export async function createClass(data: {
  className: string;
  subjectCode: string;
  academicTerm: string;
  minAttendancePercentage?: number;
}): Promise<ClassItem> {
  return request<ClassItem>('/classes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchClassAnalytics(classId: string): Promise<ClassAnalytics> {
  return request<ClassAnalytics>(`/analytics/class/${classId}`);
}

// Students
export async function fetchStudents(params?: {
  classId?: string;
  search?: string;
  riskLevel?: string;
}): Promise<StudentItem[]> {
  const query = new URLSearchParams();
  if (params?.classId) query.set('classId', params.classId);
  if (params?.search) query.set('search', params.search);
  if (params?.riskLevel) query.set('riskLevel', params.riskLevel);
  const qs = query.toString();
  return request<StudentItem[]>(`/students${qs ? `?${qs}` : ''}`);
}

export async function fetchStudentById(id: string): Promise<any> {
  return request<any>(`/students/${id}`);
}

export async function createStudent(data: {
  classId: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  parentName: string;
  parentEmail: string;
  parentPhone?: string;
}): Promise<StudentItem> {
  return request<StudentItem>('/students', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateStudent(
  id: string,
  data: Partial<StudentItem>
): Promise<StudentItem> {
  return request<StudentItem>(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteStudent(id: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/students/${id}`, {
    method: 'DELETE',
  });
}

// Attendance
export async function fetchSessionAttendance(classId: string, date: string): Promise<any> {
  return request<any>(`/attendance/session?classId=${classId}&date=${date}`);
}

export async function submitBulkAttendance(payload: BulkAttendancePayload): Promise<any> {
  return request<any>('/attendance/session', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchAttendanceHistory(params?: {
  classId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  studentId?: string;
  search?: string;
}): Promise<{ totalCount: number; logs: AttendanceLogItem[] }> {
  const query = new URLSearchParams();
  if (params?.classId) query.set('classId', params.classId);
  if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
  if (params?.dateTo) query.set('dateTo', params.dateTo);
  if (params?.status) query.set('status', params.status);
  if (params?.studentId) query.set('studentId', params.studentId);
  if (params?.search) query.set('search', params.search);
  const qs = query.toString();
  return request<{ totalCount: number; logs: AttendanceLogItem[] }>(
    `/attendance/history${qs ? `?${qs}` : ''}`
  );
}

// AI Predictive Services
export async function analyzeStudentRisk(studentId: string): Promise<{
  success: boolean;
  assessment: AIRiskAssessment;
  metrics: any;
}> {
  return request('/ai/analyze-student-risk', {
    method: 'POST',
    body: JSON.stringify({ studentId }),
  });
}

export async function analyzeClassRisk(classId: string): Promise<{
  success: boolean;
  count: number;
  assessments: any[];
}> {
  return request('/ai/analyze-class-risk', {
    method: 'POST',
    body: JSON.stringify({ classId }),
  });
}

export async function generateParentMessage(data: {
  studentId: string;
  tone: CommunicationTone;
  customNote?: string;
}): Promise<{
  success: boolean;
  studentId: string;
  studentName: string;
  parentName: string;
  parentEmail: string;
  parentPhone?: string;
  tone: CommunicationTone;
  output: AIParentMessageDraft;
}> {
  return request('/ai/generate-parent-message', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Interventions
export async function fetchInterventions(params?: {
  studentId?: string;
  status?: string;
}): Promise<Intervention[]> {
  const query = new URLSearchParams();
  if (params?.studentId) query.set('studentId', params.studentId);
  if (params?.status) query.set('status', params.status);
  const qs = query.toString();
  return request<Intervention[]>(`/interventions${qs ? `?${qs}` : ''}`);
}

export async function createIntervention(data: {
  studentId: string;
  actionPlan: string;
  parentCommunicationDraft?: string;
  notes?: string;
  status?: string;
}): Promise<Intervention> {
  return request<Intervention>('/interventions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateIntervention(
  id: string,
  data: Partial<Intervention>
): Promise<Intervention> {
  return request<Intervention>(`/interventions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Health Check
export async function fetchHealth(): Promise<{
  status: string;
  model: string;
  geminiLiveConnected: boolean;
  supabaseLiveConnected: boolean;
  activeClasses: number;
  activeStudents: number;
  activeSessions: number;
  activeRecords: number;
}> {
  return request('/health');
}
