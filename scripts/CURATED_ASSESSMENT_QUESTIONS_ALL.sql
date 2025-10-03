-- Comprehensively Curated Assessment Questions
-- All 41 questions from Prompt Engineering, AI Agents, LLM Fundamentals, and Development Platforms
-- Properly tagged with audience_filters, difficulty_level, experience_level, and tags

-- =====================================================
-- PREREQUISITE: Run the metadata migration first
-- =====================================================
-- psql ... -f supabase/migrations/20251002150000_add_question_metadata.sql

-- =====================================================
-- STEP 1: Add Categories
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
-- STEP 2: Insert Curated Questions
-- =====================================================

-- ============ PROMPT ENGINEERING QUESTIONS (25) ============

-- Foundational Level (Q1-Q5): For Secondary+ audiences
INSERT INTO assessment_questions (
  category_id, question_text, question_type, help_text, audience_filters,
  order_index, points_value, is_active,
  difficulty_level, recommended_experience_level, tags
) VALUES

-- PE Q1 (Foundational)
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What is the primary purpose of prompt engineering?',
  'single_choice',
  'Understanding the fundamental goal of prompt engineering',
  ARRAY['secondary', 'professional', 'business'],
  85, 10, true,
  'foundational', 'none', ARRAY['basics', 'introduction', 'theory']
),

-- PE Q2 (Foundational)
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Which prompting technique requires NO examples and relies solely on the model''s pre-existing knowledge?',
  'single_choice',
  'Understanding different prompting approaches',
  ARRAY['secondary', 'professional', 'business'],
  86, 10, true,
  'foundational', 'basic', ARRAY['techniques', 'zero-shot', 'theory']
),

-- PE Q3 (Applied)
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'In the PGTC framework for prompt engineering, what does the "C" stand for?',
  'single_choice',
  'Understanding the PGTC (Persona-Goal-Task-Context) framework',
  ARRAY['secondary', 'professional', 'business'],
  87, 10, true,
  'applied', 'basic', ARRAY['frameworks', 'PGTC', 'practical']
),

-- PE Q4 (Applied)
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Chain-of-Thought (CoT) prompting is most effective for which type of tasks?',
  'single_choice',
  'Understanding when to use Chain-of-Thought prompting',
  ARRAY['secondary', 'professional'],
  88, 10, true,
  'applied', 'intermediate', ARRAY['techniques', 'chain-of-thought', 'problem-solving']
),

-- PE Q5 (Applied)
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What is a major limitation of prompt engineering that practitioners must consider?',
  'single_choice',
  'Understanding the challenges and limitations',
  ARRAY['professional', 'business'],
  89, 10, true,
  'applied', 'intermediate', ARRAY['limitations', 'challenges', 'practical']
),

-- PE Q6 (Applied)
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Which of the following is NOT a key component of effective prompt structure?',
  'single_choice',
  'Identifying components that do NOT belong in prompts',
  ARRAY['professional'],
  90, 10, true,
  'applied', 'intermediate', ARRAY['structure', 'components', 'best-practices']
),

-- PE Q7 (Advanced)
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'In few-shot prompting, what is the recommended approach when examples don''t improve performance?',
  'single_choice',
  'Troubleshooting few-shot prompting',
  ARRAY['professional'],
  91, 10, true,
  'advanced', 'intermediate', ARRAY['troubleshooting', 'few-shot', 'optimization']
),

-- PE Q8 (Applied)
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What does "hallucination" mean in the context of AI responses?',
  'single_choice',
  'Understanding AI model behaviors and issues',
  ARRAY['secondary', 'professional', 'business'],
  92, 10, true,
  'applied', 'basic', ARRAY['safety', 'limitations', 'awareness']
),

-- PE Q9 (Applied)
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Which prompt engineering technique is specifically designed to make AI show its reasoning process step-by-step?',
  'single_choice',
  'Understanding reasoning techniques',
  ARRAY['secondary', 'professional'],
  93, 10, true,
  'applied', 'intermediate', ARRAY['techniques', 'chain-of-thought', 'reasoning']
),

-- PE Q10 (Foundational)
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What is the most common mistake in prompt engineering according to research?',
  'single_choice',
  'Identifying common pitfalls',
  ARRAY['secondary', 'professional', 'business'],
  94, 10, true,
  'foundational', 'basic', ARRAY['mistakes', 'best-practices', 'awareness']
),

-- PE Q11 (Strategic)
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'In enterprise applications, prompt engineering is most valuable for which use case?',
  'single_choice',
  'Understanding business applications',
  ARRAY['professional', 'business'],
  95, 10, true,
  'strategic', 'intermediate', ARRAY['business', 'enterprise', 'ROI']
),

-- PE Q12 (Advanced)
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What is "prompt injection" and why is it a concern?',
  'single_choice',
  'Understanding security vulnerabilities in prompts',
  ARRAY['professional'],
  96, 10, true,
  'advanced', 'advanced', ARRAY['security', 'vulnerabilities', 'safety']
),

-- PE Q13 (Applied)
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Which evaluation metric is most important for assessing prompt effectiveness in factual tasks?',
  'single_choice',
  'Understanding evaluation methods',
  ARRAY['professional'],
  97, 10, true,
  'applied', 'intermediate', ARRAY['evaluation', 'metrics', 'quality']
),

-- PE Q14 (Advanced)
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'The SCAMPER methodology in prompt engineering stands for:',
  'single_choice',
  'Understanding advanced frameworks',
  ARRAY['professional'],
  98, 10, true,
  'advanced', 'advanced', ARRAY['frameworks', 'SCAMPER', 'advanced']
),

-- PE Q15 (Applied)
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What is the primary advantage of using personas in prompt engineering?',
  'single_choice',
  'Understanding the role of personas',
  ARRAY['secondary', 'professional', 'business'],
  99, 10, true,
  'applied', 'basic', ARRAY['personas', 'techniques', 'practical']
),

-- PE Q16 (Applied)
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'In prompt engineering, what does "temperature" control?',
  'single_choice',
  'Understanding model parameters',
  ARRAY['secondary', 'professional'],
  100, 10, true,
  'applied', 'intermediate', ARRAY['parameters', 'temperature', 'technical']
),

-- PE Q17 (Applied)
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Which of these is a best practice for handling complex multi-part requests?',
  'single_choice',
  'Understanding complex prompt strategies',
  ARRAY['professional', 'business'],
  101, 10, true,
  'applied', 'intermediate', ARRAY['best-practices', 'complex-tasks', 'workflow']
),

-- PE Q18 (Advanced)
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What is the main challenge with evaluating prompt effectiveness in creative tasks?',
  'single_choice',
  'Understanding evaluation challenges',
  ARRAY['professional'],
  102, 10, true,
  'advanced', 'advanced', ARRAY['evaluation', 'creativity', 'challenges']
),

-- PE Q19 (Strategic)
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'In the context of AI safety and responsible use, what should prompt engineers prioritize?',
  'single_choice',
  'Understanding ethical considerations',
  ARRAY['professional', 'business'],
  103, 10, true,
  'strategic', 'intermediate', ARRAY['ethics', 'safety', 'responsibility']
),

-- PE Q20 (Strategic)
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'What emerging trend is shaping the future of prompt engineering?',
  'single_choice',
  'Understanding industry trends',
  ARRAY['professional', 'business'],
  104, 10, true,
  'strategic', 'advanced', ARRAY['trends', 'future', 'innovation']
),

-- PE Rapid Q1 (Advanced - OpenAI specific)
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Which key parameter removes guess-work in OpenAI chat calls?',
  'single_choice',
  'Understanding OpenAI API parameters for structured outputs',
  ARRAY['professional'],
  105, 10, true,
  'advanced', 'advanced', ARRAY['technical', 'openai', 'API']
),

-- PE Rapid Q2 (Applied - JSON prompting)
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'JSON prompts are especially useful when working with:',
  'single_choice',
  'Understanding when to use JSON mode',
  ARRAY['professional'],
  106, 10, true,
  'applied', 'intermediate', ARRAY['JSON', 'structured-output', 'technical']
),

-- PE Rapid Q3 (Applied - JSON limitations)
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'True or False: JSON mode alone guarantees adherence to your custom schema.',
  'single_choice',
  'Understanding JSON mode limitations',
  ARRAY['professional'],
  107, 10, true,
  'applied', 'intermediate', ARRAY['JSON', 'limitations', 'technical']
),

-- PE Rapid Q4 (Advanced - JSON tone control) - Text input
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'In a JSON prompt, which field should you use to force the model''s tone?',
  'text_input',
  'Understanding how to control tone in structured prompts. The correct answer is "style"',
  ARRAY['professional'],
  108, 10, true,
  'advanced', 'advanced', ARRAY['JSON', 'tone-control', 'advanced']
),

-- PE Rapid Q5 (Applied - JSON benefits)
(
  (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering'),
  'Benefits of JSON prompting include: (Select all that apply)',
  'multiple_choice',
  'Understanding multiple benefits of structured prompting',
  ARRAY['professional'],
  109, 10, true,
  'applied', 'intermediate', ARRAY['JSON', 'benefits', 'structured-output']
);

-- ============ AI AGENTS QUESTIONS (5) ============

INSERT INTO assessment_questions (
  category_id, question_text, question_type, help_text, audience_filters,
  order_index, points_value, is_active,
  difficulty_level, recommended_experience_level, tags
) VALUES

-- AI Agents Q1 (Foundational)
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Agents'),
  'Which of the following best describes an agent in Artificial Intelligence?',
  'single_choice',
  'Understanding the fundamental definition of an AI agent',
  ARRAY['secondary', 'professional'],
  110, 10, true,
  'foundational', 'basic', ARRAY['basics', 'definition', 'theory']
),

-- AI Agents Q2 (Applied)
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Agents'),
  'What type of AI agent makes decisions solely on the current percept, with no internal memory of past percepts?',
  'single_choice',
  'Understanding different types of AI agents',
  ARRAY['secondary', 'professional'],
  111, 10, true,
  'applied', 'intermediate', ARRAY['agent-types', 'reflex', 'architecture']
),

-- AI Agents Q3 (Applied)
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Agents'),
  'A robotic vacuum cleaner (e.g. Roomba) primarily operates as which kind of agent?',
  'single_choice',
  'Applying agent concepts to real-world examples',
  ARRAY['secondary', 'professional'],
  112, 10, true,
  'applied', 'basic', ARRAY['real-world', 'examples', 'practical']
),

-- AI Agents Q4 (Applied)
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Agents'),
  'In the PEAS (Performance, Environment, Actuators, Sensors) framework, which element would "dust-detection sensor" belong to for a cleaning robot?',
  'single_choice',
  'Understanding the PEAS framework for agent design',
  ARRAY['professional'],
  113, 10, true,
  'applied', 'intermediate', ARRAY['PEAS', 'frameworks', 'architecture']
),

-- AI Agents Q5 (Applied)
(
  (SELECT id FROM assessment_categories WHERE name = 'AI Agents'),
  'Why is exploration important for a learning agent?',
  'single_choice',
  'Understanding learning agent behavior',
  ARRAY['professional'],
  114, 10, true,
  'applied', 'intermediate', ARRAY['learning', 'exploration', 'behavior']
);

-- ============ LLM FUNDAMENTALS QUESTIONS (6) ============

INSERT INTO assessment_questions (
  category_id, question_text, question_type, help_text, audience_filters,
  order_index, points_value, is_active,
  difficulty_level, recommended_experience_level, tags
) VALUES

-- LLM Q1 (Foundational - Problem solving technique)
(
  (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals'),
  'What is "rubber ducking"?',
  'single_choice',
  'Understanding problem-solving techniques in programming',
  ARRAY['secondary', 'professional'],
  115, 10, true,
  'foundational', 'none', ARRAY['problem-solving', 'programming', 'techniques']
),

-- LLM Q2 (Foundational)
(
  (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals'),
  'What is the MAIN purpose of a large language model (LLM)?',
  'single_choice',
  'Understanding the fundamental purpose of LLMs',
  ARRAY['primary', 'secondary', 'professional', 'business'],
  116, 10, true,
  'foundational', 'none', ARRAY['basics', 'LLM', 'introduction']
),

-- LLM Q3 (Applied)
(
  (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals'),
  'During training, an LLM adjusts millions (or even billions) of tiny values called "parameters." What do these parameters represent?',
  'single_choice',
  'Understanding LLM architecture and training',
  ARRAY['secondary', 'professional'],
  117, 10, true,
  'applied', 'basic', ARRAY['architecture', 'parameters', 'training']
),

-- LLM Q4 (Applied)
(
  (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals'),
  'Which of the following best describes "tokenization" in an LLM?',
  'single_choice',
  'Understanding how LLMs process text',
  ARRAY['secondary', 'professional'],
  118, 10, true,
  'applied', 'intermediate', ARRAY['tokenization', 'processing', 'technical']
),

-- LLM Q5 (Applied - Hallucination)
(
  (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals'),
  'Why do LLMs sometimes give confident-sounding answers that are actually wrong (a phenomenon called "hallucination")?',
  'single_choice',
  'Understanding LLM limitations and hallucination',
  ARRAY['primary', 'secondary', 'professional', 'business'],
  119, 10, true,
  'applied', 'basic', ARRAY['hallucination', 'limitations', 'safety']
),

-- LLM Q6 (Strategic - Ethics in education)
(
  (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals'),
  'A teacher wants students to use an LLM ethically while writing essays. Which guideline BEST promotes academic honesty?',
  'single_choice',
  'Understanding ethical AI use in education',
  ARRAY['primary', 'secondary', 'professional'],
  120, 10, true,
  'strategic', 'basic', ARRAY['ethics', 'education', 'responsibility']
);

-- ============ DEVELOPMENT PLATFORMS QUESTIONS (5) ============

INSERT INTO assessment_questions (
  category_id, question_text, question_type, help_text, audience_filters,
  order_index, points_value, is_active,
  difficulty_level, recommended_experience_level, tags
) VALUES

-- Lovable Q1 (Applied - Tech stack)
(
  (SELECT id FROM assessment_categories WHERE name = 'Development Platforms'),
  'What technology stack does Lovable.dev use?',
  'single_choice',
  'Understanding Lovable.dev platform architecture',
  ARRAY['professional'],
  121, 10, true,
  'applied', 'intermediate', ARRAY['lovable', 'tech-stack', 'platforms']
),

-- Lovable Q2 (Strategic - Code ownership)
(
  (SELECT id FROM assessment_categories WHERE name = 'Development Platforms'),
  'How does Lovable.dev handle code ownership?',
  'single_choice',
  'Understanding code ownership in AI development platforms',
  ARRAY['professional', 'business'],
  122, 10, true,
  'strategic', 'intermediate', ARRAY['lovable', 'ownership', 'business']
),

-- Lovable Q3 (Strategic - Benefits)
(
  (SELECT id FROM assessment_categories WHERE name = 'Development Platforms'),
  'What''s the main advantage of Lovable over traditional coding?',
  'single_choice',
  'Understanding benefits of AI-assisted development',
  ARRAY['professional', 'business'],
  123, 10, true,
  'strategic', 'basic', ARRAY['lovable', 'benefits', 'productivity']
),

-- Lovable Q4 (Applied - Integration)
(
  (SELECT id FROM assessment_categories WHERE name = 'Development Platforms'),
  'True or False: Lovable can integrate with external APIs like OpenAI',
  'single_choice',
  'Understanding platform integration capabilities',
  ARRAY['professional'],
  124, 10, true,
  'applied', 'intermediate', ARRAY['lovable', 'integration', 'API']
),

-- Lovable Q5 (Applied - Pricing)
(
  (SELECT id FROM assessment_categories WHERE name = 'Development Platforms'),
  'Which pricing model does Lovable use?',
  'single_choice',
  'Understanding platform pricing models',
  ARRAY['professional', 'business'],
  125, 10, true,
  'applied', 'basic', ARRAY['lovable', 'pricing', 'business']
);

-- =====================================================
-- STEP 3: Add ALL Answer Options (continues in next file due to length)
-- =====================================================
-- See: CURATED_ASSESSMENT_OPTIONS.sql
