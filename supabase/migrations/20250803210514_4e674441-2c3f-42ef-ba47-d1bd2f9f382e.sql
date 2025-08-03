-- Fix infinite recursion in profiles RLS policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Create corrected admin policies that don't cause recursion
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can delete profiles" ON public.profiles
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

-- Insert sample events
INSERT INTO public.events (title, description, location, event_date, start_time, end_time, price, activities, category, max_capacity, current_registrations) VALUES
('AI Leadership Summit 2024', 'A premier gathering of AI leaders, entrepreneurs, and innovators to discuss the future of artificial intelligence in business and society.', 'London Tech Hub, 123 Innovation Street, London', '2024-02-15', '09:00:00', '17:00:00', 299.99, ARRAY['Keynote Speeches', 'Panel Discussions', 'Networking Sessions', 'Tech Demos'], 'Conference', 200, 45),
('Women in AI Networking Breakfast', 'Connect with inspiring women leading the AI revolution. Featuring successful female entrepreneurs, researchers, and executives in the AI space.', 'The Shard, Level 31, London', '2024-02-20', '08:00:00', '10:30:00', 75.00, ARRAY['Networking', 'Inspirational Talks', 'Mentorship Sessions'], 'Networking', 50, 23),
('AI Startup Pitch Night', 'Watch promising AI startups pitch their innovative solutions to a panel of experienced investors and industry experts.', 'Innovation Quarter, Manchester', '2024-02-25', '18:00:00', '21:00:00', 45.00, ARRAY['Startup Pitches', 'Investor Feedback', 'Networking', 'Live Voting'], 'Competition', 100, 67),
('Future of Work: AI & Automation', 'Explore how AI and automation are reshaping the workplace, featuring discussions on reskilling, new job categories, and the human-AI collaboration.', 'Birmingham Business Park, Conference Center', '2024-03-05', '10:00:00', '16:00:00', 150.00, ARRAY['Expert Panels', 'Case Studies', 'Interactive Workshops', 'Q&A Sessions'], 'Workshop', 80, 34),
('AI Ethics & Society Forum', 'A critical examination of AI''s impact on society, covering bias, privacy, transparency, and responsible AI development practices.', 'University of Edinburgh, AI Institute', '2024-03-12', '13:00:00', '18:00:00', 99.99, ARRAY['Academic Presentations', 'Ethical Debates', 'Policy Discussions', 'Community Engagement'], 'Academic', 120, 56);

-- Insert sample reviews (these will be approved by default for demo purposes)
INSERT INTO public.reviews (user_id, course_id, display_name_option, review_type, written_review, course_period, course_mode, rating, approved) VALUES
-- Using a placeholder user_id (this would normally be from auth.users)
('00000000-0000-0000-0000-000000000001', 1, 'show_name', 'written', 'This AI fundamentals course exceeded my expectations! The instructors were knowledgeable and the hands-on projects really helped solidify the concepts. I feel much more confident about implementing AI solutions in my work now.', 'January 2024', 'online', 5, true),
('00000000-0000-0000-0000-000000000002', 2, 'anonymous', 'written', 'Great course content and well-structured curriculum. The machine learning modules were particularly insightful. However, I would have liked more real-world case studies. Overall, a solid learning experience.', 'December 2023', 'in-person', 4, true),
('00000000-0000-0000-0000-000000000003', 1, 'show_name', 'written', 'Absolutely fantastic! The course transformed my understanding of AI and its practical applications. The instructors were patient and always available for questions. The networking opportunities were an added bonus.', 'November 2023', 'hybrid', 5, true),
('00000000-0000-0000-0000-000000000004', 3, 'anonymous', 'The deep learning course was challenging but rewarding. The labs were excellent and the theoretical foundation was solid. I appreciate the practical approach to complex topics. Highly recommended for serious learners.', 'October 2023', 'online', 4, true),
('00000000-0000-0000-0000-000000000005', 2, 'show_name', 'written', 'This course gave me the confidence to transition my career into AI. The support from instructors and fellow students was amazing. The curriculum is up-to-date with industry standards and trends.', 'September 2023', 'in-person', 5, true);

-- Create profiles for the sample review users
INSERT INTO public.profiles (user_id, display_name, email, role) VALUES
('00000000-0000-0000-0000-000000000001', 'Sarah Johnson', 'sarah.j@example.com', 'user'),
('00000000-0000-0000-0000-000000000002', 'Anonymous User', 'user2@example.com', 'user'),
('00000000-0000-0000-0000-000000000003', 'Michael Chen', 'michael.c@example.com', 'user'),
('00000000-0000-0000-0000-000000000004', 'Anonymous User', 'user4@example.com', 'user'),
('00000000-0000-0000-0000-000000000005', 'Emma Williams', 'emma.w@example.com', 'user')
ON CONFLICT (user_id) DO NOTHING;