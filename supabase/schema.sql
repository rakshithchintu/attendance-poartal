-- ==============================================================================
-- AI-POWERED STUDENT ATTENDANCE MANAGEMENT & PREDICTIVE RISK ASSISTANT
-- PRODUCTION DATABASE SCHEMA (POSTGRESQL / SUPABASE)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Custom ENUM Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('TEACHER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_level AS ENUM ('LOW', 'MODERATE', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE intervention_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'PARENT_CONTACTED', 'RESOLVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. User Profiles (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'TEACHER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Classes / Subjects
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    class_name TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    academic_term TEXT NOT NULL,
    min_attendance_percentage NUMERIC DEFAULT 75.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Students Roster
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    roll_number TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    parent_name TEXT NOT NULL,
    parent_email TEXT NOT NULL,
    parent_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, roll_number)
);

-- 5. Attendance Sessions
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    created_by UUID NOT NULL REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, session_date)
);

-- 6. Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status attendance_status NOT NULL DEFAULT 'PRESENT',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- 7. AI Risk Assessments
CREATE TABLE IF NOT EXISTS ai_risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    calculated_percentage NUMERIC NOT NULL,
    risk_level risk_level NOT NULL,
    primary_risk_factors TEXT[] NOT NULL,
    analysis_summary TEXT NOT NULL,
    recommended_actions TEXT[] NOT NULL,
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Interventions Log
CREATE TABLE IF NOT EXISTS interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id),
    status intervention_status DEFAULT 'NOT_STARTED',
    action_plan TEXT NOT NULL,
    parent_communication_draft TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_sessions_class_date ON attendance_sessions(class_id, session_date);
CREATE INDEX IF NOT EXISTS idx_records_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_records_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_risk_student ON ai_risk_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_interventions_student ON interventions(student_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users read and update their own profile
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
CREATE POLICY "Users can manage own profile" ON profiles 
    FOR ALL USING (auth.uid() = id);

-- Classes: Teachers can access classes they own
DROP POLICY IF EXISTS "Teachers can access own classes" ON classes;
CREATE POLICY "Teachers can access own classes" ON classes 
    FOR ALL USING (teacher_id = auth.uid());

-- Students: Accessible if class belongs to teacher
DROP POLICY IF EXISTS "Teachers can access students in their classes" ON students;
CREATE POLICY "Teachers can access students in their classes" ON students 
    FOR ALL USING (
        class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
    );

-- Attendance Sessions: Access via class ownership
DROP POLICY IF EXISTS "Teachers manage sessions in their classes" ON attendance_sessions;
CREATE POLICY "Teachers manage sessions in their classes" ON attendance_sessions 
    FOR ALL USING (
        class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
    );

-- Attendance Records: Access via session/class ownership
DROP POLICY IF EXISTS "Teachers manage attendance records" ON attendance_records;
CREATE POLICY "Teachers manage attendance records" ON attendance_records 
    FOR ALL USING (
        session_id IN (
            SELECT id FROM attendance_sessions WHERE class_id IN (
                SELECT id FROM classes WHERE teacher_id = auth.uid()
            )
        )
    );

-- AI Risk & Interventions: Access via student ownership
DROP POLICY IF EXISTS "Teachers manage student risk data" ON ai_risk_assessments;
CREATE POLICY "Teachers manage student risk data" ON ai_risk_assessments 
    FOR ALL USING (
        student_id IN (
            SELECT s.id FROM students s JOIN classes c ON s.class_id = c.id WHERE c.teacher_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Teachers manage interventions" ON interventions;
CREATE POLICY "Teachers manage interventions" ON interventions 
    FOR ALL USING (
        teacher_id = auth.uid()
    );
