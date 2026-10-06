import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { memoryStore, StudentItem } from '../lib/supabaseAdmin.js';
import { StudentSchema, StudentUpdateSchema } from '../schemas/validation.js';
import { calculateStudentMetrics } from '../services/attendanceAnalytics.js';
import { randomUUID } from 'crypto';

export async function getStudents(req: AuthenticatedRequest, res: Response) {
  try {
    const { classId, search, riskLevel } = req.query as {
      classId?: string;
      search?: string;
      riskLevel?: string;
    };

    let students = memoryStore.students;

    if (classId) {
      students = students.filter(s => s.class_id === classId);
    }

    if (search && search.trim() !== '') {
      const q = search.toLowerCase();
      students = students.filter(s => 
        s.first_name.toLowerCase().includes(q) ||
        s.last_name.toLowerCase().includes(q) ||
        s.roll_number.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.parent_name.toLowerCase().includes(q)
      );
    }

    // Augment with calculated attendance metrics and latest AI risk
    const augmented = students.map(student => {
      const metrics = calculateStudentMetrics(student.id, student.class_id);
      const latestAssessment = memoryStore.riskAssessments
        .filter(r => r.student_id === student.id)
        .sort((a, b) => new Date(b.assessed_at).getTime() - new Date(a.assessed_at).getTime())[0];

      const classItem = memoryStore.classes.find(c => c.id === student.class_id);

      return {
        ...student,
        className: classItem?.class_name || 'Class',
        subjectCode: classItem?.subject_code || 'CODE',
        metrics,
        latestAssessment,
      };
    });

    let result = augmented;
    if (riskLevel && ['LOW', 'MODERATE', 'CRITICAL'].includes(riskLevel.toUpperCase())) {
      result = augmented.filter(s => s.metrics.riskLevel === riskLevel.toUpperCase());
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch students' });
  }
}

export async function getStudentById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const student = memoryStore.students.find(s => s.id === id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const classItem = memoryStore.classes.find(c => c.id === student.class_id);
    const metrics = calculateStudentMetrics(student.id, student.class_id);

    // Get all sessions for this class and map student's record
    const sessions = memoryStore.sessions
      .filter(s => s.class_id === student.class_id)
      .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const attendanceHistory = sessions.map(session => {
      const record = memoryStore.records.find(
        r => r.session_id === session.id && r.student_id === student.id
      );
      const date = new Date(session.session_date);

      return {
        sessionId: session.id,
        date: session.session_date,
        dayOfWeek: dayNames[date.getDay()],
        sessionNotes: session.notes,
        status: record ? record.status : 'UNRECORDED',
        remarks: record?.remarks || '',
        recordId: record?.id,
      };
    });

    // Risk assessments
    const riskAssessments = memoryStore.riskAssessments
      .filter(r => r.student_id === student.id)
      .sort((a, b) => new Date(b.assessed_at).getTime() - new Date(a.assessed_at).getTime());

    // Interventions
    const interventions = memoryStore.interventions
      .filter(i => i.student_id === student.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({
      ...student,
      classInfo: classItem,
      metrics,
      attendanceHistory,
      latestAssessment: riskAssessments[0] || null,
      riskAssessments,
      interventions,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch student details' });
  }
}

export async function createStudent(req: AuthenticatedRequest, res: Response) {
  try {
    const validated = StudentSchema.parse(req.body);

    // Verify class exists
    const classItem = memoryStore.classes.find(c => c.id === validated.classId);
    if (!classItem) {
      return res.status(404).json({ error: 'Target class not found' });
    }

    // Check duplicate roll number in class
    const existing = memoryStore.students.find(
      s => s.class_id === validated.classId && s.roll_number.toLowerCase() === validated.rollNumber.toLowerCase()
    );
    if (existing) {
      return res.status(400).json({ error: `Roll number '${validated.rollNumber}' is already registered in this class` });
    }

    const newStudent: StudentItem = {
      id: randomUUID(),
      class_id: validated.classId,
      roll_number: validated.rollNumber,
      first_name: validated.firstName,
      last_name: validated.lastName,
      email: validated.email || undefined,
      parent_name: validated.parentName,
      parent_email: validated.parentEmail,
      parent_phone: validated.parentPhone || undefined,
      created_at: new Date().toISOString(),
    };

    memoryStore.students.push(newStudent);
    res.status(201).json(newStudent);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Validation error' });
  }
}

export async function updateStudent(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const validated = StudentUpdateSchema.parse(req.body);

    const studentIdx = memoryStore.students.findIndex(s => s.id === id);
    if (studentIdx === -1) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const current = memoryStore.students[studentIdx];
    const updated: StudentItem = {
      ...current,
      first_name: validated.firstName ?? current.first_name,
      last_name: validated.lastName ?? current.last_name,
      roll_number: validated.rollNumber ?? current.roll_number,
      email: validated.email ?? current.email,
      parent_name: validated.parentName ?? current.parent_name,
      parent_email: validated.parentEmail ?? current.parent_email,
      parent_phone: validated.parentPhone ?? current.parent_phone,
    };

    memoryStore.students[studentIdx] = updated;
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Validation error' });
  }
}

export async function deleteStudent(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const studentIdx = memoryStore.students.findIndex(s => s.id === id);
    if (studentIdx === -1) {
      return res.status(404).json({ error: 'Student not found' });
    }

    memoryStore.students.splice(studentIdx, 1);
    // Remove related records
    memoryStore.records = memoryStore.records.filter(r => r.student_id !== id);
    memoryStore.riskAssessments = memoryStore.riskAssessments.filter(r => r.student_id !== id);
    memoryStore.interventions = memoryStore.interventions.filter(r => r.student_id !== id);

    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete student' });
  }
}
