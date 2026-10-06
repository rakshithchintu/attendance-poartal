import { GoogleGenAI, Type } from '@google/genai';
import { AIRiskAnalysisOutputSchema, AIParentMessageOutputSchema, AIRiskAnalysisOutput, AIParentMessageOutput } from '../schemas/validation.js';

export const GEMINI_MODEL = 'gemini-2.5-flash';

// System persona instruction as specified in prompt section 14
export const AI_SYSTEM_INSTRUCTION = 
  "You are an expert Educational Data Analyst and Child Behavior Specialist embedded in an AI Student Attendance Management System. " +
  "Your job is to analyze historical student attendance records, identify patterns of chronic absenteeism or unexcused absence trends, " +
  "quantify drop-out/failure risk levels, and output actionable, empathetic, and professional interventions and parent communication drafts. " +
  "You must strictly output valid JSON matching the requested schema.";

let aiClient: GoogleGenAI | null = null;

export function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your-gemini-api-key') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export interface StudentRiskInputData {
  name: string;
  rollNumber: string;
  totalSessions: number;
  attendedSessions: number;
  currentPercentage: number;
  recentHistory: Array<{ date: string; status: string; dayOfWeek: string; remarks?: string }>;
}

export interface ParentCommunicationInputData {
  studentName: string;
  parentName: string;
  attendancePercentage: number;
  unexcusedAbsences: number;
  riskFactors: string[];
  tone: 'FORMAL' | 'EMPATHETIC' | 'URGENT';
}

/**
 * Predictive Attendance Risk Analysis
 * Invokes Google Gemini 2.5 Flash with structured JSON schema
 */
export async function analyzeStudentAttendanceRisk(studentData: StudentRiskInputData): Promise<AIRiskAnalysisOutput> {
  const ai = getGenAIClient();

  if (ai) {
    try {
      const prompt = `
System Instruction: ${AI_SYSTEM_INSTRUCTION}

Analyze the following student attendance record and evaluate absenteeism/dropout risk:
Student Name: ${studentData.name}
Roll Number: ${studentData.rollNumber}
Current Attendance: ${studentData.currentPercentage.toFixed(1)}% (${studentData.attendedSessions}/${studentData.totalSessions} sessions)
Recent 30-day History: ${JSON.stringify(studentData.recentHistory)}

Evaluate day-of-week patterns, absence streaks, status trends (e.g., increasing 'LATE' or 'ABSENT' records), and calculate risk parameters.
Output strictly JSON matching the required schema.
`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskLevel: { type: Type.STRING, enum: ['LOW', 'MODERATE', 'CRITICAL'] },
              calculatedPercentage: { type: Type.NUMBER },
              primaryRiskFactors: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              analysisSummary: { type: Type.STRING },
              recommendedActions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['riskLevel', 'calculatedPercentage', 'primaryRiskFactors', 'analysisSummary', 'recommendedActions']
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return AIRiskAnalysisOutputSchema.parse(parsed);
      }
    } catch (error) {
      console.warn('Gemini API call failed or encountered rate limit. Falling back to analytical rule engine:', error);
    }
  }

  // Analytical engine fallback (if Gemini API key is missing or network/quota error occurs)
  return fallbackRiskAnalysis(studentData);
}

/**
 * Parent Communication & Intervention Draft Generator
 * Generates tailored communication matching requested tone
 */
export async function generateParentCommunication(data: ParentCommunicationInputData): Promise<AIParentMessageOutput> {
  const ai = getGenAIClient();

  if (ai) {
    try {
      const prompt = `
System Instruction: ${AI_SYSTEM_INSTRUCTION}

Generate a professional parent communication message for an attendance warning/intervention.
Student Name: ${data.studentName}
Parent Name: ${data.parentName}
Current Attendance: ${data.attendancePercentage.toFixed(1)}%
Unexcused Absences: ${data.unexcusedAbsences}
Identified Risk Factors: ${data.riskFactors.join(', ')}
Required Tone: ${data.tone}

Provide an email subject line, a personalized message body, and key suggested discussion points for a follow-up meeting.
Output strictly JSON matching the required schema.
`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subjectLine: { type: Type.STRING },
              messageBody: { type: Type.STRING },
              suggestedMeetingPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['subjectLine', 'messageBody', 'suggestedMeetingPoints']
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return AIParentMessageOutputSchema.parse(parsed);
      }
    } catch (error) {
      console.warn('Gemini API call failed. Falling back to deterministic draft generator:', error);
    }
  }

  // Deterministic fallback generator
  return fallbackParentCommunication(data);
}

/**
 * Intelligent analytical fallback for risk analysis
 */
function fallbackRiskAnalysis(studentData: StudentRiskInputData): AIRiskAnalysisOutput {
  const percentage = studentData.currentPercentage;
  const history = studentData.recentHistory || [];

  // Streak detection: consecutive absences
  let maxStreak = 0;
  let currentStreak = 0;
  const dayOfWeekCount: Record<string, number> = {};

  history.forEach(item => {
    if (item.status === 'ABSENT') {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
      dayOfWeekCount[item.dayOfWeek] = (dayOfWeekCount[item.dayOfWeek] || 0) + 1;
    } else {
      currentStreak = 0;
    }
  });

  const lateCount = history.filter(h => h.status === 'LATE').length;
  const riskFactors: string[] = [];

  // Identify highest absence day
  let peakDay = '';
  let peakCount = 0;
  for (const [day, count] of Object.entries(dayOfWeekCount)) {
    if (count > peakCount && count >= 2) {
      peakDay = day;
      peakCount = count;
    }
  }

  if (peakDay) {
    riskFactors.push(`Recurring absence pattern detected on ${peakDay}s (${peakCount} sessions missed)`);
  }

  if (maxStreak >= 3) {
    riskFactors.push(`High-risk consecutive absence streak of ${maxStreak} days observed`);
  }

  if (lateCount >= 3) {
    riskFactors.push(`Chronic tardiness pattern (${lateCount} late arrivals recorded)`);
  }

  let riskLevel: 'LOW' | 'MODERATE' | 'CRITICAL' = 'LOW';
  if (percentage < 70 || maxStreak >= 3) {
    riskLevel = 'CRITICAL';
    riskFactors.push(`Overall attendance (${percentage.toFixed(1)}%) is severely below mandatory 75% threshold`);
  } else if (percentage < 80 || lateCount >= 4 || peakDay) {
    riskLevel = 'MODERATE';
    riskFactors.push(`Attendance (${percentage.toFixed(1)}%) is hovering near minimum passing requirements`);
  } else {
    riskLevel = 'LOW';
    if (riskFactors.length === 0) {
      riskFactors.push('Consistent attendance record with regular class participation');
    }
  }

  const analysisSummary = riskLevel === 'CRITICAL'
    ? `${studentData.name} is exhibiting significant signs of chronic absenteeism with an attendance rate of ${percentage.toFixed(1)}%. Immediate administrative and parental intervention is recommended to avoid course disqualification.`
    : riskLevel === 'MODERATE'
    ? `${studentData.name} currently holds a ${percentage.toFixed(1)}% attendance rate. Irregular patterns and recent absences suggest potential disengagement that warrants proactive check-in.`
    : `${studentData.name} maintains a healthy attendance record of ${percentage.toFixed(1)}% with no critical disruption patterns detected.`;

  const recommendedActions = riskLevel === 'CRITICAL'
    ? [
        'Schedule an immediate mandatory parent-teacher academic review',
        'Initiate formal attendance contract with counseling department',
        'Provide structured makeup modules for missed curriculum'
      ]
    : riskLevel === 'MODERATE'
    ? [
        'Send proactive attendance reminder to student and guardian',
        'Conduct brief 1-on-1 counseling check-in regarding schedule impediments',
        'Monitor attendance closely over the upcoming 10 class sessions'
      ]
    : [
        'Acknowledge strong attendance consistency',
        'Encourage continued participation and peer study group leadership'
      ];

  return {
    riskLevel,
    calculatedPercentage: Number(percentage.toFixed(1)),
    primaryRiskFactors: riskFactors,
    analysisSummary,
    recommendedActions
  };
}

/**
 * Deterministic fallback for parent communication
 */
function fallbackParentCommunication(data: ParentCommunicationInputData): AIParentMessageOutput {
  const { studentName, parentName, attendancePercentage, unexcusedAbsences, riskFactors, tone } = data;

  if (tone === 'URGENT') {
    return {
      subjectLine: `URGENT: Critical Attendance Warning for ${studentName} (${attendancePercentage.toFixed(1)}%)`,
      messageBody: `Dear ${parentName},\n\nI am contacting you regarding an urgent academic matter concerning ${studentName}. As of today, ${studentName}'s attendance in our class has dropped to ${attendancePercentage.toFixed(1)}%, with ${unexcusedAbsences} unexcused absences recorded.\n\nOur institutional policy mandates a minimum attendance of 75.0% for course completion. The key issues identified include:\n- ${riskFactors.join('\n- ')}\n\nContinued unexcused absences will result in academic probation or failure to receive credit for this term. Please reply immediately or contact my office at your earliest availability this week so we can formulate a recovery plan.\n\nSincerely,\nAcademic Course Instruction & Student Success Office`,
      suggestedMeetingPoints: [
        `Review of the ${unexcusedAbsences} unexcused absences and institutional cutoff policies`,
        'Investigation of underlying transportation, health, or academic stress factors',
        'Sign-off on a structured Attendance Recovery Contract with weekly check-ins'
      ]
    };
  }

  if (tone === 'EMPATHETIC') {
    return {
      subjectLine: `Checking in regarding ${studentName}'s Attendance & Well-being`,
      messageBody: `Dear ${parentName},\n\nI hope this message finds you well. I am reaching out to share a gentle update regarding ${studentName}'s attendance. We have noticed that ${studentName} has missed several recent sessions, bringing their current attendance to ${attendancePercentage.toFixed(1)}%.\n\nWe care deeply about ${studentName}'s well-being and academic journey. Some patterns we noticed include:\n- ${riskFactors.join('\n- ')}\n\nWe want to ensure ${studentName} has all the support they need to feel engaged and thrive in class. If there are any extenuating circumstances or challenges we can help navigate together, please feel free to reach out. I would love to connect for a quick 10-minute check-in.\n\nWarm regards,\nDr. Eleanor Vance\nDepartment of Computer Science`,
      suggestedMeetingPoints: [
        `Discuss how ${studentName} is experiencing the course pace and workload`,
        'Explore any scheduling or wellness considerations affecting attendance',
        'Outline supportive resources including peer tutoring and lecture recap access'
      ]
    };
  }

  // Default: FORMAL
  return {
    subjectLine: `Academic Notice: Attendance Advisory for ${studentName}`,
    messageBody: `Dear ${parentName},\n\nThis communication serves as a formal notification regarding the course attendance status of ${studentName}. Records indicate an attendance rate of ${attendancePercentage.toFixed(1)}%, representing ${unexcusedAbsences} absences against scheduled sessions.\n\nIdentified attendance observations:\n- ${riskFactors.join('\n- ')}\n\nPlease be advised that university regulations require students to maintain at least 75.0% attendance to remain eligible for term examinations. We request your assistance in reviewing these figures with ${studentName} to ensure timely compliance.\n\nRespectfully,\nAcademic Faculty Department`,
    suggestedMeetingPoints: [
      'Official verification of attendance records against class register',
      'Clarification of excused absence documentation procedures',
      'Action steps to maintain attendance above the 75% threshold'
    ]
  };
}
