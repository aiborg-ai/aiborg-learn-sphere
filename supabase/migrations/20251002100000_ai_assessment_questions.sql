-- AI Assessment Question Bank Migration
-- Based on Bloom's Taxonomy and Item Response Theory (IRT)
-- Adaptive Testing Framework

-- =====================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add display_order column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'assessment_categories' AND column_name = 'display_order') THEN
    ALTER TABLE assessment_categories ADD COLUMN display_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add difficulty_level, cognitive_level, irt_difficulty columns to questions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'assessment_questions' AND column_name = 'difficulty_level') THEN
    ALTER TABLE assessment_questions ADD COLUMN difficulty_level VARCHAR(50) DEFAULT 'intermediate';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'assessment_questions' AND column_name = 'cognitive_level') THEN
    ALTER TABLE assessment_questions ADD COLUMN cognitive_level VARCHAR(50) DEFAULT 'understand';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'assessment_questions' AND column_name = 'irt_difficulty') THEN
    ALTER TABLE assessment_questions ADD COLUMN irt_difficulty DECIMAL(4,2) DEFAULT 0.0;
  END IF;
END $$;

-- Add is_correct column to options
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'assessment_question_options' AND column_name = 'is_correct') THEN
    ALTER TABLE assessment_question_options ADD COLUMN is_correct BOOLEAN DEFAULT false;
  END IF;
END $$;

-- =====================================================
-- ASSESSMENT CATEGORIES
-- =====================================================

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

-- =====================================================
-- AI FUNDAMENTALS QUESTIONS
-- =====================================================

-- Remembering Level (Bloom's Level 1, IRT Difficulty: -2 to -0.6)
INSERT INTO assessment_questions (
  category_id,
  question_text,
  question_type,
  help_text,
  order_index,
  points_value,
  difficulty_level,
  cognitive_level,
  irt_difficulty
) VALUES
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Fundamentals'),
  'What does AI stand for?',
  'single_choice',
  'Basic definition of the AI acronym',
  1,
  5,
  'beginner',
  'remember',
  -1.8
),
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Fundamentals'),
  'Which of the following is a subset of AI?',
  'single_choice',
  'Understanding the relationship between AI, ML, and DL',
  2,
  5,
  'beginner',
  'remember',
  -1.5
),
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Fundamentals'),
  'What is the Turing Test used for?',
  'single_choice',
  'Historical test for machine intelligence',
  3,
  10,
  'beginner',
  'understand',
  -0.8
);

-- Understanding Level (Bloom's Level 2, IRT Difficulty: -0.6 to 0.8)
INSERT INTO assessment_questions (
  category_id,
  question_text,
  question_type,
  help_text,
  order_index,
  points_value,
  difficulty_level,
  cognitive_level,
  irt_difficulty
) VALUES
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Fundamentals'),
  'Explain the difference between narrow AI and general AI.',
  'single_choice',
  'Understanding AI scope and capabilities',
  4,
  15,
  'intermediate',
  'understand',
  0.2
),
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Fundamentals'),
  'How does symbolic AI differ from connectionist AI?',
  'single_choice',
  'Different AI paradigms',
  5,
  15,
  'intermediate',
  'understand',
  0.5
);

-- Application Level (Bloom's Level 3, IRT Difficulty: 0.8 to 2)
INSERT INTO assessment_questions (
  category_id,
  question_text,
  question_type,
  help_text,
  order_index,
  points_value,
  difficulty_level,
  cognitive_level,
  irt_difficulty
) VALUES
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Fundamentals'),
  'You need to build a system that can play chess. Which AI approach would be most suitable?',
  'single_choice',
  'Applying AI concepts to real scenarios',
  6,
  20,
  'advanced',
  'apply',
  1.2
),
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Fundamentals'),
  'A company wants to automate customer service responses. Which combination of AI techniques would you recommend?',
  'multiple_choice',
  'Real-world application of AI',
  7,
  25,
  'advanced',
  'apply',
  1.5
);

-- =====================================================
-- MACHINE LEARNING QUESTIONS
-- =====================================================

-- Remembering Level
INSERT INTO assessment_questions (
  category_id,
  question_text,
  question_type,
  help_text,
  order_index,
  points_value,
  difficulty_level,
  cognitive_level,
  irt_difficulty
) VALUES
(
  (SELECT id FROM assessment_categories WHERE name = 'Machine Learning'),
  'What are the three main types of machine learning?',
  'multiple_choice',
  'Core ML categories',
  8,
  10,
  'beginner',
  'remember',
  -1.6
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Machine Learning'),
  'What is the purpose of a training dataset?',
  'single_choice',
  'Understanding ML data requirements',
  9,
  10,
  'beginner',
  'remember',
  -1.3
);

-- Understanding Level
INSERT INTO assessment_questions (
  category_id,
  question_text,
  question_type,
  help_text,
  order_index,
  points_value,
  difficulty_level,
  cognitive_level,
  irt_difficulty
) VALUES
(
  (SELECT id FROM assessment_categories WHERE name = 'Machine Learning'),
  'Explain the difference between overfitting and underfitting.',
  'single_choice',
  'Model performance concepts',
  10,
  15,
  'intermediate',
  'understand',
  0.0
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Machine Learning'),
  'How does cross-validation help improve model performance?',
  'single_choice',
  'Validation techniques',
  11,
  15,
  'intermediate',
  'understand',
  0.3
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Machine Learning'),
  'What is the bias-variance tradeoff?',
  'single_choice',
  'Fundamental ML concept',
  12,
  20,
  'intermediate',
  'understand',
  0.6
);

-- Application Level
INSERT INTO assessment_questions (
  category_id,
  question_text,
  question_type,
  help_text,
  order_index,
  points_value,
  difficulty_level,
  cognitive_level,
  irt_difficulty
) VALUES
(
  (SELECT id FROM assessment_categories WHERE name = 'Machine Learning'),
  'You have a dataset with 100,000 images of cats and dogs. Which algorithm would be most appropriate for classification?',
  'single_choice',
  'Choosing the right algorithm',
  13,
  20,
  'advanced',
  'apply',
  1.0
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Machine Learning'),
  'Your model achieves 95% accuracy on training data but only 60% on test data. What steps would you take?',
  'multiple_choice',
  'Troubleshooting ML models',
  14,
  25,
  'advanced',
  'apply',
  1.4
);

-- =====================================================
-- DEEP LEARNING QUESTIONS
-- =====================================================

INSERT INTO assessment_questions (
  category_id,
  question_text,
  question_type,
  help_text,
  order_index,
  points_value,
  difficulty_level,
  cognitive_level,
  irt_difficulty
) VALUES
(
  (SELECT id FROM assessment_categories WHERE name = 'Deep Learning'),
  'What is a neural network composed of?',
  'single_choice',
  'Basic neural network structure',
  15,
  10,
  'beginner',
  'remember',
  -1.4
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Deep Learning'),
  'What is the purpose of the activation function?',
  'single_choice',
  'Neural network components',
  16,
  15,
  'intermediate',
  'understand',
  0.1
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Deep Learning'),
  'Explain backpropagation in neural networks.',
  'single_choice',
  'Learning mechanism',
  17,
  20,
  'intermediate',
  'understand',
  0.7
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Deep Learning'),
  'When would you use a Convolutional Neural Network (CNN) over a Recurrent Neural Network (RNN)?',
  'single_choice',
  'Architecture selection',
  18,
  25,
  'advanced',
  'apply',
  1.3
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Deep Learning'),
  'Your CNN is experiencing vanishing gradients. What techniques would you apply?',
  'multiple_choice',
  'Advanced problem solving',
  19,
  30,
  'advanced',
  'apply',
  1.7
);

-- =====================================================
-- NLP QUESTIONS
-- =====================================================

INSERT INTO assessment_questions (
  category_id,
  question_text,
  question_type,
  help_text,
  order_index,
  points_value,
  difficulty_level,
  cognitive_level,
  irt_difficulty
) VALUES
(
  (SELECT id FROM assessment_categories WHERE name = 'Natural Language Processing'),
  'What does NLP stand for?',
  'single_choice',
  'Basic NLP terminology',
  20,
  5,
  'beginner',
  'remember',
  -1.9
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Natural Language Processing'),
  'What is tokenization in NLP?',
  'single_choice',
  'Text preprocessing',
  21,
  10,
  'beginner',
  'understand',
  -0.9
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Natural Language Processing'),
  'Explain the concept of word embeddings.',
  'single_choice',
  'NLP representations',
  22,
  15,
  'intermediate',
  'understand',
  0.4
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Natural Language Processing'),
  'How do transformer models differ from RNNs in NLP tasks?',
  'single_choice',
  'Modern NLP architectures',
  23,
  20,
  'intermediate',
  'understand',
  0.8
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Natural Language Processing'),
  'You need to build a sentiment analysis system for product reviews. What approach would you take?',
  'multiple_choice',
  'NLP application design',
  24,
  25,
  'advanced',
  'apply',
  1.4
);

-- =====================================================
-- COMPUTER VISION QUESTIONS
-- =====================================================

INSERT INTO assessment_questions (
  category_id,
  question_text,
  question_type,
  help_text,
  order_index,
  points_value,
  difficulty_level,
  cognitive_level,
  irt_difficulty
) VALUES
(
  (SELECT id FROM assessment_categories WHERE name = 'Computer Vision'),
  'What is computer vision?',
  'single_choice',
  'Basic CV definition',
  25,
  5,
  'beginner',
  'remember',
  -1.7
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Computer Vision'),
  'What is the difference between image classification and object detection?',
  'single_choice',
  'CV task types',
  26,
  15,
  'intermediate',
  'understand',
  0.2
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Computer Vision'),
  'Explain how convolutional layers work in image processing.',
  'single_choice',
  'CNN fundamentals for vision',
  27,
  20,
  'intermediate',
  'understand',
  0.6
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Computer Vision'),
  'You need to detect faces in real-time video. Which architecture and techniques would you use?',
  'multiple_choice',
  'Real-time CV applications',
  28,
  25,
  'advanced',
  'apply',
  1.5
);

-- =====================================================
-- AI ETHICS QUESTIONS
-- =====================================================

INSERT INTO assessment_questions (
  category_id,
  question_text,
  question_type,
  help_text,
  order_index,
  points_value,
  difficulty_level,
  cognitive_level,
  irt_difficulty
) VALUES
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Ethics & Bias'),
  'What is algorithmic bias?',
  'single_choice',
  'Understanding AI fairness',
  29,
  10,
  'beginner',
  'remember',
  -1.2
),
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Ethics & Bias'),
  'Why is diversity in training data important?',
  'single_choice',
  'Data quality and fairness',
  30,
  15,
  'intermediate',
  'understand',
  0.1
),
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Ethics & Bias'),
  'Explain the concept of "black box" in AI and why it matters.',
  'single_choice',
  'AI explainability',
  31,
  20,
  'intermediate',
  'understand',
  0.5
),
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Ethics & Bias'),
  'Your AI hiring tool shows bias against certain demographics. What steps would you take to address this?',
  'multiple_choice',
  'Ethical AI implementation',
  32,
  25,
  'advanced',
  'apply',
  1.3
);

-- =====================================================
-- AI TOOLS & FRAMEWORKS QUESTIONS
-- =====================================================

INSERT INTO assessment_questions (
  category_id,
  question_text,
  question_type,
  help_text,
  order_index,
  points_value,
  difficulty_level,
  cognitive_level,
  irt_difficulty
) VALUES
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Tools & Frameworks'),
  'Which of the following are popular deep learning frameworks?',
  'multiple_choice',
  'Industry-standard tools',
  33,
  10,
  'beginner',
  'remember',
  -1.5
),
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Tools & Frameworks'),
  'What is TensorFlow primarily used for?',
  'single_choice',
  'Framework purposes',
  34,
  10,
  'beginner',
  'understand',
  -0.7
),
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Tools & Frameworks'),
  'Compare PyTorch and TensorFlow for research vs production.',
  'single_choice',
  'Framework selection',
  35,
  20,
  'intermediate',
  'understand',
  0.4
),
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Tools & Frameworks'),
  'You need to deploy a real-time object detection model. Which tools and frameworks would you choose?',
  'multiple_choice',
  'Production ML systems',
  36,
  25,
  'advanced',
  'apply',
  1.2
);

-- =====================================================
-- REAL-WORLD APPLICATIONS QUESTIONS
-- =====================================================

INSERT INTO assessment_questions (
  category_id,
  question_text,
  question_type,
  help_text,
  order_index,
  points_value,
  difficulty_level,
  cognitive_level,
  irt_difficulty
) VALUES
(
  (SELECT id FROM assessment_categories WHERE name = 'Real-World Applications'),
  'Which industries commonly use AI?',
  'multiple_choice',
  'AI adoption across sectors',
  37,
  10,
  'beginner',
  'remember',
  -1.3
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Real-World Applications'),
  'How is AI used in healthcare?',
  'multiple_choice',
  'Domain-specific applications',
  38,
  15,
  'intermediate',
  'understand',
  0.0
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Real-World Applications'),
  'Explain how recommendation systems work (e.g., Netflix, Amazon).',
  'single_choice',
  'Common AI applications',
  39,
  20,
  'intermediate',
  'understand',
  0.3
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Real-World Applications'),
  'A retail company wants to optimize inventory management. Design an AI solution.',
  'multiple_choice',
  'Business problem solving',
  40,
  30,
  'advanced',
  'apply',
  1.6
);

-- Note: This is a foundation. Run the options insertion script next!
