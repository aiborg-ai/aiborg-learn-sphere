-- Setup blog categories for different audience segments

-- First, clear existing categories if needed (optional)
-- DELETE FROM blog_categories;

-- Insert categories for each audience segment
INSERT INTO blog_categories (name, slug, description, color, is_active, sort_order) VALUES
('Young Learners', 'young-learners', 'AI content for kids aged 8-12 with simple language and fun concepts', '#FF6B6B', true, 1),
('Teenagers', 'teenagers', 'Tech content for teens aged 13-18 focused on social media, gaming, and career', '#4ECDC4', true, 2),
('Professionals', 'professionals', 'Career advancement and productivity content for working professionals', '#45B7D1', true, 3),
('Business Owners', 'business-owners', 'Practical AI implementation and ROI-focused content for SMEs', '#96CEB4', true, 4),
('AI Basics', 'ai-basics', 'Fundamental AI concepts and introductory content', '#FFEAA7', true, 5),
('Industry Trends', 'industry-trends', 'Latest AI developments and market insights', '#DDA0DD', true, 6),
('How-To Guides', 'how-to-guides', 'Step-by-step tutorials and practical guides', '#98D8C8', true, 7),
('Case Studies', 'case-studies', 'Real-world AI implementation stories', '#F7DC6F', true, 8)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  is_active = EXCLUDED.is_active;

-- Create some common tags
INSERT INTO blog_tags (name, slug) VALUES
('AI', 'ai'),
('Machine Learning', 'machine-learning'),
('Automation', 'automation'),
('ChatGPT', 'chatgpt'),
('Productivity', 'productivity'),
('Education', 'education'),
('Gaming', 'gaming'),
('Social Media', 'social-media'),
('Business', 'business'),
('Career', 'career'),
('Ethics', 'ethics'),
('Future Tech', 'future-tech'),
('Tutorial', 'tutorial'),
('Beginner Friendly', 'beginner-friendly'),
('Advanced', 'advanced')
ON CONFLICT (slug) DO NOTHING;