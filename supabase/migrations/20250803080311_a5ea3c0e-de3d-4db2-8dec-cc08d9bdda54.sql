-- Create reviews table for course reviews with admin approval
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id INTEGER,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_type TEXT NOT NULL DEFAULT 'written' CHECK (review_type IN ('written', 'voice', 'video')),
  written_review TEXT,
  voice_review_url TEXT,
  video_review_url TEXT,
  course_period TEXT,
  course_mode TEXT,
  display_name_option TEXT NOT NULL DEFAULT 'full_name' CHECK (display_name_option IN ('full_name', 'first_name', 'anonymous')),
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for reviews
CREATE POLICY "Users can view approved reviews" 
ON public.reviews 
FOR SELECT 
USING (approved = true);

CREATE POLICY "Users can create their own reviews" 
ON public.reviews 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reviews" 
ON public.reviews 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" 
ON public.reviews 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert 4 more events
INSERT INTO public.events (title, description, location, event_date, start_time, end_time, price, activities, category, max_capacity) VALUES
('AI Leadership Summit 2024', 'Join industry leaders and visionaries for an exclusive summit on the future of AI leadership. Network with C-level executives, investors, and pioneers shaping the AI landscape.', 'The Shard, London', '2024-03-15', '09:00:00', '18:00:00', 299.00, ARRAY['Keynote Speeches', 'Panel Discussions', 'Executive Networking', 'Innovation Showcase'], 'Professional Development', 150),
('Women in AI Networking Breakfast', 'An empowering breakfast event celebrating women making waves in artificial intelligence. Connect with female leaders, entrepreneurs, and innovators in an intimate setting.', 'Canary Wharf, London', '2024-02-28', '08:00:00', '11:00:00', 75.00, ARRAY['Networking Breakfast', 'Inspiring Talks', 'Mentorship Speed Dating', 'Career Guidance'], 'Networking', 80),
('AI Startup Pitch Night', 'Watch the next generation of AI startups pitch their groundbreaking ideas to a panel of investors and industry experts. Open networking follows the presentations.', 'Tech Hub, Shoreditch', '2024-04-10', '18:30:00', '22:00:00', 45.00, ARRAY['Startup Pitches', 'Investor Panel', 'Networking Drinks', 'Demo Stations'], 'Startup', 200),
('Future of Work: AI & Automation', 'Explore how AI and automation are reshaping the workplace. Join discussions on the skills of tomorrow, ethical AI implementation, and preparing for the future workforce.', 'King''s Cross, London', '2024-05-22', '14:00:00', '19:00:00', 120.00, ARRAY['Expert Panels', 'Workshops', 'Skills Assessment', 'Career Fair'], 'Professional Development', 120),
('AI Ethics & Society Forum', 'A thoughtful exploration of AI''s impact on society, privacy, and ethics. Engage with ethicists, policymakers, and technologists in meaningful dialogue about responsible AI.', 'Imperial College London', '2024-06-08', '10:00:00', '17:00:00', 89.00, ARRAY['Ethics Debates', 'Policy Discussions', 'Academic Presentations', 'Think Tank Sessions'], 'Academic', 100);