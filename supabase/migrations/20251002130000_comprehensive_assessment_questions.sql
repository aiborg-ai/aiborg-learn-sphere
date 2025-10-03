-- Comprehensive AI Augmentation Assessment Questions (2024-2025)
-- Based on current AI tools, trends, and maturity frameworks

-- First, ensure we have all necessary categories
INSERT INTO assessment_categories (name, description, icon, weight, order_index) VALUES
('Daily Productivity', 'AI tools for email, calendar, notes, and task management', 'Clock', 1.2, 1),
('Content Creation', 'AI for writing, video, images, and multimedia content', 'PenTool', 1.1, 2),
('Learning & Research', 'AI-powered study aids, research tools, and knowledge acquisition', 'BookOpen', 1.0, 3),
('Communication', 'AI for meetings, presentations, translations, and collaboration', 'MessageSquare', 0.9, 4),
('Data & Analytics', 'AI tools for data analysis, visualization, and business intelligence', 'TrendingUp', 1.0, 5),
('Automation', 'Workflow automation, RPA, and AI agents', 'Zap', 1.3, 6),
('Creative Tools', 'AI for design, music, 3D modeling, and artistic creation', 'Palette', 0.8, 7),
('Development & Coding', 'AI coding assistants, debugging, and development tools', 'Code', 1.1, 8)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  weight = EXCLUDED.weight,
  order_index = EXCLUDED.order_index;

-- =====================================================
-- DAILY PRODUCTIVITY QUESTIONS
-- =====================================================

INSERT INTO assessment_questions (
  category_id, question_text, question_type, help_text, audience_filters,
  order_index, points_value, is_active
) VALUES

-- Awareness Level
(
  (SELECT id FROM assessment_categories WHERE name = 'Daily Productivity'),
  'How often do you use AI tools to help with your daily tasks?',
  'single_choice',
  'Think about email, scheduling, note-taking, and task management',
  NULL,
  1, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Daily Productivity'),
  'Which AI-powered productivity tools have you used? (Select all that apply)',
  'multiple_choice',
  'Common tools like ChatGPT, Notion AI, Grammarly, etc.',
  NULL,
  2, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Daily Productivity'),
  'Do you use AI to help write or improve your emails?',
  'single_choice',
  'Tools like Gmail Smart Compose, Superhuman AI, or ChatGPT',
  ARRAY['professional', 'business', 'secondary'],
  3, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Daily Productivity'),
  'How do you currently manage your calendar and scheduling?',
  'single_choice',
  'Consider AI scheduling assistants like Reclaim AI, Motion, or Clockwise',
  ARRAY['professional', 'business'],
  4, 12, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Daily Productivity'),
  'Do you use AI-powered note-taking tools?',
  'single_choice',
  'Tools like Notion AI, Obsidian with AI, Mem, or Reflect',
  NULL,
  5, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Daily Productivity'),
  'How often do you use AI to summarize long documents or articles?',
  'frequency',
  'Think about reading comprehension and information processing',
  NULL,
  6, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Daily Productivity'),
  'Do you use AI-powered task management features?',
  'single_choice',
  'Features in tools like Asana AI, ClickUp Brain, or Monday AI',
  ARRAY['professional', 'business', 'secondary'],
  7, 12, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Daily Productivity'),
  'Which productivity workflows have you automated with AI?',
  'multiple_choice',
  'Think about repetitive daily tasks',
  ARRAY['professional', 'business'],
  8, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Daily Productivity'),
  'How do you use AI for information search and discovery?',
  'single_choice',
  'Tools like Perplexity, ChatGPT, Google AI Overviews, or Arc Search',
  NULL,
  9, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Daily Productivity'),
  'Do you use browser extensions with AI capabilities?',
  'multiple_choice',
  'Extensions that enhance your browsing and productivity',
  ARRAY['professional', 'business', 'secondary'],
  10, 12, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Daily Productivity'),
  'How much time do AI productivity tools save you each week?',
  'scale',
  'Estimate the time savings from all AI tools you use',
  ARRAY['professional', 'business'],
  11, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Daily Productivity'),
  'What percentage of your routine tasks are now AI-assisted?',
  'scale',
  'Consider all aspects of your daily workflow',
  ARRAY['professional', 'business'],
  12, 15, true
);

-- =====================================================
-- CONTENT CREATION QUESTIONS
-- =====================================================

INSERT INTO assessment_questions (
  category_id, question_text, question_type, help_text, audience_filters,
  order_index, points_value, is_active
) VALUES

(
  (SELECT id FROM assessment_categories WHERE name = 'Content Creation'),
  'Have you used AI to help you write content?',
  'single_choice',
  'Including essays, articles, social media posts, or creative writing',
  NULL,
  13, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Content Creation'),
  'Which AI writing tools do you use regularly? (Select all that apply)',
  'multiple_choice',
  'ChatGPT, Claude, Jasper, Copy.ai, Wordtune, Grammarly, etc.',
  NULL,
  14, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Content Creation'),
  'Have you used AI to generate or edit images?',
  'single_choice',
  'Tools like Midjourney, DALL-E, Stable Diffusion, or Adobe Firefly',
  NULL,
  15, 12, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Content Creation'),
  'Do you use AI for video creation or editing?',
  'single_choice',
  'Tools like Synthesia, Runway, Descript, Pictory, or CapCut',
  ARRAY['professional', 'business', 'secondary'],
  16, 12, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Content Creation'),
  'Have you experimented with AI voice generation or cloning?',
  'single_choice',
  'Tools like ElevenLabs, Murf, or Descript voice features',
  ARRAY['professional', 'business', 'secondary'],
  17, 12, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Content Creation'),
  'How do you use AI for social media content?',
  'multiple_choice',
  'Creating posts, captions, hashtags, or scheduling',
  ARRAY['professional', 'business', 'secondary'],
  18, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Content Creation'),
  'Do you use AI to help with brainstorming and ideation?',
  'frequency',
  'Using AI as a creative partner for generating ideas',
  NULL,
  19, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Content Creation'),
  'Which content formats do you create with AI assistance?',
  'multiple_choice',
  'Blog posts, videos, podcasts, infographics, presentations, etc.',
  ARRAY['professional', 'business'],
  20, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Content Creation'),
  'Have you created AI-generated presentations?',
  'single_choice',
  'Using tools like Gamma, Beautiful.ai, or Slides AI',
  ARRAY['professional', 'business', 'secondary'],
  21, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Content Creation'),
  'Do you use AI for content repurposing or adaptation?',
  'single_choice',
  'Converting content between formats or platforms',
  ARRAY['professional', 'business'],
  22, 12, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Content Creation'),
  'How confident are you in editing/refining AI-generated content?',
  'scale',
  'Your ability to critically evaluate and improve AI outputs',
  NULL,
  23, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Content Creation'),
  'What percentage of your content creation involves AI assistance?',
  'scale',
  'Estimate across all types of content you create',
  ARRAY['professional', 'business'],
  24, 15, true
);

-- =====================================================
-- LEARNING & RESEARCH QUESTIONS
-- =====================================================

INSERT INTO assessment_questions (
  category_id, question_text, question_type, help_text, audience_filters,
  order_index, points_value, is_active
) VALUES

(
  (SELECT id FROM assessment_categories WHERE name = 'Learning & Research'),
  'Do you use AI tools to help with studying or learning?',
  'single_choice',
  'Think about homework help, test prep, or skill development',
  NULL,
  25, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Learning & Research'),
  'Which AI learning tools have you tried? (Select all that apply)',
  'multiple_choice',
  'Quizlet AI, Khan Academy AI, Duolingo, Socratic, etc.',
  ARRAY['primary', 'secondary'],
  26, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Learning & Research'),
  'Have you used AI for research and finding academic sources?',
  'single_choice',
  'Tools like Perplexity, Consensus, Elicit, or Research Rabbit',
  ARRAY['secondary', 'professional'],
  27, 12, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Learning & Research'),
  'Do you use AI to read and summarize PDFs or research papers?',
  'single_choice',
  'Tools like ChatPDF, Humata, LightPDF, or Claude for document analysis',
  NULL,
  28, 12, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Learning & Research'),
  'Have you used AI for language learning?',
  'single_choice',
  'Apps like Duolingo Max, Speak, Elsa, or ChatGPT for practice',
  NULL,
  29, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Learning & Research'),
  'How do you use AI to learn new professional skills?',
  'multiple_choice',
  'Online courses, tutorials, practice, mentorship',
  ARRAY['professional', 'business', 'secondary'],
  30, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Learning & Research'),
  'Do you use AI to generate practice questions or quizzes?',
  'single_choice',
  'For test preparation or knowledge retention',
  ARRAY['primary', 'secondary', 'professional'],
  31, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Learning & Research'),
  'Have you used AI tutoring or personalized learning assistance?',
  'single_choice',
  'AI tutors that adapt to your learning style',
  ARRAY['primary', 'secondary'],
  32, 12, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Learning & Research'),
  'How often do you verify information provided by AI tools?',
  'frequency',
  'Critical thinking and fact-checking habits',
  NULL,
  33, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Learning & Research'),
  'What types of knowledge gaps do you fill using AI?',
  'multiple_choice',
  'Quick facts, deep understanding, skills, procedures, etc.',
  NULL,
  34, 12, true
);

-- =====================================================
-- COMMUNICATION QUESTIONS
-- =====================================================

INSERT INTO assessment_questions (
  category_id, question_text, question_type, help_text, audience_filters,
  order_index, points_value, is_active
) VALUES

(
  (SELECT id FROM assessment_categories WHERE name = 'Communication'),
  'Do you use AI-powered meeting assistants?',
  'single_choice',
  'Tools like Otter.ai, Fathom, Fireflies, or Microsoft Copilot',
  ARRAY['professional', 'business'],
  35, 12, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Communication'),
  'Have you used AI to help prepare presentations?',
  'single_choice',
  'Creating slides, speaker notes, or presentation content',
  NULL,
  36, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Communication'),
  'Do you use AI translation tools?',
  'single_choice',
  'DeepL, Google Translate AI, or real-time translation features',
  NULL,
  37, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Communication'),
  'How do you use AI for team collaboration?',
  'multiple_choice',
  'Document co-creation, brainstorming, project planning',
  ARRAY['professional', 'business'],
  38, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Communication'),
  'Have you used AI chatbots for customer communication?',
  'single_choice',
  'Customer service, support, or engagement',
  ARRAY['business', 'professional'],
  39, 12, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Communication'),
  'Do you use AI to improve your writing tone or clarity?',
  'single_choice',
  'Tools like Grammarly, Wordtune, or ChatGPT for refinement',
  NULL,
  40, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Communication'),
  'Have you automated any communication workflows with AI?',
  'multiple_choice',
  'Email responses, meeting scheduling, follow-ups',
  ARRAY['professional', 'business'],
  41, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Communication'),
  'How often do you use AI for video calls or virtual meetings?',
  'frequency',
  'Features like background removal, noise cancellation, live captions',
  ARRAY['professional', 'business', 'secondary'],
  42, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Communication'),
  'Do you use AI to generate meeting summaries and action items?',
  'single_choice',
  'Automatic generation after meetings',
  ARRAY['professional', 'business'],
  43, 12, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Communication'),
  'What communication challenges has AI helped you solve?',
  'multiple_choice',
  'Language barriers, time zones, clarity, efficiency, etc.',
  ARRAY['professional', 'business'],
  44, 12, true
);

-- =====================================================
-- DATA & ANALYTICS QUESTIONS
-- =====================================================

INSERT INTO assessment_questions (
  category_id, question_text, question_type, help_text, audience_filters,
  order_index, points_value, is_active
) VALUES

(
  (SELECT id FROM assessment_categories WHERE name = 'Data & Analytics'),
  'Have you used AI to analyze data or generate insights?',
  'single_choice',
  'ChatGPT Data Analyst, Julius AI, or similar tools',
  ARRAY['professional', 'business'],
  45, 12, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Data & Analytics'),
  'Do you use AI features in spreadsheet tools?',
  'single_choice',
  'Excel Copilot, Google Sheets AI, or formulas assistance',
  ARRAY['professional', 'business', 'secondary'],
  46, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Data & Analytics'),
  'Have you created data visualizations with AI assistance?',
  'single_choice',
  'Charts, graphs, dashboards, or reports',
  ARRAY['professional', 'business'],
  47, 12, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Data & Analytics'),
  'Which data tasks do you perform with AI help?',
  'multiple_choice',
  'Cleaning, analysis, visualization, reporting, forecasting',
  ARRAY['professional', 'business'],
  48, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Data & Analytics'),
  'Do you use AI for business intelligence or analytics?',
  'single_choice',
  'Tools like ThoughtSpot, Tableau AI, or Power BI Copilot',
  ARRAY['business', 'professional'],
  49, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Data & Analytics'),
  'Have you used AI for predictive analytics or forecasting?',
  'single_choice',
  'Predicting trends, sales, or business outcomes',
  ARRAY['business', 'professional'],
  50, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Data & Analytics'),
  'How comfortable are you interpreting AI-generated data insights?',
  'scale',
  'Your ability to understand and act on AI analysis',
  ARRAY['professional', 'business'],
  51, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Data & Analytics'),
  'Do you use AI to create reports or dashboards?',
  'single_choice',
  'Automated reporting and data presentation',
  ARRAY['professional', 'business'],
  52, 12, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Data & Analytics'),
  'Have you used AI for data cleaning or preparation?',
  'single_choice',
  'Handling missing values, outliers, formatting',
  ARRAY['professional', 'business'],
  53, 12, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Data & Analytics'),
  'What data-related decisions do you make using AI insights?',
  'multiple_choice',
  'Strategic, operational, customer-facing, financial',
  ARRAY['business', 'professional'],
  54, 15, true
);

-- =====================================================
-- AUTOMATION QUESTIONS
-- =====================================================

INSERT INTO assessment_questions (
  category_id, question_text, question_type, help_text, audience_filters,
  order_index, points_value, is_active
) VALUES

(
  (SELECT id FROM assessment_categories WHERE name = 'Automation'),
  'Have you used workflow automation tools with AI?',
  'single_choice',
  'Zapier AI, Make, n8n, or similar platforms',
  ARRAY['professional', 'business'],
  55, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Automation'),
  'Which workflows have you automated using AI?',
  'multiple_choice',
  'Data entry, notifications, file management, reporting',
  ARRAY['professional', 'business'],
  56, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Automation'),
  'Do you use AI agents or assistants for tasks?',
  'single_choice',
  'Tools like Lindy, Relay, Magical, or custom GPTs',
  ARRAY['professional', 'business'],
  57, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Automation'),
  'Have you created custom automation with AI integration?',
  'single_choice',
  'Building your own workflows or connecting tools',
  ARRAY['professional', 'business'],
  58, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Automation'),
  'How much time do you save through AI-powered automation?',
  'scale',
  'Weekly time savings from automated processes',
  ARRAY['professional', 'business'],
  59, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Automation'),
  'Do you use RPA (Robotic Process Automation) tools?',
  'single_choice',
  'UiPath, Power Automate, or similar platforms',
  ARRAY['business', 'professional'],
  60, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Automation'),
  'Have you automated any customer-facing processes with AI?',
  'single_choice',
  'Customer service, onboarding, support tickets',
  ARRAY['business'],
  61, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Automation'),
  'Which business processes have you automated?',
  'multiple_choice',
  'HR, finance, sales, marketing, operations',
  ARRAY['business', 'professional'],
  62, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Automation'),
  'Do you monitor and optimize your automated workflows?',
  'frequency',
  'Regular review and improvement of automations',
  ARRAY['professional', 'business'],
  63, 12, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Automation'),
  'What automation challenges have you overcome with AI?',
  'multiple_choice',
  'Complexity, integration, maintenance, accuracy',
  ARRAY['professional', 'business'],
  64, 12, true
);

-- =====================================================
-- CREATIVE TOOLS QUESTIONS
-- =====================================================

INSERT INTO assessment_questions (
  category_id, question_text, question_type, help_text, audience_filters,
  order_index, points_value, is_active
) VALUES

(
  (SELECT id FROM assessment_categories WHERE name = 'Creative Tools'),
  'Have you used AI for graphic design?',
  'single_choice',
  'Canva AI, Adobe Firefly, Recraft, or similar tools',
  NULL,
  65, 12, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Creative Tools'),
  'Do you use AI to generate or edit photos?',
  'single_choice',
  'Background removal, enhancement, object removal, style transfer',
  NULL,
  66, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Creative Tools'),
  'Have you experimented with AI music generation?',
  'single_choice',
  'Tools like Suno, Udio, Soundraw, or AIVA',
  ARRAY['primary', 'secondary', 'professional'],
  67, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Creative Tools'),
  'Which creative projects have you completed with AI?',
  'multiple_choice',
  'Art, music, videos, designs, 3D models, animations',
  NULL,
  68, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Creative Tools'),
  'Do you use AI for brand design or marketing materials?',
  'single_choice',
  'Logos, brand kits, marketing graphics, ads',
  ARRAY['business', 'professional'],
  69, 12, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Creative Tools'),
  'Have you created AI-generated art or illustrations?',
  'single_choice',
  'Using Midjourney, DALL-E, Stable Diffusion, or similar',
  NULL,
  70, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Creative Tools'),
  'Do you use AI for animation or motion graphics?',
  'single_choice',
  'Creating or enhancing animated content',
  ARRAY['professional', 'secondary'],
  71, 12, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Creative Tools'),
  'How do you combine AI tools with traditional creative methods?',
  'single_choice',
  'Your workflow for creative projects',
  ARRAY['professional', 'secondary'],
  72, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Creative Tools'),
  'Have you monetized or professionally used AI-created content?',
  'single_choice',
  'Selling, licensing, or commercial use of AI creations',
  ARRAY['professional', 'business'],
  73, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Creative Tools'),
  'What creative skills has AI helped you develop?',
  'multiple_choice',
  'Design, video editing, music, storytelling, etc.',
  NULL,
  74, 12, true
);

-- =====================================================
-- DEVELOPMENT & CODING QUESTIONS
-- =====================================================

INSERT INTO assessment_questions (
  category_id, question_text, question_type, help_text, audience_filters,
  order_index, points_value, is_active
) VALUES

(
  (SELECT id FROM assessment_categories WHERE name = 'Development & Coding'),
  'Have you used AI coding assistants?',
  'single_choice',
  'GitHub Copilot, Cursor, Codeium, or similar tools',
  ARRAY['secondary', 'professional'],
  75, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Development & Coding'),
  'Which programming tasks do you use AI for?',
  'multiple_choice',
  'Writing code, debugging, documentation, testing, learning',
  ARRAY['secondary', 'professional'],
  76, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Development & Coding'),
  'Do you use AI for code reviews or debugging?',
  'single_choice',
  'Finding bugs, suggesting improvements, explaining errors',
  ARRAY['secondary', 'professional'],
  77, 12, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Development & Coding'),
  'Have you used AI to learn programming?',
  'single_choice',
  'Tutorials, explanations, practice problems',
  ARRAY['primary', 'secondary', 'professional'],
  78, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Development & Coding'),
  'Do you use AI for generating documentation or comments?',
  'single_choice',
  'Tools like Mintlify, Swimm, or inline doc generation',
  ARRAY['professional', 'secondary'],
  79, 12, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Development & Coding'),
  'How much of your code is AI-assisted?',
  'scale',
  'Percentage of code written with AI help',
  ARRAY['professional', 'secondary'],
  80, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Development & Coding'),
  'Have you used AI for automated testing?',
  'single_choice',
  'Test generation, test maintenance, or testing tools',
  ARRAY['professional'],
  81, 15, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Development & Coding'),
  'Do you use AI to convert or refactor code?',
  'single_choice',
  'Language conversion, modernization, optimization',
  ARRAY['professional', 'secondary'],
  82, 12, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Development & Coding'),
  'How confident are you reviewing AI-generated code?',
  'scale',
  'Your ability to verify, test, and improve AI code',
  ARRAY['professional', 'secondary'],
  83, 10, true
),
(
  (SELECT id FROM assessment_categories WHERE name = 'Development & Coding'),
  'What development workflows have you enhanced with AI?',
  'multiple_choice',
  'CI/CD, deployment, monitoring, collaboration',
  ARRAY['professional'],
  84, 15, true
);
