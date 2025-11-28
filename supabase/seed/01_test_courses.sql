-- ============================================================================
-- TEST COURSES SEED DATA
-- Creates sample courses for contract testing
-- ============================================================================

DO $$
DECLARE
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
      audience,
      mode,
      duration,
      price,
      level,
      start_date,
      features,
      category,
      keywords,
      prerequisites,
      is_active,
      sort_order,
      created_at,
      updated_at
    )
    VALUES (
      'Introduction to Web Development',
      'Learn the fundamentals of web development including HTML, CSS, and JavaScript.',
      'Professionals',
      'Online',
      '8 weeks',
      '£99',
      'Beginner',
      '1st January 2025',
      ARRAY['Live sessions', 'Recorded lectures', 'Code exercises', 'Certificate'],
      'Programming',
      ARRAY['web', 'html', 'css', 'javascript'],
      'Basic computer skills',
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
      audience,
      mode,
      duration,
      price,
      level,
      start_date,
      features,
      category,
      keywords,
      prerequisites,
      is_active,
      sort_order,
      created_at,
      updated_at
    )
    VALUES (
      'Intermediate Python Programming',
      'Advanced Python concepts including OOP, data structures, and algorithms.',
      'Professionals',
      'Online',
      '12 weeks',
      '£149',
      'Intermediate',
      '15th January 2025',
      ARRAY['Live coding sessions', 'Project-based learning', 'Mentorship', 'Career support'],
      'Programming',
      ARRAY['python', 'oop', 'algorithms'],
      'Basic Python knowledge',
      true,
      2,
      NOW(),
      NOW()
    )
    RETURNING id INTO course_id_2;

    -- Course 3: Enterprise AI Solutions (Free course)
    INSERT INTO public.courses (
      title,
      description,
      audience,
      mode,
      duration,
      price,
      level,
      start_date,
      features,
      category,
      keywords,
      prerequisites,
      is_active,
      sort_order,
      created_at,
      updated_at
    )
    VALUES (
      'Enterprise AI Solutions',
      'Learn how to implement AI solutions in enterprise environments.',
      'SMEs',
      'Online',
      '16 weeks',
      'Free',
      'Advanced',
      '1st February 2025',
      ARRAY['Hands-on projects', 'Industry case studies', 'Expert instructors', 'Certification'],
      'AI Fundamentals',
      ARRAY['ai', 'ml', 'enterprise'],
      'ML/AI fundamentals',
      true,
      3,
      NOW(),
      NOW()
    )
    RETURNING id INTO course_id_3;

    -- Add additional audiences if the junction table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'course_audiences') THEN
      -- Add secondary audiences for course 1
      INSERT INTO public.course_audiences (course_id, audience)
      VALUES (course_id_1, 'Teenagers')
      ON CONFLICT (course_id, audience) DO NOTHING;

      -- Add secondary audiences for course 2
      INSERT INTO public.course_audiences (course_id, audience)
      VALUES (course_id_2, 'Teenagers')
      ON CONFLICT (course_id, audience) DO NOTHING;

      -- Add secondary audiences for course 3
      INSERT INTO public.course_audiences (course_id, audience)
      VALUES (course_id_3, 'Professionals')
      ON CONFLICT (course_id, audience) DO NOTHING;
    END IF;

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
  -- Delete from course_audiences first (if it exists)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'course_audiences') THEN
    DELETE FROM public.course_audiences WHERE course_id IN (
      SELECT id FROM public.courses WHERE title IN (
        'Introduction to Web Development',
        'Intermediate Python Programming',
        'Enterprise AI Solutions'
      )
    );
  END IF;

  -- Then delete from courses
  DELETE FROM public.courses WHERE title IN (
    'Introduction to Web Development',
    'Intermediate Python Programming',
    'Enterprise AI Solutions'
  );

  RAISE NOTICE 'Test courses cleaned up';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_test_courses() IS 'Removes all test courses created by seed data';
