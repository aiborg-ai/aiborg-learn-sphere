-- Update pricing for SMEs and Professionals to £69
UPDATE public.courses 
SET price = '£69'
WHERE audience IN ('SMEs', 'Professionals');

-- Update pricing for Young Learners and Teenagers to £49
UPDATE public.courses 
SET price = '£49'
WHERE audience IN ('Young Learners', 'Teenagers');

-- Update all course start dates to 15 Oct 2025
UPDATE public.courses 
SET start_date = '15 Oct 2025';