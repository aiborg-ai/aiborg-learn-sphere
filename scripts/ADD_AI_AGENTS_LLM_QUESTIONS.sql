-- Additional Assessment Questions: AI Agents, LLM Fundamentals, and Platform-Specific
-- Adding questions from AI Agents Quiz, LLM Quiz (10.11), and Lovable.dev Rapid Quiz

-- =====================================================
-- STEP 1: Add new categories if needed
-- =====================================================

DO $$
BEGIN
  -- AI Agents category
  IF NOT EXISTS (SELECT 1 FROM assessment_categories WHERE name = 'AI Agents') THEN
    INSERT INTO assessment_categories (name, description, icon, weight, order_index)
    VALUES ('AI Agents', 'Understanding autonomous AI agents, architectures, and agent-based systems', 'Bot', 1.1, 10);
  END IF;

  -- LLM Fundamentals category
  IF NOT EXISTS (SELECT 1 FROM assessment_categories WHERE name = 'LLM Fundamentals') THEN
    INSERT INTO assessment_categories (name, description, icon, weight, order_index)
    VALUES ('LLM Fundamentals', 'Core concepts of Large Language Models, architecture, training, and limitations', 'Brain', 1.2, 11);
  END IF;

  -- Development Platforms category
  IF NOT EXISTS (SELECT 1 FROM assessment_categories WHERE name = 'Development Platforms') THEN
    INSERT INTO assessment_categories (name, description, icon, weight, order_index)
    VALUES ('Development Platforms', 'AI-powered development platforms and tools knowledge', 'Layers', 1.0, 12);
  END IF;
END $$;

-- =====================================================
-- STEP 2: Add AI Agents Quiz Questions (5 questions)
-- =====================================================

INSERT INTO assessment_questions (
  category_id, question_text, question_type, help_text, audience_filters,
  order_index, points_value, is_active
) VALUES

-- AI Agents Q1
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Agents'),
  'Which of the following best describes an agent in Artificial Intelligence?',
  'single_choice',
  'Understanding the fundamental definition of an AI agent',
  ARRAY['professional', 'secondary'],
  110, 10, true
),

-- AI Agents Q2
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Agents'),
  'What type of AI agent makes decisions solely on the current percept, with no internal memory of past percepts?',
  'single_choice',
  'Understanding different types of AI agents',
  ARRAY['professional', 'secondary'],
  111, 10, true
),

-- AI Agents Q3
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Agents'),
  'A robotic vacuum cleaner (e.g. Roomba) primarily operates as which kind of agent?',
  'single_choice',
  'Applying agent concepts to real-world examples',
  ARRAY['professional', 'secondary'],
  112, 10, true
),

-- AI Agents Q4
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Agents'),
  'In the PEAS (Performance, Environment, Actuators, Sensors) framework, which element would "dust-detection sensor" belong to for a cleaning robot?',
  'single_choice',
  'Understanding the PEAS framework for agent design',
  ARRAY['professional', 'secondary'],
  113, 10, true
),

-- AI Agents Q5
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Agents'),
  'Why is exploration important for a learning agent?',
  'single_choice',
  'Understanding learning agent behavior',
  ARRAY['professional', 'secondary'],
  114, 10, true
);

-- =====================================================
-- STEP 3: Add LLM Fundamentals Quiz Questions (6 questions)
-- =====================================================

INSERT INTO assessment_questions (
  category_id, question_text, question_type, help_text, audience_filters,
  order_index, points_value, is_active
) VALUES

-- LLM Q1
(
  (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals'),
  'What is "rubber ducking"?',
  'single_choice',
  'Understanding problem-solving techniques in programming',
  ARRAY['professional', 'secondary'],
  115, 10, true
),

-- LLM Q2
(
  (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals'),
  'What is the MAIN purpose of a large language model (LLM)?',
  'single_choice',
  'Understanding the fundamental purpose of LLMs',
  ARRAY['professional', 'secondary'],
  116, 10, true
),

-- LLM Q3
(
  (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals'),
  'During training, an LLM adjusts millions (or even billions) of tiny values called "parameters." What do these parameters represent?',
  'single_choice',
  'Understanding LLM architecture and training',
  ARRAY['professional', 'secondary'],
  117, 10, true
),

-- LLM Q4
(
  (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals'),
  'Which of the following best describes "tokenization" in an LLM?',
  'single_choice',
  'Understanding how LLMs process text',
  ARRAY['professional', 'secondary'],
  118, 10, true
),

-- LLM Q5
(
  (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals'),
  'Why do LLMs sometimes give confident-sounding answers that are actually wrong (a phenomenon called "hallucination")?',
  'single_choice',
  'Understanding LLM limitations and hallucination',
  ARRAY['professional', 'secondary'],
  119, 10, true
),

-- LLM Q6
(
  (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals'),
  'A teacher wants students to use an LLM ethically while writing essays. Which guideline BEST promotes academic honesty?',
  'single_choice',
  'Understanding ethical AI use in education',
  ARRAY['professional', 'secondary', 'primary'],
  120, 10, true
);

-- =====================================================
-- STEP 4: Add Lovable.dev Rapid Quiz Questions (5 questions)
-- =====================================================

INSERT INTO assessment_questions (
  category_id, question_text, question_type, help_text, audience_filters,
  order_index, points_value, is_active
) VALUES

-- Lovable Q1
(
  (SELECT id FROM assessment_categories WHERE name = 'Development Platforms'),
  'What technology stack does Lovable.dev use?',
  'single_choice',
  'Understanding Lovable.dev platform architecture',
  ARRAY['professional'],
  121, 10, true
),

-- Lovable Q2
(
  (SELECT id FROM assessment_categories WHERE name = 'Development Platforms'),
  'How does Lovable.dev handle code ownership?',
  'single_choice',
  'Understanding code ownership in AI development platforms',
  ARRAY['professional', 'business'],
  122, 10, true
),

-- Lovable Q3
(
  (SELECT id FROM assessment_categories WHERE name = 'Development Platforms'),
  'What''s the main advantage of Lovable over traditional coding?',
  'single_choice',
  'Understanding benefits of AI-assisted development',
  ARRAY['professional', 'business'],
  123, 10, true
),

-- Lovable Q4
(
  (SELECT id FROM assessment_categories WHERE name = 'Development Platforms'),
  'True or False: Lovable can integrate with external APIs like OpenAI',
  'single_choice',
  'Understanding platform integration capabilities',
  ARRAY['professional'],
  124, 10, true
),

-- Lovable Q5
(
  (SELECT id FROM assessment_categories WHERE name = 'Development Platforms'),
  'Which pricing model does Lovable use?',
  'single_choice',
  'Understanding platform pricing models',
  ARRAY['professional', 'business'],
  125, 10, true
);

-- =====================================================
-- STEP 5: Add Answer Options for AI Agents Questions
-- =====================================================

DO $$
DECLARE
  aia1_id UUID; aia2_id UUID; aia3_id UUID; aia4_id UUID; aia5_id UUID;
  llm1_id UUID; llm2_id UUID; llm3_id UUID; llm4_id UUID; llm5_id UUID; llm6_id UUID;
  lov1_id UUID; lov2_id UUID; lov3_id UUID; lov4_id UUID; lov5_id UUID;
BEGIN
  -- Get AI Agents question IDs
  SELECT id INTO aia1_id FROM assessment_questions
  WHERE question_text = 'Which of the following best describes an agent in Artificial Intelligence?'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'AI Agents');

  SELECT id INTO aia2_id FROM assessment_questions
  WHERE question_text LIKE 'What type of AI agent makes decisions solely on the current percept%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'AI Agents');

  SELECT id INTO aia3_id FROM assessment_questions
  WHERE question_text LIKE 'A robotic vacuum cleaner%Roomba%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'AI Agents');

  SELECT id INTO aia4_id FROM assessment_questions
  WHERE question_text LIKE '%PEAS%dust-detection sensor%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'AI Agents');

  SELECT id INTO aia5_id FROM assessment_questions
  WHERE question_text LIKE 'Why is exploration important for a learning agent%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'AI Agents');

  -- Get LLM Fundamentals question IDs
  SELECT id INTO llm1_id FROM assessment_questions
  WHERE question_text = 'What is "rubber ducking"?'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals');

  SELECT id INTO llm2_id FROM assessment_questions
  WHERE question_text LIKE '%MAIN purpose of a large language model%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals');

  SELECT id INTO llm3_id FROM assessment_questions
  WHERE question_text LIKE '%parameters%What do these parameters represent%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals');

  SELECT id INTO llm4_id FROM assessment_questions
  WHERE question_text LIKE '%best describes "tokenization"%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals');

  SELECT id INTO llm5_id FROM assessment_questions
  WHERE question_text LIKE '%hallucination%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals');

  SELECT id INTO llm6_id FROM assessment_questions
  WHERE question_text LIKE '%teacher wants students to use an LLM ethically%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals');

  -- Get Lovable.dev question IDs
  SELECT id INTO lov1_id FROM assessment_questions
  WHERE question_text LIKE '%technology stack does Lovable.dev use%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Development Platforms');

  SELECT id INTO lov2_id FROM assessment_questions
  WHERE question_text LIKE '%Lovable.dev handle code ownership%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Development Platforms');

  SELECT id INTO lov3_id FROM assessment_questions
  WHERE question_text LIKE '%main advantage of Lovable over traditional%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Development Platforms');

  SELECT id INTO lov4_id FROM assessment_questions
  WHERE question_text LIKE '%Lovable can integrate with external APIs%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Development Platforms');

  SELECT id INTO lov5_id FROM assessment_questions
  WHERE question_text LIKE '%pricing model does Lovable use%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Development Platforms');

  -- AI Agents Q1 Options (Answer: B)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (aia1_id, 'A piece of hardware that stores data only', 'hardware_storage', 0, false, 1),
    (aia1_id, 'A system that perceives its environment and takes actions to maximize its chances of success', 'perceives_acts', 10, true, 2),
    (aia1_id, 'A set of rules written in natural language', 'natural_rules', 0, false, 3),
    (aia1_id, 'A human supervising a computer program', 'human_supervisor', 0, false, 4);

  -- AI Agents Q2 Options (Answer: D - Reflex/reactive agent)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (aia2_id, 'Model-based agent', 'model_based', 0, false, 1),
    (aia2_id, 'Goal-based agent', 'goal_based', 0, false, 2),
    (aia2_id, 'Utility-based agent', 'utility_based', 0, false, 3),
    (aia2_id, 'Reflex (reactive) agent', 'reflex_reactive', 10, true, 4);

  -- AI Agents Q3 Options (Answer: D - Model-based reflex agent or Goal-based agent)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (aia3_id, 'Multi-agent system', 'multi_agent', 0, false, 1),
    (aia3_id, 'Simple reflex agent', 'simple_reflex', 0, false, 2),
    (aia3_id, 'Learning agent', 'learning', 0, false, 3),
    (aia3_id, 'Model-based reflex agent or Goal-based agent', 'model_goal_based', 10, true, 4);

  -- AI Agents Q4 Options (Answer: D - Sensor)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (aia4_id, 'Performance measure', 'performance', 0, false, 1),
    (aia4_id, 'Environment', 'environment', 0, false, 2),
    (aia4_id, 'Actuator', 'actuator', 0, false, 3),
    (aia4_id, 'Sensor', 'sensor', 10, true, 4);

  -- AI Agents Q5 Options (Answer: B)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (aia5_id, 'It allows the agent to reduce the size of its sensors', 'reduce_sensors', 0, false, 1),
    (aia5_id, 'It helps the agent discover new actions and improve future decisions', 'discover_actions', 10, true, 2),
    (aia5_id, 'It guarantees perfect accuracy in every decision', 'perfect_accuracy', 0, false, 3),
    (aia5_id, 'It removes the need for actuators', 'no_actuators', 0, false, 4);

  -- LLM Q1 Options (Answer: B)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (llm1_id, 'Tactics to let physical AI play with rubber duck to enhance its hand mobility', 'physical_tactics', 0, false, 1),
    (llm1_id, 'A problem-solving technique in which a person explains a problem to an inanimate object', 'problem_solving', 10, true, 2),
    (llm1_id, 'Measuring how much rubber it will take to create a floating duck with maximum weight', 'measuring_rubber', 0, false, 3);

  -- LLM Q2 Options (Answer: B)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (llm2_id, 'To store photographs in high resolution', 'store_photos', 0, false, 1),
    (llm2_id, 'To predict and generate human-like text based on patterns it learned', 'predict_generate', 10, true, 2),
    (llm2_id, 'To build physical robots for factories', 'build_robots', 0, false, 3),
    (llm2_id, 'To transmit data through fiber-optic cables', 'transmit_data', 0, false, 4);

  -- LLM Q3 Options (Answer: C)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (llm3_id, 'The amount of computer memory in the server', 'memory_amount', 0, false, 1),
    (llm3_id, 'The color coding of the user interface', 'color_coding', 0, false, 2),
    (llm3_id, 'Weights that decide how much importance to give to different pieces of input text', 'weights_importance', 10, true, 3),
    (llm3_id, 'The legal regulations that govern AI safety', 'legal_regulations', 0, false, 4);

  -- LLM Q4 Options (Answer: A)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (llm4_id, 'Turning sentences into small chunks (words or sub-words) the model can process', 'turning_chunks', 10, true, 1),
    (llm4_id, 'Encrypting text so only the model owner can read it', 'encrypting', 0, false, 2),
    (llm4_id, 'Converting text to binary (ones and zeros) for storage', 'binary_conversion', 0, false, 3),
    (llm4_id, 'Using real money to pay for faster responses', 'real_money', 0, false, 4);

  -- LLM Q5 Options (Answer: B)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (llm5_id, 'They purposely try to trick users to test security', 'trick_security', 0, false, 1),
    (llm5_id, 'Their responses are based on patterns, not true understanding or fact-checking', 'patterns_not_understanding', 10, true, 2),
    (llm5_id, 'They randomly lose internet connection mid-sentence', 'lose_connection', 0, false, 3),
    (llm5_id, 'They are limited to 1 GB of memory', 'limited_memory', 0, false, 4);

  -- LLM Q6 Options (Answer: C)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (llm6_id, 'Copy-and-paste the model''s entire response into your paper without changes', 'copy_paste', 0, false, 1),
    (llm6_id, 'Ask the model to write the essay in a different language and then translate it back', 'different_language', 0, false, 2),
    (llm6_id, 'Use the model for brainstorming ideas, but cite any direct quotes and do your own analysis', 'brainstorming_cite', 10, true, 3),
    (llm6_id, 'Disable the plagiarism checker so the teacher won''t detect AI help', 'disable_checker', 0, false, 4);

  -- Lovable Q1 Options (Answer: b)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (lov1_id, 'Vue + Python + MySQL', 'vue_python_mysql', 0, false, 1),
    (lov1_id, 'React + Node.js + Supabase', 'react_node_supabase', 10, true, 2),
    (lov1_id, 'Angular + PHP + MongoDB', 'angular_php_mongo', 0, false, 3);

  -- Lovable Q2 Options (Answer: b)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (lov2_id, 'Code stays on platform', 'stays_platform', 0, false, 1),
    (lov2_id, 'Export to GitHub', 'export_github', 10, true, 2),
    (lov2_id, 'Download zip file only', 'download_zip', 0, false, 3);

  -- Lovable Q3 Options (Answer: c)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (lov3_id, 'Cheaper hosting', 'cheaper_hosting', 0, false, 1),
    (lov3_id, 'Better performance', 'better_performance', 0, false, 2),
    (lov3_id, '20x faster development', 'faster_development', 10, true, 3);

  -- Lovable Q4 Options (Answer: True)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (lov4_id, 'True', 'true', 10, true, 1),
    (lov4_id, 'False', 'false', 0, false, 2);

  -- Lovable Q5 Options (Answer: b)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (lov5_id, 'Per app built', 'per_app', 0, false, 1),
    (lov5_id, 'Credit-based system', 'credit_based', 10, true, 2),
    (lov5_id, 'Unlimited flat rate', 'unlimited_flat', 0, false, 3);

END $$;

-- =====================================================
-- STEP 6: Verify the additions
-- =====================================================

SELECT
  c.name as category,
  COUNT(DISTINCT q.id) as question_count,
  COUNT(o.id) as option_count
FROM assessment_categories c
LEFT JOIN assessment_questions q ON q.category_id = c.id
LEFT JOIN assessment_question_options o ON o.question_id = q.id
WHERE c.name IN ('AI Agents', 'LLM Fundamentals', 'Development Platforms')
GROUP BY c.name
ORDER BY c.name;

-- Summary of all new questions
SELECT
  q.order_index,
  LEFT(q.question_text, 70) || '...' as question,
  COUNT(o.id) as options,
  SUM(CASE WHEN o.is_correct THEN 1 ELSE 0 END) as correct_answers
FROM assessment_questions q
LEFT JOIN assessment_question_options o ON o.question_id = q.id
WHERE q.category_id IN (
  SELECT id FROM assessment_categories
  WHERE name IN ('AI Agents', 'LLM Fundamentals', 'Development Platforms')
)
GROUP BY q.id, q.order_index, q.question_text
ORDER BY q.order_index;
