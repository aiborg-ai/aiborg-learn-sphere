-- Update metadata for all newly inserted assessment questions
-- Run this AFTER executing ADD_PROMPT_ENGINEERING_QUESTIONS_FINAL.sql and ADD_AI_AGENTS_LLM_QUESTIONS.sql

-- =====================================================
-- UPDATE PROMPT ENGINEERING QUESTIONS (25 questions)
-- =====================================================

-- Q1-Q5: Foundational/Applied basics
UPDATE assessment_questions
SET
  difficulty_level = 'foundational',
  recommended_experience_level = 'none',
  tags = ARRAY['basics', 'introduction', 'theory']
WHERE question_text = 'What is the primary purpose of prompt engineering?'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

UPDATE assessment_questions
SET
  difficulty_level = 'foundational',
  recommended_experience_level = 'basic',
  tags = ARRAY['techniques', 'zero-shot', 'theory']
WHERE question_text LIKE 'Which prompting technique requires NO examples%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

UPDATE assessment_questions
SET
  difficulty_level = 'applied',
  recommended_experience_level = 'basic',
  tags = ARRAY['frameworks', 'PGTC', 'practical']
WHERE question_text LIKE '%PGTC framework%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

UPDATE assessment_questions
SET
  difficulty_level = 'applied',
  recommended_experience_level = 'intermediate',
  tags = ARRAY['techniques', 'chain-of-thought', 'problem-solving']
WHERE question_text LIKE 'Chain-of-Thought (CoT) prompting is most effective%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

UPDATE assessment_questions
SET
  difficulty_level = 'applied',
  recommended_experience_level = 'intermediate',
  tags = ARRAY['limitations', 'challenges', 'practical']
WHERE question_text LIKE 'What is a major limitation of prompt engineering%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

UPDATE assessment_questions
SET
  difficulty_level = 'applied',
  recommended_experience_level = 'intermediate',
  tags = ARRAY['structure', 'components', 'best-practices']
WHERE question_text LIKE '%NOT a key component of effective prompt structure%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

UPDATE assessment_questions
SET
  difficulty_level = 'advanced',
  recommended_experience_level = 'intermediate',
  tags = ARRAY['troubleshooting', 'few-shot', 'optimization']
WHERE question_text LIKE '%few-shot prompting%examples don''t improve%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

UPDATE assessment_questions
SET
  difficulty_level = 'applied',
  recommended_experience_level = 'basic',
  tags = ARRAY['safety', 'limitations', 'awareness']
WHERE question_text LIKE '%hallucination%mean in the context of AI%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

UPDATE assessment_questions
SET
  difficulty_level = 'applied',
  recommended_experience_level = 'intermediate',
  tags = ARRAY['techniques', 'chain-of-thought', 'reasoning']
WHERE question_text LIKE '%designed to make AI show its reasoning process%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

UPDATE assessment_questions
SET
  difficulty_level = 'foundational',
  recommended_experience_level = 'basic',
  tags = ARRAY['mistakes', 'best-practices', 'awareness']
WHERE question_text LIKE '%most common mistake in prompt engineering%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

UPDATE assessment_questions
SET
  difficulty_level = 'strategic',
  recommended_experience_level = 'intermediate',
  tags = ARRAY['business', 'enterprise', 'ROI']
WHERE question_text LIKE '%enterprise applications%most valuable%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

UPDATE assessment_questions
SET
  difficulty_level = 'advanced',
  recommended_experience_level = 'advanced',
  tags = ARRAY['security', 'vulnerabilities', 'safety']
WHERE question_text LIKE '%prompt injection%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

UPDATE assessment_questions
SET
  difficulty_level = 'applied',
  recommended_experience_level = 'intermediate',
  tags = ARRAY['evaluation', 'metrics', 'quality']
WHERE question_text LIKE '%evaluation metric%factual tasks%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

UPDATE assessment_questions
SET
  difficulty_level = 'advanced',
  recommended_experience_level = 'advanced',
  tags = ARRAY['frameworks', 'SCAMPER', 'advanced']
WHERE question_text LIKE 'The SCAMPER methodology%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

UPDATE assessment_questions
SET
  difficulty_level = 'applied',
  recommended_experience_level = 'basic',
  tags = ARRAY['personas', 'techniques', 'practical']
WHERE question_text LIKE '%primary advantage of using personas%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

UPDATE assessment_questions
SET
  difficulty_level = 'applied',
  recommended_experience_level = 'intermediate',
  tags = ARRAY['parameters', 'temperature', 'technical']
WHERE question_text LIKE '%what does "temperature" control%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

UPDATE assessment_questions
SET
  difficulty_level = 'applied',
  recommended_experience_level = 'intermediate',
  tags = ARRAY['best-practices', 'complex-tasks', 'workflow']
WHERE question_text LIKE '%best practice for handling complex multi-part requests%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

UPDATE assessment_questions
SET
  difficulty_level = 'advanced',
  recommended_experience_level = 'advanced',
  tags = ARRAY['evaluation', 'creativity', 'challenges']
WHERE question_text LIKE '%challenge with evaluating prompt effectiveness in creative tasks%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

UPDATE assessment_questions
SET
  difficulty_level = 'strategic',
  recommended_experience_level = 'intermediate',
  tags = ARRAY['ethics', 'safety', 'responsibility']
WHERE question_text LIKE '%AI safety and responsible use%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

UPDATE assessment_questions
SET
  difficulty_level = 'strategic',
  recommended_experience_level = 'advanced',
  tags = ARRAY['trends', 'future', 'innovation']
WHERE question_text LIKE '%emerging trend is shaping the future%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

-- Rapid Quiz questions (JSON/OpenAI specific)
UPDATE assessment_questions
SET
  difficulty_level = 'advanced',
  recommended_experience_level = 'advanced',
  tags = ARRAY['technical', 'openai', 'API']
WHERE question_text LIKE '%key parameter removes guess-work in OpenAI%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

UPDATE assessment_questions
SET
  difficulty_level = 'applied',
  recommended_experience_level = 'intermediate',
  tags = ARRAY['JSON', 'structured-output', 'technical']
WHERE question_text LIKE 'JSON prompts are especially useful when%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

UPDATE assessment_questions
SET
  difficulty_level = 'applied',
  recommended_experience_level = 'intermediate',
  tags = ARRAY['JSON', 'limitations', 'technical']
WHERE question_text LIKE 'True or False: JSON mode alone guarantees%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

UPDATE assessment_questions
SET
  difficulty_level = 'applied',
  recommended_experience_level = 'intermediate',
  tags = ARRAY['JSON', 'benefits', 'structured-output']
WHERE question_text LIKE 'Benefits of JSON prompting include%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

-- =====================================================
-- UPDATE AI AGENTS QUESTIONS (5 questions)
-- =====================================================

UPDATE assessment_questions
SET
  difficulty_level = 'foundational',
  recommended_experience_level = 'basic',
  tags = ARRAY['basics', 'definition', 'theory']
WHERE question_text LIKE 'Which of the following best describes an agent in Artificial Intelligence%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'AI Agents');

UPDATE assessment_questions
SET
  difficulty_level = 'applied',
  recommended_experience_level = 'intermediate',
  tags = ARRAY['agent-types', 'reflex', 'architecture']
WHERE question_text LIKE '%agent makes decisions solely on the current percept%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'AI Agents');

UPDATE assessment_questions
SET
  difficulty_level = 'applied',
  recommended_experience_level = 'basic',
  tags = ARRAY['real-world', 'examples', 'practical']
WHERE question_text LIKE '%robotic vacuum cleaner%Roomba%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'AI Agents');

UPDATE assessment_questions
SET
  difficulty_level = 'applied',
  recommended_experience_level = 'intermediate',
  tags = ARRAY['PEAS', 'frameworks', 'architecture']
WHERE question_text LIKE '%PEAS%dust-detection sensor%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'AI Agents');

UPDATE assessment_questions
SET
  difficulty_level = 'applied',
  recommended_experience_level = 'intermediate',
  tags = ARRAY['learning', 'exploration', 'behavior']
WHERE question_text LIKE 'Why is exploration important for a learning agent%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'AI Agents');

-- =====================================================
-- UPDATE LLM FUNDAMENTALS QUESTIONS (6 questions)
-- =====================================================

UPDATE assessment_questions
SET
  difficulty_level = 'foundational',
  recommended_experience_level = 'none',
  tags = ARRAY['problem-solving', 'programming', 'techniques']
WHERE question_text = 'What is "rubber ducking"?'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals');

UPDATE assessment_questions
SET
  difficulty_level = 'foundational',
  recommended_experience_level = 'none',
  tags = ARRAY['basics', 'LLM', 'introduction']
WHERE question_text LIKE '%MAIN purpose of a large language model%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals');

UPDATE assessment_questions
SET
  difficulty_level = 'applied',
  recommended_experience_level = 'basic',
  tags = ARRAY['architecture', 'parameters', 'training']
WHERE question_text LIKE '%parameters%What do these parameters represent%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals');

UPDATE assessment_questions
SET
  difficulty_level = 'applied',
  recommended_experience_level = 'intermediate',
  tags = ARRAY['tokenization', 'processing', 'technical']
WHERE question_text LIKE '%best describes "tokenization"%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals');

UPDATE assessment_questions
SET
  difficulty_level = 'applied',
  recommended_experience_level = 'basic',
  tags = ARRAY['hallucination', 'limitations', 'safety']
WHERE question_text LIKE '%hallucination%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals');

UPDATE assessment_questions
SET
  difficulty_level = 'strategic',
  recommended_experience_level = 'basic',
  tags = ARRAY['ethics', 'education', 'responsibility']
WHERE question_text LIKE '%teacher wants students to use an LLM ethically%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals');

-- =====================================================
-- UPDATE DEVELOPMENT PLATFORMS QUESTIONS (5 questions)
-- =====================================================

UPDATE assessment_questions
SET
  difficulty_level = 'applied',
  recommended_experience_level = 'intermediate',
  tags = ARRAY['lovable', 'tech-stack', 'platforms']
WHERE question_text LIKE '%technology stack does Lovable.dev use%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Development Platforms');

UPDATE assessment_questions
SET
  difficulty_level = 'strategic',
  recommended_experience_level = 'intermediate',
  tags = ARRAY['lovable', 'ownership', 'business']
WHERE question_text LIKE '%Lovable.dev handle code ownership%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Development Platforms');

UPDATE assessment_questions
SET
  difficulty_level = 'strategic',
  recommended_experience_level = 'basic',
  tags = ARRAY['lovable', 'benefits', 'productivity']
WHERE question_text LIKE '%main advantage of Lovable over traditional%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Development Platforms');

UPDATE assessment_questions
SET
  difficulty_level = 'applied',
  recommended_experience_level = 'intermediate',
  tags = ARRAY['lovable', 'integration', 'API']
WHERE question_text LIKE '%Lovable can integrate with external APIs%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Development Platforms');

UPDATE assessment_questions
SET
  difficulty_level = 'applied',
  recommended_experience_level = 'basic',
  tags = ARRAY['lovable', 'pricing', 'business']
WHERE question_text LIKE '%pricing model does Lovable use%'
  AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Development Platforms');

-- =====================================================
-- ASSIGN IRT DIFFICULTY SCORES
-- =====================================================

-- Foundational: -2.0 to -0.5 (easy questions)
UPDATE assessment_questions
SET irt_difficulty = -1.5
WHERE difficulty_level = 'foundational'
  AND irt_difficulty IS NULL;

-- Applied: -0.5 to +0.5 (medium difficulty)
UPDATE assessment_questions
SET irt_difficulty = 0.0
WHERE difficulty_level = 'applied'
  AND irt_difficulty IS NULL;

-- Advanced: +0.5 to +1.5 (hard questions)
UPDATE assessment_questions
SET irt_difficulty = 1.0
WHERE difficulty_level = 'advanced'
  AND irt_difficulty IS NULL;

-- Strategic: +1.5 to +2.5 (very hard questions)
UPDATE assessment_questions
SET irt_difficulty = 2.0
WHERE difficulty_level = 'strategic'
  AND irt_difficulty IS NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Show updated questions with metadata
SELECT
  c.name AS category,
  COUNT(*) AS total_questions,
  COUNT(CASE WHEN q.difficulty_level = 'foundational' THEN 1 END) AS foundational,
  COUNT(CASE WHEN q.difficulty_level = 'applied' THEN 1 END) AS applied,
  COUNT(CASE WHEN q.difficulty_level = 'advanced' THEN 1 END) AS advanced,
  COUNT(CASE WHEN q.difficulty_level = 'strategic' THEN 1 END) AS strategic
FROM assessment_questions q
JOIN assessment_categories c ON q.category_id = c.id
WHERE c.name IN ('Prompt Engineering', 'AI Agents', 'LLM Fundamentals', 'Development Platforms')
GROUP BY c.name
ORDER BY c.name;

-- Expected results:
-- Prompt Engineering: 25 total (3 foundational, 13 applied, 5 advanced, 4 strategic)
-- AI Agents: 5 total (1 foundational, 4 applied)
-- LLM Fundamentals: 6 total (2 foundational, 3 applied, 1 strategic)
-- Development Platforms: 5 total (0 foundational, 3 applied, 2 strategic)

COMMIT;
