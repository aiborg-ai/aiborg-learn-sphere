-- Update start dates for August 8th programs
UPDATE public.courses 
SET start_date = '8 Aug 2025'
WHERE title IN (
  'Kickstarter AI Adventures',
  'Ultimate Academic Advantage by AI', 
  'Digital Transformation with AI',
  'AI Opportunity Assessment',
  'AI product development'
);

-- Update start dates for August 15th programs  
UPDATE public.courses
SET start_date = '15 Aug 2025'
WHERE title IN (
  'AI Storyteller''s Studio',
  'Code Your Own ChatGPT', 
  'AI Team Training Program'
);