-- Final Fixed Version: Prompt Engineering Assessment Questions
-- Includes proper option_value field for all options

-- =====================================================
-- STEP 1: Add or Update Prompt Engineering Category
-- =====================================================

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
-- STEP 3: Add Answer Options with option_value field
-- =====================================================

DO $$
DECLARE
  q1_id UUID; q2_id UUID; q3_id UUID; q4_id UUID; q5_id UUID;
  q6_id UUID; q7_id UUID; q8_id UUID; q9_id UUID; q10_id UUID;
  q11_id UUID; q12_id UUID; q13_id UUID; q14_id UUID; q15_id UUID;
  q16_id UUID; q17_id UUID; q18_id UUID; q19_id UUID; q20_id UUID;
  qr1_id UUID; qr2_id UUID; qr3_id UUID; qr4_id UUID; qr5_id UUID;
BEGIN
  -- Get question IDs
  SELECT id INTO q1_id FROM assessment_questions WHERE question_text = 'What is the primary purpose of prompt engineering?' AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');
  SELECT id INTO q2_id FROM assessment_questions WHERE question_text LIKE 'Which prompting technique requires NO examples%' AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');
  SELECT id INTO q3_id FROM assessment_questions WHERE question_text LIKE '%PGTC framework%what does the "C" stand for%' AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');
  SELECT id INTO q4_id FROM assessment_questions WHERE question_text LIKE 'Chain-of-Thought (CoT) prompting is most effective%' AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');
  SELECT id INTO q5_id FROM assessment_questions WHERE question_text LIKE 'What is a major limitation of prompt engineering%' AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');
  SELECT id INTO q6_id FROM assessment_questions WHERE question_text LIKE '%NOT a key component of effective prompt structure%' AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');
  SELECT id INTO q7_id FROM assessment_questions WHERE question_text LIKE '%few-shot prompting%examples don''t improve performance%' AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');
  SELECT id INTO q8_id FROM assessment_questions WHERE question_text LIKE '%hallucination%mean in the context of AI%' AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');
  SELECT id INTO q9_id FROM assessment_questions WHERE question_text LIKE '%designed to make AI show its reasoning process step-by-step%' AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');
  SELECT id INTO q10_id FROM assessment_questions WHERE question_text LIKE '%most common mistake in prompt engineering%' AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');
  SELECT id INTO q11_id FROM assessment_questions WHERE question_text LIKE '%enterprise applications%most valuable for which use case%' AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');
  SELECT id INTO q12_id FROM assessment_questions WHERE question_text LIKE '%prompt injection%why is it a concern%' AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');
  SELECT id INTO q13_id FROM assessment_questions WHERE question_text LIKE '%evaluation metric%most important%factual tasks%' AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');
  SELECT id INTO q14_id FROM assessment_questions WHERE question_text LIKE 'The SCAMPER methodology%' AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');
  SELECT id INTO q15_id FROM assessment_questions WHERE question_text LIKE '%primary advantage of using personas%' AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');
  SELECT id INTO q16_id FROM assessment_questions WHERE question_text LIKE '%what does "temperature" control%' AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');
  SELECT id INTO q17_id FROM assessment_questions WHERE question_text LIKE '%best practice for handling complex multi-part requests%' AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');
  SELECT id INTO q18_id FROM assessment_questions WHERE question_text LIKE '%main challenge with evaluating prompt effectiveness in creative tasks%' AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');
  SELECT id INTO q19_id FROM assessment_questions WHERE question_text LIKE '%AI safety and responsible use%should prompt engineers prioritize%' AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');
  SELECT id INTO q20_id FROM assessment_questions WHERE question_text LIKE '%emerging trend is shaping the future of prompt engineering%' AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');
  SELECT id INTO qr1_id FROM assessment_questions WHERE question_text LIKE '%Which key parameter removes guess-work in OpenAI chat calls%' AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');
  SELECT id INTO qr2_id FROM assessment_questions WHERE question_text LIKE 'JSON prompts are especially useful when%' AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');
  SELECT id INTO qr3_id FROM assessment_questions WHERE question_text LIKE 'True or False: JSON mode alone guarantees adherence%' AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');
  SELECT id INTO qr5_id FROM assessment_questions WHERE question_text LIKE 'Benefits of JSON prompting include%' AND category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

  -- Q1 Options (Answer: B)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (q1_id, 'To train new AI models from scratch', 'train_models', 0, false, 1),
    (q1_id, 'To design effective inputs that guide AI models toward desired outputs', 'design_inputs', 10, true, 2),
    (q1_id, 'To debug AI model architecture', 'debug_architecture', 0, false, 3),
    (q1_id, 'To increase computational speed of AI systems', 'increase_speed', 0, false, 4);

  -- Q2 Options (Answer: C)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (q2_id, 'Few-shot prompting', 'few_shot', 0, false, 1),
    (q2_id, 'Chain-of-thought prompting', 'chain_of_thought', 0, false, 2),
    (q2_id, 'Zero-shot prompting', 'zero_shot', 10, true, 3),
    (q2_id, 'Self-consistency prompting', 'self_consistency', 0, false, 4);

  -- Q3 Options (Answer: C - Context)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (q3_id, 'Creativity', 'creativity', 0, false, 1),
    (q3_id, 'Constraints', 'constraints', 0, false, 2),
    (q3_id, 'Context', 'context', 10, true, 3),
    (q3_id, 'Completion', 'completion', 0, false, 4);

  -- Q4 Options (Answer: C)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (q4_id, 'Simple factual retrieval', 'factual', 0, false, 1),
    (q4_id, 'Creative writing only', 'creative', 0, false, 2),
    (q4_id, 'Complex reasoning and multi-step problem solving', 'complex_reasoning', 10, true, 3),
    (q4_id, 'Image generation tasks', 'image_gen', 0, false, 4);

  -- Q5 Options (Answer: B)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (q5_id, 'It only works with GPT models', 'gpt_only', 0, false, 1),
    (q5_id, 'Prompts can be brittle and may not transfer well between different AI models', 'brittle_prompts', 10, true, 2),
    (q5_id, 'It requires extensive coding knowledge', 'coding_required', 0, false, 3),
    (q5_id, 'It can only be used for text generation', 'text_only', 0, false, 4);

  -- Q6 Options (Answer: C - Random token insertion)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (q6_id, 'Role/Persona definition', 'role_persona', 0, false, 1),
    (q6_id, 'Task specification', 'task_spec', 0, false, 2),
    (q6_id, 'Random token insertion', 'random_tokens', 10, true, 3),
    (q6_id, 'Context provision', 'context', 0, false, 4);

  -- Q7 Options (Answer: B)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (q7_id, 'Add more examples immediately', 'add_more', 0, false, 1),
    (q7_id, 'Check if examples are diverse and high-quality, then consider zero-shot', 'check_quality', 10, true, 2),
    (q7_id, 'Switch to a different AI model', 'switch_model', 0, false, 3),
    (q7_id, 'Increase the temperature setting', 'increase_temp', 0, false, 4);

  -- Q8 Options (Answer: B)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (q8_id, 'The AI generates creative and imaginative content', 'creative', 0, false, 1),
    (q8_id, 'The AI produces confident-sounding but factually incorrect information', 'incorrect_info', 10, true, 2),
    (q8_id, 'The AI refuses to answer questions', 'refuses', 0, false, 3),
    (q8_id, 'The AI generates duplicate responses', 'duplicates', 0, false, 4);

  -- Q9 Options (Answer: B)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (q9_id, 'Role-playing prompts', 'role_play', 0, false, 1),
    (q9_id, 'Chain-of-Thought prompting', 'chain_of_thought', 10, true, 2),
    (q9_id, 'Temperature adjustment', 'temperature', 0, false, 3),
    (q9_id, 'Token limiting', 'token_limit', 0, false, 4);

  -- Q10 Options (Answer: C)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (q10_id, 'Using too many examples', 'too_many', 0, false, 1),
    (q10_id, 'Being too specific', 'too_specific', 0, false, 2),
    (q10_id, 'Being too vague or ambiguous in instructions', 'too_vague', 10, true, 3),
    (q10_id, 'Making prompts too short', 'too_short', 0, false, 4);

  -- Q11 Options (Answer: B)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (q11_id, 'Replacing human workers entirely', 'replace_humans', 0, false, 1),
    (q11_id, 'Creating consistent, high-quality AI interactions for business processes', 'consistent_quality', 10, true, 2),
    (q11_id, 'Reducing computational costs only', 'reduce_costs', 0, false, 3),
    (q11_id, 'Training new AI models', 'train_models', 0, false, 4);

  -- Q12 Options (Answer: B)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (q12_id, 'A technique to improve prompt performance', 'improve_performance', 0, false, 1),
    (q12_id, 'A security vulnerability where malicious inputs can manipulate AI behavior', 'security_vuln', 10, true, 2),
    (q12_id, 'A method for adding examples to prompts', 'add_examples', 0, false, 3),
    (q12_id, 'A way to reduce AI response time', 'reduce_time', 0, false, 4);

  -- Q13 Options (Answer: C)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (q13_id, 'Creativity score', 'creativity', 0, false, 1),
    (q13_id, 'Response length', 'length', 0, false, 2),
    (q13_id, 'Accuracy and factual correctness', 'accuracy', 10, true, 3),
    (q13_id, 'Processing speed', 'speed', 0, false, 4);

  -- Q14 Options (Answer: A)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (q14_id, 'System-Context-Analysis-Method-Prompt-Evaluation-Results', 'scamper_correct', 10, true, 1),
    (q14_id, 'Substitute-Combine-Adapt-Modify-Put to other uses-Eliminate-Reverse', 'scamper_creative', 0, false, 2),
    (q14_id, 'Structure-Create-Analyze-Measure-Present-Execute-Review', 'scamper_alt1', 0, false, 3),
    (q14_id, 'Simple-Clear-Accurate-Measurable-Precise-Efficient-Relevant', 'scamper_alt2', 0, false, 4);

  -- Q15 Options (Answer: B)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (q15_id, 'It makes prompts longer and more detailed', 'longer', 0, false, 1),
    (q15_id, 'It helps AI adopt specific expertise and perspective for more relevant responses', 'expertise', 10, true, 2),
    (q15_id, 'It reduces computational requirements', 'reduce_compute', 0, false, 3),
    (q15_id, 'It eliminates the need for examples', 'no_examples', 0, false, 4);

  -- Q16 Options (Answer: B)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (q16_id, 'The processing speed of the AI model', 'speed', 0, false, 1),
    (q16_id, 'The creativity/randomness vs. consistency of AI responses', 'creativity_consistency', 10, true, 2),
    (q16_id, 'The length of the generated response', 'length', 0, false, 3),
    (q16_id, 'The accuracy of factual information', 'accuracy', 0, false, 4);

  -- Q17 Options (Answer: B)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (q17_id, 'Combine all requests into one long prompt', 'combine_all', 0, false, 1),
    (q17_id, 'Break complex tasks into sequential, manageable prompts', 'break_sequential', 10, true, 2),
    (q17_id, 'Use only zero-shot prompting', 'zero_shot_only', 0, false, 3),
    (q17_id, 'Increase the model''s context window', 'increase_context', 0, false, 4);

  -- Q18 Options (Answer: B)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (q18_id, 'Creative tasks cannot be evaluated', 'cannot_evaluate', 0, false, 1),
    (q18_id, 'Evaluation is highly subjective and context-dependent', 'subjective', 10, true, 2),
    (q18_id, 'Creative prompts always produce the same output', 'same_output', 0, false, 3),
    (q18_id, 'Only technical experts can evaluate creative outputs', 'experts_only', 0, false, 4);

  -- Q19 Options (Answer: C)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (q19_id, 'Maximum creativity in outputs', 'max_creativity', 0, false, 1),
    (q19_id, 'Fastest possible response times', 'fast_response', 0, false, 2),
    (q19_id, 'Preventing bias, harmful content, and ensuring ethical AI behavior', 'ethical_behavior', 10, true, 3),
    (q19_id, 'Longest possible responses', 'long_responses', 0, false, 4);

  -- Q20 Options (Answer: B)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (q20_id, 'Elimination of the need for prompts entirely', 'no_prompts', 0, false, 1),
    (q20_id, 'Integration with autonomous AI agents and multi-modal interactions', 'ai_agents_multimodal', 10, true, 2),
    (q20_id, 'Focus only on text-based applications', 'text_only', 0, false, 3),
    (q20_id, 'Reduction in prompt complexity', 'reduce_complexity', 0, false, 4);

  -- Rapid Quiz Q1 Options (Answer: b - response_format)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (qr1_id, 'temperature', 'temperature', 0, false, 1),
    (qr1_id, 'response_format', 'response_format', 10, true, 2),
    (qr1_id, 'max_tokens', 'max_tokens', 0, false, 3);

  -- Rapid Quiz Q2 Options (Answer: b - downstream code parses results)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (qr2_id, 'you need more tokens', 'more_tokens', 0, false, 1),
    (qr2_id, 'downstream code parses results', 'downstream_parsing', 10, true, 2),
    (qr2_id, 'chatting casually', 'casual_chat', 0, false, 3);

  -- Rapid Quiz Q3 Options (Answer: False)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (qr3_id, 'True', 'true', 0, false, 1),
    (qr3_id, 'False', 'false', 10, true, 2);

  -- Rapid Quiz Q5 Options (Answer: a & c - easier validation, type-safety)
  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index) VALUES
    (qr5_id, 'easier validation', 'easier_validation', 5, true, 1),
    (qr5_id, 'smaller tokens', 'smaller_tokens', 0, false, 2),
    (qr5_id, 'type-safety', 'type_safety', 5, true, 3),
    (qr5_id, 'neural speedup', 'neural_speedup', 0, false, 4);

END $$;

-- =====================================================
-- STEP 4: Verify the additions
-- =====================================================

SELECT
  c.name as category,
  COUNT(DISTINCT q.id) as question_count,
  COUNT(o.id) as option_count
FROM assessment_categories c
LEFT JOIN assessment_questions q ON q.category_id = c.id
LEFT JOIN assessment_question_options o ON o.question_id = q.id
WHERE c.name = 'Prompt Engineering'
GROUP BY c.name;

-- Show first 10 questions with their options
SELECT
  q.order_index,
  LEFT(q.question_text, 60) || '...' as question,
  COUNT(o.id) as options,
  SUM(CASE WHEN o.is_correct THEN 1 ELSE 0 END) as correct_answers
FROM assessment_questions q
LEFT JOIN assessment_question_options o ON o.question_id = q.id
WHERE q.category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering')
GROUP BY q.id, q.order_index, q.question_text
ORDER BY q.order_index
LIMIT 10;
