import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { memoryStore, AIRiskAssessment } from '../lib/supabaseAdmin.js';
import { AIRiskRequestSchema, ParentMessageRequestSchema } from '../schemas/validation.js';
import { analyzeStudentAttendanceRisk, generateParentCommunication } from '../lib/gemini.js';
import { calculateStudentMetrics } from '../services/attendanceAnalytics.js';
import { randomUUID } from 'crypto';

export async function analyzeStudentRiskEndpoint(req: AuthenticatedRequest, res: Response) {
  try {
    const validated = AIRiskRequestSchema.parse(req.body);
    const { studentId } = validated;

    const student = memoryStore.students.find(s => s.id === studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const metrics = calculateStudentMetrics(student.id, student.class_id);

    // Prepare 30-day recent session history
    const sessions = memoryStore.sessions
      .filter(s => s.class_id === student.class_id)
      .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const sessionMap = new Map(sessions.map(s => [s.id, s]));

    const recentHistory = memoryStore.records
      .filter(r => r.student_id === student.id && sessionMap.has(r.session_id))
      .slice(-30)
      .map(r => {
        const session = sessionMap.get(r.session_id);
        const date = session ? new Date(session.session_date) : new Date();
        return {
          date: session?.session_date || '',
          status: r.status,
          dayOfWeek: dayNames[date.getDay()],
          remarks: r.remarks || undefined,
        };
      });

    // Invoke Gemini AI Predictive Risk Model
    const aiResult = await analyzeStudentAttendanceRisk({
      name: `${student.first_name} ${student.last_name}`,
      rollNumber: student.roll_number,
      totalSessions: metrics.totalSessions,
      attendedSessions: metrics.attendedSessions,
      currentPercentage: metrics.attendancePercentage,
      recentHistory,
    });

    // Store in memoryStore.riskAssessments
    const newAssessment: AIRiskAssessment = {
      id: randomUUID(),
      student_id: student.id,
      calculated_percentage: aiResult.calculatedPercentage,
      risk_level: aiResult.riskLevel,
      primary_risk_factors: aiResult.primaryRiskFactors,
      analysis_summary: aiResult.analysisSummary,
      recommended_actions: aiResult.recommendedActions,
      assessed_at: new Date().toISOString(),
    };

    // Remove previous assessment for this student if any, or push new one
    const existingIdx = memoryStore.riskAssessments.findIndex(r => r.student_id === student.id);
    if (existingIdx !== -1) {
      memoryStore.riskAssessments[existingIdx] = newAssessment;
    } else {
      memoryStore.riskAssessments.unshift(newAssessment);
    }

    res.json({
      success: true,
      assessment: newAssessment,
      metrics,
    });
  } catch (error: any) {
    console.error('Error in analyzeStudentRiskEndpoint:', error);
    res.status(400).json({ error: error.message || 'Failed to complete AI risk analysis' });
  }
}

export async function analyzeClassRiskEndpoint(req: AuthenticatedRequest, res: Response) {
  try {
    const { classId } = req.body;
    if (!classId) {
      return res.status(400).json({ error: 'classId is required' });
    }

    const students = memoryStore.students.filter(s => s.class_id === classId);
    const results: any[] = [];

    for (const student of students) {
      const metrics = calculateStudentMetrics(student.id, classId);
      const sessions = memoryStore.sessions
        .filter(s => s.class_id === classId)
        .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const sessionMap = new Map(sessions.map(s => [s.id, s]));

      const recentHistory = memoryStore.records
        .filter(r => r.student_id === student.id && sessionMap.has(r.session_id))
        .slice(-20)
        .map(r => {
          const session = sessionMap.get(r.session_id);
          const date = session ? new Date(session.session_date) : new Date();
          return {
            date: session?.session_date || '',
            status: r.status,
            dayOfWeek: dayNames[date.getDay()],
            remarks: r.remarks || undefined,
          };
        });

      const aiResult = await analyzeStudentAttendanceRisk({
        name: `${student.first_name} ${student.last_name}`,
        rollNumber: student.roll_number,
        totalSessions: metrics.totalSessions,
        attendedSessions: metrics.attendedSessions,
        currentPercentage: metrics.attendancePercentage,
        recentHistory,
      });

      const assessment: AIRiskAssessment = {
        id: randomUUID(),
        student_id: student.id,
        calculated_percentage: aiResult.calculatedPercentage,
        risk_level: aiResult.riskLevel,
        primary_risk_factors: aiResult.primaryRiskFactors,
        analysis_summary: aiResult.analysisSummary,
        recommended_actions: aiResult.recommendedActions,
        assessed_at: new Date().toISOString(),
      };

      const existingIdx = memoryStore.riskAssessments.findIndex(r => r.student_id === student.id);
      if (existingIdx !== -1) {
        memoryStore.riskAssessments[existingIdx] = assessment;
      } else {
        memoryStore.riskAssessments.unshift(assessment);
      }

      results.push({
        studentId: student.id,
        name: `${student.first_name} ${student.last_name}`,
        rollNumber: student.roll_number,
        assessment,
      });
    }

    res.json({
      success: true,
      count: results.length,
      assessments: results,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to analyze class risk' });
  }
}

export async function generateParentMessageEndpoint(req: AuthenticatedRequest, res: Response) {
  try {
    const validated = ParentMessageRequestSchema.parse(req.body);
    const { studentId, tone, language } = validated;

    const student = memoryStore.students.find(s => s.id === studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const metrics = calculateStudentMetrics(student.id, student.class_id);

    // Retrieve latest assessment or suggested risk factors
    const latestAssessment = memoryStore.riskAssessments
      .filter(r => r.student_id === student.id)
      .sort((a, b) => new Date(b.assessed_at).getTime() - new Date(a.assessed_at).getTime())[0];

    const riskFactors = latestAssessment?.primary_risk_factors?.length
      ? latestAssessment.primary_risk_factors
      : metrics.suggestedRiskFactors.length
      ? metrics.suggestedRiskFactors
      : ['Attendance rate is near or below the mandatory 75% threshold'];

    // Generate with Gemini
    const communication = await generateParentCommunication({
      studentName: `${student.first_name} ${student.last_name}`,
      parentName: student.parent_name,
      attendancePercentage: metrics.attendancePercentage,
      unexcusedAbsences: metrics.absentCount,
      riskFactors,
      tone,
    });

    res.json({
      success: true,
      studentId: student.id,
      studentName: `${student.first_name} ${student.last_name}`,
      parentName: student.parent_name,
      parentEmail: student.parent_email,
      parentPhone: student.parent_phone,
      tone,
      output: communication,
    });
  } catch (error: any) {
    console.error('Error generating parent message:', error);
    res.status(400).json({ error: error.message || 'Failed to generate parent message draft' });
  }
}
