-- Insert sample upcoming events to populate the home page
-- All events are set as active, visible, and not past

INSERT INTO public.events (
  title,
  description,
  location,
  event_date,
  start_time,
  end_time,
  price,
  activities,
  category,
  max_capacity,
  current_registrations,
  is_active,
  is_visible,
  is_past
) VALUES
-- Event 1: AI Networking Mixer - Next Month
(
  'AI Innovators Networking Mixer',
  'Join fellow AI enthusiasts, entrepreneurs, and professionals for an evening of networking and knowledge sharing. Connect with like-minded individuals, discuss the latest AI trends, and explore collaboration opportunities. Light refreshments provided.',
  'The AI Hub, 123 Tech Street, London, EC2A 4NE',
  '2025-11-15',
  '18:00:00',
  '21:00:00',
  0,
  ARRAY['Networking', 'Panel Discussion', 'Lightning Talks', 'Drinks & Canapés'],
  'Networking',
  80,
  0,
  true,
  true,
  false
),

-- Event 2: AI Workshop - Prompt Engineering
(
  'Prompt Engineering Masterclass',
  'Learn the art and science of effective prompt engineering. This hands-on workshop will teach you advanced techniques for getting the best results from AI language models. Suitable for professionals looking to enhance their AI productivity.',
  'Aiborg Training Centre, 45 Innovation Way, London, W1F 9TB',
  '2025-11-22',
  '10:00:00',
  '16:00:00',
  49,
  ARRAY['Hands-on Workshop', 'Live Demonstrations', 'Practice Sessions', 'Lunch Included'],
  'Workshop',
  30,
  0,
  true,
  true,
  false
),

-- Event 3: AI Ethics Roundtable
(
  'AI Ethics & Responsibility Roundtable',
  'An engaging discussion on the ethical implications of AI technology. Join industry leaders, academics, and policymakers as we explore responsible AI development, bias mitigation, and the future of AI governance.',
  'The Ethics Center, 89 Wisdom Road, London, WC2H 9JQ',
  '2025-12-05',
  '14:00:00',
  '17:00:00',
  0,
  ARRAY['Panel Discussion', 'Q&A Session', 'Networking', 'Afternoon Tea'],
  'Conference',
  50,
  0,
  true,
  true,
  false
),

-- Event 4: Family AI Day
(
  'Family AI Discovery Day',
  'A fun-filled day for the whole family to explore AI! Interactive demos, hands-on activities for kids, and parent sessions on AI literacy. Perfect for families wanting to understand AI together. All ages welcome!',
  'Science Museum, Exhibition Road, South Kensington, London, SW7 2DD',
  '2025-12-14',
  '10:00:00',
  '15:00:00',
  15,
  ARRAY['Interactive Demos', 'Kids Activities', 'Parent Workshops', 'AI Robotics Show'],
  'Family Event',
  100,
  0,
  true,
  true,
  false
),

-- Event 5: Business AI Strategy Summit
(
  'SME AI Transformation Summit',
  'Designed specifically for small and medium enterprises looking to leverage AI. Learn practical strategies for AI adoption, hear success stories from fellow business owners, and discover affordable AI solutions for your business.',
  'Business Innovation Centre, 67 Enterprise Plaza, London, E14 5AB',
  '2026-01-10',
  '09:00:00',
  '17:00:00',
  99,
  ARRAY['Keynote Speeches', 'Case Studies', 'Breakout Sessions', 'Networking Lunch', 'Vendor Showcase'],
  'Conference',
  120,
  0,
  true,
  true,
  false
),

-- Event 6: AI Careers Fair
(
  'AI Careers & Opportunities Fair',
  'Explore career opportunities in the AI industry. Meet with recruiters from leading tech companies, attend career workshops, get your CV reviewed, and learn about the skills needed for AI careers. Free for students and job seekers.',
  'Tech Career Hub, 156 Future Lane, London, N1 9GU',
  '2026-01-25',
  '11:00:00',
  '18:00:00',
  0,
  ARRAY['Company Booths', 'CV Reviews', 'Career Workshops', 'Mock Interviews', '1-on-1 Mentoring'],
  'Career Fair',
  200,
  0,
  true,
  true,
  false
),

-- Event 7: Monthly AI Coding Bootcamp
(
  'Weekend AI Coding Bootcamp',
  'Intensive 2-day coding bootcamp focused on building AI applications. Learn to work with popular AI frameworks, build your own AI projects, and deploy machine learning models. Basic Python knowledge required.',
  'CodeSpace London, 234 Developer Avenue, London, EC1V 2NX',
  '2026-02-07',
  '09:00:00',
  '18:00:00',
  199,
  ARRAY['Hands-on Coding', 'Project Building', 'Mentorship', 'Meals Included', 'Certificate'],
  'Bootcamp',
  25,
  0,
  true,
  true,
  false
),

-- Event 8: AI & Art Exhibition
(
  'AI-Generated Art Exhibition & Gallery Opening',
  'Experience the intersection of AI and creativity! View stunning AI-generated artwork, meet the artists, and participate in interactive AI art creation sessions. Wine and cheese reception included.',
  'Contemporary Art Gallery, 78 Creative Square, London, W11 2BQ',
  '2026-02-20',
  '17:00:00',
  '21:00:00',
  25,
  ARRAY['Art Exhibition', 'Artist Talks', 'Interactive Sessions', 'Wine & Cheese Reception'],
  'Exhibition',
  150,
  0,
  true,
  true,
  false
);

-- Add a comment for documentation
COMMENT ON TABLE public.events IS 'Sample upcoming events have been added for demonstration purposes';
