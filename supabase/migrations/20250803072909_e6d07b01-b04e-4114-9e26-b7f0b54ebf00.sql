-- Drop the unique constraint on section_name and recreate CMS content table properly
DROP TABLE IF EXISTS public.cms_content CASCADE;

-- Create CMS content table
CREATE TABLE public.cms_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_name TEXT NOT NULL,
  content_key TEXT NOT NULL,
  content_value TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'html', 'json', 'image_url')),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(section_name, content_key)
);

-- Enable RLS for CMS
ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;

-- Create policies for CMS content
CREATE POLICY "Anyone can view active content" 
ON public.cms_content 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all content" 
ON public.cms_content 
FOR ALL 
USING (auth.uid() IN (
  SELECT user_id FROM profiles WHERE role = 'admin'
));

-- Insert initial CMS content
INSERT INTO public.cms_content (section_name, content_key, content_value, content_type, description) VALUES
('hero', 'title', 'Transform Your Future with AI Education', 'text', 'Main hero section title'),
('hero', 'subtitle', 'Master the most in-demand technology skills with our comprehensive AI training programs designed for all ages and expertise levels.', 'text', 'Hero section subtitle'),
('about', 'title', 'About Aiborg™', 'text', 'About section title'),
('about', 'description', 'We are pioneers in AI education, committed to making artificial intelligence accessible to everyone through innovative learning experiences.', 'text', 'About section description'),
('contact', 'email', 'hirendra.vikram@aiborg.ai', 'text', 'Contact email address'),
('contact', 'phone', '+44 7404568207', 'text', 'WhatsApp contact number'),
('announcements', 'ticker_text', '🚀 New AI Courses Available Now! • 📚 Join 5,000+ Learners Worldwide • 🎯 Industry-Leading Curriculum • 💡 Transform Your Career Today', 'text', 'Announcement ticker text');