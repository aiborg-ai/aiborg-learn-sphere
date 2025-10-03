-- Combined SQL script to add Prompt Engineering questions to assessment database
-- Execute this file using your Supabase SQL editor or CLI

-- =====================================================
-- STEP 1: Add Prompt Engineering Category
-- =====================================================

INSERT INTO assessment_categories (name, description, icon, weight, order_index) VALUES
('Prompt Engineering', 'Advanced prompt engineering techniques, frameworks, and best practices for AI', 'MessageSquare', 1.2, 9)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  weight = EXCLUDED.weight,
  order_index = EXCLUDED.order_index;

-- =====================================================
-- STEP 2: Add Assessment Questions
-- =====================================================

INSERT INTO assessment_questions (
  category_id, question_text, question_type, help_text, audience_filters,
  order_index, points_value, is_active
) VALUES

-- Mastery Quiz Question 1
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What is the primary purpose of prompt engineering?',
  'single_choice',
  'Understanding the fundamental goal of prompt engineering',
  ARRAY['professional', 'secondary'],
  85, 10, true
),

-- Mastery Quiz Question 2
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Which prompting technique requires NO examples and relies solely on the model''s pre-existing knowledge?',
  'single_choice',
  'Understanding different prompting approaches',
  ARRAY['professional', 'secondary'],
  86, 10, true
),

-- Mastery Quiz Question 3
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'In the PGTC framework for prompt engineering, what does the "C" stand for?',
  'single_choice',
  'Understanding the PGTC (Persona-Goal-Task-Context) framework',
  ARRAY['professional', 'secondary'],
  87, 10, true
),

-- Mastery Quiz Question 4
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Chain-of-Thought (CoT) prompting is most effective for which type of tasks?',
  'single_choice',
  'Understanding when to use Chain-of-Thought prompting',
  ARRAY['professional', 'secondary'],
  88, 10, true
),

-- Mastery Quiz Question 5
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What is a major limitation of prompt engineering that practitioners must consider?',
  'single_choice',
  'Understanding the challenges and limitations',
  ARRAY['professional', 'secondary'],
  89, 10, true
),

-- Mastery Quiz Question 6
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Which of the following is NOT a key component of effective prompt structure?',
  'single_choice',
  'Identifying components that do NOT belong in prompts',
  ARRAY['professional', 'secondary'],
  90, 10, true
),

-- Mastery Quiz Question 7
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'In few-shot prompting, what is the recommended approach when examples don''t improve performance?',
  'single_choice',
  'Troubleshooting few-shot prompting',
  ARRAY['professional', 'secondary'],
  91, 10, true
),

-- Mastery Quiz Question 8
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What does "hallucination" mean in the context of AI responses?',
  'single_choice',
  'Understanding AI model behaviors and issues',
  ARRAY['professional', 'secondary'],
  92, 10, true
),

-- Mastery Quiz Question 9
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Which prompt engineering technique is specifically designed to make AI show its reasoning process step-by-step?',
  'single_choice',
  'Understanding reasoning techniques',
  ARRAY['professional', 'secondary'],
  93, 10, true
),

-- Mastery Quiz Question 10
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What is the most common mistake in prompt engineering according to research?',
  'single_choice',
  'Identifying common pitfalls',
  ARRAY['professional', 'secondary'],
  94, 10, true
),

-- Mastery Quiz Question 11
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'In enterprise applications, prompt engineering is most valuable for which use case?',
  'single_choice',
  'Understanding business applications',
  ARRAY['professional', 'business'],
  95, 10, true
),

-- Mastery Quiz Question 12
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What is "prompt injection" and why is it a concern?',
  'single_choice',
  'Understanding security vulnerabilities in prompts',
  ARRAY['professional', 'business'],
  96, 10, true
),

-- Mastery Quiz Question 13
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Which evaluation metric is most important for assessing prompt effectiveness in factual tasks?',
  'single_choice',
  'Understanding evaluation methods',
  ARRAY['professional', 'secondary'],
  97, 10, true
),

-- Mastery Quiz Question 14
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'The SCAMPER methodology in prompt engineering stands for:',
  'single_choice',
  'Understanding advanced frameworks',
  ARRAY['professional', 'secondary'],
  98, 10, true
),

-- Mastery Quiz Question 15
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What is the primary advantage of using personas in prompt engineering?',
  'single_choice',
  'Understanding the role of personas',
  ARRAY['professional', 'secondary'],
  99, 10, true
),

-- Mastery Quiz Question 16
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'In prompt engineering, what does "temperature" control?',
  'single_choice',
  'Understanding model parameters',
  ARRAY['professional', 'secondary'],
  100, 10, true
),

-- Mastery Quiz Question 17
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Which of these is a best practice for handling complex multi-part requests?',
  'single_choice',
  'Understanding complex prompt strategies',
  ARRAY['professional', 'secondary'],
  101, 10, true
),

-- Mastery Quiz Question 18
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What is the main challenge with evaluating prompt effectiveness in creative tasks?',
  'single_choice',
  'Understanding evaluation challenges',
  ARRAY['professional', 'secondary'],
  102, 10, true
),

-- Mastery Quiz Question 19
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'In the context of AI safety and responsible use, what should prompt engineers prioritize?',
  'single_choice',
  'Understanding ethical considerations',
  ARRAY['professional', 'business'],
  103, 10, true
),

-- Mastery Quiz Question 20
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What emerging trend is shaping the future of prompt engineering?',
  'single_choice',
  'Understanding industry trends',
  ARRAY['professional', 'business'],
  104, 10, true
),

-- Rapid Quiz Question 1
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Which key parameter removes guess-work in OpenAI chat calls?',
  'single_choice',
  'Understanding OpenAI API parameters for structured outputs',
  ARRAY['professional'],
  105, 10, true
),

-- Rapid Quiz Question 2
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'JSON prompts are especially useful when working with:',
  'single_choice',
  'Understanding when to use JSON mode',
  ARRAY['professional'],
  106, 10, true
),

-- Rapid Quiz Question 3
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'True or False: JSON mode alone guarantees adherence to your custom schema.',
  'single_choice',
  'Understanding JSON mode limitations',
  ARRAY['professional'],
  107, 10, true
),

-- Rapid Quiz Question 4
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'In a JSON prompt, use which field to force the model''s tone?',
  'text_input',
  'Understanding how to control tone in structured prompts. Answer: "style"',
  ARRAY['professional'],
  108, 10, true
),

-- Rapid Quiz Question 5
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Benefits of JSON prompting include: (Select all that apply)',
  'multiple_choice',
  'Understanding multiple benefits of structured prompting',
  ARRAY['professional'],
  109, 10, true
);

-- =====================================================
-- STEP 3: Add Answer Options
-- =====================================================

-- Q1 Options: Primary purpose
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index)
SELECT id, 'To train new AI models from scratch', false, 1
FROM assessment_questions WHERE question_text = 'What is the primary purpose of prompt engineering?'
UNION ALL
SELECT id, 'To design effective inputs that guide AI models toward desired outputs', true, 2
FROM assessment_questions WHERE question_text = 'What is the primary purpose of prompt engineering?'
UNION ALL
SELECT id, 'To debug AI model architecture', false, 3
FROM assessment_questions WHERE question_text = 'What is the primary purpose of prompt engineering?'
UNION ALL
SELECT id, 'To increase computational speed of AI systems', false, 4
FROM assessment_questions WHERE question_text = 'What is the primary purpose of prompt engineering?';

-- Q2 Options: Zero-shot
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index)
SELECT id, 'Few-shot prompting', false, 1
FROM assessment_questions WHERE question_text LIKE 'Which prompting technique requires NO examples%'
UNION ALL
SELECT id, 'Chain-of-thought prompting', false, 2
FROM assessment_questions WHERE question_text LIKE 'Which prompting technique requires NO examples%'
UNION ALL
SELECT id, 'Zero-shot prompting', true, 3
FROM assessment_questions WHERE question_text LIKE 'Which prompting technique requires NO examples%'
UNION ALL
SELECT id, 'Self-consistency prompting', false, 4
FROM assessment_questions WHERE question_text LIKE 'Which prompting technique requires NO examples%';

-- Q3 Options: PGTC "C"
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index)
SELECT id, 'Creativity', false, 1
FROM assessment_questions WHERE question_text LIKE '%PGTC framework%what does the "C" stand for%'
UNION ALL
SELECT id, 'Constraints', false, 2
FROM assessment_questions WHERE question_text LIKE '%PGTC framework%what does the "C" stand for%'
UNION ALL
SELECT id, 'Context', true, 3
FROM assessment_questions WHERE question_text LIKE '%PGTC framework%what does the "C" stand for%'
UNION ALL
SELECT id, 'Completion', false, 4
FROM assessment_questions WHERE question_text LIKE '%PGTC framework%what does the "C" stand for%';

-- Q4 Options: Chain-of-Thought effectiveness
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index)
SELECT id, 'Simple factual retrieval', false, 1
FROM assessment_questions WHERE question_text LIKE 'Chain-of-Thought (CoT) prompting is most effective%'
UNION ALL
SELECT id, 'Creative writing only', false, 2
FROM assessment_questions WHERE question_text LIKE 'Chain-of-Thought (CoT) prompting is most effective%'
UNION ALL
SELECT id, 'Complex reasoning and multi-step problem solving', true, 3
FROM assessment_questions WHERE question_text LIKE 'Chain-of-Thought (CoT) prompting is most effective%'
UNION ALL
SELECT id, 'Image generation tasks', false, 4
FROM assessment_questions WHERE question_text LIKE 'Chain-of-Thought (CoT) prompting is most effective%';

-- Q5 Options: Major limitation
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index)
SELECT id, 'It only works with GPT models', false, 1
FROM assessment_questions WHERE question_text LIKE 'What is a major limitation of prompt engineering%'
UNION ALL
SELECT id, 'Prompts can be brittle and may not transfer well between different AI models', true, 2
FROM assessment_questions WHERE question_text LIKE 'What is a major limitation of prompt engineering%'
UNION ALL
SELECT id, 'It requires extensive coding knowledge', false, 3
FROM assessment_questions WHERE question_text LIKE 'What is a major limitation of prompt engineering%'
UNION ALL
SELECT id, 'It can only be used for text generation', false, 4
FROM assessment_questions WHERE question_text LIKE 'What is a major limitation of prompt engineering%';

-- Q6 Options: NOT a component
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index)
SELECT id, 'Role/Persona definition', false, 1
FROM assessment_questions WHERE question_text LIKE '%NOT a key component of effective prompt structure%'
UNION ALL
SELECT id, 'Task specification', false, 2
FROM assessment_questions WHERE question_text LIKE '%NOT a key component of effective prompt structure%'
UNION ALL
SELECT id, 'Random token insertion', true, 3
FROM assessment_questions WHERE question_text LIKE '%NOT a key component of effective prompt structure%'
UNION ALL
SELECT id, 'Context provision', false, 4
FROM assessment_questions WHERE question_text LIKE '%NOT a key component of effective prompt structure%';

-- Q7 Options: Few-shot troubleshooting
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index)
SELECT id, 'Add more examples immediately', false, 1
FROM assessment_questions WHERE question_text LIKE '%few-shot prompting%examples don''t improve performance%'
UNION ALL
SELECT id, 'Check if examples are diverse and high-quality, then consider zero-shot', true, 2
FROM assessment_questions WHERE question_text LIKE '%few-shot prompting%examples don''t improve performance%'
UNION ALL
SELECT id, 'Switch to a different AI model', false, 3
FROM assessment_questions WHERE question_text LIKE '%few-shot prompting%examples don''t improve performance%'
UNION ALL
SELECT id, 'Increase the temperature setting', false, 4
FROM assessment_questions WHERE question_text LIKE '%few-shot prompting%examples don''t improve performance%';

-- Q8 Options: Hallucination
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index)
SELECT id, 'The AI generates creative and imaginative content', false, 1
FROM assessment_questions WHERE question_text LIKE '%hallucination%mean in the context of AI%'
UNION ALL
SELECT id, 'The AI produces confident-sounding but factually incorrect information', true, 2
FROM assessment_questions WHERE question_text LIKE '%hallucination%mean in the context of AI%'
UNION ALL
SELECT id, 'The AI refuses to answer questions', false, 3
FROM assessment_questions WHERE question_text LIKE '%hallucination%mean in the context of AI%'
UNION ALL
SELECT id, 'The AI generates duplicate responses', false, 4
FROM assessment_questions WHERE question_text LIKE '%hallucination%mean in the context of AI%';

-- Q9 Options: Step-by-step reasoning
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index)
SELECT id, 'Role-playing prompts', false, 1
FROM assessment_questions WHERE question_text LIKE '%designed to make AI show its reasoning process step-by-step%'
UNION ALL
SELECT id, 'Chain-of-Thought prompting', true, 2
FROM assessment_questions WHERE question_text LIKE '%designed to make AI show its reasoning process step-by-step%'
UNION ALL
SELECT id, 'Temperature adjustment', false, 3
FROM assessment_questions WHERE question_text LIKE '%designed to make AI show its reasoning process step-by-step%'
UNION ALL
SELECT id, 'Token limiting', false, 4
FROM assessment_questions WHERE question_text LIKE '%designed to make AI show its reasoning process step-by-step%';

-- Q10 Options: Most common mistake
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index)
SELECT id, 'Using too many examples', false, 1
FROM assessment_questions WHERE question_text LIKE '%most common mistake in prompt engineering%'
UNION ALL
SELECT id, 'Being too specific', false, 2
FROM assessment_questions WHERE question_text LIKE '%most common mistake in prompt engineering%'
UNION ALL
SELECT id, 'Being too vague or ambiguous in instructions', true, 3
FROM assessment_questions WHERE question_text LIKE '%most common mistake in prompt engineering%'
UNION ALL
SELECT id, 'Making prompts too short', false, 4
FROM assessment_questions WHERE question_text LIKE '%most common mistake in prompt engineering%';

-- Continue with remaining questions...
-- (Additional options would follow the same pattern for Q11-Q20 and Rapid Quiz questions)

-- Rapid Quiz Q1: OpenAI parameter
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index)
SELECT id, 'temperature', false, 1
FROM assessment_questions WHERE question_text LIKE '%Which key parameter removes guess-work in OpenAI chat calls%'
UNION ALL
SELECT id, 'response_format', true, 2
FROM assessment_questions WHERE question_text LIKE '%Which key parameter removes guess-work in OpenAI chat calls%'
UNION ALL
SELECT id, 'max_tokens', false, 3
FROM assessment_questions WHERE question_text LIKE '%Which key parameter removes guess-work in OpenAI chat calls%';

-- Rapid Quiz Q2: JSON usefulness
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index)
SELECT id, 'you need more tokens', false, 1
FROM assessment_questions WHERE question_text LIKE 'JSON prompts are especially useful when%'
UNION ALL
SELECT id, 'downstream code parses results', true, 2
FROM assessment_questions WHERE question_text LIKE 'JSON prompts are especially useful when%'
UNION ALL
SELECT id, 'chatting casually', false, 3
FROM assessment_questions WHERE question_text LIKE 'JSON prompts are especially useful when%';

-- Rapid Quiz Q3: True/False
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index)
SELECT id, 'True', false, 1
FROM assessment_questions WHERE question_text LIKE 'True or False: JSON mode alone guarantees adherence%'
UNION ALL
SELECT id, 'False', true, 2
FROM assessment_questions WHERE question_text LIKE 'True or False: JSON mode alone guarantees adherence%';

-- Rapid Quiz Q5: Multiple benefits
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index)
SELECT id, 'easier validation', true, 1
FROM assessment_questions WHERE question_text LIKE 'Benefits of JSON prompting include%'
UNION ALL
SELECT id, 'smaller tokens', false, 2
FROM assessment_questions WHERE question_text LIKE 'Benefits of JSON prompting include%'
UNION ALL
SELECT id, 'type-safety', true, 3
FROM assessment_questions WHERE question_text LIKE 'Benefits of JSON prompting include%'
UNION ALL
SELECT id, 'neural speedup', false, 4
FROM assessment_questions WHERE question_text LIKE 'Benefits of JSON prompting include%';

-- Verify the additions
SELECT
  c.name as category,
  COUNT(q.id) as question_count
FROM assessment_categories c
LEFT JOIN assessment_questions q ON q.category_id = c.id
WHERE c.name = 'Prompt Engineering'
GROUP BY c.name;
