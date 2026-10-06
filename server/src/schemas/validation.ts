import { z } from 'zod';

// ==============================================================================
// ZOD VALIDATION SCHEMAS FOR CLIENT INPUTS, API PAYLOADS, AND AI RESPONSES
// ==============================================================================

export const StudentSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  rollNumber: z.string().min(1, 'Roll number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid student email').optional().or(z.literal('')),
  parentName: z.string().min(1, 'Parent name is required'),
  parentEmail: z.string().email('Valid parent email is required'),
  parentPhone: z.string().optional()
});

export const StudentUpdateSchema = StudentSchema.partial().extend({
  id: z.string().uuid().optional()
});

export const AttendanceRecordItemSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
  remarks: z.string().optional()
});

export const BulkAttendanceSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  notes: z.string().optional(),
  records: z.array(AttendanceRecordItemSchema).min(1, 'Must contain at least one student record')
});

export const ClassSchema = z.object({
  className: z.string().min(2, 'Class name is required'),
  subjectCode: z.string().min(2, 'Subject code is required'),
  academicTerm: z.string().min(2, 'Academic term is required'),
  minAttendancePercentage: z.number().min(50).max(100).default(75.0)
});

export const ParentMessageRequestSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  tone: z.enum(['FORMAL', 'EMPATHETIC', 'URGENT']),
  language: z.string().default('English'),
  customNote: z.string().optional()
});

export const AIRiskRequestSchema = z.object({
  studentId: z.string().uuid('Invalid student ID')
});

export const InterventionSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'PARENT_CONTACTED', 'RESOLVED']).default('NOT_STARTED'),
  actionPlan: z.string().min(5, 'Action plan must be at least 5 characters'),
  parentCommunicationDraft: z.string().optional(),
  notes: z.string().optional()
});

export const InterventionUpdateSchema = InterventionSchema.partial().extend({
  id: z.string().uuid('Invalid intervention ID')
});

// AI Response Validation Schemas
export const AIRiskAnalysisOutputSchema = z.object({
  riskLevel: z.enum(['LOW', 'MODERATE', 'CRITICAL']),
  calculatedPercentage: z.number(),
  primaryRiskFactors: z.array(z.string()),
  analysisSummary: z.string(),
  recommendedActions: z.array(z.string())
});

export const AIParentMessageOutputSchema = z.object({
  subjectLine: z.string(),
  messageBody: z.string(),
  suggestedMeetingPoints: z.array(z.string())
});

export type StudentInput = z.infer<typeof StudentSchema>;
export type BulkAttendanceInput = z.infer<typeof BulkAttendanceSchema>;
export type ParentMessageRequestInput = z.infer<typeof ParentMessageRequestSchema>;
export type AIRiskAnalysisOutput = z.infer<typeof AIRiskAnalysisOutputSchema>;
export type AIParentMessageOutput = z.infer<typeof AIParentMessageOutputSchema>;
export type InterventionInput = z.infer<typeof InterventionSchema>;
