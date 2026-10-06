export type UserRole = 'TEACHER' | 'ADMIN';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
export type RiskLevel = 'LOW' | 'MODERATE' | 'CRITICAL';
export type InterventionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PARENT_CONTACTED' | 'RESOLVED';
export type CommunicationTone = 'FORMAL' | 'EMPATHETIC' | 'URGENT';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at?: string;
}

export interface ClassItem {
  id: string;
  teacher_id: string;
  class_name: string;
  subject_code: string;
  academic_term: string;
  min_attendance_percentage: number;
  studentCount?: number;
  sessionCount?: number;
  created_at?: string;
}

export interface StudentMetrics {
  studentId: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendedSessions: number;
  attendancePercentage: number;
  currentStreakAbsence: number;
  maxConsecutiveAbsence: number;
  dayOfWeekAbsences: Record<string, number>;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  riskLevel: RiskLevel;
  suggestedRiskFactors: string[];
}

export interface StudentItem {
  id: string;
  class_id: string;
  roll_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  parent_name: string;
  parent_email: string;
  parent_phone?: string;
  created_at?: string;
  className?: string;
  subjectCode?: string;
  metrics?: StudentMetrics;
  latestAssessment?: AIRiskAssessment | null;
}

export interface AttendanceRecordItem {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface BulkAttendancePayload {
  classId: string;
  sessionDate: string;
  notes?: string;
  records: AttendanceRecordItem[];
}

export interface AIRiskAssessment {
  id: string;
  student_id: string;
  calculated_percentage: number;
  risk_level: RiskLevel;
  primary_risk_factors: string[];
  analysis_summary: string;
  recommended_actions: string[];
  assessed_at: string;
}

export interface AIParentMessageDraft {
  subjectLine: string;
  messageBody: string;
  suggestedMeetingPoints: string[];
}

export interface Intervention {
  id: string;
  student_id: string;
  teacher_id: string;
  status: InterventionStatus;
  action_plan: string;
  parent_communication_draft?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  studentName?: string;
  rollNumber?: string;
  parentName?: string;
  parentEmail?: string;
}

export interface AttendanceLogItem {
  recordId: string;
  sessionId: string;
  sessionDate: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  classId: string;
  className: string;
  subjectCode: string;
  status: AttendanceStatus;
  remarks?: string;
  sessionNotes?: string;
  updatedAt: string;
}

export interface DailyTrendItem {
  date: string;
  formattedDate: string;
  attendanceRate: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  total: number;
  notes?: string;
}

export interface ClassAnalytics {
  classId: string;
  className: string;
  subjectCode: string;
  academicTerm: string;
  minAttendancePercentage: number;
  totalStudents: number;
  totalSessions: number;
  averageAttendance: number;
  riskDistribution: {
    critical: number;
    moderate: number;
    low: number;
  };
  dailyTrends: DailyTrendItem[];
  dayTotals: Record<string, number>;
  flaggedStudents: Array<StudentMetrics & {
    name: string;
    rollNumber: string;
    parentName: string;
    parentEmail: string;
  }>;
}
