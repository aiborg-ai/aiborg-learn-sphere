-- Demo Users Seed Data
-- Creates password-free demo accounts for stakeholder demonstrations
-- Password for all demo accounts: demo123!secure

-- ============================================
-- Create Demo Learner Account
-- ============================================

-- First, create the auth user (this needs to be done via Supabase Dashboard or API)
-- The user should be created with:
-- Email: demo-learner@aiborg.ai
-- Password: demo123!secure

-- Insert demo learner profile
INSERT INTO public.profiles (
  id,
  email,
  display_name,
  first_name,
  last_name,
  role,
  avatar_url,
  bio,
  preferences,
  created_at,
  updated_at
)
SELECT
  id,
  'demo-learner@aiborg.ai',
  'Demo Learner',
  'Demo',
  'Learner',
  'user',
  NULL,
  'This is a demo account for exploring AIBORG as a learner. Feel free to explore courses, assessments, and resources.',
  '{"theme": "system", "notifications": true, "demo_mode": true}'::jsonb,
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'demo-learner@aiborg.ai'
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  preferences = EXCLUDED.preferences,
  updated_at = NOW();

-- ============================================
-- Create Demo Admin Account
-- ============================================

-- The admin user should be created with:
-- Email: demo-admin@aiborg.ai
-- Password: demo123!secure
-- raw_user_meta_data: {"role": "admin"}

-- Insert demo admin profile
INSERT INTO public.profiles (
  id,
  email,
  display_name,
  first_name,
  last_name,
  role,
  avatar_url,
  bio,
  preferences,
  created_at,
  updated_at
)
SELECT
  id,
  'demo-admin@aiborg.ai',
  'Demo Admin',
  'Demo',
  'Admin',
  'admin',
  NULL,
  'This is a demo admin account for exploring AIBORG''s full capabilities. Access all CMS features, analytics, and management tools.',
  '{"theme": "system", "notifications": true, "demo_mode": true}'::jsonb,
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'demo-admin@aiborg.ai'
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = 'admin',
  bio = EXCLUDED.bio,
  preferences = EXCLUDED.preferences,
  updated_at = NOW();

-- ============================================
-- Add sample enrollments for demo learner
-- ============================================

-- Get demo learner ID and add some sample enrollments
-- This assumes you have courses already seeded

INSERT INTO public.enrollments (user_id, course_id, status, progress, enrolled_at)
SELECT
  u.id,
  c.id,
  'active',
  FLOOR(RANDOM() * 100)::int,
  NOW() - (RANDOM() * INTERVAL '30 days')
FROM auth.users u
CROSS JOIN (
  SELECT id FROM public.courses
  WHERE status = 'published'
  ORDER BY RANDOM()
  LIMIT 3
) c
WHERE u.email = 'demo-learner@aiborg.ai'
ON CONFLICT DO NOTHING;

-- ============================================
-- Instructions for creating demo users
-- ============================================

/*
To create the demo users in Supabase:

1. Go to Supabase Dashboard > Authentication > Users

2. Create Demo Learner:
   - Click "Add user"
   - Email: demo-learner@aiborg.ai
   - Password: demo123!secure
   - Auto-confirm: Yes
   - User metadata: {"role": "user", "demo_account": true}

3. Create Demo Admin:
   - Click "Add user"
   - Email: demo-admin@aiborg.ai
   - Password: demo123!secure
   - Auto-confirm: Yes
   - User metadata: {"role": "admin", "demo_account": true}

4. Run this seed file to create profiles:
   psql $DATABASE_URL -f supabase/seed/demo_users_seed.sql

Alternative: Use Supabase CLI to create users:

supabase functions invoke create-demo-users

Or via SQL (run in SQL Editor):

-- Create demo learner
SELECT auth.create_user(
  'demo-learner@aiborg.ai',
  'demo123!secure',
  '{"role": "user", "demo_account": true}'::jsonb
);

-- Create demo admin
SELECT auth.create_user(
  'demo-admin@aiborg.ai',
  'demo123!secure',
  '{"role": "admin", "demo_account": true}'::jsonb
);

Note: The exact method depends on your Supabase setup and auth configuration.
*/

-- Verify demo users exist
DO $$
DECLARE
  learner_exists BOOLEAN;
  admin_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'demo-learner@aiborg.ai') INTO learner_exists;
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'demo-admin@aiborg.ai') INTO admin_exists;

  IF NOT learner_exists THEN
    RAISE NOTICE 'WARNING: Demo learner user not found. Create via Supabase Dashboard.';
  END IF;

  IF NOT admin_exists THEN
    RAISE NOTICE 'WARNING: Demo admin user not found. Create via Supabase Dashboard.';
  END IF;

  IF learner_exists AND admin_exists THEN
    RAISE NOTICE 'SUCCESS: Both demo users exist and are ready.';
  END IF;
END $$;
