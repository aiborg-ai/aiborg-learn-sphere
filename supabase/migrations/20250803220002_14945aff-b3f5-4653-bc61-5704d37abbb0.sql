-- Fix the foreign key relationship between reviews and courses
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES public.courses(id) 
ON DELETE CASCADE;