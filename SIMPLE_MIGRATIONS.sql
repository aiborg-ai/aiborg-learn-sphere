-- ========================================
-- COPY AND PASTE EACH SECTION SEPARATELY
-- ========================================

-- ========================================
-- SECTION 1: BASE ASSESSMENT TABLES
-- Run this FIRST
-- ========================================

-- Assessment Categories
CREATE TABLE IF NOT EXISTS assessment_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  weight DECIMAL(3, 2) DEFAULT 1.0,
  order_index INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assessment Questions
CREATE TABLE IF NOT EXISTS assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES assessment_categories(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) DEFAULT 'single_choice',
  help_text TEXT,
  audience_filters TEXT[],
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  points_value INTEGER DEFAULT 10,
  difficulty_level VARCHAR(50) DEFAULT 'intermediate',
  cognitive_level VARCHAR(50) DEFAULT 'understand',
  irt_difficulty DECIMAL(4,2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Question Options
CREATE TABLE IF NOT EXISTS assessment_question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES assessment_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_value VARCHAR(100) NOT NULL,
  points INTEGER DEFAULT 0,
  is_correct BOOLEAN DEFAULT false,
  description TEXT,
  tool_recommendations TEXT[],
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Assessments
CREATE TABLE IF NOT EXISTS user_ai_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  audience_type VARCHAR(50),
  total_score INTEGER DEFAULT 0,
  max_possible_score INTEGER DEFAULT 0,
  augmentation_level VARCHAR(50),
  completion_time_seconds INTEGER,
  is_complete BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Answers
CREATE TABLE IF NOT EXISTS user_assessment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES user_ai_assessments(id) ON DELETE CASCADE,
  question_id UUID REFERENCES assessment_questions(id) ON DELETE CASCADE,
  selected_options UUID[],
  text_answer TEXT,
  score_earned INTEGER DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE assessment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessment_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read categories" ON assessment_categories FOR SELECT USING (true);
CREATE POLICY "Public read questions" ON assessment_questions FOR SELECT USING (is_active = true);
CREATE POLICY "Public read options" ON assessment_question_options FOR SELECT USING (true);

CREATE POLICY "Users view own assessments" ON user_ai_assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own assessments" ON user_ai_assessments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own assessments" ON user_ai_assessments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users view own answers" ON user_assessment_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_ai_assessments WHERE id = assessment_id AND user_id = auth.uid())
);
CREATE POLICY "Users create own answers" ON user_assessment_answers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_ai_assessments WHERE id = assessment_id AND user_id = auth.uid())
);

-- ========================================
-- SECTION 2: AI STUDY ASSISTANT TABLES
-- Run this SECOND
-- ========================================

-- AI Study Sessions
CREATE TABLE IF NOT EXISTS ai_study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('chat', 'study_plan', 'assignment_help', 'performance_review')),
  context JSONB DEFAULT '{}'::jsonb,
  duration_minutes INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES ai_study_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Recommendations
CREATE TABLE IF NOT EXISTS ai_study_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL CHECK (
    recommendation_type IN ('material', 'study_time', 'review', 'assignment_priority', 'learning_path')
  ),
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  related_course_id INTEGER,
  related_assignment_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dismissed')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Learning Insights
CREATE TABLE IF NOT EXISTS ai_learning_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (
    insight_type IN ('strength', 'weakness', 'pattern', 'achievement', 'suggestion')
  ),
  category TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_study_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users view own sessions" ON ai_study_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own conversations" ON ai_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own recommendations" ON ai_study_recommendations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own insights" ON ai_learning_insights FOR ALL USING (auth.uid() = user_id);

-- ========================================
-- SECTION 3: AI/ML ASSESSMENT QUESTIONS
-- Run this THIRD
-- ========================================

-- Insert Categories
INSERT INTO assessment_categories (name, description, icon, display_order) VALUES
('AI Fundamentals', 'Core concepts and principles of Artificial Intelligence', 'brain', 1),
('Machine Learning', 'Supervised, unsupervised, and reinforcement learning', 'trending-up', 2),
('Deep Learning', 'Neural networks, CNNs, RNNs, and transformers', 'layers', 3),
('Natural Language Processing', 'Text processing, language models, and understanding', 'message-square', 4),
('Computer Vision', 'Image recognition, object detection, and visual understanding', 'eye', 5),
('AI Ethics & Bias', 'Responsible AI, fairness, and ethical considerations', 'shield', 6),
('AI Tools & Frameworks', 'TensorFlow, PyTorch, OpenAI, and other tools', 'wrench', 7),
('Real-World Applications', 'Practical use cases and industry applications', 'briefcase', 8)
ON CONFLICT (name) DO NOTHING;

-- Sample Questions (10 core questions - you can add more)
INSERT INTO assessment_questions (category_id, question_text, question_type, points_value, difficulty_level, cognitive_level, irt_difficulty, order_index) VALUES
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Fundamentals'),
  'What does AI stand for?',
  'single_choice',
  5,
  'beginner',
  'remember',
  -1.8,
  1
),
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Fundamentals'),
  'Which of the following is a subset of AI?',
  'single_choice',
  5,
  'beginner',
  'remember',
  -1.5,
  2
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Machine Learning'),
  'What are the three main types of machine learning?',
  'multiple_choice',
  10,
  'beginner',
  'remember',
  -1.6,
  3
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Machine Learning'),
  'Explain the difference between overfitting and underfitting.',
  'single_choice',
  15,
  'intermediate',
  'understand',
  0.0,
  4
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Deep Learning'),
  'What is a neural network composed of?',
  'single_choice',
  10,
  'beginner',
  'remember',
  -1.4,
  5
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Natural Language Processing'),
  'What does NLP stand for?',
  'single_choice',
  5,
  'beginner',
  'remember',
  -1.9,
  6
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Computer Vision'),
  'What is computer vision?',
  'single_choice',
  5,
  'beginner',
  'remember',
  -1.7,
  7
),
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Ethics & Bias'),
  'What is algorithmic bias?',
  'single_choice',
  10,
  'beginner',
  'remember',
  -1.2,
  8
),
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Tools & Frameworks'),
  'Which of the following are popular deep learning frameworks?',
  'multiple_choice',
  10,
  'beginner',
  'remember',
  -1.5,
  9
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Real-World Applications'),
  'Which industries commonly use AI?',
  'multiple_choice',
  10,
  'beginner',
  'remember',
  -1.3,
  10
);

-- ========================================
-- SECTION 4: ANSWER OPTIONS
-- Run this FOURTH
-- ========================================

-- Options for: What does AI stand for?
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
((SELECT id FROM assessment_questions WHERE question_text = 'What does AI stand for?' LIMIT 1), 'Artificial Intelligence', 'artificial_intelligence', 5, true, 1),
((SELECT id FROM assessment_questions WHERE question_text = 'What does AI stand for?' LIMIT 1), 'Automated Integration', 'automated_integration', 0, false, 2),
((SELECT id FROM assessment_questions WHERE question_text = 'What does AI stand for?' LIMIT 1), 'Advanced Information', 'advanced_information', 0, false, 3),
((SELECT id FROM assessment_questions WHERE question_text = 'What does AI stand for?' LIMIT 1), 'Algorithmic Interface', 'algorithmic_interface', 0, false, 4);

-- Options for: Which is a subset of AI?
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
((SELECT id FROM assessment_questions WHERE question_text = 'Which of the following is a subset of AI?' LIMIT 1), 'Machine Learning', 'machine_learning', 5, true, 1),
((SELECT id FROM assessment_questions WHERE question_text = 'Which of the following is a subset of AI?' LIMIT 1), 'Quantum Computing', 'quantum_computing', 0, false, 2),
((SELECT id FROM assessment_questions WHERE question_text = 'Which of the following is a subset of AI?' LIMIT 1), 'Cloud Computing', 'cloud_computing', 0, false, 3),
((SELECT id FROM assessment_questions WHERE question_text = 'Which of the following is a subset of AI?' LIMIT 1), 'Blockchain', 'blockchain', 0, false, 4);

-- Options for: Three main types of ML
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
((SELECT id FROM assessment_questions WHERE question_text = 'What are the three main types of machine learning?' LIMIT 1), 'Supervised Learning', 'supervised', 4, true, 1),
((SELECT id FROM assessment_questions WHERE question_text = 'What are the three main types of machine learning?' LIMIT 1), 'Unsupervised Learning', 'unsupervised', 3, true, 2),
((SELECT id FROM assessment_questions WHERE question_text = 'What are the three main types of machine learning?' LIMIT 1), 'Reinforcement Learning', 'reinforcement', 3, true, 3),
((SELECT id FROM assessment_questions WHERE question_text = 'What are the three main types of machine learning?' LIMIT 1), 'Quantum Learning', 'quantum', 0, false, 4);

-- Options for: Overfitting vs Underfitting
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index, description) VALUES
((SELECT id FROM assessment_questions WHERE question_text = 'Explain the difference between overfitting and underfitting.' LIMIT 1), 'Overfitting: too complex, poor generalization. Underfitting: too simple, poor performance', 'correct_explanation', 15, true, 1, 'Overfitting memorizes training data, underfitting doesn''t capture patterns'),
((SELECT id FROM assessment_questions WHERE question_text = 'Explain the difference between overfitting and underfitting.' LIMIT 1), 'Overfitting is good, underfitting is bad', 'good_bad', 0, false, 2, 'Both are problems'),
((SELECT id FROM assessment_questions WHERE question_text = 'Explain the difference between overfitting and underfitting.' LIMIT 1), 'They are the same thing', 'same', 0, false, 3, 'Opposite problems');

-- Options for: Neural network composition
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
((SELECT id FROM assessment_questions WHERE question_text = 'What is a neural network composed of?' LIMIT 1), 'Layers of interconnected neurons/nodes', 'layers_neurons', 10, true, 1),
((SELECT id FROM assessment_questions WHERE question_text = 'What is a neural network composed of?' LIMIT 1), 'Database tables', 'database', 0, false, 2),
((SELECT id FROM assessment_questions WHERE question_text = 'What is a neural network composed of?' LIMIT 1), 'If-then rules', 'rules', 0, false, 3);

-- Options for: What does NLP stand for?
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
((SELECT id FROM assessment_questions WHERE question_text = 'What does NLP stand for?' LIMIT 1), 'Natural Language Processing', 'nlp', 5, true, 1),
((SELECT id FROM assessment_questions WHERE question_text = 'What does NLP stand for?' LIMIT 1), 'Network Layer Protocol', 'network', 0, false, 2),
((SELECT id FROM assessment_questions WHERE question_text = 'What does NLP stand for?' LIMIT 1), 'Neural Learning Process', 'neural', 0, false, 3);

-- Options for: Computer Vision
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
((SELECT id FROM assessment_questions WHERE question_text = 'What is computer vision?' LIMIT 1), 'AI that enables machines to interpret visual information', 'visual_ai', 5, true, 1),
((SELECT id FROM assessment_questions WHERE question_text = 'What is computer vision?' LIMIT 1), 'A type of monitor', 'monitor', 0, false, 2),
((SELECT id FROM assessment_questions WHERE question_text = 'What is computer vision?' LIMIT 1), 'A programming language', 'language', 0, false, 3);

-- Options for: Algorithmic bias
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
((SELECT id FROM assessment_questions WHERE question_text = 'What is algorithmic bias?' LIMIT 1), 'Systematic unfairness in AI decision-making', 'unfairness', 10, true, 1),
((SELECT id FROM assessment_questions WHERE question_text = 'What is algorithmic bias?' LIMIT 1), 'A programming error', 'error', 0, false, 2),
((SELECT id FROM assessment_questions WHERE question_text = 'What is algorithmic bias?' LIMIT 1), 'Speed optimization', 'speed', 0, false, 3);

-- Options for: DL Frameworks
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
((SELECT id FROM assessment_questions WHERE question_text = 'Which of the following are popular deep learning frameworks?' LIMIT 1), 'TensorFlow', 'tensorflow', 3, true, 1),
((SELECT id FROM assessment_questions WHERE question_text = 'Which of the following are popular deep learning frameworks?' LIMIT 1), 'PyTorch', 'pytorch', 3, true, 2),
((SELECT id FROM assessment_questions WHERE question_text = 'Which of the following are popular deep learning frameworks?' LIMIT 1), 'Keras', 'keras', 4, true, 3),
((SELECT id FROM assessment_questions WHERE question_text = 'Which of the following are popular deep learning frameworks?' LIMIT 1), 'MySQL', 'mysql', 0, false, 4);

-- Options for: AI Industries
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
((SELECT id FROM assessment_questions WHERE question_text = 'Which industries commonly use AI?' LIMIT 1), 'Healthcare', 'healthcare', 3, true, 1),
((SELECT id FROM assessment_questions WHERE question_text = 'Which industries commonly use AI?' LIMIT 1), 'Finance', 'finance', 3, true, 2),
((SELECT id FROM assessment_questions WHERE question_text = 'Which industries commonly use AI?' LIMIT 1), 'Retail', 'retail', 2, true, 3),
((SELECT id FROM assessment_questions WHERE question_text = 'Which industries commonly use AI?' LIMIT 1), 'Manufacturing', 'manufacturing', 2, true, 4);

-- ========================================
-- DONE! Verify with:
-- SELECT COUNT(*) FROM assessment_categories;  -- Should be 8
-- SELECT COUNT(*) FROM assessment_questions;   -- Should be 10
-- SELECT COUNT(*) FROM assessment_question_options; -- Should be ~35
-- ========================================
