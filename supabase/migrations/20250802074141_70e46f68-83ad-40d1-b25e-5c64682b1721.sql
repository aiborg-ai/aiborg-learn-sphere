-- Update all courses to have duration "6 hrs/4 sessions"
UPDATE public.courses SET duration = '6 hrs/4 sessions' WHERE is_active = true;