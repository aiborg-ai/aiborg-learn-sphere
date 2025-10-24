-- =====================================================
-- AI-FLUENCY ASSESSMENT - SAMPLE QUESTIONS
-- Created: 2025-10-23
-- Purpose: Sample questions for testing AI-Fluency assessment
-- Audiences: Young Learners (primary), Teenagers (secondary), Professionals (professional)
-- Focus: Practical AI skills, prompt engineering, tool usage
-- =====================================================

-- =====================================================
-- YOUNG LEARNERS (PRIMARY) - AI-FLUENCY QUESTIONS
-- Simple practical tasks with AI tools
-- =====================================================

-- Question 1: Applied - Using AI for homework
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
  (SELECT id FROM assessment_categories WHERE name = 'AI Tools & Frameworks' LIMIT 1),
  'You want to use AI to help write a story. What should you ask it?',
  'single_choice',
  'applied',
  'apply',
  0.3,
  ARRAY['primary'],
  'Think about giving clear instructions',
  15,
  true
);

INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index)
VALUES
  ((SELECT id FROM assessment_questions WHERE question_text = 'You want to use AI to help write a story. What should you ask it?' LIMIT 1),
   'Write a story about a friendly dragon who helps people', 'clear_prompt', 15, true, 1),
  ((SELECT id FROM assessment_questions WHERE question_text = 'You want to use AI to help write a story. What should you ask it?' LIMIT 1),
   'Story', 'vague', 0, false, 2),
  ((SELECT id FROM assessment_questions WHERE question_text = 'You want to use AI to help write a story. What should you ask it?' LIMIT 1),
   'Do my homework', 'do_homework', 0, false, 3),
  ((SELECT id FROM assessment_questions WHERE question_text = 'You want to use AI to help write a story. What should you ask it?' LIMIT 1),
   'Write something', 'write_something', 0, false, 4);

-- Question 2: Applied - AI Image creation
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
  (SELECT id FROM assessment_categories WHERE name = 'Computer Vision' LIMIT 1),
  'Which description would help AI create the BEST picture of a cat?',
  'single_choice',
  'applied',
  'apply',
  0.5,
  ARRAY['primary'],
  'More details make better pictures',
  15,
  true
);

INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index)
VALUES
  ((SELECT id FROM assessment_questions WHERE question_text = 'Which description would help AI create the BEST picture of a cat?' LIMIT 1),
   'A fluffy orange cat sitting on a windowsill in the sunshine', 'detailed', 15, true, 1),
  ((SELECT id FROM assessment_questions WHERE question_text = 'Which description would help AI create the BEST picture of a cat?' LIMIT 1),
   'Cat', 'simple', 0, false, 2),
  ((SELECT id FROM assessment_questions WHERE question_text = 'Which description would help AI create the BEST picture of a cat?' LIMIT 1),
   'Animal', 'vague', 0, false, 3),
  ((SELECT id FROM assessment_questions WHERE question_text = 'Which description would help AI create the BEST picture of a cat?' LIMIT 1),
   'Picture please', 'no_description', 0, false, 4);

-- Question 3: Applied - Checking AI answers
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
  'After AI gives you an answer, what should you ALWAYS do?',
  'single_choice',
  'applied',
  'evaluate',
  0.7,
  ARRAY['primary'],
  'AI can make mistakes, just like people',
  20,
  true
);

INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index)
VALUES
  ((SELECT id FROM assessment_questions WHERE question_text = 'After AI gives you an answer, what should you ALWAYS do?' LIMIT 1),
   'Check if the answer makes sense and is correct', 'check_answer', 20, true, 1),
  ((SELECT id FROM assessment_questions WHERE question_text = 'After AI gives you an answer, what should you ALWAYS do?' LIMIT 1),
   'Copy it without reading', 'copy_without_reading', 0, false, 2),
  ((SELECT id FROM assessment_questions WHERE question_text = 'After AI gives you an answer, what should you ALWAYS do?' LIMIT 1),
   'Delete it immediately', 'delete', 0, false, 3),
  ((SELECT id FROM assessment_questions WHERE question_text = 'After AI gives you an answer, what should you ALWAYS do?' LIMIT 1),
   'Share it with everyone right away', 'share_immediately', 0, false, 4);

-- =====================================================
-- TEENAGERS (SECONDARY) - AI-FLUENCY QUESTIONS
-- More complex prompts and tool usage
-- =====================================================

-- Question 4: Advanced - Prompt Engineering
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
  (SELECT id FROM assessment_categories WHERE name = 'Natural Language Processing' LIMIT 1),
  'Which prompt would give you the BEST code explanation from an AI?',
  'single_choice',
  'advanced',
  'evaluate',
  1.0,
  ARRAY['secondary'],
  'Specific context and format requests work best',
  20,
  true
);

INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index)
VALUES
  ((SELECT id FROM assessment_questions WHERE question_text = 'Which prompt would give you the BEST code explanation from an AI?' LIMIT 1),
   'Explain this Python code like I''m a beginner: [code]. Include what each line does', 'detailed_prompt', 20, true, 1),
  ((SELECT id FROM assessment_questions WHERE question_text = 'Which prompt would give you the BEST code explanation from an AI?' LIMIT 1),
   'What does this do?', 'vague', 0, false, 2),
  ((SELECT id FROM assessment_questions WHERE question_text = 'Which prompt would give you the BEST code explanation from an AI?' LIMIT 1),
   'Explain code', 'too_simple', 0, false, 3),
  ((SELECT id FROM assessment_questions WHERE question_text = 'Which prompt would give you the BEST code explanation from an AI?' LIMIT 1),
   'Help', 'no_context', 0, false, 4);

-- Question 5: Advanced - AI Tool Selection
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
  (SELECT id FROM assessment_categories WHERE name = 'AI Tools & Frameworks' LIMIT 1),
  'You need to create a presentation with AI-generated images. Which tool combination is BEST?',
  'single_choice',
  'advanced',
  'apply',
  1.2,
  ARRAY['secondary'],
  'Choose tools that match your specific needs',
  20,
  true
);

INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index)
VALUES
  ((SELECT id FROM assessment_questions WHERE question_text = 'You need to create a presentation with AI-generated images. Which tool combination is BEST?' LIMIT 1),
   'Midjourney for images + ChatGPT for content + Canva for design', 'best_combo', 20, true, 1),
  ((SELECT id FROM assessment_questions WHERE question_text = 'You need to create a presentation with AI-generated images. Which tool combination is BEST?' LIMIT 1),
   'Only use ChatGPT for everything', 'only_chatgpt', 0, false, 2),
  ((SELECT id FROM assessment_questions WHERE question_text = 'You need to create a presentation with AI-generated images. Which tool combination is BEST?' LIMIT 1),
   'Don''t use AI at all', 'no_ai', 0, false, 3),
  ((SELECT id FROM assessment_questions WHERE question_text = 'You need to create a presentation with AI-generated images. Which tool combination is BEST?' LIMIT 1),
   'Use random AI tools without planning', 'random_tools', 0, false, 4);

-- Question 6: Strategic - Evaluating AI output
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
  'You notice an AI chatbot gave you incorrect information. What is the BEST response?',
  'single_choice',
  'strategic',
  'evaluate',
  1.5,
  ARRAY['secondary'],
  'Critical thinking is essential when using AI',
  25,
  true
);

INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index)
VALUES
  ((SELECT id FROM assessment_questions WHERE question_text = 'You notice an AI chatbot gave you incorrect information. What is the BEST response?' LIMIT 1),
   'Verify with reliable sources and provide feedback to improve the AI', 'verify_feedback', 25, true, 1),
  ((SELECT id FROM assessment_questions WHERE question_text = 'You notice an AI chatbot gave you incorrect information. What is the BEST response?' LIMIT 1),
   'Trust the AI because it''s always right', 'always_trust', 0, false, 2),
  ((SELECT id FROM assessment_questions WHERE question_text = 'You notice an AI chatbot gave you incorrect information. What is the BEST response?' LIMIT 1),
   'Stop using all AI tools forever', 'stop_using', 0, false, 3),
  ((SELECT id FROM assessment_questions WHERE question_text = 'You notice an AI chatbot gave you incorrect information. What is the BEST response?' LIMIT 1),
   'Spread the incorrect information anyway', 'spread_misinformation', 0, false, 4);

-- =====================================================
-- PROFESSIONALS - AI-FLUENCY QUESTIONS
-- Advanced prompting, workflow integration, ROI
-- =====================================================

-- Question 7: Advanced - Workflow Integration
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
  'How can you BEST integrate AI into a content marketing workflow?',
  'single_choice',
  'advanced',
  'create',
  1.3,
  ARRAY['professional'],
  'AI should enhance, not replace, human creativity',
  20,
  true
);

INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index)
VALUES
  ((SELECT id FROM assessment_questions WHERE question_text = 'How can you BEST integrate AI into a content marketing workflow?' LIMIT 1),
   'Use AI for ideation and drafts, humans for strategy and final editing', 'human_ai_collab', 20, true, 1),
  ((SELECT id FROM assessment_questions WHERE question_text = 'How can you BEST integrate AI into a content marketing workflow?' LIMIT 1),
   'Let AI do everything automatically without review', 'full_automation', 0, false, 2),
  ((SELECT id FROM assessment_questions WHERE question_text = 'How can you BEST integrate AI into a content marketing workflow?' LIMIT 1),
   'Avoid AI completely to maintain authenticity', 'avoid_ai', 0, false, 3),
  ((SELECT id FROM assessment_questions WHERE question_text = 'How can you BEST integrate AI into a content marketing workflow?' LIMIT 1),
   'Use AI only for spell-checking', 'only_spellcheck', 0, false, 4);

-- Question 8: Strategic - Advanced Prompting
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
  (SELECT id FROM assessment_categories WHERE name = 'Natural Language Processing' LIMIT 1),
  'Which prompt engineering technique improves AI accuracy for complex business analysis?',
  'single_choice',
  'strategic',
  'create',
  1.8,
  ARRAY['professional'],
  'Breaking down complex tasks helps AI reason better',
  25,
  true
);

INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index)
VALUES
  ((SELECT id FROM assessment_questions WHERE question_text = 'Which prompt engineering technique improves AI accuracy for complex business analysis?' LIMIT 1),
   'Chain-of-thought prompting with step-by-step reasoning', 'chain_of_thought', 25, true, 1),
  ((SELECT id FROM assessment_questions WHERE question_text = 'Which prompt engineering technique improves AI accuracy for complex business analysis?' LIMIT 1),
   'Using all capital letters to emphasize importance', 'capital_letters', 0, false, 2),
  ((SELECT id FROM assessment_questions WHERE question_text = 'Which prompt engineering technique improves AI accuracy for complex business analysis?' LIMIT 1),
   'Making prompts as short as possible', 'short_prompts', 0, false, 3),
  ((SELECT id FROM assessment_questions WHERE question_text = 'Which prompt engineering technique improves AI accuracy for complex business analysis?' LIMIT 1),
   'Repeating the same question multiple times', 'repeat_question', 0, false, 4);

-- Question 9: Strategic - ROI and Value
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
  'What is the PRIMARY factor in measuring AI implementation success?',
  'single_choice',
  'strategic',
  'evaluate',
  2.0,
  ARRAY['professional'],
  'Focus on business outcomes, not technology adoption',
  25,
  true
);

INSERT INTO assessment_question_options (question_id, option_text, option_value, points, is_correct, order_index)
VALUES
  ((SELECT id FROM assessment_questions WHERE question_text = 'What is the PRIMARY factor in measuring AI implementation success?' LIMIT 1),
   'Achievement of defined business objectives and ROI', 'business_objectives', 25, true, 1),
  ((SELECT id FROM assessment_questions WHERE question_text = 'What is the PRIMARY factor in measuring AI implementation success?' LIMIT 1),
   'Number of AI tools purchased', 'tools_purchased', 0, false, 2),
  ((SELECT id FROM assessment_questions WHERE question_text = 'What is the PRIMARY factor in measuring AI implementation success?' LIMIT 1),
   'How advanced the AI technology is', 'advanced_tech', 0, false, 3),
  ((SELECT id FROM assessment_questions WHERE question_text = 'What is the PRIMARY factor in measuring AI implementation success?' LIMIT 1),
   'Amount of data collected', 'data_collected', 0, false, 4);

-- =====================================================
-- LINK QUESTIONS TO AI-FLUENCY TOOL
-- =====================================================

DO $$
DECLARE
  v_tool_id UUID;
  v_question_id UUID;
BEGIN
  SELECT id INTO v_tool_id FROM assessment_tools WHERE slug = 'ai-fluency';

  -- Link all AI-Fluency questions to the tool
  FOR v_question_id IN
    SELECT DISTINCT q.id
    FROM assessment_questions q
    WHERE q.is_active = true
      AND q.question_text IN (
        'You want to use AI to help write a story. What should you ask it?',
        'Which description would help AI create the BEST picture of a cat?',
        'After AI gives you an answer, what should you ALWAYS do?',
        'Which prompt would give you the BEST code explanation from an AI?',
        'You need to create a presentation with AI-generated images. Which tool combination is BEST?',
        'You notice an AI chatbot gave you incorrect information. What is the BEST response?',
        'How can you BEST integrate AI into a content marketing workflow?',
        'Which prompt engineering technique improves AI accuracy for complex business analysis?',
        'What is the PRIMARY factor in measuring AI implementation success?'
      )
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
  WHERE tool_id = (SELECT id FROM assessment_tools WHERE slug = 'ai-fluency')
)
WHERE slug = 'ai-fluency';
