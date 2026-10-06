import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { memoryStore, Intervention } from '../lib/supabaseAdmin.js';
import { InterventionSchema, InterventionUpdateSchema } from '../schemas/validation.js';
import { randomUUID } from 'crypto';

export async function getInterventions(req: AuthenticatedRequest, res: Response) {
  try {
    const { studentId, status } = req.query as { studentId?: string; status?: string };

    let interventions = memoryStore.interventions;

    if (studentId) {
      interventions = interventions.filter(i => i.student_id === studentId);
    }

    if (status) {
      interventions = interventions.filter(i => i.status === status.toUpperCase());
    }

    const studentMap = new Map(memoryStore.students.map(s => [s.id, s]));

    const enriched = interventions.map(item => {
      const student = studentMap.get(item.student_id);
      return {
        ...item,
        studentName: student ? `${student.first_name} ${student.last_name}` : 'Unknown Student',
        rollNumber: student?.roll_number,
        parentName: student?.parent_name,
        parentEmail: student?.parent_email,
      };
    });

    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch interventions' });
  }
}

export async function createIntervention(req: AuthenticatedRequest, res: Response) {
  try {
    const validated = InterventionSchema.parse(req.body);
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';

    const newIntervention: Intervention = {
      id: randomUUID(),
      student_id: validated.studentId,
      teacher_id: userId,
      status: validated.status || 'NOT_STARTED',
      action_plan: validated.actionPlan,
      parent_communication_draft: validated.parentCommunicationDraft || '',
      notes: validated.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    memoryStore.interventions.unshift(newIntervention);

    res.status(201).json(newIntervention);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Validation error' });
  }
}

export async function updateIntervention(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const validated = InterventionUpdateSchema.parse(req.body);

    const idx = memoryStore.interventions.findIndex(i => i.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Intervention not found' });
    }

    const current = memoryStore.interventions[idx];
    const updated: Intervention = {
      ...current,
      status: validated.status ?? current.status,
      action_plan: validated.actionPlan ?? current.action_plan,
      parent_communication_draft: validated.parentCommunicationDraft ?? current.parent_communication_draft,
      notes: validated.notes ?? current.notes,
      updated_at: new Date().toISOString(),
    };

    memoryStore.interventions[idx] = updated;
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Validation error' });
  }
}
