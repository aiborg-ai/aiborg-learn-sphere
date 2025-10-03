-- ========================================
-- MINIMAL MIGRATION - RUN EACH STEP ONE AT A TIME
-- Copy and run each block separately, wait for success before next
-- ========================================

-- ========================================
-- STEP 1A: Create assessment_categories table
-- ========================================
CREATE TABLE IF NOT EXISTS assessment_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- STEP 1B: Insert categories
-- ========================================
INSERT INTO assessment_categories (name, description, icon, display_order) VALUES
('AI Fundamentals', 'Core AI concepts', 'brain', 1),
('Machine Learning', 'ML algorithms', 'trending-up', 2),
('Deep Learning', 'Neural networks', 'layers', 3),
('NLP', 'Text processing', 'message-square', 4),
('Computer Vision', 'Image AI', 'eye', 5),
('AI Ethics', 'Responsible AI', 'shield', 6),
('AI Tools', 'Frameworks', 'wrench', 7),
('Applications', 'Real-world use', 'briefcase', 8)
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- STEP 2: Create assessment_questions table
-- ========================================
CREATE TABLE IF NOT EXISTS assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES assessment_categories(id),
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) DEFAULT 'single_choice',
  points_value INTEGER DEFAULT 10,
  difficulty_level VARCHAR(50) DEFAULT 'beginner',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- STEP 3: Create assessment_question_options table
-- ========================================
CREATE TABLE IF NOT EXISTS assessment_question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES assessment_questions(id),
  option_text TEXT NOT NULL,
  option_value VARCHAR(100) NOT NULL,
  points INTEGER DEFAULT 0,
  is_correct BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- STEP 4: Insert sample question 1
-- ========================================
INSERT INTO assessment_questions (
  category_id,
  question_text,
  question_type,
  points_value,
  difficulty_level,
  order_index
) VALUES (
  (SELECT id FROM assessment_categories WHERE name = 'AI Fundamentals' LIMIT 1),
  'What does AI stand for?',
  'single_choice',
  5,
  'beginner',
  1
);

-- ========================================
-- STEP 5: Insert options for question 1
-- ========================================
INSERT INTO assessment_question_options (
  question_id,
  option_text,
  option_value,
  points,
  is_correct,
  order_index
) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text = 'What does AI stand for?' LIMIT 1),
  'Artificial Intelligence',
  'ai',
  5,
  true,
  1
),
(
  (SELECT id FROM assessment_questions WHERE question_text = 'What does AI stand for?' LIMIT 1),
  'Automated Integration',
  'auto',
  0,
  false,
  2
),
(
  (SELECT id FROM assessment_questions WHERE question_text = 'What does AI stand for?' LIMIT 1),
  'Advanced Information',
  'adv',
  0,
  false,
  3
);

-- ========================================
-- STEP 6: Insert sample question 2
-- ========================================
INSERT INTO assessment_questions (
  category_id,
  question_text,
  question_type,
  points_value,
  difficulty_level,
  order_index
) VALUES (
  (SELECT id FROM assessment_categories WHERE name = 'Machine Learning' LIMIT 1),
  'Which is a type of machine learning?',
  'single_choice',
  10,
  'beginner',
  2
);

-- ========================================
-- STEP 7: Insert options for question 2
-- ========================================
INSERT INTO assessment_question_options (
  question_id,
  option_text,
  option_value,
  points,
  is_correct,
  order_index
) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text = 'Which is a type of machine learning?' LIMIT 1),
  'Supervised Learning',
  'supervised',
  10,
  true,
  1
),
(
  (SELECT id FROM assessment_questions WHERE question_text = 'Which is a type of machine learning?' LIMIT 1),
  'Cloud Computing',
  'cloud',
  0,
  false,
  2
);

-- ========================================
-- STEP 8: Enable RLS (Row Level Security)
-- ========================================
ALTER TABLE assessment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_question_options ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 9: Create RLS policies
-- ========================================
DROP POLICY IF EXISTS "Public read categories" ON assessment_categories;
CREATE POLICY "Public read categories" ON assessment_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read questions" ON assessment_questions;
CREATE POLICY "Public read questions" ON assessment_questions FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public read options" ON assessment_question_options;
CREATE POLICY "Public read options" ON assessment_question_options FOR SELECT USING (true);

-- ========================================
-- STEP 10: Verify data
-- ========================================
SELECT 'Categories:' as type, COUNT(*)::text as count FROM assessment_categories
UNION ALL
SELECT 'Questions:' as type, COUNT(*)::text as count FROM assessment_questions
UNION ALL
SELECT 'Options:' as type, COUNT(*)::text as count FROM assessment_question_options;

-- ========================================
-- DONE! You should see:
-- Categories: 8
-- Questions: 2
-- Options: 5
-- ========================================
