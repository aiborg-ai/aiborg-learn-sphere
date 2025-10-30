-- Migration: Create "Vibe Coding" Course and Sessions
-- Feature: Professional hands-on AI coding course
-- Created: 2024-10-29

-- =====================================================
-- 1. CREATE VIBE CODING COURSE
-- =====================================================

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
  sort_order
) VALUES (
  'Vibe Coding: AI-Powered Development for Professionals',
  'Master modern AI-powered development tools in this hands-on professional course. Learn to leverage Claude Code, ChatGPT, GitHub Copilot, and more to supercharge your coding workflow. 4 live sessions in November 2025. Perfect for developers looking to stay ahead in the AI-augmented development landscape. FREE for Family Pass holders!',
  'Professionals',
  'Online',
  '4 weeks',
  '£20',
  'Intermediate',
  '8th November 2025',
  ARRAY[
    '4 live sessions in November 2025',
    'Hands-on with Claude Code',
    'ChatGPT for code generation',
    'GitHub Copilot best practices',
    'AI pair programming techniques',
    'Real-world project workflows',
    'Live Q&A with experts',
    'Certificate of completion',
    'FREE for Family Pass holders'
  ],
  'Professional Development',
  ARRAY[
    'claude-code',
    'chatgpt',
    'github-copilot',
    'ai-coding',
    'vibe-coding',
    'pair-programming',
    'developer-tools',
    'productivity'
  ],
  'Basic programming knowledge (any language), familiarity with IDE/code editors, willingness to experiment with new tools',
  true,
  999
) RETURNING id;

-- Store the course ID for reference (you'll need to get this after running)
-- The course will be created with an auto-generated ID

-- =====================================================
-- 2. COURSE SESSION SCHEDULE
-- =====================================================
--
-- This course includes 4 live sessions in November 2025:
--
-- Session 1: Introduction to AI-Powered Development
--   Date: Saturday, November 8, 2025 at 7:00 PM GMT
--   Duration: 2 hours
--   Topics: Claude Code, ChatGPT, GitHub Copilot introduction
--
-- Session 2: Mastering Claude Code Workflows
--   Date: Saturday, November 15, 2025 at 7:00 PM GMT
--   Duration: 2 hours
--   Topics: Advanced Claude Code techniques, prompt engineering
--
-- Session 3: ChatGPT & Copilot Power Techniques
--   Date: Saturday, November 22, 2025 at 7:00 PM GMT
--   Duration: 2 hours
--   Topics: Multi-tool workflows, advanced prompts
--
-- Session 4: Real-World Projects & Pro Tips
--   Date: Saturday, November 29, 2025 at 7:00 PM GMT
--   Duration: 2 hours
--   Topics: Complete project build, best practices, Q&A
--
-- Meeting Details:
--   Platform: Jitsi (browser-based, no download required)
--   Support: WhatsApp +44 7404568207
--   Capacity: 50 participants per session
--
-- NOTE: Sessions are delivered as part of the course enrollment.
-- Meeting links will be sent to enrolled students via email.

-- =====================================================
-- NOTES FOR COURSE ADMINISTRATOR
-- =====================================================

-- After running this migration:
-- 1. Get the course ID from the courses table:
--    SELECT id FROM public.courses WHERE title LIKE 'Vibe Coding%';
--
-- 2. Create course materials using the course_id
--    (Run migration: 20251029_vibe_coding_materials.sql)
--
-- 3. Course pricing:
--    - Regular price: £20
--    - FREE for Family Pass holders
--    - Enrollment handled through normal course enrollment system
--
-- 4. Session delivery:
--    - 4 live sessions scheduled for November 2025
--    - Dates: 8th, 15th, 22nd, 29th (Saturdays)
--    - Time: 7:00 PM - 9:00 PM GMT
--    - Platform: Jitsi
--    - Meeting links to be sent to enrolled students
--
-- 5. Family Pass integration:
--    - Family Pass holders should get automatic free access
--    - Check enrollment system for Family Pass verification

COMMENT ON COLUMN public.courses.sort_order IS 'Higher numbers appear later in lists. 999 = new courses';
