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
-- Migration: Create Course Materials for "Vibe Coding"
-- Feature: Handbooks, presentations, and resources for each session
-- Created: 2024-10-29
--
-- IMPORTANT: Run this AFTER 20251029_vibe_coding_course.sql
-- Update COURSE_ID below with the actual ID from courses table

-- =====================================================
-- STEP 1: GET THE COURSE ID
-- =====================================================
-- Run this query first to get the course_id:
-- SELECT id FROM public.courses WHERE title LIKE 'Vibe Coding%';
-- Then replace 'YOUR_COURSE_ID_HERE' below with that ID

DO $$
DECLARE
  v_course_id INTEGER;
BEGIN
  -- Get the Vibe Coding course ID
  SELECT id INTO v_course_id
  FROM public.courses
  WHERE title LIKE 'Vibe Coding%'
  LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'Vibe Coding course not found! Please run 20251029_vibe_coding_course.sql first';
  END IF;

  RAISE NOTICE 'Found Vibe Coding course with ID: %', v_course_id;

  -- =====================================================
  -- SESSION 1 MATERIALS: Introduction to AI-Powered Development
  -- =====================================================

  -- Session 1: Handbook
  INSERT INTO public.course_materials (
    course_id,
    title,
    description,
    material_type,
    file_url,
    is_active,
    sort_order
  ) VALUES (
    v_course_id,
    'Session 1: Getting Started with AI Coding Tools - Handbook',
    'Comprehensive guide to setting up and using Claude Code, ChatGPT, and GitHub Copilot. Includes installation instructions, API key setup, IDE configuration, and your first AI-assisted coding session. Perfect for beginners to AI-powered development.',
    'handbook',
    'https://your-storage-bucket.com/vibe-coding/session-1-handbook.pdf',
    true,
    1
  );

  -- Session 1: Presentation
  INSERT INTO public.course_materials (
    course_id,
    title,
    description,
    material_type,
    file_url,
    is_active,
    sort_order
  ) VALUES (
    v_course_id,
    'Session 1: Introduction to AI-Powered Development - Slides',
    'Presentation slides covering: What is AI-powered coding? Overview of major tools, How AI assistants work, Benefits and limitations, Demo: Your first AI coding session, Best practices for beginners.',
    'presentation',
    'https://your-storage-bucket.com/vibe-coding/session-1-slides.pdf',
    true,
    2
  );

  -- Session 1: Recording (placeholder - update URL after session)
  INSERT INTO public.course_materials (
    course_id,
    title,
    description,
    material_type,
    file_url,
    duration,
    is_active,
    sort_order
  ) VALUES (
    v_course_id,
    'Session 1: Live Session Recording',
    'Full recording of Session 1 including live coding demonstration, Q&A, and hands-on exercises. Duration: 2 hours.',
    'recording',
    'https://your-storage-bucket.com/vibe-coding/session-1-recording.mp4',
    7200, -- 2 hours in seconds
    false, -- Set to true after recording is available
    3
  );

  -- Session 1: Quick Reference Guide
  INSERT INTO public.course_materials (
    course_id,
    title,
    description,
    material_type,
    file_url,
    is_active,
    sort_order
  ) VALUES (
    v_course_id,
    'Session 1: Quick Reference - Keyboard Shortcuts & Commands',
    'One-page cheat sheet with essential keyboard shortcuts, common prompts, and quick commands for Claude Code, ChatGPT, and GitHub Copilot.',
    'other',
    'https://your-storage-bucket.com/vibe-coding/session-1-quick-ref.pdf',
    true,
    4
  );

  -- =====================================================
  -- SESSION 2 MATERIALS: Deep Dive into Claude Code
  -- =====================================================

  -- Session 2: Handbook
  INSERT INTO public.course_materials (
    course_id,
    title,
    description,
    material_type,
    file_url,
    is_active,
    sort_order
  ) VALUES (
    v_course_id,
    'Session 2: Claude Code Mastery - Complete Handbook',
    'In-depth guide to Claude Code workflows: Advanced prompting techniques, Code generation and refactoring, Debugging strategies, Test-driven development with AI, Multi-file editing, Context management, and Real-world project examples.',
    'handbook',
    'https://your-storage-bucket.com/vibe-coding/session-2-handbook.pdf',
    true,
    5
  );

  -- Session 2: Presentation
  INSERT INTO public.course_materials (
    course_id,
    title,
    description,
    material_type,
    file_url,
    is_active,
    sort_order
  ) VALUES (
    v_course_id,
    'Session 2: Claude Code Deep Dive - Slides',
    'Presentation covering: Architecture of Claude Code, Advanced features and capabilities, Prompt engineering for code, Case studies and workflows, Common pitfalls and solutions, Pro tips from experienced users.',
    'presentation',
    'https://your-storage-bucket.com/vibe-coding/session-2-slides.pdf',
    true,
    6
  );

  -- Session 2: Recording
  INSERT INTO public.course_materials (
    course_id,
    title,
    description,
    material_type,
    file_url,
    duration,
    is_active,
    sort_order
  ) VALUES (
    v_course_id,
    'Session 2: Live Session Recording',
    'Full recording of Session 2 with live coding demos, advanced techniques, and Q&A.',
    'recording',
    'https://your-storage-bucket.com/vibe-coding/session-2-recording.mp4',
    7200,
    false,
    7
  );

  -- Session 2: Code Examples
  INSERT INTO public.course_materials (
    course_id,
    title,
    description,
    material_type,
    file_url,
    is_active,
    sort_order
  ) VALUES (
    v_course_id,
    'Session 2: Claude Code Examples & Templates',
    'GitHub repository with 20+ code examples, prompts, and templates demonstrated in Session 2. Includes: API integration patterns, Refactoring workflows, Test generation templates, Documentation automation.',
    'other',
    'https://github.com/aiborg-ai/vibe-coding-session-2-examples',
    true,
    8
  );

  -- =====================================================
  -- SESSION 3 MATERIALS: ChatGPT & GitHub Copilot
  -- =====================================================

  -- Session 3: Handbook
  INSERT INTO public.course_materials (
    course_id,
    title,
    description,
    material_type,
    file_url,
    is_active,
    sort_order
  ) VALUES (
    v_course_id,
    'Session 3: ChatGPT & Copilot Power User Guide',
    'Comprehensive handbook covering: Advanced ChatGPT prompt patterns, GitHub Copilot keyboard mastery, Multi-tool workflows, IDE integration tips, Context-aware coding techniques, Combining tools for maximum productivity.',
    'handbook',
    'https://your-storage-bucket.com/vibe-coding/session-3-handbook.pdf',
    true,
    9
  );

  -- Session 3: Presentation
  INSERT INTO public.course_materials (
    course_id,
    title,
    description,
    material_type,
    file_url,
    is_active,
    sort_order
  ) VALUES (
    v_course_id,
    'Session 3: ChatGPT & Copilot Techniques - Slides',
    'Slides covering: ChatGPT for architecture & design, Copilot best practices, Tool comparison matrix, When to use which tool, Multi-tool workflow patterns, Real-world case studies.',
    'presentation',
    'https://your-storage-bucket.com/vibe-coding/session-3-slides.pdf',
    true,
    10
  );

  -- Session 3: Recording
  INSERT INTO public.course_materials (
    course_id,
    title,
    description,
    material_type,
    file_url,
    duration,
    is_active,
    sort_order
  ) VALUES (
    v_course_id,
    'Session 3: Live Session Recording',
    'Full recording of Session 3 including ChatGPT demos, Copilot workflows, and Q&A.',
    'recording',
    'https://your-storage-bucket.com/vibe-coding/session-3-recording.mp4',
    7200,
    false,
    11
  );

  -- Session 3: Prompt Library
  INSERT INTO public.course_materials (
    course_id,
    title,
    description,
    material_type,
    file_url,
    is_active,
    sort_order
  ) VALUES (
    v_course_id,
    'Session 3: Ultimate Prompt Library for Developers',
    'Curated collection of 50+ battle-tested prompts for ChatGPT and Copilot. Categories: Code generation, Debugging, Refactoring, Documentation, Testing, Architecture design, Code review.',
    'other',
    'https://your-storage-bucket.com/vibe-coding/session-3-prompt-library.pdf',
    true,
    12
  );

  -- =====================================================
  -- SESSION 4 MATERIALS: Real Projects & Best Practices
  -- =====================================================

  -- Session 4: Handbook
  INSERT INTO public.course_materials (
    course_id,
    title,
    description,
    material_type,
    file_url,
    is_active,
    sort_order
  ) VALUES (
    v_course_id,
    'Session 4: Production-Ready AI Coding - Handbook',
    'Final handbook covering: Building complete projects with AI, Code quality and review, Testing strategies, Security considerations, Team collaboration, CI/CD integration, Avoiding AI pitfalls, Career development.',
    'handbook',
    'https://your-storage-bucket.com/vibe-coding/session-4-handbook.pdf',
    true,
    13
  );

  -- Session 4: Presentation
  INSERT INTO public.course_materials (
    course_id,
    title,
    description,
    material_type,
    file_url,
    is_active,
    sort_order
  ) VALUES (
    v_course_id,
    'Session 4: Real-World Projects & Best Practices - Slides',
    'Final presentation: Project walkthrough, Quality assurance with AI, Production deployment, Team workflows, Future of AI coding, Career opportunities, Q&A and closing remarks.',
    'presentation',
    'https://your-storage-bucket.com/vibe-coding/session-4-slides.pdf',
    true,
    14
  );

  -- Session 4: Recording
  INSERT INTO public.course_materials (
    course_id,
    title,
    description,
    material_type,
    file_url,
    duration,
    is_active,
    sort_order
  ) VALUES (
    v_course_id,
    'Session 4: Live Session Recording',
    'Final session recording with complete project build, best practices, and extended Q&A.',
    'recording',
    'https://your-storage-bucket.com/vibe-coding/session-4-recording.mp4',
    7200,
    false,
    15
  );

  -- Session 4: Complete Project
  INSERT INTO public.course_materials (
    course_id,
    title,
    description,
    material_type,
    file_url,
    is_active,
    sort_order
  ) VALUES (
    v_course_id,
    'Session 4: Complete Project Repository',
    'Full source code of the project built in Session 4. Includes: Complete codebase, AI prompts used, Commit history showing AI-assisted development, README with workflow explanation, Deployment instructions.',
    'other',
    'https://github.com/aiborg-ai/vibe-coding-final-project',
    true,
    16
  );

  -- =====================================================
  -- BONUS MATERIALS
  -- =====================================================

  -- Bonus: Course Completion Certificate Template
  INSERT INTO public.course_materials (
    course_id,
    title,
    description,
    material_type,
    file_url,
    is_active,
    sort_order
  ) VALUES (
    v_course_id,
    'Vibe Coding: Certificate of Completion',
    'Official certificate template for course graduates. Verify your completion of all 4 sessions and showcase your AI-powered development skills.',
    'other',
    'https://your-storage-bucket.com/vibe-coding/certificate-template.pdf',
    true,
    17
  );

  -- Bonus: Resource List
  INSERT INTO public.course_materials (
    course_id,
    title,
    description,
    material_type,
    file_url,
    is_active,
    sort_order
  ) VALUES (
    v_course_id,
    'Additional Resources & Community Links',
    'Curated list of: Official documentation links, Community forums and Discord, YouTube channels and tutorials, Blog posts and articles, Newsletter recommendations, Career resources, Tool comparisons and alternatives.',
    'other',
    'https://your-storage-bucket.com/vibe-coding/resources.pdf',
    true,
    18
  );

  RAISE NOTICE 'Successfully created % course materials for Vibe Coding course', 18;

END $$;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify materials were created:
-- SELECT
--   cm.title,
--   cm.material_type,
--   cm.is_active,
--   c.title as course_title
-- FROM public.course_materials cm
-- JOIN public.courses c ON c.id = cm.course_id
-- WHERE c.title LIKE 'Vibe Coding%'
-- ORDER BY cm.sort_order;
