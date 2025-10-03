-- Fix missing options for Prompt Engineering questions Q4 and Q5
-- Issue: Questions exist but have no options, causing "No options available" error

-- First, update Q4 question type from 'text_input' to 'single_choice'
UPDATE assessment_questions
SET question_type = 'single_choice',
    question_text = 'In a JSON prompt, which field should you use to force the model''s tone?'
WHERE question_text LIKE '%JSON prompt%force the model''s tone%'
  AND question_type = 'text_input';

-- Add options for Q4: JSON prompt tone control (Answer: "style")
INSERT INTO assessment_question_options (question_id, option_text, option_value, is_correct, order_index, points) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%JSON prompt%force the model''s tone%' LIMIT 1),
  '"style"',
  'style',
  true, 1, 10
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%JSON prompt%force the model''s tone%' LIMIT 1),
  '"tone"',
  'tone',
  false, 2, 0
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%JSON prompt%force the model''s tone%' LIMIT 1),
  '"mood"',
  'mood',
  false, 3, 0
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%JSON prompt%force the model''s tone%' LIMIT 1),
  '"voice"',
  'voice',
  false, 4, 0
);

-- Add options for Q5: Benefits of JSON prompting (Answer: All apply - multiple correct)
INSERT INTO assessment_question_options (question_id, option_text, option_value, is_correct, order_index, points) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'Benefits of JSON prompting%' LIMIT 1),
  'Structured outputs',
  'structured',
  true, 1, 3
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'Benefits of JSON prompting%' LIMIT 1),
  'Easier parsing',
  'parsing',
  true, 2, 3
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'Benefits of JSON prompting%' LIMIT 1),
  'Better consistency',
  'consistency',
  true, 3, 2
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'Benefits of JSON prompting%' LIMIT 1),
  'Reduced ambiguity',
  'ambiguity',
  true, 4, 2
);
