-- Answer options for Prompt Engineering Assessment Questions
-- Includes correct answers based on the quiz answer key

-- =====================================================
-- OPTIONS FOR MASTERY QUIZ QUESTIONS
-- =====================================================

-- Q1: Primary purpose of prompt engineering (Answer: B)
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text = 'What is the primary purpose of prompt engineering?'),
  'To train new AI models from scratch',
  false, 1
),
(
  (SELECT id FROM assessment_questions WHERE question_text = 'What is the primary purpose of prompt engineering?'),
  'To design effective inputs that guide AI models toward desired outputs',
  true, 2
),
(
  (SELECT id FROM assessment_questions WHERE question_text = 'What is the primary purpose of prompt engineering?'),
  'To debug AI model architecture',
  false, 3
),
(
  (SELECT id FROM assessment_questions WHERE question_text = 'What is the primary purpose of prompt engineering?'),
  'To increase computational speed of AI systems',
  false, 4
);

-- Q2: Zero-shot prompting (Answer: C)
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'Which prompting technique requires NO examples%'),
  'Few-shot prompting',
  false, 1
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'Which prompting technique requires NO examples%'),
  'Chain-of-thought prompting',
  false, 2
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'Which prompting technique requires NO examples%'),
  'Zero-shot prompting',
  true, 3
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'Which prompting technique requires NO examples%'),
  'Self-consistency prompting',
  false, 4
);

-- Q3: PGTC framework "C" (Answer: C - Context)
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%PGTC framework%what does the "C" stand for%'),
  'Creativity',
  false, 1
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%PGTC framework%what does the "C" stand for%'),
  'Constraints',
  false, 2
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%PGTC framework%what does the "C" stand for%'),
  'Context',
  true, 3
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%PGTC framework%what does the "C" stand for%'),
  'Completion',
  false, 4
);

-- Q4: Chain-of-Thought effectiveness (Answer: C)
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'Chain-of-Thought (CoT) prompting is most effective%'),
  'Simple factual retrieval',
  false, 1
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'Chain-of-Thought (CoT) prompting is most effective%'),
  'Creative writing only',
  false, 2
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'Chain-of-Thought (CoT) prompting is most effective%'),
  'Complex reasoning and multi-step problem solving',
  true, 3
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'Chain-of-Thought (CoT) prompting is most effective%'),
  'Image generation tasks',
  false, 4
);

-- Q5: Major limitation (Answer: B)
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'What is a major limitation of prompt engineering%'),
  'It only works with GPT models',
  false, 1
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'What is a major limitation of prompt engineering%'),
  'Prompts can be brittle and may not transfer well between different AI models',
  true, 2
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'What is a major limitation of prompt engineering%'),
  'It requires extensive coding knowledge',
  false, 3
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'What is a major limitation of prompt engineering%'),
  'It can only be used for text generation',
  false, 4
);

-- Q6: NOT a component (Answer: C - Random token insertion)
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%NOT a key component of effective prompt structure%'),
  'Role/Persona definition',
  false, 1
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%NOT a key component of effective prompt structure%'),
  'Task specification',
  false, 2
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%NOT a key component of effective prompt structure%'),
  'Random token insertion',
  true, 3
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%NOT a key component of effective prompt structure%'),
  'Context provision',
  false, 4
);

-- Q7: Few-shot troubleshooting (Answer: B)
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%few-shot prompting%examples don''t improve performance%'),
  'Add more examples immediately',
  false, 1
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%few-shot prompting%examples don''t improve performance%'),
  'Check if examples are diverse and high-quality, then consider zero-shot',
  true, 2
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%few-shot prompting%examples don''t improve performance%'),
  'Switch to a different AI model',
  false, 3
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%few-shot prompting%examples don''t improve performance%'),
  'Increase the temperature setting',
  false, 4
);

-- Q8: Hallucination (Answer: B)
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%hallucination%mean in the context of AI%'),
  'The AI generates creative and imaginative content',
  false, 1
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%hallucination%mean in the context of AI%'),
  'The AI produces confident-sounding but factually incorrect information',
  true, 2
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%hallucination%mean in the context of AI%'),
  'The AI refuses to answer questions',
  false, 3
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%hallucination%mean in the context of AI%'),
  'The AI generates duplicate responses',
  false, 4
);

-- Q9: Step-by-step reasoning (Answer: B)
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%designed to make AI show its reasoning process step-by-step%'),
  'Role-playing prompts',
  false, 1
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%designed to make AI show its reasoning process step-by-step%'),
  'Chain-of-Thought prompting',
  true, 2
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%designed to make AI show its reasoning process step-by-step%'),
  'Temperature adjustment',
  false, 3
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%designed to make AI show its reasoning process step-by-step%'),
  'Token limiting',
  false, 4
);

-- Q10: Most common mistake (Answer: C)
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%most common mistake in prompt engineering%'),
  'Using too many examples',
  false, 1
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%most common mistake in prompt engineering%'),
  'Being too specific',
  false, 2
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%most common mistake in prompt engineering%'),
  'Being too vague or ambiguous in instructions',
  true, 3
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%most common mistake in prompt engineering%'),
  'Making prompts too short',
  false, 4
);

-- Q11: Enterprise use case (Answer: B)
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%enterprise applications%most valuable for which use case%'),
  'Replacing human workers entirely',
  false, 1
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%enterprise applications%most valuable for which use case%'),
  'Creating consistent, high-quality AI interactions for business processes',
  true, 2
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%enterprise applications%most valuable for which use case%'),
  'Reducing computational costs only',
  false, 3
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%enterprise applications%most valuable for which use case%'),
  'Training new AI models',
  false, 4
);

-- Q12: Prompt injection (Answer: B)
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%prompt injection%why is it a concern%'),
  'A technique to improve prompt performance',
  false, 1
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%prompt injection%why is it a concern%'),
  'A security vulnerability where malicious inputs can manipulate AI behavior',
  true, 2
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%prompt injection%why is it a concern%'),
  'A method for adding examples to prompts',
  false, 3
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%prompt injection%why is it a concern%'),
  'A way to reduce AI response time',
  false, 4
);

-- Q13: Evaluation metric for factual tasks (Answer: C)
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%evaluation metric%most important%factual tasks%'),
  'Creativity score',
  false, 1
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%evaluation metric%most important%factual tasks%'),
  'Response length',
  false, 2
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%evaluation metric%most important%factual tasks%'),
  'Accuracy and factual correctness',
  true, 3
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%evaluation metric%most important%factual tasks%'),
  'Processing speed',
  false, 4
);

-- Q14: SCAMPER methodology (Answer: A)
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'The SCAMPER methodology%'),
  'System-Context-Analysis-Method-Prompt-Evaluation-Results',
  true, 1
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'The SCAMPER methodology%'),
  'Substitute-Combine-Adapt-Modify-Put to other uses-Eliminate-Reverse',
  false, 2
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'The SCAMPER methodology%'),
  'Structure-Create-Analyze-Measure-Present-Execute-Review',
  false, 3
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'The SCAMPER methodology%'),
  'Simple-Clear-Accurate-Measurable-Precise-Efficient-Relevant',
  false, 4
);

-- Q15: Primary advantage of personas (Answer: B)
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%primary advantage of using personas%'),
  'It makes prompts longer and more detailed',
  false, 1
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%primary advantage of using personas%'),
  'It helps AI adopt specific expertise and perspective for more relevant responses',
  true, 2
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%primary advantage of using personas%'),
  'It reduces computational requirements',
  false, 3
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%primary advantage of using personas%'),
  'It eliminates the need for examples',
  false, 4
);

-- Q16: Temperature control (Answer: B)
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%what does "temperature" control%'),
  'The processing speed of the AI model',
  false, 1
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%what does "temperature" control%'),
  'The creativity/randomness vs. consistency of AI responses',
  true, 2
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%what does "temperature" control%'),
  'The length of the generated response',
  false, 3
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%what does "temperature" control%'),
  'The accuracy of factual information',
  false, 4
);

-- Q17: Complex multi-part requests (Answer: B)
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%best practice for handling complex multi-part requests%'),
  'Combine all requests into one long prompt',
  false, 1
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%best practice for handling complex multi-part requests%'),
  'Break complex tasks into sequential, manageable prompts',
  true, 2
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%best practice for handling complex multi-part requests%'),
  'Use only zero-shot prompting',
  false, 3
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%best practice for handling complex multi-part requests%'),
  'Increase the model''s context window',
  false, 4
);

-- Q18: Creative task evaluation challenge (Answer: B)
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%main challenge with evaluating prompt effectiveness in creative tasks%'),
  'Creative tasks cannot be evaluated',
  false, 1
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%main challenge with evaluating prompt effectiveness in creative tasks%'),
  'Evaluation is highly subjective and context-dependent',
  true, 2
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%main challenge with evaluating prompt effectiveness in creative tasks%'),
  'Creative prompts always produce the same output',
  false, 3
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%main challenge with evaluating prompt effectiveness in creative tasks%'),
  'Only technical experts can evaluate creative outputs',
  false, 4
);

-- Q19: AI safety priority (Answer: C)
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%AI safety and responsible use%should prompt engineers prioritize%'),
  'Maximum creativity in outputs',
  false, 1
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%AI safety and responsible use%should prompt engineers prioritize%'),
  'Fastest possible response times',
  false, 2
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%AI safety and responsible use%should prompt engineers prioritize%'),
  'Preventing bias, harmful content, and ensuring ethical AI behavior',
  true, 3
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%AI safety and responsible use%should prompt engineers prioritize%'),
  'Longest possible responses',
  false, 4
);

-- Q20: Emerging trend (Answer: B)
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%emerging trend is shaping the future of prompt engineering%'),
  'Elimination of the need for prompts entirely',
  false, 1
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%emerging trend is shaping the future of prompt engineering%'),
  'Integration with autonomous AI agents and multi-modal interactions',
  true, 2
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%emerging trend is shaping the future of prompt engineering%'),
  'Focus only on text-based applications',
  false, 3
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%emerging trend is shaping the future of prompt engineering%'),
  'Reduction in prompt complexity',
  false, 4
);

-- =====================================================
-- OPTIONS FOR RAPID QUIZ (JSON/OpenAI)
-- =====================================================

-- Q1: OpenAI parameter (Answer: b - response_format)
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%Which key parameter removes guess-work in OpenAI chat calls%'),
  'temperature',
  false, 1
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%Which key parameter removes guess-work in OpenAI chat calls%'),
  'response_format',
  true, 2
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE '%Which key parameter removes guess-work in OpenAI chat calls%'),
  'max_tokens',
  false, 3
);

-- Q2: JSON prompts useful when (Answer: b - downstream code parses results)
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'JSON prompts are especially useful when%'),
  'you need more tokens',
  false, 1
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'JSON prompts are especially useful when%'),
  'downstream code parses results',
  true, 2
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'JSON prompts are especially useful when%'),
  'chatting casually',
  false, 3
);

-- Q3: JSON mode guarantees schema (Answer: False)
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'True or False: JSON mode alone guarantees adherence%'),
  'True',
  false, 1
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'True or False: JSON mode alone guarantees adherence%'),
  'False',
  true, 2
);

-- Q5: Benefits of JSON prompting (Answer: a & c - easier validation, type-safety)
INSERT INTO assessment_question_options (question_id, option_text, is_correct, order_index) VALUES
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'Benefits of JSON prompting include%'),
  'easier validation',
  true, 1
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'Benefits of JSON prompting include%'),
  'smaller tokens',
  false, 2
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'Benefits of JSON prompting include%'),
  'type-safety',
  true, 3
),
(
  (SELECT id FROM assessment_questions WHERE question_text LIKE 'Benefits of JSON prompting include%'),
  'neural speedup',
  false, 4
);
