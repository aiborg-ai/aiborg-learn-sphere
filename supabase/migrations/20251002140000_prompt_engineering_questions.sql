-- Prompt Engineering Assessment Questions
-- Based on Prompt Engineering Mastery Quiz and Rapid Quiz (2-min)
-- Questions cover techniques, frameworks, best practices, and advanced concepts

-- First, ensure we have a Prompt Engineering category
INSERT INTO assessment_categories (name, description, icon, weight, order_index) VALUES
('Prompt Engineering', 'Advanced prompt engineering techniques, frameworks, and best practices for AI', 'MessageSquare', 1.2, 9)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  weight = EXCLUDED.weight,
  order_index = EXCLUDED.order_index;

-- =====================================================
-- PROMPT ENGINEERING MASTERY QUESTIONS (20 Questions)
-- =====================================================

INSERT INTO assessment_questions (
  category_id, question_text, question_type, help_text, audience_filters,
  order_index, points_value, is_active
) VALUES

-- Question 1
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What is the primary purpose of prompt engineering?',
  'single_choice',
  'Understanding the fundamental goal of prompt engineering',
  ARRAY['professional', 'secondary'],
  85, 10, true
),

-- Question 2
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Which prompting technique requires NO examples and relies solely on the model''s pre-existing knowledge?',
  'single_choice',
  'Understanding different prompting approaches',
  ARRAY['professional', 'secondary'],
  86, 10, true
),

-- Question 3
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'In the PGTC framework for prompt engineering, what does the "C" stand for?',
  'single_choice',
  'Understanding the PGTC (Persona-Goal-Task-Context) framework',
  ARRAY['professional', 'secondary'],
  87, 10, true
),

-- Question 4
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Chain-of-Thought (CoT) prompting is most effective for which type of tasks?',
  'single_choice',
  'Understanding when to use Chain-of-Thought prompting',
  ARRAY['professional', 'secondary'],
  88, 10, true
),

-- Question 5
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What is a major limitation of prompt engineering that practitioners must consider?',
  'single_choice',
  'Understanding the challenges and limitations',
  ARRAY['professional', 'secondary'],
  89, 10, true
),

-- Question 6
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Which of the following is NOT a key component of effective prompt structure?',
  'single_choice',
  'Identifying components that do NOT belong in prompts',
  ARRAY['professional', 'secondary'],
  90, 10, true
),

-- Question 7
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'In few-shot prompting, what is the recommended approach when examples don''t improve performance?',
  'single_choice',
  'Troubleshooting few-shot prompting',
  ARRAY['professional', 'secondary'],
  91, 10, true
),

-- Question 8
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What does "hallucination" mean in the context of AI responses?',
  'single_choice',
  'Understanding AI model behaviors and issues',
  ARRAY['professional', 'secondary'],
  92, 10, true
),

-- Question 9
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Which prompt engineering technique is specifically designed to make AI show its reasoning process step-by-step?',
  'single_choice',
  'Understanding reasoning techniques',
  ARRAY['professional', 'secondary'],
  93, 10, true
),

-- Question 10
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What is the most common mistake in prompt engineering according to research?',
  'single_choice',
  'Identifying common pitfalls',
  ARRAY['professional', 'secondary'],
  94, 10, true
),

-- Question 11
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'In enterprise applications, prompt engineering is most valuable for which use case?',
  'single_choice',
  'Understanding business applications',
  ARRAY['professional', 'business'],
  95, 10, true
),

-- Question 12
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What is "prompt injection" and why is it a concern?',
  'single_choice',
  'Understanding security vulnerabilities in prompts',
  ARRAY['professional', 'business'],
  96, 10, true
),

-- Question 13
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Which evaluation metric is most important for assessing prompt effectiveness in factual tasks?',
  'single_choice',
  'Understanding evaluation methods',
  ARRAY['professional', 'secondary'],
  97, 10, true
),

-- Question 14
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'The SCAMPER methodology in prompt engineering stands for:',
  'single_choice',
  'Understanding advanced frameworks',
  ARRAY['professional', 'secondary'],
  98, 10, true
),

-- Question 15
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What is the primary advantage of using personas in prompt engineering?',
  'single_choice',
  'Understanding the role of personas',
  ARRAY['professional', 'secondary'],
  99, 10, true
),

-- Question 16
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'In prompt engineering, what does "temperature" control?',
  'single_choice',
  'Understanding model parameters',
  ARRAY['professional', 'secondary'],
  100, 10, true
),

-- Question 17
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Which of these is a best practice for handling complex multi-part requests?',
  'single_choice',
  'Understanding complex prompt strategies',
  ARRAY['professional', 'secondary'],
  101, 10, true
),

-- Question 18
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What is the main challenge with evaluating prompt effectiveness in creative tasks?',
  'single_choice',
  'Understanding evaluation challenges',
  ARRAY['professional', 'secondary'],
  102, 10, true
),

-- Question 19
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'In the context of AI safety and responsible use, what should prompt engineers prioritize?',
  'single_choice',
  'Understanding ethical considerations',
  ARRAY['professional', 'business'],
  103, 10, true
),

-- Question 20
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What emerging trend is shaping the future of prompt engineering?',
  'single_choice',
  'Understanding industry trends',
  ARRAY['professional', 'business'],
  104, 10, true
),

-- =====================================================
-- RAPID QUIZ QUESTIONS (JSON/OpenAI specific)
-- =====================================================

-- Question Q1
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Which key parameter removes guess-work in OpenAI chat calls?',
  'single_choice',
  'Understanding OpenAI API parameters for structured outputs',
  ARRAY['professional'],
  105, 10, true
),

-- Question Q2
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'JSON prompts are especially useful when working with:',
  'single_choice',
  'Understanding when to use JSON mode',
  ARRAY['professional'],
  106, 10, true
),

-- Question Q3
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'True or False: JSON mode alone guarantees adherence to your custom schema.',
  'single_choice',
  'Understanding JSON mode limitations',
  ARRAY['professional'],
  107, 10, true
),

-- Question Q4
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'In a JSON prompt, use which field to force the model''s tone?',
  'text_input',
  'Understanding how to control tone in structured prompts',
  ARRAY['professional'],
  108, 10, true
),

-- Question Q5
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Benefits of JSON prompting include: (Select all that apply)',
  'multiple_choice',
  'Understanding multiple benefits of structured prompting',
  ARRAY['professional'],
  109, 10, true
);
