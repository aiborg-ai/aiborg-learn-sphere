-- First drop the old constraint
ALTER TABLE public.courses DROP CONSTRAINT courses_audience_check;

-- Update audience values in courses table to match hero section names  
UPDATE public.courses SET audience = 'Young Learners' WHERE audience = 'Primary';
UPDATE public.courses SET audience = 'Teenagers' WHERE audience = 'Secondary'; 
UPDATE public.courses SET audience = 'Professionals' WHERE audience = 'Professional';
UPDATE public.courses SET audience = 'SMEs' WHERE audience = 'Business';

-- Add the new constraint with updated names
ALTER TABLE public.courses ADD CONSTRAINT courses_audience_check 
CHECK (audience IN ('Young Learners', 'Teenagers', 'Professionals', 'SMEs'));