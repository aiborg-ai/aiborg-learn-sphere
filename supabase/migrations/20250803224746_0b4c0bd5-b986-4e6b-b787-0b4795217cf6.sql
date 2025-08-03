-- Add foreign key constraint between reviews and profiles
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key constraint between reviews and courses  
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;