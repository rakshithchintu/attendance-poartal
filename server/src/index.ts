import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import classRoutes from './routes/class.routes.js';
import studentRoutes from './routes/student.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import aiRoutes from './routes/ai.routes.js';
import interventionRoutes from './routes/intervention.routes.js';
import { getClassAnalyticsEndpoint } from './controllers/class.controller.js';
import { requireAuth } from './middleware/auth.js';
import { memoryStore } from './lib/supabaseAdmin.js';
import { getGenAIClient } from './lib/gemini.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Utility Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
}));
app.use(express.json());

// API Route Mounts
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/interventions', interventionRoutes);

// Explicit route as specified in Section 12: GET /api/analytics/class/:classId
app.get('/api/analytics/class/:classId', requireAuth, getClassAnalyticsEndpoint);

// System Diagnostics & Health Status
app.get('/api/health', (req: Request, res: Response) => {
  const hasGeminiKey = !!getGenAIClient();
  const hasSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

  res.json({
    status: 'ONLINE',
    system: 'AI-Powered Student Attendance Management & Predictive Risk Assistant',
    version: '1.0.0',
    model: 'gemini-2.5-flash',
    geminiLiveConnected: hasGeminiKey,
    supabaseLiveConnected: hasSupabase,
    activeClasses: memoryStore.classes.length,
    activeStudents: memoryStore.students.length,
    activeSessions: memoryStore.sessions.length,
    activeRecords: memoryStore.records.length,
    activeInterventions: memoryStore.interventions.length,
  });
});

// Centralized Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
  });
});

app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`🚀 Attendance AI Backend running on http://localhost:${PORT}`);
  console.log(`🤖 Gemini AI Model: gemini-2.5-flash (${getGenAIClient() ? 'LIVE API KEY' : 'ANALYTICAL ENGINE READY'})`);
  console.log(`📊 Loaded ${memoryStore.students.length} students, ${memoryStore.sessions.length} sessions, ${memoryStore.records.length} records`);
  console.log(`================================================================`);
});
