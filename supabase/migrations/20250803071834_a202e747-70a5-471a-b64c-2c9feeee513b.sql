-- Insert 100 additional courses for each audience type
-- Young Learners courses (100 new)
INSERT INTO courses (title, description, audience, mode, duration, price, level, start_date, features, category, keywords, prerequisites, sort_order) VALUES
('AI Art Creation Lab', 'Create amazing digital art using AI tools and unleash your creativity', 'Young Learners', 'Online', '4 hrs/3 sessions', '£25', 'Beginner', '22 Aug 2025', '{"Introduction to AI art", "Creative expression", "Digital portfolio", "Fun showcase"}', 'Creativity', '{"art", "creativity", "digital"}', 'None', 1001),
('Robot Friend Builder', 'Design and program your very own virtual robot companion', 'Young Learners', 'Online', '5 hrs/4 sessions', '£30', 'Beginner', '29 Aug 2025', '{"Robot design", "Basic programming", "Personality creation", "Interactive play"}', 'Robotics', '{"robots", "programming", "fun"}', 'None', 1002),
('Magic Story Generator', 'Use AI to create enchanting stories and magical adventures', 'Young Learners', 'Online', '4 hrs/3 sessions', '£25', 'Beginner', '5 Sep 2025', '{"Story creation", "Character development", "AI writing tools", "Creative sharing"}', 'Creative Writing', '{"stories", "writing", "imagination"}', 'None', 1003),
('Space Explorer AI', 'Journey through space with AI as your co-pilot and learn about planets', 'Young Learners', 'Online', '6 hrs/4 sessions', '£35', 'Beginner', '12 Sep 2025', '{"Space exploration", "AI navigation", "Planet discovery", "Mission planning"}', 'Science', '{"space", "exploration", "science"}', 'None', 1004),
('Animal Kingdom AI', 'Discover how AI helps us understand and protect animals', 'Young Learners', 'Online', '4 hrs/3 sessions', '£25', 'Beginner', '19 Sep 2025', '{"Animal recognition", "Conservation AI", "Wildlife tracking", "Fun facts"}', 'Nature', '{"animals", "nature", "conservation"}', 'None', 1005),
('Music Maker AI', 'Compose your own songs and melodies with AI assistance', 'Young Learners', 'Online', '5 hrs/4 sessions', '£30', 'Beginner', '26 Sep 2025', '{"Music composition", "AI instruments", "Rhythm creation", "Performance sharing"}', 'Music', '{"music", "composition", "creativity"}', 'None', 1006),
('Weather Wizard AI', 'Predict weather patterns and understand climate with AI', 'Young Learners', 'Online', '4 hrs/3 sessions', '£25', 'Beginner', '3 Oct 2025', '{"Weather prediction", "Climate understanding", "Data visualization", "Science exploration"}', 'Science', '{"weather", "climate", "science"}', 'None', 1007),
('Game Designer Junior', 'Create simple games using AI tools and your imagination', 'Young Learners', 'Online', '6 hrs/5 sessions', '£40', 'Beginner', '10 Oct 2025', '{"Game design", "AI assistance", "Creative development", "Playtest sharing"}', 'Gaming', '{"games", "design", "creativity"}', 'None', 1008),
('Virtual Pet Academy', 'Raise and train digital pets using AI behavior systems', 'Young Learners', 'Online', '5 hrs/4 sessions', '£30', 'Beginner', '17 Oct 2025', '{"Pet care simulation", "AI behavior", "Training games", "Responsibility learning"}', 'Simulation', '{"pets", "simulation", "care"}', 'None', 1009),
('Smart Home Helper', 'Learn how AI makes homes smarter and more helpful', 'Young Learners', 'Online', '4 hrs/3 sessions', '£25', 'Beginner', '24 Oct 2025', '{"Smart devices", "Home automation", "AI assistance", "Future living"}', 'Technology', '{"smart home", "automation", "technology"}', 'None', 1010);

-- Add 90 more Young Learners courses with varied content
INSERT INTO courses (title, description, audience, mode, duration, price, level, start_date, features, category, keywords, prerequisites, sort_order) 
SELECT 
    'AI Adventure ' || generate_series || ' for Kids',
    'Exciting AI learning adventure designed for young minds to explore technology',
    'Young Learners',
    'Online',
    (ARRAY['4 hrs/3 sessions', '5 hrs/4 sessions', '6 hrs/4 sessions'])[floor(random() * 3 + 1)],
    (ARRAY['£25', '£30', '£35'])[floor(random() * 3 + 1)],
    'Beginner',
    (current_date + interval '1 week' * generate_series)::text,
    ARRAY['Interactive learning', 'Fun activities', 'Creative projects', 'Achievement badges'],
    (ARRAY['Technology', 'Creativity', 'Science', 'Gaming'])[floor(random() * 4 + 1)],
    ARRAY['kids', 'learning', 'ai', 'fun'],
    'None',
    1010 + generate_series
FROM generate_series(1, 90);

-- Teenagers courses (100 new)
INSERT INTO courses (title, description, audience, mode, duration, price, level, start_date, features, category, keywords, prerequisites, sort_order) VALUES
('AI App Development Bootcamp', 'Build real mobile apps powered by AI and machine learning', 'Teenagers', 'Online', '8 hrs/6 sessions', '£65', 'Intermediate', '22 Aug 2025', '{"Mobile development", "AI integration", "App publishing", "Portfolio building"}', 'App Development', '{"mobile", "apps", "development"}', 'Basic programming knowledge', 2001),
('Social Media AI Analytics', 'Analyze trends and create content using AI-powered insights', 'Teenagers', 'Online', '6 hrs/5 sessions', '£50', 'Intermediate', '29 Aug 2025', '{"Trend analysis", "Content creation", "AI tools", "Social strategy"}', 'Digital Marketing', '{"social media", "analytics", "trends"}', 'None', 2002),
('AI Photography Enhancement', 'Transform your photos using advanced AI editing techniques', 'Teenagers', 'Online', '5 hrs/4 sessions', '£45', 'Beginner', '5 Sep 2025', '{"Photo editing", "AI enhancement", "Style transfer", "Portfolio creation"}', 'Photography', '{"photography", "editing", "ai"}', 'None', 2003),
('Ethical AI Debate Club', 'Explore AI ethics and participate in thought-provoking discussions', 'Teenagers', 'Hybrid', '6 hrs/4 sessions', '£40', 'Intermediate', '12 Sep 2025', '{"Ethics discussion", "Critical thinking", "Debate skills", "Future implications"}', 'Ethics', '{"ethics", "debate", "society"}', 'None', 2004),
('AI Stock Market Simulator', 'Learn financial markets using AI prediction models', 'Teenagers', 'Online', '7 hrs/5 sessions', '£55', 'Intermediate', '19 Sep 2025', '{"Financial literacy", "AI predictions", "Investment simulation", "Market analysis"}', 'Finance', '{"finance", "stocks", "investing"}', 'Basic math skills', 2005),
('Video Game AI Programming', 'Create intelligent NPCs and game mechanics using AI', 'Teenagers', 'Online', '8 hrs/6 sessions', '£70', 'Advanced', '26 Sep 2025', '{"Game AI", "NPC behavior", "Pathfinding", "Game mechanics"}', 'Game Development', '{"games", "programming", "ai"}', 'Programming basics', 2006),
('AI Music Production', 'Produce professional music tracks with AI collaboration', 'Teenagers', 'Online', '6 hrs/5 sessions', '£50', 'Intermediate', '3 Oct 2025', '{"Music production", "AI composition", "Sound design", "Track sharing"}', 'Music Production', '{"music", "production", "audio"}', 'None', 2007),
('Climate Change AI Solutions', 'Use AI to understand and combat climate change', 'Teenagers', 'Hybrid', '7 hrs/5 sessions', '£45', 'Intermediate', '10 Oct 2025', '{"Climate science", "AI modeling", "Environmental solutions", "Research projects"}', 'Environmental Science', '{"climate", "environment", "science"}', 'None', 2008),
('AI Startup Incubator', 'Launch your own AI-powered startup idea', 'Teenagers', 'Hybrid', '10 hrs/8 sessions', '£85', 'Advanced', '17 Oct 2025', '{"Entrepreneurship", "Business planning", "AI implementation", "Pitch practice"}', 'Entrepreneurship', '{"startup", "business", "innovation"}', 'Basic business knowledge', 2009),
('Language Learning AI', 'Master new languages with personalized AI tutoring', 'Teenagers', 'Online', '6 hrs/4 sessions', '£40', 'Beginner', '24 Oct 2025', '{"Language learning", "AI tutoring", "Conversation practice", "Cultural exchange"}', 'Languages', '{"languages", "learning", "culture"}', 'None', 2010);

-- Add 90 more Teenagers courses
INSERT INTO courses (title, description, audience, mode, duration, price, level, start_date, features, category, keywords, prerequisites, sort_order) 
SELECT 
    'Teen AI Mastery ' || generate_series,
    'Advanced AI concepts and practical applications for ambitious teenagers',
    'Teenagers',
    (ARRAY['Online', 'Hybrid'])[floor(random() * 2 + 1)],
    (ARRAY['6 hrs/4 sessions', '7 hrs/5 sessions', '8 hrs/6 sessions'])[floor(random() * 3 + 1)],
    (ARRAY['£45', '£50', '£55', '£60'])[floor(random() * 4 + 1)],
    (ARRAY['Beginner', 'Intermediate', 'Advanced'])[floor(random() * 3 + 1)],
    (current_date + interval '1 week' * generate_series)::text,
    ARRAY['Hands-on projects', 'Peer collaboration', 'Industry insights', 'Certificate of completion'],
    (ARRAY['Technology', 'Programming', 'Data Science', 'Innovation'])[floor(random() * 4 + 1)],
    ARRAY['teens', 'advanced', 'ai', 'skills'],
    'None',
    2010 + generate_series
FROM generate_series(1, 90);

-- Professionals courses (100 new)
INSERT INTO courses (title, description, audience, mode, duration, price, level, start_date, features, category, keywords, prerequisites, sort_order) VALUES
('AI Project Management Certification', 'Lead AI initiatives with confidence and strategic insight', 'Professionals', 'Hybrid', '12 hrs/8 sessions', '£150', 'Intermediate', '22 Aug 2025', '{"Project leadership", "AI implementation", "Risk management", "Team coordination"}', 'Project Management', '{"management", "leadership", "projects"}', 'Project management experience', 3001),
('AI Sales Optimization', 'Boost sales performance using AI-driven insights and automation', 'Professionals', 'Online', '8 hrs/6 sessions', '£120', 'Intermediate', '29 Aug 2025', '{"Sales automation", "Customer insights", "Predictive analytics", "Revenue optimization"}', 'Sales', '{"sales", "automation", "analytics"}', 'Sales experience', 3002),
('AI Healthcare Applications', 'Transform healthcare delivery with AI technologies', 'Professionals', 'Hybrid', '15 hrs/10 sessions', '£200', 'Advanced', '5 Sep 2025', '{"Medical AI", "Diagnostic tools", "Patient care", "Healthcare innovation"}', 'Healthcare', '{"healthcare", "medical", "innovation"}', 'Healthcare background', 3003),
('AI Legal Research Assistant', 'Revolutionize legal research and case preparation with AI', 'Professionals', 'Online', '10 hrs/7 sessions', '£140', 'Intermediate', '12 Sep 2025', '{"Legal research", "Case analysis", "Document review", "Compliance automation"}', 'Legal', '{"legal", "research", "compliance"}', 'Legal background', 3004),
('AI Financial Analysis', 'Advanced financial modeling and risk assessment using AI', 'Professionals', 'Hybrid', '12 hrs/8 sessions', '£180', 'Advanced', '19 Sep 2025', '{"Financial modeling", "Risk analysis", "Investment strategies", "Market prediction"}', 'Finance', '{"finance", "analysis", "investment"}', 'Financial background', 3005),
('AI Marketing Automation', 'Create intelligent marketing campaigns that convert', 'Professionals', 'Online', '8 hrs/6 sessions', '£110', 'Intermediate', '26 Sep 2025', '{"Campaign automation", "Customer segmentation", "Personalization", "ROI optimization"}', 'Marketing', '{"marketing", "automation", "campaigns"}', 'Marketing experience', 3006),
('AI Human Resources', 'Modernize HR processes with AI-powered solutions', 'Professionals', 'Hybrid', '10 hrs/7 sessions', '£130', 'Intermediate', '3 Oct 2025', '{"Talent acquisition", "Performance analytics", "Employee engagement", "HR automation"}', 'Human Resources', '{"hr", "recruitment", "analytics"}', 'HR experience', 3007),
('AI Supply Chain Optimization', 'Optimize logistics and supply chain with AI intelligence', 'Professionals', 'Online', '12 hrs/8 sessions', '£160', 'Advanced', '10 Oct 2025', '{"Supply chain AI", "Logistics optimization", "Demand forecasting", "Cost reduction"}', 'Supply Chain', '{"supply chain", "logistics", "optimization"}', 'Supply chain background', 3008),
('AI Customer Service Excellence', 'Deliver exceptional customer experiences with AI', 'Professionals', 'Online', '8 hrs/6 sessions', '£100', 'Intermediate', '17 Oct 2025', '{"Chatbot development", "Sentiment analysis", "Service automation", "Customer satisfaction"}', 'Customer Service', '{"customer service", "chatbots", "automation"}', 'Customer service experience', 3009),
('AI Quality Assurance', 'Implement AI-driven quality control and testing', 'Professionals', 'Hybrid', '10 hrs/7 sessions', '£135', 'Advanced', '24 Oct 2025', '{"Automated testing", "Quality metrics", "Defect prediction", "Process improvement"}', 'Quality Assurance', '{"qa", "testing", "quality"}', 'QA experience', 3010);

-- Add 90 more Professionals courses
INSERT INTO courses (title, description, audience, mode, duration, price, level, start_date, features, category, keywords, prerequisites, sort_order) 
SELECT 
    'Professional AI Skills ' || generate_series,
    'Industry-specific AI applications for working professionals',
    'Professionals',
    (ARRAY['Online', 'Hybrid'])[floor(random() * 2 + 1)],
    (ARRAY['8 hrs/6 sessions', '10 hrs/7 sessions', '12 hrs/8 sessions'])[floor(random() * 3 + 1)],
    (ARRAY['£100', '£120', '£140', '£160'])[floor(random() * 4 + 1)],
    (ARRAY['Intermediate', 'Advanced'])[floor(random() * 2 + 1)],
    (current_date + interval '1 week' * generate_series)::text,
    ARRAY['Professional certification', 'Industry case studies', 'Practical implementation', 'Networking opportunities'],
    (ARRAY['Technology', 'Business Intelligence', 'Process Automation', 'Strategic Planning'])[floor(random() * 4 + 1)],
    ARRAY['professional', 'industry', 'ai', 'certification'],
    'Relevant professional experience',
    3010 + generate_series
FROM generate_series(1, 90);

-- SMEs courses (100 new) - using Advanced instead of Executive level
INSERT INTO courses (title, description, audience, mode, duration, price, level, start_date, features, category, keywords, prerequisites, sort_order) VALUES
('AI Business Strategy Workshop', 'Develop comprehensive AI strategy for your organization', 'SMEs', 'Hybrid', '16 hrs/8 sessions', '£300', 'Advanced', '22 Aug 2025', '{"Strategic planning", "Competitive advantage", "ROI analysis", "Implementation roadmap"}', 'Strategy', '{"strategy", "planning", "business"}', 'Senior management experience', 4001),
('AI Risk Management Framework', 'Implement robust AI governance and risk management', 'SMEs', 'Hybrid', '12 hrs/6 sessions', '£250', 'Advanced', '29 Aug 2025', '{"Risk assessment", "Governance framework", "Compliance", "Security protocols"}', 'Risk Management', '{"risk", "governance", "compliance"}', 'Risk management background', 4002),
('AI Customer Intelligence Platform', 'Build comprehensive customer insights using AI', 'SMEs', 'Online', '14 hrs/7 sessions', '£280', 'Advanced', '5 Sep 2025', '{"Customer analytics", "Behavior prediction", "Personalization", "Retention strategies"}', 'Customer Intelligence', '{"customer", "analytics", "intelligence"}', 'Customer management experience', 4003),
('AI Operations Excellence', 'Optimize business operations with AI-driven efficiency', 'SMEs', 'Hybrid', '15 hrs/8 sessions', '£320', 'Advanced', '12 Sep 2025', '{"Process optimization", "Automation strategies", "Performance metrics", "Cost reduction"}', 'Operations', '{"operations", "efficiency", "automation"}', 'Operations management experience', 4004),
('AI Innovation Lab Setup', 'Establish and manage AI innovation centers', 'SMEs', 'Hybrid', '18 hrs/9 sessions', '£350', 'Advanced', '19 Sep 2025', '{"Innovation management", "R&D strategies", "Technology adoption", "Change leadership"}', 'Innovation', '{"innovation", "R&D", "technology"}', 'Innovation leadership experience', 4005),
('AI Merger & Acquisition Due Diligence', 'Evaluate AI capabilities in M&A scenarios', 'SMEs', 'Online', '10 hrs/5 sessions', '£400', 'Advanced', '26 Sep 2025', '{"Due diligence", "Technology assessment", "Integration planning", "Value estimation"}', 'M&A', '{"merger", "acquisition", "valuation"}', 'M&A experience', 4006),
('AI Workforce Transformation', 'Lead organization-wide AI adoption and training', 'SMEs', 'Hybrid', '20 hrs/10 sessions', '£380', 'Advanced', '3 Oct 2025', '{"Change management", "Workforce planning", "Skills development", "Cultural transformation"}', 'Workforce', '{"workforce", "transformation", "change"}', 'HR leadership experience', 4007),
('AI Revenue Diversification', 'Create new revenue streams with AI products and services', 'SMEs', 'Hybrid', '16 hrs/8 sessions', '£360', 'Advanced', '10 Oct 2025', '{"Product development", "Market expansion", "Revenue models", "Go-to-market strategy"}', 'Revenue', '{"revenue", "products", "market"}', 'Business development experience', 4008),
('AI Regulatory Compliance', 'Navigate AI regulations and ensure compliance', 'SMEs', 'Online', '12 hrs/6 sessions', '£275', 'Advanced', '17 Oct 2025', '{"Regulatory landscape", "Compliance frameworks", "Legal considerations", "Policy development"}', 'Compliance', '{"regulatory", "compliance", "legal"}', 'Compliance background', 4009),
('AI Investment & Funding Strategy', 'Secure funding and investment for AI initiatives', 'SMEs', 'Hybrid', '14 hrs/7 sessions', '£340', 'Advanced', '24 Oct 2025', '{"Investment strategy", "Funding sources", "Pitch development", "Investor relations"}', 'Investment', '{"investment", "funding", "strategy"}', 'Finance leadership experience', 4010);

-- Add 90 more SMEs courses
INSERT INTO courses (title, description, audience, mode, duration, price, level, start_date, features, category, keywords, prerequisites, sort_order) 
SELECT 
    'Executive AI Leadership ' || generate_series,
    'Strategic AI leadership for senior executives and business leaders',
    'SMEs',
    (ARRAY['Online', 'Hybrid'])[floor(random() * 2 + 1)],
    (ARRAY['12 hrs/6 sessions', '14 hrs/7 sessions', '16 hrs/8 sessions'])[floor(random() * 3 + 1)],
    (ARRAY['£250', '£300', '£350', '£400'])[floor(random() * 4 + 1)],
    'Advanced',
    (current_date + interval '1 week' * generate_series)::text,
    ARRAY['Executive insights', 'Strategic planning', 'Leadership development', 'Industry networking'],
    (ARRAY['Leadership', 'Strategy', 'Innovation', 'Transformation'])[floor(random() * 4 + 1)],
    ARRAY['executive', 'leadership', 'strategy', 'transformation'],
    'Senior leadership experience',
    4010 + generate_series
FROM generate_series(1, 90);

-- Insert the Test programme
INSERT INTO courses (title, description, audience, mode, duration, price, level, start_date, features, category, keywords, prerequisites, sort_order, is_active) VALUES
('Test Programme - Stripe Payment', 'Test course for payment functionality - includes basic AI concepts', 'Professionals', 'Online', '1 hr/1 session', '£0.05', 'Beginner', '1 Aug 2025', '{"Test payment", "Basic AI intro", "Payment verification", "System testing"}', 'Testing', '{"test", "payment", "demo"}', 'None', 1, true);