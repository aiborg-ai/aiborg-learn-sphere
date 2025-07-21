-- Create courses table for CMS management
CREATE TABLE public.courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  audience TEXT NOT NULL CHECK (audience IN ('Primary', 'Secondary', 'Professional', 'Business')),
  mode TEXT NOT NULL DEFAULT 'Online',
  duration TEXT NOT NULL,
  price TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  start_date TEXT NOT NULL,
  features TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  prerequisites TEXT DEFAULT 'None',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read courses (public data)
CREATE POLICY "Anyone can view active courses" 
ON public.courses 
FOR SELECT 
USING (is_active = true);

-- Create policy for admins to manage courses (you can update this later with proper admin roles)
CREATE POLICY "Allow all operations for development" 
ON public.courses 
FOR ALL 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert existing course data
INSERT INTO public.courses (title, description, audience, mode, duration, price, level, start_date, features, category, keywords, prerequisites, sort_order) VALUES

-- Primary School Courses (1-25)
('Kickstarter AI Adventures', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', '4th August', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'AI Fundamentals', ARRAY['games', 'robots', 'ethics'], 'None', 1),

('Ethical AI for Young Minds', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', 'Enquire for start date', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'Ethics & Safety', ARRAY['games', 'robots', 'ethics'], 'None', 2),

('Creative Robots Coding Jam', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', 'Enquire for start date', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'Creative AI', ARRAY['games', 'robots', 'ethics'], 'None', 3),

('AI Storytellers'' Studio', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', 'Enquire for start date', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'Creative AI', ARRAY['games', 'robots', 'ethics'], 'None', 4),

('My First Neural Network', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', 'Enquire for start date', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'AI Fundamentals', ARRAY['games', 'robots', 'ethics'], 'None', 5),

('Smart Sensors & Toy Bots', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', 'Enquire for start date', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'Robotics', ARRAY['games', 'robots', 'ethics'], 'None', 6),

('AI Heroes & Villains', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', 'Enquire for start date', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'Ethics & Safety', ARRAY['games', 'robots', 'ethics'], 'None', 7),

('Machine Music Makers', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', 'Enquire for start date', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'Creative AI', ARRAY['games', 'robots', 'ethics'], 'None', 8),

('Picture Perfect AI', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', 'Enquire for start date', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'Computer Vision', ARRAY['games', 'robots', 'ethics'], 'None', 9),

('Data Detectives', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', 'Enquire for start date', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'Data Science', ARRAY['games', 'robots', 'ethics'], 'None', 10),

('Chatbot Buddies', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', 'Enquire for start date', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'Conversational AI', ARRAY['games', 'robots', 'ethics'], 'None', 11),

('AR Treasure Hunt AI', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', 'Enquire for start date', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'AR/VR', ARRAY['games', 'robots', 'ethics'], 'None', 12),

('AI & Planet Earth', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', 'Enquire for start date', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'Environmental AI', ARRAY['games', 'robots', 'ethics'], 'None', 13),

('Learning with RoboPets', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', 'Enquire for start date', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'Robotics', ARRAY['games', 'robots', 'ethics'], 'None', 14),

('Code a Talking Turtle', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', 'Enquire for start date', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'Programming', ARRAY['games', 'robots', 'ethics'], 'None', 15),

('AI Math Magic', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', 'Enquire for start date', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'Mathematics', ARRAY['games', 'robots', 'ethics'], 'None', 16),

('Virtual Zoo Keepers', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', 'Enquire for start date', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'Simulation', ARRAY['games', 'robots', 'ethics'], 'None', 17),

('Language Translator Fun', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', 'Enquire for start date', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'Language Processing', ARRAY['games', 'robots', 'ethics'], 'None', 18),

('Art with Algorithms', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', 'Enquire for start date', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'Creative AI', ARRAY['games', 'robots', 'ethics'], 'None', 19),

('AI Weather Wizards', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', 'Enquire for start date', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'Prediction', ARRAY['games', 'robots', 'ethics'], 'None', 20),

('Digital Safety with AI', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', 'Enquire for start date', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'Cybersecurity', ARRAY['games', 'robots', 'ethics'], 'None', 21),

('AI & Healthy Habits', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', 'Enquire for start date', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'Health Tech', ARRAY['games', 'robots', 'ethics'], 'None', 22),

('Junior Cyber Detectives', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', 'Enquire for start date', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'Cybersecurity', ARRAY['games', 'robots', 'ethics'], 'None', 23),

('Build a Voice Assistant Jr.', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', 'Enquire for start date', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'Voice AI', ARRAY['games', 'robots', 'ethics'], 'None', 24),

('Robo-Rescue Missions', 'Fun, hands-on intro to AI concepts with creative projects.', 'Primary', 'Online', '4 weeks', '£49', 'Beginner', 'Enquire for start date', ARRAY['What is AI?', 'Train a mini model', 'Build & test project', 'Showcase & ethics'], 'Robotics', ARRAY['games', 'robots', 'ethics'], 'None', 25),

-- Secondary School Courses (26-50)
('Ultimate Academic Advantage by AI', 'Build industry-aligned AI skills and showcase portfolio pieces.', 'Secondary', 'Online', '6 weeks', '£49', 'Intermediate', '4th August', ARRAY['Data & ML crash-course', 'Model building hands-on', 'Deployment & apps', 'Ethics & career paths'], 'Academic Enhancement', ARRAY['python', 'ml', 'projects'], 'None', 26),

('Teen Machine Learning Bootcamp', 'Build industry-aligned AI skills and showcase portfolio pieces.', 'Secondary', 'Online', '6 weeks', '£49', 'Intermediate', 'Enquire for start date', ARRAY['Data & ML crash-course', 'Model building hands-on', 'Deployment & apps', 'Ethics & career paths'], 'Machine Learning', ARRAY['python', 'ml', 'projects'], 'None', 27);

-- I'll continue with the remaining courses in the next part due to the large dataset