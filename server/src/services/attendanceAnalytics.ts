import { memoryStore, AttendanceRecord, AttendanceSession } from '../lib/supabaseAdmin.js';

export interface StudentAttendanceMetrics {
  studentId: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendedSessions: number; // Present + Late
  attendancePercentage: number;
  currentStreakAbsence: number;
  maxConsecutiveAbsence: number;
  dayOfWeekAbsences: Record<string, number>;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  riskLevel: 'LOW' | 'MODERATE' | 'CRITICAL';
  suggestedRiskFactors: string[];
}

export function calculateStudentMetrics(
  studentId: string,
  classId?: string
): StudentAttendanceMetrics {
  // Retrieve sessions for the student's class
  const student = memoryStore.students.find(s => s.id === studentId);
  const targetClassId = classId || student?.class_id;

  const relevantSessions = memoryStore.sessions
    .filter(s => !targetClassId || s.class_id === targetClassId)
    .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());

  const sessionIds = relevantSessions.map(s => s.id);
  const sessionMap = new Map<string, AttendanceSession>(relevantSessions.map(s => [s.id, s]));

  const records = memoryStore.records
    .filter(r => r.student_id === studentId && sessionIds.includes(r.session_id))
    .sort((a, b) => {
      const dateA = sessionMap.get(a.session_id)?.session_date || '';
      const dateB = sessionMap.get(b.session_id)?.session_date || '';
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

  const totalSessions = records.length;
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;

  const dayOfWeekAbsences: Record<string, number> = {
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  let currentStreakAbsence = 0;
  let maxConsecutiveAbsence = 0;

  records.forEach(record => {
    const session = sessionMap.get(record.session_id);
    const date = session ? new Date(session.session_date) : new Date();
    const dayName = dayNames[date.getDay()];

    if (record.status === 'PRESENT') {
      presentCount++;
      currentStreakAbsence = 0;
    } else if (record.status === 'LATE') {
      lateCount++;
      currentStreakAbsence = 0;
    } else if (record.status === 'EXCUSED') {
      excusedCount++;
      currentStreakAbsence = 0;
    } else if (record.status === 'ABSENT') {
      absentCount++;
      currentStreakAbsence++;
      if (currentStreakAbsence > maxConsecutiveAbsence) {
        maxConsecutiveAbsence = currentStreakAbsence;
      }
      if (dayOfWeekAbsences[dayName] !== undefined) {
        dayOfWeekAbsences[dayName]++;
      }
    }
  });

  const attendedSessions = presentCount + lateCount;
  const attendancePercentage = totalSessions > 0
    ? Number(((attendedSessions / totalSessions) * 100).toFixed(1))
    : 100.0;

  // Trend detection (compare last 5 records with previous 5 records)
  let trend: 'IMPROVING' | 'STABLE' | 'DECLINING' = 'STABLE';
  if (records.length >= 10) {
    const recent5 = records.slice(-5);
    const prev5 = records.slice(-10, -5);
    const recentAttended = recent5.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const prevAttended = prev5.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    if (recentAttended > prevAttended) trend = 'IMPROVING';
    else if (recentAttended < prevAttended) trend = 'DECLINING';
  }

  // Risk factors
  const suggestedRiskFactors: string[] = [];
  if (attendancePercentage < 70) {
    suggestedRiskFactors.push(`Critical attendance deficit: ${attendancePercentage}% is below 70%`);
  } else if (attendancePercentage < 75) {
    suggestedRiskFactors.push(`Attendance breach: ${attendancePercentage}% is below 75% minimum passing threshold`);
  }

  if (maxConsecutiveAbsence >= 3) {
    suggestedRiskFactors.push(`Disengagement alert: ${maxConsecutiveAbsence} consecutive unexcused absences detected`);
  }

  // Peak absence day
  for (const [day, count] of Object.entries(dayOfWeekAbsences)) {
    if (count >= 3) {
      suggestedRiskFactors.push(`Chronic pattern: Concentrated absences on ${day}s (${count} sessions)`);
    }
  }

  if (lateCount >= 4) {
    suggestedRiskFactors.push(`Repeated tardiness: ${lateCount} late arrivals recorded`);
  }

  // Risk Level determination matching Prompt Section 8
  let riskLevel: 'LOW' | 'MODERATE' | 'CRITICAL' = 'LOW';
  if (attendancePercentage < 70 || maxConsecutiveAbsence >= 3) {
    riskLevel = 'CRITICAL';
  } else if (attendancePercentage < 80 || Object.values(dayOfWeekAbsences).some(c => c >= 2) || lateCount >= 3) {
    riskLevel = 'MODERATE';
  }

  return {
    studentId,
    totalSessions,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    attendedSessions,
    attendancePercentage,
    currentStreakAbsence,
    maxConsecutiveAbsence,
    dayOfWeekAbsences,
    trend,
    riskLevel,
    suggestedRiskFactors,
  };
}

export function calculateClassAnalytics(classId: string) {
  const classItem = memoryStore.classes.find(c => c.id === classId);
  const students = memoryStore.students.filter(s => s.class_id === classId);
  const sessions = memoryStore.sessions
    .filter(s => s.class_id === classId)
    .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());

  const studentMetrics = students.map(s => calculateStudentMetrics(s.id, classId));

  const totalStudents = students.length;
  const criticalCount = studentMetrics.filter(m => m.riskLevel === 'CRITICAL').length;
  const moderateCount = studentMetrics.filter(m => m.riskLevel === 'MODERATE').length;
  const lowCount = studentMetrics.filter(m => m.riskLevel === 'LOW').length;

  const averageAttendance = totalStudents > 0
    ? Number((studentMetrics.reduce((acc, m) => acc + m.attendancePercentage, 0) / totalStudents).toFixed(1))
    : 100.0;

  // Daily trend for charts (percentage of class present on each date)
  const sessionMap = new Map(sessions.map(s => [s.id, s]));
  const dailyTrends = sessions.map(session => {
    const sessionRecords = memoryStore.records.filter(r => r.session_id === session.id);
    const present = sessionRecords.filter(r => r.status === 'PRESENT').length;
    const late = sessionRecords.filter(r => r.status === 'LATE').length;
    const absent = sessionRecords.filter(r => r.status === 'ABSENT').length;
    const excused = sessionRecords.filter(r => r.status === 'EXCUSED').length;
    const total = sessionRecords.length || 1;
    const rate = Number((((present + late) / total) * 100).toFixed(1));

    return {
      date: session.session_date,
      formattedDate: new Date(session.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      attendanceRate: rate,
      present,
      late,
      absent,
      excused,
      total,
      notes: session.notes,
    };
  });

  // Day of week aggregate absences across class
  const dayTotals: Record<string, number> = {
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
  };

  studentMetrics.forEach(m => {
    Object.entries(m.dayOfWeekAbsences).forEach(([day, count]) => {
      if (dayTotals[day] !== undefined) {
        dayTotals[day] += count;
      }
    });
  });

  return {
    classId,
    className: classItem?.class_name || 'Class',
    subjectCode: classItem?.subject_code || 'CODE',
    academicTerm: classItem?.academic_term || 'Term',
    minAttendancePercentage: classItem?.min_attendance_percentage || 75.0,
    totalStudents,
    totalSessions: sessions.length,
    averageAttendance,
    riskDistribution: {
      critical: criticalCount,
      moderate: moderateCount,
      low: lowCount,
    },
    dailyTrends,
    dayTotals,
    flaggedStudents: studentMetrics
      .filter(m => m.riskLevel === 'CRITICAL' || m.riskLevel === 'MODERATE')
      .map(m => {
        const student = students.find(s => s.id === m.studentId);
        return {
          ...m,
          name: `${student?.first_name} ${student?.last_name}`,
          rollNumber: student?.roll_number,
          parentName: student?.parent_name,
          parentEmail: student?.parent_email,
        };
      }),
  };
}
