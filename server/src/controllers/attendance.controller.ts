import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { memoryStore, AttendanceSession, AttendanceRecord } from '../lib/supabaseAdmin.js';
import { BulkAttendanceSchema } from '../schemas/validation.js';
import { calculateStudentMetrics, calculateClassAnalytics } from '../services/attendanceAnalytics.js';
import { randomUUID } from 'crypto';

export async function getSessionAttendance(req: AuthenticatedRequest, res: Response) {
  try {
    const { classId, date } = req.query as { classId: string; date: string };

    if (!classId || !date) {
      return res.status(400).json({ error: 'Both classId and date (YYYY-MM-DD) query parameters are required' });
    }

    const classItem = memoryStore.classes.find(c => c.id === classId);
    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Find session if exists
    const session = memoryStore.sessions.find(
      s => s.class_id === classId && s.session_date === date
    );

    const students = memoryStore.students.filter(s => s.class_id === classId);

    // If session exists, load records
    const sessionRecords = session
      ? memoryStore.records.filter(r => r.session_id === session.id)
      : [];

    const recordMap = new Map(sessionRecords.map(r => [r.student_id, r]));

    // Check lock window (14 days)
    const sessionDateObj = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - sessionDateObj.getTime()) / (1000 * 60 * 60 * 24));
    const isLocked = diffDays > 14 && req.user?.role !== 'ADMIN';

    const roster = students.map(student => {
      const existing = recordMap.get(student.id);
      const metrics = calculateStudentMetrics(student.id, classId);

      return {
        studentId: student.id,
        rollNumber: student.roll_number,
        firstName: student.first_name,
        lastName: student.last_name,
        fullName: `${student.first_name} ${student.last_name}`,
        parentName: student.parent_name,
        status: existing ? existing.status : 'PRESENT',
        remarks: existing?.remarks || '',
        currentPercentage: metrics.attendancePercentage,
        riskLevel: metrics.riskLevel,
      };
    });

    res.json({
      sessionExists: !!session,
      sessionId: session?.id,
      classId,
      className: classItem.class_name,
      subjectCode: classItem.subject_code,
      sessionDate: date,
      notes: session?.notes || '',
      isLocked,
      lockDaysRemaining: Math.max(0, 14 - diffDays),
      roster,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve session attendance' });
  }
}

export async function submitBulkAttendance(req: AuthenticatedRequest, res: Response) {
  try {
    const validated = BulkAttendanceSchema.parse(req.body);
    const { classId, sessionDate, notes, records } = validated;

    // 1. Verify 14-day lock window rule (Section 9: Attendance Marking Rules)
    const sessionDateObj = new Date(sessionDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - sessionDateObj.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 14 && req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Attendance lock policy: Modifications past the 14-day window require administrative override.'
      });
    }

    // 2. Verify EXCUSED absence reason note rule (Section 9: require reason notes for EXCUSED absences)
    for (const record of records) {
      if (record.status === 'EXCUSED' && (!record.remarks || record.remarks.trim() === '')) {
        const student = memoryStore.students.find(s => s.id === record.studentId);
        const name = student ? `${student.first_name} ${student.last_name}` : 'Student';
        return res.status(400).json({
          error: `Excused absence rule: A reason note is required for excused student ${name} (${student?.roll_number}).`
        });
      }
    }

    // 3. Find or create session
    let session = memoryStore.sessions.find(
      s => s.class_id === classId && s.session_date === sessionDate
    );

    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';

    if (!session) {
      session = {
        id: randomUUID(),
        class_id: classId,
        session_date: sessionDate,
        created_by: userId,
        notes: notes || '',
        created_at: new Date().toISOString(),
      };
      memoryStore.sessions.push(session);
    } else {
      if (notes !== undefined) {
        session.notes = notes;
      }
    }

    // 4. Upsert attendance records
    records.forEach(item => {
      const existingIdx = memoryStore.records.findIndex(
        r => r.session_id === session!.id && r.student_id === item.studentId
      );

      if (existingIdx !== -1) {
        memoryStore.records[existingIdx] = {
          ...memoryStore.records[existingIdx],
          status: item.status,
          remarks: item.remarks || '',
          updated_at: new Date().toISOString(),
        };
      } else {
        const newRecord: AttendanceRecord = {
          id: randomUUID(),
          session_id: session!.id,
          student_id: item.studentId,
          status: item.status,
          remarks: item.remarks || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        memoryStore.records.push(newRecord);
      }
    });

    // 5. Compute updated metrics immediately
    const updatedClassAnalytics = calculateClassAnalytics(classId);

    res.status(200).json({
      success: true,
      message: `Successfully saved attendance records for ${records.length} students.`,
      sessionId: session.id,
      sessionDate,
      classAnalytics: updatedClassAnalytics,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Validation error' });
  }
}

export async function getStudentAttendance(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const student = memoryStore.students.find(s => s.id === id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const metrics = calculateStudentMetrics(student.id, student.class_id);
    const sessions = memoryStore.sessions
      .filter(s => s.class_id === student.class_id)
      .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());

    const records = sessions.map(session => {
      const rec = memoryStore.records.find(
        r => r.session_id === session.id && r.student_id === student.id
      );
      return {
        sessionId: session.id,
        date: session.session_date,
        status: rec ? rec.status : 'NOT_MARKED',
        remarks: rec?.remarks || '',
        notes: session.notes,
      };
    });

    res.json({
      student,
      metrics,
      records,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get student attendance' });
  }
}

export async function getAttendanceHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const { classId, dateFrom, dateTo, status, studentId, search } = req.query as {
      classId?: string;
      dateFrom?: string;
      dateTo?: string;
      status?: string;
      studentId?: string;
      search?: string;
    };

    let sessions = memoryStore.sessions;
    if (classId) {
      sessions = sessions.filter(s => s.class_id === classId);
    }
    if (dateFrom) {
      sessions = sessions.filter(s => s.session_date >= dateFrom);
    }
    if (dateTo) {
      sessions = sessions.filter(s => s.session_date <= dateTo);
    }

    const sessionMap = new Map(sessions.map(s => [s.id, s]));
    const classMap = new Map(memoryStore.classes.map(c => [c.id, c]));
    const studentMap = new Map(memoryStore.students.map(s => [s.id, s]));

    let logs: any[] = [];

    memoryStore.records.forEach(rec => {
      const session = sessionMap.get(rec.session_id);
      if (!session) return;

      const student = studentMap.get(rec.student_id);
      if (!student) return;

      if (studentId && rec.student_id !== studentId) return;
      if (status && rec.status !== status.toUpperCase()) return;

      if (search && search.trim() !== '') {
        const q = search.toLowerCase();
        const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
        if (!fullName.includes(q) && !student.roll_number.toLowerCase().includes(q)) {
          return;
        }
      }

      const classItem = classMap.get(session.class_id);

      logs.push({
        recordId: rec.id,
        sessionId: session.id,
        sessionDate: session.session_date,
        studentId: student.id,
        studentName: `${student.first_name} ${student.last_name}`,
        rollNumber: student.roll_number,
        classId: session.class_id,
        className: classItem?.class_name || 'Class',
        subjectCode: classItem?.subject_code || 'CODE',
        status: rec.status,
        remarks: rec.remarks || '',
        sessionNotes: session.notes || '',
        updatedAt: rec.updated_at || rec.created_at,
      });
    });

    // Sort descending by date
    logs.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());

    res.json({
      totalCount: logs.length,
      logs,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve attendance logs' });
  }
}
