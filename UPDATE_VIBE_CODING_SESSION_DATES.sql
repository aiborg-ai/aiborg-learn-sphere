-- ============================================================================
-- Update Vibe Coding Course with Session Dates
-- ============================================================================
-- Sessions: 8 November, 15 November, 22 November, 29 November
-- Time: From 7 PM onwards
-- Mode: Online
--
-- HOW TO RUN:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Copy and paste this entire script
-- 3. Click "Run" or press Ctrl+Enter
-- ============================================================================

-- Update the course with session dates
UPDATE public.courses
SET
  -- Updated description with session dates
  description = 'Master modern AI-powered development tools in this hands-on professional course. Learn to leverage Claude Code, ChatGPT, GitHub Copilot, and more to supercharge your coding workflow. Sessions: 8 November, 15 November, 22 November, and 29 November from 7 PM onwards (Online). Perfect for developers looking to stay ahead in the AI-augmented development landscape. FREE for Family Pass holders!',

  -- Updated features list with session dates at the top
  features = ARRAY[
    'Session 1: 8 November from 7 PM (Online)',
    'Session 2: 15 November from 7 PM (Online)',
    'Session 3: 22 November from 7 PM (Online)',
    'Session 4: 29 November from 7 PM (Online)',
    'Hands-on with Claude Code',
    'ChatGPT for code generation',
    'GitHub Copilot best practices',
    'AI pair programming techniques',
    'Real-world project workflows',
    'Live Q&A with experts',
    'Certificate of completion',
    'FREE for Family Pass holders'
  ],

  -- Update start date to first session
  start_date = '8 November 2025',

  -- Ensure mode is set to Online
  mode = 'Online',

  -- Update timestamp
  updated_at = NOW()

WHERE
  -- Match by title (in case course_id changes)
  title LIKE 'Vibe Coding%'
  -- OR match by known course_id
  OR id = 807;

-- ============================================================================
-- Verify the update
-- ============================================================================

SELECT
  id,
  title,
  description,
  features,
  start_date,
  mode,
  duration,
  price,
  audience,
  updated_at
FROM public.courses
WHERE title LIKE 'Vibe Coding%'
   OR id = 807;

-- ============================================================================
-- Expected Result:
-- ============================================================================
-- You should see:
-- - description includes "8 November, 15 November, 22 November, and 29 November from 7 PM onwards (Online)"
-- - features array has session dates at the top
-- - start_date is "8 November 2025"
-- - mode is "Online"
-- - updated_at is current timestamp
-- ============================================================================
