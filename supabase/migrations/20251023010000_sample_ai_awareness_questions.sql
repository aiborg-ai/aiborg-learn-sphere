-- =====================================================
-- AI-AWARENESS ASSESSMENT - SAMPLE QUESTIONS
-- Created: 2025-10-23
-- Purpose: Sample questions for testing AI-Awareness assessment
-- Audiences: Young Learners (primary), Teenagers (secondary), Professionals (professional)
-- =====================================================

-- =====================================================
-- YOUNG LEARNERS (PRIMARY) - AI-AWARENESS QUESTIONS
-- Simple, age-appropriate questions about AI basics
-- =====================================================

-- Question 1: Beginner - What is AI?
INSERT INTO assessment_questions (
  category_id,
  question_text,
  question_type,
  difficulty_level,
  cognitive_level,
  irt_difficulty,
  audience_filters,
  help_text,
  points_value,
  is_active
) VALUES (
  (SELECT id FROM assessment_categories WHERE name = 'AI Fundamentals' LIMIT 1),
  'What does AI stand for?',
  'single_choice',
  'beginner',
  'remember',
  -1.5,
  ARRAY['primary'],
  'AI is short for Artificial Intelligence',
  10,
  true
);

-- Options for Question 1
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index)
VALUES
  ((SELECT id FROM assessment_questions WHERE question_text = 'What does AI stand for?' AND 'primary' = ANY(audience_filters) LIMIT 1),
   'Artificial Intelligence', 'artificial_intelligence', 10, true, 1),
  ((SELECT id FROM assessment_questions WHERE question_text = 'What does AI stand for?' AND 'primary' = ANY(audience_filters) LIMIT 1),
   'Amazing Internet', 'amazing_internet', 0, false, 2),
  ((SELECT id FROM assessment_questions WHERE question_text = 'What does AI stand for?' AND 'primary' = ANY(audience_filters) LIMIT 1),
   'Automatic Information', 'automatic_information', 0, false, 3),
  ((SELECT id FROM assessment_questions WHERE question_text = 'What does AI stand for?' AND 'primary' = ANY(audience_filters) LIMIT 1),
   'Apple Intelligence', 'apple_intelligence', 0, false, 4);

-- Question 2: Beginner - AI in daily life
INSERT INTO assessment_questions (
  category_id,
  question_text,
  question_type,
  difficulty_level,
  cognitive_level,
  irt_difficulty,
  audience_filters,
  help_text,
  points_value,
  is_active
) VALUES (
  (SELECT id FROM assessment_categories WHERE name = 'Real-World Applications' LIMIT 1),
  'Which of these uses Artificial Intelligence?',
  'single_choice',
  'beginner',
  'understand',
  -1.2,
  ARRAY['primary'],
  'Think about devices that can understand what you say',
  10,
  true
);

INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index)
VALUES
  ((SELECT id FROM assessment_questions WHERE question_text = 'Which of these uses Artificial Intelligence?' AND 'primary' = ANY(audience_filters) LIMIT 1),
   'Voice assistants like Siri or Alexa', 'voice_assistants', 10, true, 1),
  ((SELECT id FROM assessment_questions WHERE question_text = 'Which of these uses Artificial Intelligence?' AND 'primary' = ANY(audience_filters) LIMIT 1),
   'A regular calculator', 'calculator', 0, false, 2),
  ((SELECT id FROM assessment_questions WHERE question_text = 'Which of these uses Artificial Intelligence?' AND 'primary' = ANY(audience_filters) LIMIT 1),
   'A bicycle', 'bicycle', 0, false, 3),
  ((SELECT id FROM assessment_questions WHERE question_text = 'Which of these uses Artificial Intelligence?' AND 'primary' = ANY(audience_filters) LIMIT 1),
   'A pencil', 'pencil', 0, false, 4);

-- Question 3: Intermediate - AI learning
INSERT INTO assessment_questions (
  category_id,
  question_text,
  question_type,
  difficulty_level,
  cognitive_level,
  irt_difficulty,
  audience_filters,
  help_text,
  points_value,
  is_active
) VALUES (
  (SELECT id FROM assessment_categories WHERE name = 'Machine Learning' LIMIT 1),
  'How does AI learn new things?',
  'single_choice',
  'intermediate',
  'understand',
  0.2,
  ARRAY['primary'],
  'AI learns from examples, just like you learn from practice',
  15,
  true
);

INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index)
VALUES
  ((SELECT id FROM assessment_questions WHERE question_text = 'How does AI learn new things?' AND 'primary' = ANY(audience_filters) LIMIT 1),
   'By looking at lots of examples and finding patterns', 'patterns', 15, true, 1),
  ((SELECT id FROM assessment_questions WHERE question_text = 'How does AI learn new things?' AND 'primary' = ANY(audience_filters) LIMIT 1),
   'By going to school like humans', 'school', 0, false, 2),
  ((SELECT id FROM assessment_questions WHERE question_text = 'How does AI learn new things?' AND 'primary' = ANY(audience_filters) LIMIT 1),
   'By reading books', 'books', 0, false, 3),
  ((SELECT id FROM assessment_questions WHERE question_text = 'How does AI learn new things?' AND 'primary' = ANY(audience_filters) LIMIT 1),
   'AI cannot learn anything new', 'cannot_learn', 0, false, 4);

-- =====================================================
-- TEENAGERS (SECONDARY) - AI-AWARENESS QUESTIONS
-- More technical, includes real-world applications
-- =====================================================

-- Question 4: Intermediate - AI vs Human Intelligence
INSERT INTO assessment_questions (
  category_id,
  question_text,
  question_type,
  difficulty_level,
  cognitive_level,
  irt_difficulty,
  audience_filters,
  help_text,
  points_value,
  is_active
) VALUES (
  (SELECT id FROM assessment_categories WHERE name = 'AI Fundamentals' LIMIT 1),
  'What is the main difference between human intelligence and artificial intelligence?',
  'single_choice',
  'intermediate',
  'understand',
  0.3,
  ARRAY['secondary'],
  'Consider what makes human thinking unique',
  15,
  true
);

INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index)
VALUES
  ((SELECT id FROM assessment_questions WHERE question_text = 'What is the main difference between human intelligence and artificial intelligence?' LIMIT 1),
   'AI is programmed by humans and lacks consciousness and emotions', 'programmed', 15, true, 1),
  ((SELECT id FROM assessment_questions WHERE question_text = 'What is the main difference between human intelligence and artificial intelligence?' LIMIT 1),
   'AI is smarter than humans in all areas', 'smarter', 0, false, 2),
  ((SELECT id FROM assessment_questions WHERE question_text = 'What is the main difference between human intelligence and artificial intelligence?' LIMIT 1),
   'There is no difference between them', 'no_difference', 0, false, 3),
  ((SELECT id FROM assessment_questions WHERE question_text = 'What is the main difference between human intelligence and artificial intelligence?' LIMIT 1),
   'AI can only do math problems', 'only_math', 0, false, 4);

-- Question 5: Intermediate - Machine Learning
INSERT INTO assessment_questions (
  category_id,
  question_text,
  question_type,
  difficulty_level,
  cognitive_level,
  irt_difficulty,
  audience_filters,
  help_text,
  points_value,
  is_active
) VALUES (
  (SELECT id FROM assessment_categories WHERE name = 'Machine Learning' LIMIT 1),
  'What is machine learning?',
  'single_choice',
  'intermediate',
  'understand',
  0.5,
  ARRAY['secondary'],
  'Think about how AI improves over time',
  15,
  true
);

INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index)
VALUES
  ((SELECT id FROM assessment_questions WHERE question_text = 'What is machine learning?' LIMIT 1),
   'A type of AI that learns from data without being explicitly programmed', 'learns_from_data', 15, true, 1),
  ((SELECT id FROM assessment_questions WHERE question_text = 'What is machine learning?' LIMIT 1),
   'A way to teach robots to walk', 'teach_robots', 0, false, 2),
  ((SELECT id FROM assessment_questions WHERE question_text = 'What is machine learning?' LIMIT 1),
   'A computer science course in school', 'course', 0, false, 3),
  ((SELECT id FROM assessment_questions WHERE question_text = 'What is machine learning?' LIMIT 1),
   'A software that helps students study', 'study_software', 0, false, 4);

-- Question 6: Advanced - AI Ethics
INSERT INTO assessment_questions (
  category_id,
  question_text,
  question_type,
  difficulty_level,
  cognitive_level,
  irt_difficulty,
  audience_filters,
  help_text,
  points_value,
  is_active
) VALUES (
  (SELECT id FROM assessment_categories WHERE name = 'AI Ethics & Bias' LIMIT 1),
  'Why is AI bias a concern?',
  'single_choice',
  'advanced',
  'analyze',
  0.8,
  ARRAY['secondary'],
  'Consider how AI systems are trained with data from the real world',
  20,
  true
);

INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index)
VALUES
  ((SELECT id FROM assessment_questions WHERE question_text = 'Why is AI bias a concern?' LIMIT 1),
   'AI can inherit biases from training data and make unfair decisions', 'inherit_bias', 20, true, 1),
  ((SELECT id FROM assessment_questions WHERE question_text = 'Why is AI bias a concern?' LIMIT 1),
   'AI is always biased against humans', 'always_biased', 0, false, 2),
  ((SELECT id FROM assessment_questions WHERE question_text = 'Why is AI bias a concern?' LIMIT 1),
   'AI bias is not a real problem', 'not_problem', 0, false, 3),
  ((SELECT id FROM assessment_questions WHERE question_text = 'Why is AI bias a concern?' LIMIT 1),
   'AI prefers certain programming languages', 'prefers_languages', 0, false, 4);

-- =====================================================
-- PROFESSIONALS - AI-AWARENESS QUESTIONS
-- Business-focused, strategic applications
-- =====================================================

-- Question 7: Intermediate - AI in Business
INSERT INTO assessment_questions (
  category_id,
  question_text,
  question_type,
  difficulty_level,
  cognitive_level,
  irt_difficulty,
  audience_filters,
  help_text,
  points_value,
  is_active
) VALUES (
  (SELECT id FROM assessment_categories WHERE name = 'Real-World Applications' LIMIT 1),
  'Which business function benefits MOST from AI-powered predictive analytics?',
  'single_choice',
  'intermediate',
  'apply',
  0.6,
  ARRAY['professional'],
  'Think about forecasting and planning',
  15,
  true
);

INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index)
VALUES
  ((SELECT id FROM assessment_questions WHERE question_text = 'Which business function benefits MOST from AI-powered predictive analytics?' LIMIT 1),
   'Demand forecasting and inventory management', 'demand_forecasting', 15, true, 1),
  ((SELECT id FROM assessment_questions WHERE question_text = 'Which business function benefits MOST from AI-powered predictive analytics?' LIMIT 1),
   'Employee lunch scheduling', 'lunch_scheduling', 0, false, 2),
  ((SELECT id FROM assessment_questions WHERE question_text = 'Which business function benefits MOST from AI-powered predictive analytics?' LIMIT 1),
   'Office decoration choices', 'decoration', 0, false, 3),
  ((SELECT id FROM assessment_questions WHERE question_text = 'Which business function benefits MOST from AI-powered predictive analytics?' LIMIT 1),
   'Parking space allocation', 'parking', 0, false, 4);

-- Question 8: Advanced - AI Implementation
INSERT INTO assessment_questions (
  category_id,
  question_text,
  question_type,
  difficulty_level,
  cognitive_level,
  irt_difficulty,
  audience_filters,
  help_text,
  points_value,
  is_active
) VALUES (
  (SELECT id FROM assessment_categories WHERE name = 'AI Fundamentals' LIMIT 1),
  'What is the FIRST step in implementing an AI solution for a business problem?',
  'single_choice',
  'advanced',
  'apply',
  1.0,
  ARRAY['professional'],
  'Start with understanding the problem, not the technology',
  20,
  true
);

INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index)
VALUES
  ((SELECT id FROM assessment_questions WHERE question_text = 'What is the FIRST step in implementing an AI solution for a business problem?' LIMIT 1),
   'Clearly define the business problem and success metrics', 'define_problem', 20, true, 1),
  ((SELECT id FROM assessment_questions WHERE question_text = 'What is the FIRST step in implementing an AI solution for a business problem?' LIMIT 1),
   'Buy the most expensive AI software', 'buy_software', 0, false, 2),
  ((SELECT id FROM assessment_questions WHERE question_text = 'What is the FIRST step in implementing an AI solution for a business problem?' LIMIT 1),
   'Hire a team of data scientists', 'hire_team', 0, false, 3),
  ((SELECT id FROM assessment_questions WHERE question_text = 'What is the FIRST step in implementing an AI solution for a business problem?' LIMIT 1),
   'Collect as much data as possible', 'collect_data', 0, false, 4);

-- Question 9: Advanced - AI Ethics in Business
INSERT INTO assessment_questions (
  category_id,
  question_text,
  question_type,
  difficulty_level,
  cognitive_level,
  irt_difficulty,
  audience_filters,
  help_text,
  points_value,
  is_active
) VALUES (
  (SELECT id FROM assessment_categories WHERE name = 'AI Ethics & Bias' LIMIT 1),
  'In the context of responsible AI, what does "explainability" mean?',
  'single_choice',
  'advanced',
  'understand',
  1.2,
  ARRAY['professional'],
  'Consider transparency and trust in AI decisions',
  20,
  true
);

INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index)
VALUES
  ((SELECT id FROM assessment_questions WHERE question_text = 'In the context of responsible AI, what does "explainability" mean?' LIMIT 1),
   'The ability to understand and interpret how an AI system makes decisions', 'interpret_decisions', 20, true, 1),
  ((SELECT id FROM assessment_questions WHERE question_text = 'In the context of responsible AI, what does "explainability" mean?' LIMIT 1),
   'The ability to explain AI to non-technical people only', 'explain_non_technical', 0, false, 2),
  ((SELECT id FROM assessment_questions WHERE question_text = 'In the context of responsible AI, what does "explainability" mean?' LIMIT 1),
   'Writing documentation for AI code', 'write_docs', 0, false, 3),
  ((SELECT id FROM assessment_questions WHERE question_text = 'In the context of responsible AI, what does "explainability" mean?' LIMIT 1),
   'Making AI run faster', 'run_faster', 0, false, 4);

-- =====================================================
-- LINK QUESTIONS TO AI-AWARENESS TOOL
-- =====================================================

-- Get the AI-Awareness tool ID
DO $$
DECLARE
  v_tool_id UUID;
  v_question_id UUID;
BEGIN
  SELECT id INTO v_tool_id FROM assessment_tools WHERE slug = 'ai-awareness';

  -- Link all AI-Awareness questions to the tool
  FOR v_question_id IN
    SELECT id FROM assessment_questions
    WHERE 'primary' = ANY(audience_filters)
       OR 'secondary' = ANY(audience_filters)
       OR 'professional' = ANY(audience_filters)
    AND is_active = true
    LIMIT 9
  LOOP
    INSERT INTO assessment_question_pools (tool_id, question_id, is_active, weight)
    VALUES (v_tool_id, v_question_id, true, 1.0)
    ON CONFLICT (tool_id, question_id) DO NOTHING;
  END LOOP;
END $$;

-- =====================================================
-- UPDATE TOOL METADATA
-- =====================================================

UPDATE assessment_tools
SET total_questions_pool = (
  SELECT COUNT(*)
  FROM assessment_question_pools
  WHERE tool_id = (SELECT id FROM assessment_tools WHERE slug = 'ai-awareness')
)
WHERE slug = 'ai-awareness';
