import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { memoryStore, ClassItem } from '../lib/supabaseAdmin.js';
import { ClassSchema } from '../schemas/validation.js';
import { calculateClassAnalytics } from '../services/attendanceAnalytics.js';
import { randomUUID } from 'crypto';

export async function getClasses(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Filter by teacher_id unless admin
    let classes = memoryStore.classes;
    if (userRole !== 'ADMIN' && userId) {
      classes = classes.filter(c => c.teacher_id === userId);
    }

    // Augment with student count and average attendance
    const augmented = classes.map(c => {
      const studentCount = memoryStore.students.filter(s => s.class_id === c.id).length;
      const sessionCount = memoryStore.sessions.filter(s => s.class_id === c.id).length;
      return {
        ...c,
        studentCount,
        sessionCount,
      };
    });

    res.json(augmented);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch classes' });
  }
}

export async function getClassById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const found = memoryStore.classes.find(c => c.id === id);
    if (!found) {
      return res.status(404).json({ error: 'Class not found' });
    }
    const studentCount = memoryStore.students.filter(s => s.class_id === found.id).length;
    res.json({ ...found, studentCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch class' });
  }
}

export async function createClass(req: AuthenticatedRequest, res: Response) {
  try {
    const validated = ClassSchema.parse(req.body);
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';

    const newClass: ClassItem = {
      id: randomUUID(),
      teacher_id: userId,
      class_name: validated.className,
      subject_code: validated.subjectCode,
      academic_term: validated.academicTerm,
      min_attendance_percentage: validated.minAttendancePercentage,
      created_at: new Date().toISOString(),
    };

    memoryStore.classes.unshift(newClass);
    res.status(201).json(newClass);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Validation error' });
  }
}

export async function getClassAnalyticsEndpoint(req: AuthenticatedRequest, res: Response) {
  try {
    const { classId } = req.params;
    const found = memoryStore.classes.find(c => c.id === classId);
    if (!found) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const analytics = calculateClassAnalytics(classId);
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to compute class analytics' });
  }
}
