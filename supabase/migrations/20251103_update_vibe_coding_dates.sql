-- Update Vibe Coding Course with November 2025 Session Dates
-- Created: 2025-11-03
-- Sessions: 8 Nov, 15 Nov, 22 Nov, 29 Nov from 7 PM onwards (Online)

UPDATE public.courses
SET
  description = 'Master modern AI-powered development tools in this hands-on professional course. Learn to leverage Claude Code, ChatGPT, GitHub Copilot, and more to supercharge your coding workflow. Sessions: 8 November, 15 November, 22 November, and 29 November from 7 PM onwards (Online). Perfect for developers looking to stay ahead in the AI-augmented development landscape. FREE for Family Pass holders!',
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
  start_date = '8 November 2025',
  mode = 'Online',
  updated_at = NOW()
WHERE title LIKE 'Vibe Coding%';
