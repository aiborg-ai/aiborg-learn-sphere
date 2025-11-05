-- Test Data for Session Ticket System
-- Run this in Supabase SQL Editor

-- ==================================================
-- 1. Get a course to test with
-- ==================================================
DO $$
DECLARE
  v_course_id INTEGER;
  v_user_id UUID;
  v_session_id UUID;
BEGIN
  -- Get the first active course
  SELECT id INTO v_course_id
  FROM courses
  WHERE is_active = true
  LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'No active courses found. Please create a course first.';
  END IF;

  RAISE NOTICE 'Using course_id: %', v_course_id;

  -- ==================================================
  -- 2. Create test sessions
  -- ==================================================
  RAISE NOTICE 'Creating test sessions...';

  -- Session 1: Tomorrow (can check in)
  INSERT INTO course_sessions (
    course_id,
    session_number,
    title,
    description,
    session_type,
    session_date,
    start_time,
    end_time,
    location,
    status,
    check_in_enabled,
    check_in_window_start,
    check_in_window_end,
    max_capacity
  ) VALUES (
    v_course_id,
    1,
    'Introduction to AI - Session 1',
    'Welcome session and course overview',
    'scheduled',
    CURRENT_DATE + INTERVAL '1 day',
    '10:00:00',
    '12:00:00',
    'Room 101',
    'scheduled',
    true,
    NOW(),
    NOW() + INTERVAL '48 hours',
    30
  ) RETURNING id INTO v_session_id;

  RAISE NOTICE 'Created session 1: %', v_session_id;

  -- Session 2: In 3 days
  INSERT INTO course_sessions (
    course_id,
    session_number,
    title,
    description,
    session_type,
    session_date,
    start_time,
    end_time,
    location,
    status,
    check_in_enabled,
    max_capacity
  ) VALUES (
    v_course_id,
    2,
    'AI Fundamentals - Session 2',
    'Deep dive into AI concepts',
    'scheduled',
    CURRENT_DATE + INTERVAL '3 days',
    '10:00:00',
    '12:00:00',
    'Room 101',
    'scheduled',
    false,
    30
  );

  -- Session 3: Next week
  INSERT INTO course_sessions (
    course_id,
    session_number,
    title,
    description,
    session_type,
    session_date,
    start_time,
    end_time,
    location,
    status,
    max_capacity
  ) VALUES (
    v_course_id,
    3,
    'Machine Learning Basics - Session 3',
    'Introduction to ML algorithms',
    'scheduled',
    CURRENT_DATE + INTERVAL '7 days',
    '14:00:00',
    '16:00:00',
    'Room 202',
    'scheduled',
    30
  );

  RAISE NOTICE 'Created 3 test sessions';

  -- ==================================================
  -- 3. Verify tickets were auto-generated
  -- ==================================================
  RAISE NOTICE 'Checking auto-generated tickets...';

  -- Show generated tickets
  RAISE NOTICE 'Tickets generated:';
  FOR v_user_id IN
    SELECT DISTINCT user_id
    FROM session_tickets
    WHERE course_id = v_course_id
    LIMIT 5
  LOOP
    RAISE NOTICE '  User: %, Tickets: %',
      v_user_id,
      (SELECT COUNT(*) FROM session_tickets WHERE user_id = v_user_id AND course_id = v_course_id);
  END LOOP;

  -- ==================================================
  -- 4. Summary
  -- ==================================================
  RAISE NOTICE '';
  RAISE NOTICE '=== SUMMARY ===';
  RAISE NOTICE 'Course ID: %', v_course_id;
  RAISE NOTICE 'Sessions created: %', (SELECT COUNT(*) FROM course_sessions WHERE course_id = v_course_id);
  RAISE NOTICE 'Tickets generated: %', (SELECT COUNT(*) FROM session_tickets WHERE course_id = v_course_id);
  RAISE NOTICE 'Enrolled students: %', (SELECT COUNT(DISTINCT user_id) FROM session_tickets WHERE course_id = v_course_id);
  RAISE NOTICE '';
  RAISE NOTICE '✅ Test data created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Navigate to /my-tickets to see student view';
  RAISE NOTICE '2. Navigate to /instructor/sessions to mark attendance';
  RAISE NOTICE '';

END $$;

-- ==================================================
-- View the created sessions
-- ==================================================
SELECT
  cs.id,
  cs.session_number,
  cs.title,
  cs.session_date,
  cs.start_time,
  cs.status,
  cs.check_in_enabled,
  COUNT(st.id) as ticket_count,
  cs.current_attendance
FROM course_sessions cs
LEFT JOIN session_tickets st ON st.session_id = cs.id
WHERE cs.created_at > NOW() - INTERVAL '5 minutes'
GROUP BY cs.id
ORDER BY cs.session_date;
