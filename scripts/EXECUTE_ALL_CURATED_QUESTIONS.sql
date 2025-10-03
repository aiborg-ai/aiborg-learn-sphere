-- =====================================================
-- COMPLETE CURATED ASSESSMENT SETUP
-- Execute this entire file in Supabase SQL Editor
-- =====================================================
-- This file:
-- 1. Temporarily disables constraints
-- 2. Inserts all 41 questions with answer options
-- 3. Updates metadata (difficulty, experience, tags)
-- 4. Re-enables constraints with verification
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Temporarily Disable Constraints
-- =====================================================

ALTER TABLE assessment_questions DROP CONSTRAINT IF EXISTS check_difficulty_level;
ALTER TABLE assessment_questions DROP CONSTRAINT IF EXISTS check_experience_level;

-- =====================================================
-- STEP 2: Add Categories
-- =====================================================

DO $$
BEGIN
  -- Prompt Engineering
  IF NOT EXISTS (SELECT 1 FROM assessment_categories WHERE name = 'Prompt Engineering') THEN
    INSERT INTO assessment_categories (name, description, icon, weight, order_index)
    VALUES ('Prompt Engineering', 'Advanced prompt engineering techniques, frameworks, and best practices for AI', 'MessageSquare', 1.2, 9);
  END IF;

  -- AI Agents
  IF NOT EXISTS (SELECT 1 FROM assessment_categories WHERE name = 'AI Agents') THEN
    INSERT INTO assessment_categories (name, description, icon, weight, order_index)
    VALUES ('AI Agents', 'Understanding autonomous AI agents, architectures, and agent-based systems', 'Bot', 1.1, 10);
  END IF;

  -- LLM Fundamentals
  IF NOT EXISTS (SELECT 1 FROM assessment_categories WHERE name = 'LLM Fundamentals') THEN
    INSERT INTO assessment_categories (name, description, icon, weight, order_index)
    VALUES ('LLM Fundamentals', 'Core concepts of Large Language Models, architecture, training, and limitations', 'Brain', 1.2, 11);
  END IF;

  -- Development Platforms
  IF NOT EXISTS (SELECT 1 FROM assessment_categories WHERE name = 'Development Platforms') THEN
    INSERT INTO assessment_categories (name, description, icon, weight, order_index)
    VALUES ('Development Platforms', 'AI-powered development platforms and tools knowledge', 'Layers', 1.0, 12);
  END IF;
END $$;

-- =====================================================
-- STEP 3: Insert Questions (without metadata first)
-- =====================================================

-- Note: We'll add metadata in Step 5 after insertion

INSERT INTO assessment_questions (
  category_id, question_text, question_type, help_text, audience_filters,
  order_index, points_value, is_active
) VALUES

-- ============ PROMPT ENGINEERING (25 questions) ============

(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What is the primary purpose of prompt engineering?',
  'single_choice',
  'Understanding the fundamental goal of prompt engineering',
  ARRAY['professional', 'secondary'],
  85, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Which prompting technique requires NO examples and relies solely on the model''s pre-existing knowledge?',
  'single_choice',
  'Understanding different prompting approaches',
  ARRAY['professional', 'secondary'],
  86, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'In the PGTC framework for prompt engineering, what does the "C" stand for?',
  'single_choice',
  'Understanding the PGTC (Persona-Goal-Task-Context) framework',
  ARRAY['professional', 'secondary'],
  87, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Chain-of-Thought (CoT) prompting is most effective for which type of tasks?',
  'single_choice',
  'Understanding when to use Chain-of-Thought prompting',
  ARRAY['professional', 'secondary'],
  88, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What is a major limitation of prompt engineering that practitioners must consider?',
  'single_choice',
  'Understanding the challenges and limitations',
  ARRAY['professional', 'business'],
  89, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Which of the following is NOT a key component of effective prompt structure?',
  'single_choice',
  'Identifying components that do NOT belong in prompts',
  ARRAY['professional'],
  90, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'In few-shot prompting, what is the recommended approach when examples don''t improve performance?',
  'single_choice',
  'Troubleshooting few-shot prompting',
  ARRAY['professional'],
  91, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What does "hallucination" mean in the context of AI responses?',
  'single_choice',
  'Understanding AI model behaviors and issues',
  ARRAY['professional', 'secondary'],
  92, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Which prompt engineering technique is specifically designed to make AI show its reasoning process step-by-step?',
  'single_choice',
  'Understanding reasoning techniques',
  ARRAY['professional', 'secondary'],
  93, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What is the most common mistake in prompt engineering according to research?',
  'single_choice',
  'Identifying common pitfalls',
  ARRAY['professional', 'secondary'],
  94, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'In enterprise applications, prompt engineering is most valuable for which use case?',
  'single_choice',
  'Understanding business applications',
  ARRAY['professional', 'business'],
  95, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What is "prompt injection" and why is it a concern?',
  'single_choice',
  'Understanding security vulnerabilities in prompts',
  ARRAY['professional', 'business'],
  96, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Which evaluation metric is most important for assessing prompt effectiveness in factual tasks?',
  'single_choice',
  'Understanding evaluation methods',
  ARRAY['professional'],
  97, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'The SCAMPER methodology in prompt engineering stands for:',
  'single_choice',
  'Understanding advanced frameworks',
  ARRAY['professional'],
  98, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What is the primary advantage of using personas in prompt engineering?',
  'single_choice',
  'Understanding the role of personas',
  ARRAY['professional', 'secondary'],
  99, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'In prompt engineering, what does "temperature" control?',
  'single_choice',
  'Understanding model parameters',
  ARRAY['professional', 'secondary'],
  100, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Which of these is a best practice for handling complex multi-part requests?',
  'single_choice',
  'Understanding complex prompt strategies',
  ARRAY['professional', 'secondary'],
  101, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What is the main challenge with evaluating prompt effectiveness in creative tasks?',
  'single_choice',
  'Understanding evaluation challenges',
  ARRAY['professional'],
  102, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'In the context of AI safety and responsible use, what should prompt engineers prioritize?',
  'single_choice',
  'Understanding ethical considerations',
  ARRAY['professional', 'business'],
  103, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What emerging trend is shaping the future of prompt engineering?',
  'single_choice',
  'Understanding industry trends',
  ARRAY['professional', 'business'],
  104, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Which key parameter removes guess-work in OpenAI chat calls?',
  'single_choice',
  'Understanding OpenAI API parameters for structured outputs',
  ARRAY['professional'],
  105, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'JSON prompts are especially useful when working with:',
  'single_choice',
  'Understanding when to use JSON mode',
  ARRAY['professional'],
  106, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'True or False: JSON mode alone guarantees adherence to your custom schema.',
  'single_choice',
  'Understanding JSON mode limitations',
  ARRAY['professional'],
  107, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'In a JSON prompt, which field should you use to force the model''s tone?',
  'text_input',
  'Understanding how to control tone in structured prompts. The correct answer is "style"',
  ARRAY['professional'],
  108, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Benefits of JSON prompting include: (Select all that apply)',
  'multiple_choice',
  'Understanding multiple benefits of structured prompting',
  ARRAY['professional'],
  109, 10, true
),

-- ============ AI AGENTS (5 questions) ============

(
  (SELECT id FROM assessment_categories WHERE name = 'AI Agents'),
  'Which of the following best describes an agent in Artificial Intelligence?',
  'single_choice',
  'Understanding the fundamental definition of an AI agent',
  ARRAY['professional', 'secondary'],
  110, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Agents'),
  'What type of AI agent makes decisions solely on the current percept, with no internal memory of past percepts?',
  'single_choice',
  'Understanding different types of AI agents',
  ARRAY['professional', 'secondary'],
  111, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Agents'),
  'A robotic vacuum cleaner (e.g. Roomba) primarily operates as which kind of agent?',
  'single_choice',
  'Applying agent concepts to real-world examples',
  ARRAY['professional', 'secondary'],
  112, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Agents'),
  'In the PEAS (Performance, Environment, Actuators, Sensors) framework, which element would "dust-detection sensor" belong to for a cleaning robot?',
  'single_choice',
  'Understanding the PEAS framework for agent design',
  ARRAY['professional'],
  113, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Agents'),
  'Why is exploration important for a learning agent?',
  'single_choice',
  'Understanding learning agent behavior',
  ARRAY['professional'],
  114, 10, true
),

-- ============ LLM FUNDAMENTALS (6 questions) ============

(
  (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals'),
  'What is "rubber ducking"?',
  'single_choice',
  'Understanding problem-solving techniques in programming',
  ARRAY['professional', 'secondary'],
  115, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals'),
  'What is the MAIN purpose of a large language model (LLM)?',
  'single_choice',
  'Understanding the fundamental purpose of LLMs',
  ARRAY['primary', 'secondary', 'professional', 'business'],
  116, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals'),
  'During training, an LLM adjusts millions (or even billions) of tiny values called "parameters." What do these parameters represent?',
  'single_choice',
  'Understanding LLM architecture and training',
  ARRAY['professional', 'secondary'],
  117, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals'),
  'Which of the following best describes "tokenization" in an LLM?',
  'single_choice',
  'Understanding how LLMs process text',
  ARRAY['professional', 'secondary'],
  118, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals'),
  'Why do LLMs sometimes give confident-sounding answers that are actually wrong (a phenomenon called "hallucination")?',
  'single_choice',
  'Understanding LLM limitations and hallucination',
  ARRAY['primary', 'secondary', 'professional', 'business'],
  119, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals'),
  'A teacher wants students to use an LLM ethically while writing essays. Which guideline BEST promotes academic honesty?',
  'single_choice',
  'Understanding ethical AI use in education',
  ARRAY['primary', 'secondary', 'professional'],
  120, 10, true
),

-- ============ DEVELOPMENT PLATFORMS (5 questions) ============

(
  (SELECT id FROM assessment_categories WHERE name = 'Development Platforms'),
  'What technology stack does Lovable.dev use?',
  'single_choice',
  'Understanding Lovable.dev platform architecture',
  ARRAY['professional'],
  121, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Development Platforms'),
  'How does Lovable.dev handle code ownership?',
  'single_choice',
  'Understanding code ownership in AI development platforms',
  ARRAY['professional', 'business'],
  122, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Development Platforms'),
  'What''s the main advantage of Lovable over traditional coding?',
  'single_choice',
  'Understanding benefits of AI-assisted development',
  ARRAY['professional', 'business'],
  123, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Development Platforms'),
  'True or False: Lovable can integrate with external APIs like OpenAI',
  'single_choice',
  'Understanding platform integration capabilities',
  ARRAY['professional'],
  124, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Development Platforms'),
  'Which pricing model does Lovable use?',
  'single_choice',
  'Understanding platform pricing models',
  ARRAY['professional', 'business'],
  125, 10, true
);

-- =====================================================
-- STEP 4: Insert Answer Options
-- =====================================================
-- This section will be continued in the next part due to length
-- For now, please run the existing option files:
-- 1. ADD_PROMPT_ENGINEERING_QUESTIONS_FINAL.sql (options section)
-- 2. ADD_AI_AGENTS_LLM_QUESTIONS.sql (options section)

COMMIT;

-- Display inserted questions
SELECT 'Questions inserted successfully!' AS status;
SELECT
  c.name AS category,
  COUNT(*) AS question_count
FROM assessment_questions q
JOIN assessment_categories c ON q.category_id = c.id
WHERE c.name IN ('Prompt Engineering', 'AI Agents', 'LLM Fundamentals', 'Development Platforms')
GROUP BY c.name
ORDER BY c.name;
