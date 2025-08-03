-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  display_name_option TEXT NOT NULL CHECK (display_name_option IN ('show_name', 'anonymous')),
  review_type TEXT NOT NULL CHECK (review_type IN ('written', 'voice', 'video')),
  written_review TEXT,
  voice_review_url TEXT,
  video_review_url TEXT,
  course_period TEXT NOT NULL,
  course_mode TEXT NOT NULL CHECK (course_mode IN ('online', 'in-person', 'hybrid')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for reviews
CREATE POLICY "Anyone can view approved reviews" 
ON public.reviews 
FOR SELECT 
USING (is_approved = true);

CREATE POLICY "Users can view their own reviews" 
ON public.reviews 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reviews" 
ON public.reviews 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" 
ON public.reviews 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" 
ON public.reviews 
FOR ALL 
USING (auth.uid() IN (
  SELECT user_id FROM profiles WHERE role = 'admin'
));

-- Create CMS content table
CREATE TABLE public.cms_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_name TEXT NOT NULL UNIQUE,
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

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  event_registration_id UUID REFERENCES public.event_registrations(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  item_type TEXT NOT NULL CHECK (item_type IN ('course', 'event')),
  item_id INTEGER NOT NULL,
  item_title TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  payment_status TEXT NOT NULL DEFAULT 'paid',
  issued_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for invoices
CREATE POLICY "Users can view their own invoices" 
ON public.invoices 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create invoices" 
ON public.invoices 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage all invoices" 
ON public.invoices 
FOR ALL 
USING (auth.uid() IN (
  SELECT user_id FROM profiles WHERE role = 'admin'
));

-- Create function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_part TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  sequence_part := LPAD((
    SELECT COALESCE(MAX(
      CAST(SUBSTRING(invoice_number FROM 6) AS INTEGER)
    ), 0) + 1
    FROM public.invoices 
    WHERE invoice_number LIKE year_part || '-%'
  )::TEXT, 4, '0');
  
  RETURN year_part || '-' || sequence_part;
END;
$$ LANGUAGE plpgsql;

-- Insert initial CMS content
INSERT INTO public.cms_content (section_name, content_key, content_value, content_type, description) VALUES
('hero', 'title', 'Transform Your Future with AI Education', 'text', 'Main hero section title'),
('hero', 'subtitle', 'Master the most in-demand technology skills with our comprehensive AI training programs designed for all ages and expertise levels.', 'text', 'Hero section subtitle'),
('about', 'title', 'About Aiborg™', 'text', 'About section title'),
('about', 'description', 'We are pioneers in AI education, committed to making artificial intelligence accessible to everyone through innovative learning experiences.', 'text', 'About section description'),
('contact', 'email', 'hirendra.vikram@aiborg.ai', 'text', 'Contact email address'),
('contact', 'phone', '+44 7404568207', 'text', 'WhatsApp contact number'),
('announcements', 'ticker_text', '🚀 New AI Courses Available Now! • 📚 Join 5,000+ Learners Worldwide • 🎯 Industry-Leading Curriculum • 💡 Transform Your Career Today', 'text', 'Announcement ticker text');