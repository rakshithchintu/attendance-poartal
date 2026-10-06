-- ==============================================================================
-- AI-POWERED STUDENT ATTENDANCE MANAGEMENT & PREDICTIVE RISK ASSISTANT
-- COMPREHENSIVE SEED DATA FOR DEVELOPMENT & TESTING
-- ==============================================================================

-- 1. Insert Profiles
INSERT INTO profiles (id, email, full_name, role)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'teacher@school.edu', 'Dr. Eleanor Vance', 'TEACHER'),
    ('00000000-0000-0000-0000-000000000002', 'admin@school.edu', 'Principal Marcus Davis', 'ADMIN')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- 2. Insert Classes
INSERT INTO classes (id, teacher_id, class_name, subject_code, academic_term, min_attendance_percentage)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Advanced Computer Science', 'CS-101', 'Fall Term 2026', 75.0),
    ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Data Structures & Algorithms', 'CS-204', 'Fall Term 2026', 75.0),
    ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Software Engineering Ethics', 'ENG-310', 'Fall Term 2026', 80.0)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Students Roster for CS-101
INSERT INTO students (id, class_id, roll_number, first_name, last_name, email, parent_name, parent_email, parent_phone)
VALUES 
    ('aaaaaaaa-0001-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'CS101-01', 'Leo', 'Hernandez', 'leo.h@student.edu', 'Carlos Hernandez', 'carlos.h@parent.com', '+1 (555) 234-8890'),
    ('aaaaaaaa-0002-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'CS101-02', 'Maya', 'Lin', 'maya.l@student.edu', 'Sheng Lin', 'sheng.lin@parent.com', '+1 (555) 345-1212'),
    ('aaaaaaaa-0003-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'CS101-03', 'Sophia', 'Rodriguez', 'sophia.r@student.edu', 'Elena Rodriguez', 'elena.r@parent.com', '+1 (555) 456-7890'),
    ('aaaaaaaa-0004-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'CS101-04', 'Ethan', 'Chen', 'ethan.c@student.edu', 'David Chen', 'david.chen@parent.com', '+1 (555) 567-3344'),
    ('aaaaaaaa-0005-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'CS101-05', 'Amara', 'Okafor', 'amara.o@student.edu', 'Chidi Okafor', 'chidi.okafor@parent.com', '+1 (555) 678-9012'),
    ('aaaaaaaa-0006-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'CS101-06', 'Liam', 'O''Connor', 'liam.oc@student.edu', 'Fiona O''Connor', 'fiona.oc@parent.com', '+1 (555) 789-0123'),
    ('aaaaaaaa-0007-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'CS101-07', 'Zara', 'Patel', 'zara.p@student.edu', 'Raj Patel', 'raj.patel@parent.com', '+1 (555) 890-1234'),
    ('aaaaaaaa-0008-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'CS101-08', 'Noah', 'Kim', 'noah.k@student.edu', 'Grace Kim', 'grace.kim@parent.com', '+1 (555) 901-2345'),
    ('aaaaaaaa-0009-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'CS101-09', 'Chloe', 'Dubois', 'chloe.d@student.edu', 'Jean Dubois', 'jean.d@parent.com', '+1 (555) 012-3456'),
    ('aaaaaaaa-0010-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'CS101-10', 'Lucas', 'Silva', 'lucas.s@student.edu', 'Beatriz Silva', 'beatriz.silva@parent.com', '+1 (555) 123-4567')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Students for CS-204
INSERT INTO students (id, class_id, roll_number, first_name, last_name, email, parent_name, parent_email, parent_phone)
VALUES 
    ('bbbbbbbb-0001-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'CS204-01', 'Aiden', 'Taylor', 'aiden.t@student.edu', 'Robert Taylor', 'robert.t@parent.com', '+1 (555) 222-3333'),
    ('bbbbbbbb-0002-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'CS204-02', 'Zoe', 'Kowalski', 'zoe.k@student.edu', 'Marta Kowalski', 'marta.k@parent.com', '+1 (555) 444-5555')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert AI Risk Assessments for Key Students
INSERT INTO ai_risk_assessments (student_id, calculated_percentage, risk_level, primary_risk_factors, analysis_summary, recommended_actions)
VALUES 
(
    'aaaaaaaa-0001-0000-0000-000000000001', 
    64.2, 
    'CRITICAL', 
    ARRAY['Friday absenteeism spike (4 consecutive Fridays missed)', '3-day unexcused absence streak in week 3', 'Attendance well below 75% threshold'],
    'Leo displays acute chronic absenteeism risk. A steep decline occurred during mid-term weeks, concentrated primarily around laboratory sessions on Fridays. Immediate intervention required to prevent course failure.',
    ARRAY['Schedule mandatory academic advising check-in', 'Send urgent parent notification with detailed attendance audit', 'Assign student peer mentor for lab coursework']
),
(
    'aaaaaaaa-0002-0000-0000-000000000002', 
    73.5, 
    'MODERATE', 
    ARRAY['Attendance hovering at 73.5% (below 75% threshold)', 'Frequent LATE status arrivals (30+ mins late)', 'Monday morning fatigue pattern'],
    'Maya is on the boundary of failing course attendance criteria. While not completely absent, repeated late arrivals severely impact participation points. Prompt empathetic intervention can easily restore compliance.',
    ARRAY['Send empathetic reminder regarding 75% cutoff threshold', 'Inquire with student regarding transportation or early morning schedule conflicts', 'Provide recorded lecture recap for missed intro segments']
),
(
    'aaaaaaaa-0003-0000-0000-000000000003', 
    96.5, 
    'LOW', 
    ARRAY['Consistently high engagement', 'Only one excused medical absence'],
    'Sophia demonstrates exceptional attendance discipline with strong correlation to high coursework performance. Negligible dropout risk.',
    ARRAY['Acknowledge exemplary consistency', 'Consider for lab assistant or peer tutor roles']
)
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Intervention Records
INSERT INTO interventions (student_id, teacher_id, status, action_plan, parent_communication_draft, notes)
VALUES 
(
    'aaaaaaaa-0001-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'IN_PROGRESS',
    'Execute urgent parent outreach via email/phone, establish bi-weekly check-in contract, and provide makeup lab hours.',
    'Dear Mr. Hernandez, I am writing to urgently bring to your attention that Leo has missed several key Friday classes and his attendance has dropped to 64.2%, placing him at risk of not meeting course requirements. We are eager to partner with you to support his recovery.',
    'Spoke with academic counselor. Waiting for parental response to schedule joint meeting.'
);
