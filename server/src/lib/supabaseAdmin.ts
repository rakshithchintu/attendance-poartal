import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types matching database schema
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'TEACHER' | 'ADMIN';
  created_at?: string;
  updated_at?: string;
}

export interface ClassItem {
  id: string;
  teacher_id: string;
  class_name: string;
  subject_code: string;
  academic_term: string;
  min_attendance_percentage: number;
  created_at?: string;
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
}

export interface AttendanceSession {
  id: string;
  class_id: string;
  session_date: string;
  created_by: string;
  notes?: string;
  created_at?: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AIRiskAssessment {
  id: string;
  student_id: string;
  calculated_percentage: number;
  risk_level: 'LOW' | 'MODERATE' | 'CRITICAL';
  primary_risk_factors: string[];
  analysis_summary: string;
  recommended_actions: string[];
  assessed_at: string;
}

export interface Intervention {
  id: string;
  student_id: string;
  teacher_id: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'PARENT_CONTACTED' | 'RESOLVED';
  action_plan: string;
  parent_communication_draft?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ------------------------------------------------------------------------------
// In-Memory Database Store (Initialized with rich, realistic production-like data)
// ------------------------------------------------------------------------------
class MemoryStore {
  profiles: Profile[] = [];
  classes: ClassItem[] = [];
  students: StudentItem[] = [];
  sessions: AttendanceSession[] = [];
  records: AttendanceRecord[] = [];
  riskAssessments: AIRiskAssessment[] = [];
  interventions: Intervention[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    // 1. Profiles
    this.profiles = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'teacher@school.edu',
        full_name: 'Dr. Eleanor Vance',
        role: 'TEACHER',
        created_at: '2026-09-01T08:00:00Z',
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'admin@school.edu',
        full_name: 'Principal Marcus Davis',
        role: 'ADMIN',
        created_at: '2026-09-01T08:00:00Z',
      },
    ];

    // 2. Classes
    this.classes = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        teacher_id: '00000000-0000-0000-0000-000000000001',
        class_name: 'Advanced Computer Science',
        subject_code: 'CS-101',
        academic_term: 'Fall Term 2026',
        min_attendance_percentage: 75.0,
        created_at: '2026-09-01T09:00:00Z',
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        teacher_id: '00000000-0000-0000-0000-000000000001',
        class_name: 'Data Structures & Algorithms',
        subject_code: 'CS-204',
        academic_term: 'Fall Term 2026',
        min_attendance_percentage: 75.0,
        created_at: '2026-09-01T09:00:00Z',
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        teacher_id: '00000000-0000-0000-0000-000000000001',
        class_name: 'Software Engineering Ethics',
        subject_code: 'ENG-310',
        academic_term: 'Fall Term 2026',
        min_attendance_percentage: 80.0,
        created_at: '2026-09-01T09:00:00Z',
      },
    ];

    // 3. Students
    this.students = [
      {
        id: 'aaaaaaaa-0001-0000-0000-000000000001',
        class_id: '11111111-1111-1111-1111-111111111111',
        roll_number: 'CS101-01',
        first_name: 'Leo',
        last_name: 'Hernandez',
        email: 'leo.h@student.edu',
        parent_name: 'Carlos Hernandez',
        parent_email: 'carlos.h@parent.com',
        parent_phone: '+1 (555) 234-8890',
        created_at: '2026-09-01T10:00:00Z',
      },
      {
        id: 'aaaaaaaa-0002-0000-0000-000000000002',
        class_id: '11111111-1111-1111-1111-111111111111',
        roll_number: 'CS101-02',
        first_name: 'Maya',
        last_name: 'Lin',
        email: 'maya.l@student.edu',
        parent_name: 'Sheng Lin',
        parent_email: 'sheng.lin@parent.com',
        parent_phone: '+1 (555) 345-1212',
        created_at: '2026-09-01T10:00:00Z',
      },
      {
        id: 'aaaaaaaa-0003-0000-0000-000000000003',
        class_id: '11111111-1111-1111-1111-111111111111',
        roll_number: 'CS101-03',
        first_name: 'Sophia',
        last_name: 'Rodriguez',
        email: 'sophia.r@student.edu',
        parent_name: 'Elena Rodriguez',
        parent_email: 'elena.r@parent.com',
        parent_phone: '+1 (555) 456-7890',
        created_at: '2026-09-01T10:00:00Z',
      },
      {
        id: 'aaaaaaaa-0004-0000-0000-000000000004',
        class_id: '11111111-1111-1111-1111-111111111111',
        roll_number: 'CS101-04',
        first_name: 'Ethan',
        last_name: 'Chen',
        email: 'ethan.c@student.edu',
        parent_name: 'David Chen',
        parent_email: 'david.chen@parent.com',
        parent_phone: '+1 (555) 567-3344',
        created_at: '2026-09-01T10:00:00Z',
      },
      {
        id: 'aaaaaaaa-0005-0000-0000-000000000005',
        class_id: '11111111-1111-1111-1111-111111111111',
        roll_number: 'CS101-05',
        first_name: 'Amara',
        last_name: 'Okafor',
        email: 'amara.o@student.edu',
        parent_name: 'Chidi Okafor',
        parent_email: 'chidi.okafor@parent.com',
        parent_phone: '+1 (555) 678-9012',
        created_at: '2026-09-01T10:00:00Z',
      },
      {
        id: 'aaaaaaaa-0006-0000-0000-000000000006',
        class_id: '11111111-1111-1111-1111-111111111111',
        roll_number: 'CS101-06',
        first_name: 'Liam',
        last_name: "O'Connor",
        email: 'liam.oc@student.edu',
        parent_name: "Fiona O'Connor",
        parent_email: 'fiona.oc@parent.com',
        parent_phone: '+1 (555) 789-0123',
        created_at: '2026-09-01T10:00:00Z',
      },
      {
        id: 'aaaaaaaa-0007-0000-0000-000000000007',
        class_id: '11111111-1111-1111-1111-111111111111',
        roll_number: 'CS101-07',
        first_name: 'Zara',
        last_name: 'Patel',
        email: 'zara.p@student.edu',
        parent_name: 'Raj Patel',
        parent_email: 'raj.patel@parent.com',
        parent_phone: '+1 (555) 890-1234',
        created_at: '2026-09-01T10:00:00Z',
      },
      {
        id: 'aaaaaaaa-0008-0000-0000-000000000008',
        class_id: '11111111-1111-1111-1111-111111111111',
        roll_number: 'CS101-08',
        first_name: 'Noah',
        last_name: 'Kim',
        email: 'noah.k@student.edu',
        parent_name: 'Grace Kim',
        parent_email: 'grace.kim@parent.com',
        parent_phone: '+1 (555) 901-2345',
        created_at: '2026-09-01T10:00:00Z',
      },
      {
        id: 'aaaaaaaa-0009-0000-0000-000000000009',
        class_id: '11111111-1111-1111-1111-111111111111',
        roll_number: 'CS101-09',
        first_name: 'Chloe',
        last_name: 'Dubois',
        email: 'chloe.d@student.edu',
        parent_name: 'Jean Dubois',
        parent_email: 'jean.d@parent.com',
        parent_phone: '+1 (555) 012-3456',
        created_at: '2026-09-01T10:00:00Z',
      },
      {
        id: 'aaaaaaaa-0010-0000-0000-000000000010',
        class_id: '11111111-1111-1111-1111-111111111111',
        roll_number: 'CS101-10',
        first_name: 'Lucas',
        last_name: 'Silva',
        email: 'lucas.s@student.edu',
        parent_name: 'Beatriz Silva',
        parent_email: 'beatriz.silva@parent.com',
        parent_phone: '+1 (555) 123-4567',
        created_at: '2026-09-01T10:00:00Z',
      },
    ];

    // 4. Generate 20 daily attendance sessions (weekdays from Sept 8 to Oct 5, 2026)
    const dates: string[] = [
      '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12',
      '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19',
      '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26',
      '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-05',
    ];

    dates.forEach((dateStr, sessionIdx) => {
      const sessionId = `session-0000-0000-0000-${String(sessionIdx + 1).padStart(12, '0')}`;
      this.sessions.push({
        id: sessionId,
        class_id: '11111111-1111-1111-1111-111111111111',
        session_date: dateStr,
        created_by: '00000000-0000-0000-0000-000000000001',
        notes: sessionIdx % 5 === 4 ? 'Friday Lab Session' : 'Regular Lecture & Lab',
        created_at: `${dateStr}T10:00:00Z`,
      });

      // Populate records for all students
      this.students.forEach((student, sIdx) => {
        let status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' = 'PRESENT';
        let remarks: string | undefined = undefined;

        // Specific profiles to simulate realistic conditions
        if (student.roll_number === 'CS101-01') {
          // Leo Hernandez: Critical Risk, missed Fridays and recent streak
          const isFriday = sessionIdx % 5 === 4;
          if (isFriday || sessionIdx === 14 || sessionIdx === 15 || sessionIdx === 16) {
            status = 'ABSENT';
            remarks = 'Unexcused absence';
          } else if (sessionIdx === 10) {
            status = 'LATE';
            remarks = 'Arrived 25m late';
          }
        } else if (student.roll_number === 'CS101-02') {
          // Maya Lin: Moderate Risk, frequent LATE and some Monday absences
          const isMonday = sessionIdx % 5 === 0;
          if (isMonday && sessionIdx >= 10) {
            status = 'ABSENT';
            remarks = 'Family commitment';
          } else if (sessionIdx % 3 === 0) {
            status = 'LATE';
            remarks = 'Transit delay';
          }
        } else if (student.roll_number === 'CS101-03') {
          // Sophia: 1 excused absence, otherwise present
          if (sessionIdx === 7) {
            status = 'EXCUSED';
            remarks = 'Medical appointment notice provided';
          }
        } else if (student.roll_number === 'CS101-04') {
          // Ethan: occasional late
          if (sessionIdx === 3 || sessionIdx === 12) {
            status = 'LATE';
            remarks = 'Dorm lock issue';
          }
        } else {
          // Random occasional absence for general variety
          if ((sessionIdx + sIdx) % 11 === 0) {
            status = 'EXCUSED';
            remarks = 'Official school competition';
          } else if ((sessionIdx + sIdx) % 17 === 0) {
            status = 'ABSENT';
          }
        }

        this.records.push({
          id: `record-${String(sessionIdx + 1).padStart(4, '0')}-${String(sIdx + 1).padStart(4, '0')}`,
          session_id: sessionId,
          student_id: student.id,
          status,
          remarks,
          created_at: `${dateStr}T10:05:00Z`,
          updated_at: `${dateStr}T10:05:00Z`,
        });
      });
    });

    // 5. Initial Risk Assessments
    this.riskAssessments = [
      {
        id: 'risk-0001',
        student_id: 'aaaaaaaa-0001-0000-0000-000000000001',
        calculated_percentage: 60.0,
        risk_level: 'CRITICAL',
        primary_risk_factors: [
          'Friday absenteeism spike (4 consecutive Fridays missed)',
          '3-day unexcused absence streak in mid-term',
          'Attendance well below 75% threshold'
        ],
        analysis_summary: 'Leo displays acute chronic absenteeism risk. A steep decline occurred during mid-term weeks, concentrated primarily around laboratory sessions on Fridays. Immediate intervention required to prevent course failure.',
        recommended_actions: [
          'Schedule mandatory academic advising check-in',
          'Send urgent parent notification with detailed attendance audit',
          'Assign student peer mentor for lab coursework'
        ],
        assessed_at: '2026-10-05T14:30:00Z'
      },
      {
        id: 'risk-0002',
        student_id: 'aaaaaaaa-0002-0000-0000-000000000002',
        calculated_percentage: 75.0,
        risk_level: 'MODERATE',
        primary_risk_factors: [
          'Attendance hovering right at 75% cutoff threshold',
          'Frequent LATE status arrivals (4 late arrivals recorded)',
          'Monday morning pattern of non-attendance'
        ],
        analysis_summary: 'Maya is on the boundary of failing course attendance criteria. While not completely absent, repeated late arrivals severely impact participation points. Prompt empathetic intervention can easily restore compliance.',
        recommended_actions: [
          'Send empathetic reminder regarding 75% cutoff threshold',
          'Inquire with student regarding transportation or early morning schedule conflicts',
          'Provide recorded lecture recap for missed intro segments'
        ],
        assessed_at: '2026-10-05T14:30:00Z'
      },
      {
        id: 'risk-0003',
        student_id: 'aaaaaaaa-0003-0000-0000-000000000003',
        calculated_percentage: 95.0,
        risk_level: 'LOW',
        primary_risk_factors: [
          'Consistently high engagement',
          'Only one excused medical absence'
        ],
        analysis_summary: 'Sophia demonstrates exceptional attendance discipline with strong correlation to high coursework performance. Negligible dropout risk.',
        recommended_actions: [
          'Acknowledge exemplary consistency',
          'Consider for lab assistant or peer tutor roles'
        ],
        assessed_at: '2026-10-05T14:30:00Z'
      }
    ];

    // 6. Initial Interventions
    this.interventions = [
      {
        id: 'interv-0001',
        student_id: 'aaaaaaaa-0001-0000-0000-000000000001',
        teacher_id: '00000000-0000-0000-0000-000000000001',
        status: 'IN_PROGRESS',
        action_plan: 'Execute urgent parent outreach via email/phone, establish bi-weekly check-in contract, and provide makeup lab hours.',
        parent_communication_draft: 'Dear Mr. Hernandez, I am writing to urgently bring to your attention that Leo has missed several key Friday classes and his attendance has dropped to 60.0%, placing him at risk of not meeting course requirements. We are eager to partner with you to support his recovery.',
        notes: 'Spoke with academic counselor. Waiting for parental response to schedule joint meeting.',
        created_at: '2026-10-05T15:00:00Z',
        updated_at: '2026-10-05T15:00:00Z'
      }
    ];
  }
}

export const memoryStore = new MemoryStore();

// Supabase client instance (if configured)
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (url && key && url.includes('supabase.co')) {
    if (!supabaseInstance) {
      supabaseInstance = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
    }
    return supabaseInstance;
  }
  return null;
}
