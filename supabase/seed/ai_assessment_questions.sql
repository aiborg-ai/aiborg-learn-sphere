-- Seed Data for AI Assessment Questions
-- Comprehensive question bank for AI Augmentation Self-Assessment

-- Get category IDs for reference
DO $$
DECLARE
  cat_productivity UUID;
  cat_content UUID;
  cat_learning UUID;
  cat_communication UUID;
  cat_data UUID;
  cat_automation UUID;
  cat_creative UUID;
  cat_development UUID;
  question_id UUID;
BEGIN
  -- Get category IDs
  SELECT id INTO cat_productivity FROM assessment_categories WHERE name = 'Daily Productivity';
  SELECT id INTO cat_content FROM assessment_categories WHERE name = 'Content Creation';
  SELECT id INTO cat_learning FROM assessment_categories WHERE name = 'Learning & Research';
  SELECT id INTO cat_communication FROM assessment_categories WHERE name = 'Communication';
  SELECT id INTO cat_data FROM assessment_categories WHERE name = 'Data & Analytics';
  SELECT id INTO cat_automation FROM assessment_categories WHERE name = 'Automation';
  SELECT id INTO cat_creative FROM assessment_categories WHERE name = 'Creative Tools';
  SELECT id INTO cat_development FROM assessment_categories WHERE name = 'Development & Coding';

  -- DAILY PRODUCTIVITY QUESTIONS
  INSERT INTO assessment_questions (category_id, question_text, question_type, help_text, order_index, points_value)
  VALUES
    (cat_productivity,
     'How often do you use AI-powered tools for daily tasks (email, scheduling, note-taking)?',
     'frequency',
     'Consider tools like Gmail Smart Compose, Calendly, Notion AI, etc.',
     1, 10)
  RETURNING id INTO question_id;

  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index) VALUES
    (question_id, 'Never', 'never', 0, 1),
    (question_id, 'Rarely (once a month)', 'rarely', 2, 2),
    (question_id, 'Sometimes (weekly)', 'sometimes', 5, 3),
    (question_id, 'Often (2-3 times a week)', 'often', 7, 4),
    (question_id, 'Daily', 'daily', 10, 5);

  INSERT INTO assessment_questions (category_id, question_text, question_type, help_text, order_index, points_value)
  VALUES
    (cat_productivity,
     'Which AI productivity tools do you currently use? (Select all that apply)',
     'multiple_choice',
     'Select all tools you use at least once a week',
     2, 20)
  RETURNING id INTO question_id;

  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, tool_recommendations, order_index) VALUES
    (question_id, 'ChatGPT/Claude for task assistance', 'llm_assistants', 5, ARRAY['ChatGPT', 'Claude', 'Gemini'], 1),
    (question_id, 'AI email assistants (Gmail, Outlook)', 'email_ai', 3, ARRAY['Gmail Smart Compose', 'Grammarly'], 2),
    (question_id, 'AI calendar/scheduling tools', 'calendar_ai', 3, ARRAY['Calendly', 'Motion', 'Reclaim.ai'], 3),
    (question_id, 'AI note-taking apps', 'notes_ai', 4, ARRAY['Notion AI', 'Obsidian', 'Mem'], 4),
    (question_id, 'AI task management', 'task_ai', 3, ARRAY['Todoist AI', 'ClickUp AI', 'Monday.com'], 5),
    (question_id, 'Voice assistants (Siri, Alexa, Google)', 'voice_ai', 2, ARRAY['Siri', 'Alexa', 'Google Assistant'], 6);

  -- CONTENT CREATION QUESTIONS
  INSERT INTO assessment_questions (category_id, question_text, question_type, help_text, order_index, points_value)
  VALUES
    (cat_content,
     'How much of your written content is created or enhanced with AI assistance?',
     'scale',
     'Think about emails, documents, social media posts, articles, etc.',
     1, 10)
  RETURNING id INTO question_id;

  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index) VALUES
    (question_id, 'None (0%)', '0', 0, 1),
    (question_id, 'Minimal (1-20%)', '20', 2, 2),
    (question_id, 'Some (21-40%)', '40', 4, 3),
    (question_id, 'Half (41-60%)', '60', 6, 4),
    (question_id, 'Most (61-80%)', '80', 8, 5),
    (question_id, 'Almost all (81-100%)', '100', 10, 6);

  INSERT INTO assessment_questions (category_id, question_text, question_type, help_text, audience_filters, order_index, points_value)
  VALUES
    (cat_content,
     'Which AI content creation tools do you use?',
     'multiple_choice',
     'Select all that apply',
     NULL,
     2, 15)
  RETURNING id INTO question_id;

  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, tool_recommendations, order_index) VALUES
    (question_id, 'AI writing assistants', 'writing', 3, ARRAY['Jasper', 'Copy.ai', 'Writesonic'], 1),
    (question_id, 'AI image generators', 'image', 3, ARRAY['DALL-E', 'Midjourney', 'Stable Diffusion'], 2),
    (question_id, 'AI video creators', 'video', 3, ARRAY['Synthesia', 'Runway', 'Pika'], 3),
    (question_id, 'AI audio/music tools', 'audio', 3, ARRAY['ElevenLabs', 'Murf', 'AIVA'], 4),
    (question_id, 'AI presentation makers', 'presentation', 3, ARRAY['Tome', 'Beautiful.ai', 'Gamma'], 5);

  -- LEARNING & RESEARCH QUESTIONS
  INSERT INTO assessment_questions (category_id, question_text, question_type, help_text, order_index, points_value)
  VALUES
    (cat_learning,
     'How often do you use AI for learning new skills or researching topics?',
     'frequency',
     'Including AI tutors, research assistants, summarizers, etc.',
     1, 10)
  RETURNING id INTO question_id;

  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index) VALUES
    (question_id, 'Never', 'never', 0, 1),
    (question_id, 'Monthly', 'monthly', 3, 2),
    (question_id, 'Weekly', 'weekly', 5, 3),
    (question_id, 'Several times a week', 'multi_weekly', 7, 4),
    (question_id, 'Daily', 'daily', 10, 5);

  -- AUDIENCE-SPECIFIC QUESTIONS
  -- For Young Learners
  INSERT INTO assessment_questions (category_id, question_text, question_type, help_text, audience_filters, order_index, points_value)
  VALUES
    (cat_learning,
     'Which AI study tools help you with homework?',
     'multiple_choice',
     'Select all that you use',
     ARRAY['primary'],
     10, 15)
  RETURNING id INTO question_id;

  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, tool_recommendations, order_index) VALUES
    (question_id, 'Math solvers (Photomath, Mathway)', 'math', 3, ARRAY['Photomath', 'Mathway', 'Symbolab'], 1),
    (question_id, 'AI tutors (Khan Academy, Duolingo)', 'tutors', 3, ARRAY['Khan Academy', 'Duolingo', 'Socratic'], 2),
    (question_id, 'Reading helpers', 'reading', 3, ARRAY['Grammarly', 'QuillBot', 'Speechify'], 3),
    (question_id, 'Science assistants', 'science', 3, ARRAY['Wolfram Alpha', 'CK-12', 'Brainly'], 4),
    (question_id, 'Art and creativity apps', 'art', 3, ARRAY['Canva', 'AutoDraw', 'Quick Draw'], 5);

  -- For Professionals
  INSERT INTO assessment_questions (category_id, question_text, question_type, help_text, audience_filters, order_index, points_value)
  VALUES
    (cat_data,
     'How do you use AI for professional data analysis?',
     'multiple_choice',
     'Select your current usage level',
     ARRAY['professional'],
     10, 15)
  RETURNING id INTO question_id;

  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, tool_recommendations, order_index) VALUES
    (question_id, 'Excel/Sheets with AI features', 'spreadsheet', 3, ARRAY['Excel Copilot', 'Google Sheets AI'], 1),
    (question_id, 'Business intelligence tools', 'bi', 4, ARRAY['Tableau', 'Power BI', 'Looker'], 2),
    (question_id, 'AI-powered analytics platforms', 'analytics', 5, ARRAY['DataRobot', 'H2O.ai', 'Obviously AI'], 3),
    (question_id, 'Custom ML models', 'ml', 3, ARRAY['TensorFlow', 'PyTorch', 'AutoML'], 4);

  -- For SMEs/Business
  INSERT INTO assessment_questions (category_id, question_text, question_type, help_text, audience_filters, order_index, points_value)
  VALUES
    (cat_automation,
     'Which business processes have you automated with AI?',
     'multiple_choice',
     'Select all automated processes',
     ARRAY['business'],
     10, 20)
  RETURNING id INTO question_id;

  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, tool_recommendations, order_index) VALUES
    (question_id, 'Customer service (chatbots)', 'customer_service', 4, ARRAY['Intercom', 'Zendesk AI', 'Drift'], 1),
    (question_id, 'Marketing automation', 'marketing', 4, ARRAY['HubSpot AI', 'Marketo', 'Mailchimp'], 2),
    (question_id, 'Sales processes', 'sales', 4, ARRAY['Salesforce Einstein', 'Gong.io', 'Chorus.ai'], 3),
    (question_id, 'HR and recruitment', 'hr', 4, ARRAY['Workday', 'BambooHR', 'HireVue'], 4),
    (question_id, 'Financial operations', 'finance', 4, ARRAY['QuickBooks AI', 'Xero', 'Bill.com'], 5);

  -- DEVELOPMENT & CODING QUESTIONS
  INSERT INTO assessment_questions (category_id, question_text, question_type, help_text, audience_filters, order_index, points_value)
  VALUES
    (cat_development,
     'What percentage of your code is written with AI assistance?',
     'scale',
     'Consider code completion, generation, debugging, etc.',
     ARRAY['professional', 'secondary'],
     1, 10)
  RETURNING id INTO question_id;

  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index) VALUES
    (question_id, 'I don''t code', 'none', 0, 1),
    (question_id, '1-20%', '20', 2, 2),
    (question_id, '21-40%', '40', 4, 3),
    (question_id, '41-60%', '60', 6, 4),
    (question_id, '61-80%', '80', 8, 5),
    (question_id, '81-100%', '100', 10, 6);

  -- GENERAL ASSESSMENT QUESTIONS FOR ALL AUDIENCES
  INSERT INTO assessment_questions (category_id, question_text, question_type, help_text, order_index, points_value)
  VALUES
    (cat_automation,
     'How comfortable are you with trying new AI tools?',
     'scale',
     'Rate your openness to experimenting with new AI technologies',
     20, 10)
  RETURNING id INTO question_id;

  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index) VALUES
    (question_id, 'Very uncomfortable', '1', 0, 1),
    (question_id, 'Somewhat uncomfortable', '2', 2, 2),
    (question_id, 'Neutral', '3', 5, 3),
    (question_id, 'Somewhat comfortable', '4', 7, 4),
    (question_id, 'Very comfortable', '5', 10, 5);

  INSERT INTO assessment_questions (category_id, question_text, question_type, help_text, order_index, points_value)
  VALUES
    (cat_communication,
     'How many AI tools do you actively use per week?',
     'scale',
     'Count all AI-powered applications, features, or services',
     21, 10)
  RETURNING id INTO question_id;

  INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index) VALUES
    (question_id, '0-2 tools', '2', 2, 1),
    (question_id, '3-5 tools', '5', 4, 2),
    (question_id, '6-10 tools', '10', 6, 3),
    (question_id, '11-20 tools', '20', 8, 4),
    (question_id, 'More than 20', '20plus', 10, 5);

END $$;