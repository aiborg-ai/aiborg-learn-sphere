-- Update Vibe Coding Course Material URLs
-- Run this after materials are uploaded to actual storage

-- Update file URLs to use a more realistic placeholder or actual URLs
-- Replace 'your-storage-bucket.com' with actual storage domain

-- Session 1 Materials
UPDATE public.course_materials
SET file_url = 'https://storage.aiborg.ai/vibe-coding/session-1-handbook.pdf'
WHERE course_id = 807
  AND title LIKE '%Session 1%Handbook%';

UPDATE public.course_materials
SET file_url = 'https://storage.aiborg.ai/vibe-coding/session-1-slides.pdf'
WHERE course_id = 807
  AND title LIKE '%Session 1%Slides%';

UPDATE public.course_materials
SET file_url = 'https://storage.aiborg.ai/vibe-coding/session-1-recording.mp4'
WHERE course_id = 807
  AND title LIKE '%Session 1%Recording%';

UPDATE public.course_materials
SET file_url = 'https://storage.aiborg.ai/vibe-coding/session-1-quick-ref.pdf'
WHERE course_id = 807
  AND title LIKE '%Session 1%Quick Reference%';

-- Session 2 Materials
UPDATE public.course_materials
SET file_url = 'https://storage.aiborg.ai/vibe-coding/session-2-handbook.pdf'
WHERE course_id = 807
  AND title LIKE '%Session 2%Handbook%';

UPDATE public.course_materials
SET file_url = 'https://storage.aiborg.ai/vibe-coding/session-2-slides.pdf'
WHERE course_id = 807
  AND title LIKE '%Session 2%Slides%';

UPDATE public.course_materials
SET file_url = 'https://storage.aiborg.ai/vibe-coding/session-2-recording.mp4'
WHERE course_id = 807
  AND title LIKE '%Session 2%Recording%';

UPDATE public.course_materials
SET file_url = 'https://github.com/aiborg-ai/vibe-coding-examples'
WHERE course_id = 807
  AND title LIKE '%Session 2%Examples%';

-- Session 3 Materials
UPDATE public.course_materials
SET file_url = 'https://storage.aiborg.ai/vibe-coding/session-3-handbook.pdf'
WHERE course_id = 807
  AND title LIKE '%Session 3%Handbook%';

UPDATE public.course_materials
SET file_url = 'https://storage.aiborg.ai/vibe-coding/session-3-slides.pdf'
WHERE course_id = 807
  AND title LIKE '%Session 3%Slides%';

UPDATE public.course_materials
SET file_url = 'https://storage.aiborg.ai/vibe-coding/session-3-recording.mp4'
WHERE course_id = 807
  AND title LIKE '%Session 3%Recording%';

UPDATE public.course_materials
SET file_url = 'https://storage.aiborg.ai/vibe-coding/session-3-prompt-library.pdf'
WHERE course_id = 807
  AND title LIKE '%Session 3%Prompt Library%';

-- Session 4 Materials
UPDATE public.course_materials
SET file_url = 'https://storage.aiborg.ai/vibe-coding/session-4-handbook.pdf'
WHERE course_id = 807
  AND title LIKE '%Session 4%Handbook%';

UPDATE public.course_materials
SET file_url = 'https://storage.aiborg.ai/vibe-coding/session-4-slides.pdf'
WHERE course_id = 807
  AND title LIKE '%Session 4%Slides%';

UPDATE public.course_materials
SET file_url = 'https://storage.aiborg.ai/vibe-coding/session-4-recording.mp4'
WHERE course_id = 807
  AND title LIKE '%Session 4%Recording%';

UPDATE public.course_materials
SET file_url = 'https://github.com/aiborg-ai/vibe-coding-project'
WHERE course_id = 807
  AND title LIKE '%Session 4%Project Repository%';

-- Bonus Materials
UPDATE public.course_materials
SET file_url = 'https://storage.aiborg.ai/vibe-coding/certificate-template.pdf'
WHERE course_id = 807
  AND title LIKE '%Certificate%';

UPDATE public.course_materials
SET file_url = 'https://storage.aiborg.ai/vibe-coding/resources.pdf'
WHERE course_id = 807
  AND title LIKE '%Additional Resources%';

-- Verify updates
SELECT
  id,
  title,
  material_type,
  file_url,
  is_active
FROM public.course_materials
WHERE course_id = 807
ORDER BY sort_order;
