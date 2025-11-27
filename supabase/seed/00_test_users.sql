-- ============================================================================
-- TEST USERS SEED DATA
-- Creates test users for contract testing
-- ============================================================================

-- Note: These are test users - use UUIDs that won't conflict with real users
-- In a real test environment, these would be created through Supabase Auth

-- Test User IDs (use consistent UUIDs for reproducible tests)
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000001';
  test_admin_id UUID := '00000000-0000-0000-0000-000000000002';
  test_instructor_id UUID := '00000000-0000-0000-0000-000000000003';
BEGIN
  -- Only insert if profiles table exists and test data doesn't exist
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    -- Test Regular User
    INSERT INTO public.profiles (user_id, display_name, email, role, created_at, updated_at)
    VALUES (
      test_user_id,
      'Test User',
      'test.user@example.com',
      'user',
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- Test Admin
    INSERT INTO public.profiles (user_id, display_name, email, role, created_at, updated_at)
    VALUES (
      test_admin_id,
      'Test Admin',
      'test.admin@example.com',
      'admin',
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- Test Instructor (stored as user since role constraint is user/admin)
    INSERT INTO public.profiles (user_id, display_name, email, role, created_at, updated_at)
    VALUES (
      test_instructor_id,
      'Test Instructor',
      'test.instructor@example.com',
      'user',
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;

    RAISE NOTICE 'Test users seeded successfully';
  ELSE
    RAISE NOTICE 'Profiles table does not exist, skipping user seeding';
  END IF;
END $$;

-- ============================================================================
-- CLEANUP FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_test_users()
RETURNS void AS $$
BEGIN
  DELETE FROM public.profiles WHERE email LIKE 'test.%@example.com';
  RAISE NOTICE 'Test users cleaned up';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_test_users() IS 'Removes all test users created by seed data';
