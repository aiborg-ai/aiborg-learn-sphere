-- ============================================================================
-- TEST COURSES SEED DATA
-- Creates sample courses for contract testing
-- ============================================================================

DO $$
DECLARE
  test_instructor_id UUID := '00000000-0000-0000-0000-000000000002';
  course_id_1 INT;
  course_id_2 INT;
  course_id_3 INT;
BEGIN
  -- Only insert if courses table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'courses') THEN

    -- Course 1: Beginner Web Development
    INSERT INTO public.courses (
      title,
      description,
      instructor_id,
      audience,
      audiences,
      mode,
      level,
      status,
      duration,
      price,
      start_date,
      max_enrollments,
      features,
      prerequisites,
      learning_outcomes,
      is_active,
      display,
      currently_enrolling,
      sort_order,
      created_at,
      updated_at
    )
    VALUES (
      'Introduction to Web Development',
      'Learn the fundamentals of web development including HTML, CSS, and JavaScript.',
      test_instructor_id,
      'students',
      ARRAY['students', 'professionals'],
      'online',
      'beginner',
      'published',
      '8 weeks',
      99.00,
      NOW() + INTERVAL '7 days',
      50,
      ARRAY['Live sessions', 'Recorded lectures', 'Code exercises', 'Certificate'],
      ARRAY['Basic computer skills', 'Internet access'],
      ARRAY['Build responsive websites', 'Understand HTML/CSS/JS fundamentals', 'Deploy web applications'],
      true,
      true,
      true,
      1,
      NOW(),
      NOW()
    )
    RETURNING id INTO course_id_1;

    -- Course 2: Intermediate Python Programming
    INSERT INTO public.courses (
      title,
      description,
      instructor_id,
      audience,
      audiences,
      mode,
      level,
      status,
      duration,
      price,
      start_date,
      max_enrollments,
      features,
      prerequisites,
      learning_outcomes,
      is_active,
      display,
      currently_enrolling,
      sort_order,
      created_at,
      updated_at
    )
    VALUES (
      'Intermediate Python Programming',
      'Advanced Python concepts including OOP, data structures, and algorithms.',
      test_instructor_id,
      'professionals',
      ARRAY['professionals', 'students'],
      'hybrid',
      'intermediate',
      'published',
      '12 weeks',
      149.00,
      NOW() + INTERVAL '14 days',
      30,
      ARRAY['Live coding sessions', 'Project-based learning', 'Mentorship', 'Career support'],
      ARRAY['Basic Python knowledge', 'Programming fundamentals'],
      ARRAY['Master OOP in Python', 'Implement complex data structures', 'Solve algorithmic problems'],
      true,
      true,
      true,
      2,
      NOW(),
      NOW()
    )
    RETURNING id INTO course_id_2;

    -- Course 3: Enterprise AI Solutions (Free course for testing)
    INSERT INTO public.courses (
      title,
      description,
      instructor_id,
      audience,
      audiences,
      mode,
      level,
      status,
      duration,
      price,
      start_date,
      max_enrollments,
      features,
      prerequisites,
      learning_outcomes,
      is_active,
      display,
      currently_enrolling,
      sort_order,
      created_at,
      updated_at
    )
    VALUES (
      'Enterprise AI Solutions',
      'Learn how to implement AI solutions in enterprise environments.',
      test_instructor_id,
      'enterprises',
      ARRAY['enterprises', 'professionals'],
      'in-person',
      'advanced',
      'published',
      '16 weeks',
      0.00, -- Free course
      NOW() + INTERVAL '30 days',
      20,
      ARRAY['Hands-on projects', 'Industry case studies', 'Expert instructors', 'Certification'],
      ARRAY['ML/AI fundamentals', 'Enterprise experience', 'Python/TensorFlow knowledge'],
      ARRAY['Deploy AI models at scale', 'Build enterprise AI architecture', 'Manage AI teams'],
      true,
      true,
      true,
      3,
      NOW(),
      NOW()
    )
    RETURNING id INTO course_id_3;

    RAISE NOTICE 'Test courses seeded successfully: %, %, %', course_id_1, course_id_2, course_id_3;
  ELSE
    RAISE NOTICE 'Courses table does not exist, skipping course seeding';
  END IF;
END $$;

-- ============================================================================
-- CLEANUP FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_test_courses()
RETURNS void AS $$
BEGIN
  DELETE FROM public.courses WHERE title IN (
    'Introduction to Web Development',
    'Intermediate Python Programming',
    'Enterprise AI Solutions'
  );
  RAISE NOTICE 'Test courses cleaned up';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_test_courses() IS 'Removes all test courses created by seed data';
