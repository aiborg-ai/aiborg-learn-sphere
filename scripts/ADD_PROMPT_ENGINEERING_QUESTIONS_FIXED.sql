-- Fixed: Prompt Engineering Assessment Questions
-- This version handles the case where categories might already exist

-- =====================================================
-- STEP 1: Add or Update Prompt Engineering Category
-- =====================================================

-- First check if category exists, if not insert it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM assessment_categories WHERE name = 'Prompt Engineering') THEN
    INSERT INTO assessment_categories (name, description, icon, weight, order_index)
    VALUES ('Prompt Engineering', 'Advanced prompt engineering techniques, frameworks, and best practices for AI', 'MessageSquare', 1.2, 9);
  ELSE
    UPDATE assessment_categories
    SET description = 'Advanced prompt engineering techniques, frameworks, and best practices for AI',
        icon = 'MessageSquare',
        weight = 1.2,
        order_index = 9
    WHERE name = 'Prompt Engineering';
  END IF;
END $$;

-- =====================================================
-- STEP 2: Add Assessment Questions
-- =====================================================

-- Delete existing questions if re-running (optional - comment out if you want to keep existing)
-- DELETE FROM assessment_questions WHERE category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

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
  'In a JSON prompt, which field should you use to force the model''s tone?',
  'text_input',
  'Understanding how to control tone in structured prompts. The correct answer is "style"',
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
-- STEP 3: Add Answer Options for ALL Questions
-- =====================================================

-- Store question IDs in temporary variables for easier reference
DO $$
DECLARE
  q1_id UUID; q2_id UUID; q3_id UUID; q4_id UUID; q5_id UUID;
  q6_id UUID; q7_id UUID; q8_id UUID; q9_id UUID; q10_id UUID;
  q11_id UUID; q12_id UUID; q13_id UUID; q14_id UUID; q15_id UUID;
  q16_id UUID; q17_id UUID; q18_id UUID; q19_id UUID; q20_id UUID;
  qr1_id UUID; qr2_id UUID; qr3_id UUID; qr4_id UUID; qr5_id UUID;
BEGIN
  -- Get question IDs
  SELECT id INTO q1_id FROM assessment_questions WHERE question_text = 'What is the primary purpose of prompt engineering?';
  SELECT id INTO q2_id FROM assessment_questions WHERE question_text LIKE 'Which prompting technique requires NO examples%';
  SELECT id INTO q3_id FROM assessment_questions WHERE question_text LIKE '%PGTC framework%what does the "C" stand for%';
  SELECT id INTO q4_id FROM assessment_questions WHERE question_text LIKE 'Chain-of-Thought (CoT) prompting is most effective%';
  SELECT id INTO q5_id FROM assessment_questions WHERE question_text LIKE 'What is a major limitation of prompt engineering%';
  SELECT id INTO q6_id FROM assessment_questions WHERE question_text LIKE '%NOT a key component of effective prompt structure%';
  SELECT id INTO q7_id FROM assessment_questions WHERE question_text LIKE '%few-shot prompting%examples don''t improve performance%';
  SELECT id INTO q8_id FROM assessment_questions WHERE question_text LIKE '%hallucination%mean in the context of AI%';
  SELECT id INTO q9_id FROM assessment_questions WHERE question_text LIKE '%designed to make AI show its reasoning process step-by-step%';
  SELECT id INTO q10_id FROM assessment_questions WHERE question_text LIKE '%most common mistake in prompt engineering%';
  SELECT id INTO q11_id FROM assessment_questions WHERE question_text LIKE '%enterprise applications%most valuable for which use case%';
  SELECT id INTO q12_id FROM assessment_questions WHERE question_text LIKE '%prompt injection%why is it a concern%';
  SELECT id INTO q13_id FROM assessment_questions WHERE question_text LIKE '%evaluation metric%most important%factual tasks%';
  SELECT id INTO q14_id FROM assessment_questions WHERE question_text LIKE 'The SCAMPER methodology%';
  SELECT id INTO q15_id FROM assessment_questions WHERE question_text LIKE '%primary advantage of using personas%';
  SELECT id INTO q16_id FROM assessment_questions WHERE question_text LIKE '%what does "temperature" control%';
  SELECT id INTO q17_id FROM assessment_questions WHERE question_text LIKE '%best practice for handling complex multi-part requests%';
  SELECT id INTO q18_id FROM assessment_questions WHERE question_text LIKE '%main challenge with evaluating prompt effectiveness in creative tasks%';
  SELECT id INTO q19_id FROM assessment_questions WHERE question_text LIKE '%AI safety and responsible use%should prompt engineers prioritize%';
  SELECT id INTO q20_id FROM assessment_questions WHERE question_text LIKE '%emerging trend is shaping the future of prompt engineering%';
  SELECT id INTO qr1_id FROM assessment_questions WHERE question_text LIKE '%Which key parameter removes guess-work in OpenAI chat calls%';
  SELECT id INTO qr2_id FROM assessment_questions WHERE question_text LIKE 'JSON prompts are especially useful when%';
  SELECT id INTO qr3_id FROM assessment_questions WHERE question_text LIKE 'True or False: JSON mode alone guarantees adherence%';
  SELECT id INTO qr5_id FROM assessment_questions WHERE question_text LIKE 'Benefits of JSON prompting include%';

  -- Q1 Options
  INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q1_id, 'To train new AI models from scratch', false, 1),
    (q1_id, 'To design effective inputs that guide AI models toward desired outputs', true, 2),
    (q1_id, 'To debug AI model architecture', false, 3),
    (q1_id, 'To increase computational speed of AI systems', false, 4);

  -- Q2 Options
  INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q2_id, 'Few-shot prompting', false, 1),
    (q2_id, 'Chain-of-thought prompting', false, 2),
    (q2_id, 'Zero-shot prompting', true, 3),
    (q2_id, 'Self-consistency prompting', false, 4);

  -- Q3 Options
  INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q3_id, 'Creativity', false, 1),
    (q3_id, 'Constraints', false, 2),
    (q3_id, 'Context', true, 3),
    (q3_id, 'Completion', false, 4);

  -- Q4 Options
  INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q4_id, 'Simple factual retrieval', false, 1),
    (q4_id, 'Creative writing only', false, 2),
    (q4_id, 'Complex reasoning and multi-step problem solving', true, 3),
    (q4_id, 'Image generation tasks', false, 4);

  -- Q5 Options
  INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q5_id, 'It only works with GPT models', false, 1),
    (q5_id, 'Prompts can be brittle and may not transfer well between different AI models', true, 2),
    (q5_id, 'It requires extensive coding knowledge', false, 3),
    (q5_id, 'It can only be used for text generation', false, 4);

  -- Q6 Options
  INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q6_id, 'Role/Persona definition', false, 1),
    (q6_id, 'Task specification', false, 2),
    (q6_id, 'Random token insertion', true, 3),
    (q6_id, 'Context provision', false, 4);

  -- Q7 Options
  INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q7_id, 'Add more examples immediately', false, 1),
    (q7_id, 'Check if examples are diverse and high-quality, then consider zero-shot', true, 2),
    (q7_id, 'Switch to a different AI model', false, 3),
    (q7_id, 'Increase the temperature setting', false, 4);

  -- Q8 Options
  INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q8_id, 'The AI generates creative and imaginative content', false, 1),
    (q8_id, 'The AI produces confident-sounding but factually incorrect information', true, 2),
    (q8_id, 'The AI refuses to answer questions', false, 3),
    (q8_id, 'The AI generates duplicate responses', false, 4);

  -- Q9 Options
  INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q9_id, 'Role-playing prompts', false, 1),
    (q9_id, 'Chain-of-Thought prompting', true, 2),
    (q9_id, 'Temperature adjustment', false, 3),
    (q9_id, 'Token limiting', false, 4);

  -- Q10 Options
  INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q10_id, 'Using too many examples', false, 1),
    (q10_id, 'Being too specific', false, 2),
    (q10_id, 'Being too vague or ambiguous in instructions', true, 3),
    (q10_id, 'Making prompts too short', false, 4);

  -- Q11 Options
  INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q11_id, 'Replacing human workers entirely', false, 1),
    (q11_id, 'Creating consistent, high-quality AI interactions for business processes', true, 2),
    (q11_id, 'Reducing computational costs only', false, 3),
    (q11_id, 'Training new AI models', false, 4);

  -- Q12 Options
  INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q12_id, 'A technique to improve prompt performance', false, 1),
    (q12_id, 'A security vulnerability where malicious inputs can manipulate AI behavior', true, 2),
    (q12_id, 'A method for adding examples to prompts', false, 3),
    (q12_id, 'A way to reduce AI response time', false, 4);

  -- Q13 Options
  INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q13_id, 'Creativity score', false, 1),
    (q13_id, 'Response length', false, 2),
    (q13_id, 'Accuracy and factual correctness', true, 3),
    (q13_id, 'Processing speed', false, 4);

  -- Q14 Options
  INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q14_id, 'System-Context-Analysis-Method-Prompt-Evaluation-Results', true, 1),
    (q14_id, 'Substitute-Combine-Adapt-Modify-Put to other uses-Eliminate-Reverse', false, 2),
    (q14_id, 'Structure-Create-Analyze-Measure-Present-Execute-Review', false, 3),
    (q14_id, 'Simple-Clear-Accurate-Measurable-Precise-Efficient-Relevant', false, 4);

  -- Q15 Options
  INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q15_id, 'It makes prompts longer and more detailed', false, 1),
    (q15_id, 'It helps AI adopt specific expertise and perspective for more relevant responses', true, 2),
    (q15_id, 'It reduces computational requirements', false, 3),
    (q15_id, 'It eliminates the need for examples', false, 4);

  -- Q16 Options
  INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q16_id, 'The processing speed of the AI model', false, 1),
    (q16_id, 'The creativity/randomness vs. consistency of AI responses', true, 2),
    (q16_id, 'The length of the generated response', false, 3),
    (q16_id, 'The accuracy of factual information', false, 4);

  -- Q17 Options
  INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q17_id, 'Combine all requests into one long prompt', false, 1),
    (q17_id, 'Break complex tasks into sequential, manageable prompts', true, 2),
    (q17_id, 'Use only zero-shot prompting', false, 3),
    (q17_id, 'Increase the model''s context window', false, 4);

  -- Q18 Options
  INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q18_id, 'Creative tasks cannot be evaluated', false, 1),
    (q18_id, 'Evaluation is highly subjective and context-dependent', true, 2),
    (q18_id, 'Creative prompts always produce the same output', false, 3),
    (q18_id, 'Only technical experts can evaluate creative outputs', false, 4);

  -- Q19 Options
  INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q19_id, 'Maximum creativity in outputs', false, 1),
    (q19_id, 'Fastest possible response times', false, 2),
    (q19_id, 'Preventing bias, harmful content, and ensuring ethical AI behavior', true, 3),
    (q19_id, 'Longest possible responses', false, 4);

  -- Q20 Options
  INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q20_id, 'Elimination of the need for prompts entirely', false, 1),
    (q20_id, 'Integration with autonomous AI agents and multi-modal interactions', true, 2),
    (q20_id, 'Focus only on text-based applications', false, 3),
    (q20_id, 'Reduction in prompt complexity', false, 4);

  -- Rapid Quiz Q1 Options
  INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
    (qr1_id, 'temperature', false, 1),
    (qr1_id, 'response_format', true, 2),
    (qr1_id, 'max_tokens', false, 3);

  -- Rapid Quiz Q2 Options
  INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
    (qr2_id, 'you need more tokens', false, 1),
    (qr2_id, 'downstream code parses results', true, 2),
    (qr2_id, 'chatting casually', false, 3);

  -- Rapid Quiz Q3 Options
  INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
    (qr3_id, 'True', false, 1),
    (qr3_id, 'False', true, 2);

  -- Rapid Quiz Q5 Options (multiple choice)
  INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
    (qr5_id, 'easier validation', true, 1),
    (qr5_id, 'smaller tokens', false, 2),
    (qr5_id, 'type-safety', true, 3),
    (qr5_id, 'neural speedup', false, 4);

END $$;

-- =====================================================
-- STEP 4: Verify the additions
-- =====================================================

SELECT
  c.name as category,
  COUNT(q.id) as question_count,
  COUNT(o.id) as option_count
FROM assessment_categories c
LEFT JOIN assessment_questions q ON q.category_id = c.id
LEFT JOIN assessment_question_options o ON o.question_id = q.id
WHERE c.name = 'Prompt Engineering'
GROUP BY c.name;

-- Show sample questions
SELECT
  q.order_index,
  q.question_text,
  COUNT(o.id) as option_count
FROM assessment_questions q
LEFT JOIN assessment_question_options o ON o.question_id = q.id
WHERE q.category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering')
GROUP BY q.id, q.order_index, q.question_text
ORDER BY q.order_index
LIMIT 10;
