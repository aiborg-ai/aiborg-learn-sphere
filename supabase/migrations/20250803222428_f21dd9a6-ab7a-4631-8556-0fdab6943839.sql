-- Create course_materials table for recordings, handbooks, and presentations
CREATE TABLE public.course_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  material_type TEXT NOT NULL CHECK (material_type IN ('recording', 'handbook', 'presentation', 'other')),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  duration INTEGER, -- for recordings in seconds
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;

-- Create policies for course materials
-- Only enrolled users can view materials for their enrolled courses
CREATE POLICY "Enrolled users can view course materials" 
ON public.course_materials 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE enrollments.course_id = course_materials.course_id 
    AND enrollments.user_id = auth.uid()
    AND enrollments.payment_status = 'completed'
  )
);

-- Admins can manage all materials
CREATE POLICY "Admins can manage course materials" 
ON public.course_materials 
FOR ALL 
USING (auth.uid() IN ( SELECT profiles.user_id FROM profiles WHERE profiles.role = 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_course_materials_updated_at
BEFORE UPDATE ON public.course_materials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add sample recordings for existing courses
INSERT INTO public.course_materials (course_id, title, description, material_type, file_url, duration, sort_order) VALUES
(1, 'Introduction to AI Fundamentals', 'Welcome session covering AI basics and course overview', 'recording', 'https://example.com/recordings/ai-intro.mp4', 3600, 1),
(1, 'Machine Learning Essentials', 'Deep dive into ML concepts and practical applications', 'recording', 'https://example.com/recordings/ml-essentials.mp4', 4200, 2),
(1, 'AI Course Handbook', 'Complete course materials and reference guide', 'handbook', 'https://example.com/materials/ai-handbook.pdf', null, 3),
(2, 'Ethics in AI Development', 'Understanding ethical considerations in AI implementation', 'recording', 'https://example.com/recordings/ai-ethics.mp4', 2700, 1),
(2, 'AI Implementation Guide', 'Step-by-step guide for implementing AI solutions', 'handbook', 'https://example.com/materials/implementation-guide.pdf', null, 2);