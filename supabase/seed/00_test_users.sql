-- ============================================================================
-- TEST USERS SEED DATA
-- Creates test users for contract testing
-- ============================================================================

-- Note: This requires service role access to insert into auth.users
-- For local development, you can disable the foreign key constraint temporarily

DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000001';
  test_admin_id UUID := '00000000-0000-0000-0000-000000000002';
  test_instructor_id UUID := '00000000-0000-0000-0000-000000000003';
BEGIN
  -- Check if profiles table exists
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    RAISE NOTICE 'Profiles table does not exist, skipping user seeding';
    RETURN;
  END IF;

  -- Insert into auth.users first (required for foreign key constraint)
  -- Note: In production, users are created via Supabase Auth API
  -- This is only for testing purposes

  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES
    (
      test_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'test.user@example.com',
      crypt('test123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    ),
    (
      test_admin_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'test.admin@example.com',
      crypt('test123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    ),
    (
      test_instructor_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'test.instructor@example.com',
      crypt('test123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
  ON CONFLICT (id) DO NOTHING;

  -- Now insert into profiles table
  INSERT INTO public.profiles (user_id, display_name, email, role, created_at, updated_at)
  VALUES
    (
      test_user_id,
      'Test User',
      'test.user@example.com',
      'user',
      NOW(),
      NOW()
    ),
    (
      test_admin_id,
      'Test Admin',
      'test.admin@example.com',
      'admin',
      NOW(),
      NOW()
    ),
    (
      test_instructor_id,
      'Test Instructor',
      'test.instructor@example.com',
      'user',
      NOW(),
      NOW()
    )
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'Test users seeded successfully';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Failed to seed test users: %. If you do not have access to auth.users, see alternative approach in comments.', SQLERRM;
END $$;

-- ============================================================================
-- ALTERNATIVE: Disable FK constraint temporarily (for local testing only)
-- ============================================================================
-- If you cannot insert into auth.users, uncomment the following:
--
-- -- Disable foreign key constraint
-- ALTER TABLE public.profiles DISABLE TRIGGER ALL;
--
-- -- Insert test data
-- INSERT INTO public.profiles (user_id, display_name, email, role, created_at, updated_at)
-- VALUES
--   ('00000000-0000-0000-0000-000000000001', 'Test User', 'test.user@example.com', 'user', NOW(), NOW()),
--   ('00000000-0000-0000-0000-000000000002', 'Test Admin', 'test.admin@example.com', 'admin', NOW(), NOW()),
--   ('00000000-0000-0000-0000-000000000003', 'Test Instructor', 'test.instructor@example.com', 'user', NOW(), NOW())
-- ON CONFLICT (user_id) DO NOTHING;
--
-- -- Re-enable foreign key constraint
-- ALTER TABLE public.profiles ENABLE TRIGGER ALL;

-- ============================================================================
-- CLEANUP FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_test_users()
RETURNS void AS $$
BEGIN
  -- Delete from profiles first
  DELETE FROM public.profiles WHERE email LIKE 'test.%@example.com';

  -- Then delete from auth.users (if you have permission)
  DELETE FROM auth.users WHERE email LIKE 'test.%@example.com';

  RAISE NOTICE 'Test users cleaned up';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Partial cleanup completed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_test_users() IS 'Removes all test users created by seed data';
