-- Comprehensive Assessment Options - Part 2
-- Communication, Data & Analytics, Automation, Creative Tools, Development & Coding

-- Use the same helper function from part 1
-- Assumes get_question_by_text() function already exists

-- =====================================================
-- COMMUNICATION OPTIONS (Questions 35-44)
-- =====================================================

-- Question 35: Meeting assistants
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI-powered meeting assistants'), 'No, I take notes manually', 'no', 0, 1, 'Manual notes', ARRAY['Otter.ai', 'Fathom', 'Fireflies']),
(get_question_by_text('AI-powered meeting assistants'), 'Yes, for transcription only', 'transcription', 6, 2, 'Meeting transcripts', ARRAY['Otter.ai', 'Fireflies']),
(get_question_by_text('AI-powered meeting assistants'), 'Yes, for summaries and action items', 'summaries', 10, 3, 'Smart summaries', ARRAY['Fathom', 'Fireflies', 'tl;dv']),
(get_question_by_text('AI-powered meeting assistants'), 'Yes, for full meeting intelligence', 'full', 12, 4, 'Complete integration', ARRAY['Fathom', 'Fireflies', 'Microsoft Copilot']);

-- Question 36: AI presentations
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI to help prepare presentations'), 'No, I create all content manually', 'no', 0, 1, 'Manual creation', ARRAY['Gamma', 'Beautiful.ai', 'ChatGPT']),
(get_question_by_text('AI to help prepare presentations'), 'Yes, for content ideas', 'ideas', 5, 2, 'Content brainstorming', ARRAY['ChatGPT', 'Claude']),
(get_question_by_text('AI to help prepare presentations'), 'Yes, for slides and design', 'design', 8, 3, 'Visual creation', ARRAY['Gamma', 'Beautiful.ai']),
(get_question_by_text('AI to help prepare presentations'), 'Yes, for complete presentation creation', 'complete', 10, 4, 'End-to-end', ARRAY['Gamma', 'Slides AI']);

-- Question 37: Translation
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI translation tools'), 'No, I don''t need translation', 'no', 0, 1, 'Single language', NULL),
(get_question_by_text('AI translation tools'), 'Yes, occasionally for text', 'occasional', 5, 2, 'Basic translation', ARRAY['DeepL', 'Google Translate']),
(get_question_by_text('AI translation tools'), 'Yes, regularly for communication', 'regular', 8, 3, 'Frequent translation', ARRAY['DeepL', 'ChatGPT']),
(get_question_by_text('AI translation tools'), 'Yes, with real-time translation', 'realtime', 10, 4, 'Live translation', ARRAY['Google Translate', 'Microsoft Translator']);

-- Question 38: Team collaboration
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description) VALUES
(get_question_by_text('AI for team collaboration'), 'Co-writing and editing documents', 'cowriting', 3, 1, 'Document collaboration'),
(get_question_by_text('AI for team collaboration'), 'Brainstorming and ideation', 'brainstorm', 3, 2, 'Idea generation'),
(get_question_by_text('AI for team collaboration'), 'Project planning and management', 'planning', 4, 3, 'Project organization'),
(get_question_by_text('AI for team collaboration'), 'Knowledge sharing and documentation', 'knowledge', 3, 4, 'Team knowledge base'),
(get_question_by_text('AI for team collaboration'), 'Meeting notes and summaries', 'meetings', 3, 5, 'Meeting management'),
(get_question_by_text('AI for team collaboration'), 'None', 'none', 0, 6, 'No collaboration');

-- Question 39: AI chatbots for customers
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI chatbots for customer communication'), 'No, we handle all inquiries manually', 'no', 0, 1, 'Manual support', ARRAY['Intercom AI', 'Zendesk AI', 'Drift']),
(get_question_by_text('AI chatbots for customer communication'), 'Yes, for FAQs and simple queries', 'faqs', 6, 2, 'Basic automation', ARRAY['Intercom', 'Tidio']),
(get_question_by_text('AI chatbots for customer communication'), 'Yes, for most customer interactions', 'most', 10, 3, 'Advanced automation', ARRAY['Intercom AI', 'Ada']),
(get_question_by_text('AI chatbots for customer communication'), 'Yes, full AI-powered customer service', 'full', 12, 4, 'Complete automation', ARRAY['Ada', 'ControlHippo']);

-- Question 40: Writing tone
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI to improve your writing tone or clarity'), 'No, I don''t use AI for writing improvement', 'no', 0, 1, 'No AI editing', ARRAY['Grammarly', 'Wordtune', 'ChatGPT']),
(get_question_by_text('AI to improve your writing tone or clarity'), 'Yes, for grammar and spelling', 'grammar', 5, 2, 'Basic corrections', ARRAY['Grammarly', 'ProWritingAid']),
(get_question_by_text('AI to improve your writing tone or clarity'), 'Yes, for tone and style', 'tone', 8, 3, 'Advanced refinement', ARRAY['Wordtune', 'Grammarly']),
(get_question_by_text('AI to improve your writing tone or clarity'), 'Yes, for comprehensive writing enhancement', 'comprehensive', 10, 4, 'Complete optimization', ARRAY['Grammarly Premium', 'Wordtune', 'ChatGPT']);

-- Question 41: Communication automation
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description) VALUES
(get_question_by_text('automated any communication workflows'), 'Email auto-responses', 'email', 3, 1, 'Email automation'),
(get_question_by_text('automated any communication workflows'), 'Meeting scheduling', 'scheduling', 4, 2, 'Calendar automation'),
(get_question_by_text('automated any communication workflows'), 'Follow-up reminders', 'followups', 3, 3, 'Reminder systems'),
(get_question_by_text('automated any communication workflows'), 'Customer service responses', 'customer', 4, 4, 'Support automation'),
(get_question_by_text('automated any communication workflows'), 'Team notifications', 'notifications', 3, 5, 'Alert systems'),
(get_question_by_text('automated any communication workflows'), 'None', 'none', 0, 6, 'No automation');

-- Question 42: Video calls with AI
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index) VALUES
(get_question_by_text('AI for video calls or virtual meetings'), 'Never', 'never', 0, 1),
(get_question_by_text('AI for video calls or virtual meetings'), 'Rarely', 'rarely', 3, 2),
(get_question_by_text('AI for video calls or virtual meetings'), 'Sometimes', 'sometimes', 5, 3),
(get_question_by_text('AI for video calls or virtual meetings'), 'Often', 'often', 7, 4),
(get_question_by_text('AI for video calls or virtual meetings'), 'Always', 'always', 10, 5);

-- Question 43: Meeting summaries
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI to generate meeting summaries and action items'), 'No, I create summaries manually', 'no', 0, 1, 'Manual summaries', ARRAY['Fathom', 'Fireflies', 'Otter']),
(get_question_by_text('AI to generate meeting summaries and action items'), 'Yes, for some meetings', 'some', 6, 2, 'Selective use', ARRAY['Fathom', 'Fireflies']),
(get_question_by_text('AI to generate meeting summaries and action items'), 'Yes, for most meetings', 'most', 10, 3, 'Regular use', ARRAY['Fathom', 'tl;dv']),
(get_question_by_text('AI to generate meeting summaries and action items'), 'Yes, automatically for all meetings', 'all', 12, 4, 'Full automation', ARRAY['Fathom', 'Fireflies', 'Microsoft Copilot']);

-- Question 44: Communication challenges solved
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description) VALUES
(get_question_by_text('communication challenges has AI helped you solve'), 'Language barriers and translation', 'language', 3, 1, 'Multilingual communication'),
(get_question_by_text('communication challenges has AI helped you solve'), 'Time zone coordination', 'timezone', 2, 2, 'Global scheduling'),
(get_question_by_text('communication challenges has AI helped you solve'), 'Writing clarity and professionalism', 'clarity', 3, 3, 'Better writing'),
(get_question_by_text('communication challenges has AI helped you solve'), 'Response time and efficiency', 'efficiency', 3, 4, 'Faster responses'),
(get_question_by_text('communication challenges has AI helped you solve'), 'Meeting documentation', 'documentation', 3, 5, 'Better records'),
(get_question_by_text('communication challenges has AI helped you solve'), 'None', 'none', 0, 6, 'No challenges solved');

-- =====================================================
-- DATA & ANALYTICS OPTIONS (Questions 45-54)
-- =====================================================

-- Question 45: Data analysis
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('used AI to analyze data or generate insights'), 'No, I analyze data manually', 'no', 0, 1, 'Manual analysis', ARRAY['ChatGPT Data Analyst', 'Julius AI']),
(get_question_by_text('used AI to analyze data or generate insights'), 'Yes, for basic data exploration', 'basic', 6, 2, 'Simple analysis', ARRAY['ChatGPT', 'Claude']),
(get_question_by_text('used AI to analyze data or generate insights'), 'Yes, for statistical analysis', 'statistical', 10, 3, 'Advanced analysis', ARRAY['Julius AI', 'ChatGPT']),
(get_question_by_text('used AI to analyze data or generate insights'), 'Yes, for comprehensive analytics', 'comprehensive', 12, 4, 'Full analytics pipeline', ARRAY['Julius AI', 'ThoughtSpot']);

-- Question 46: Spreadsheet AI
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI features in spreadsheet tools'), 'No, I don''t use spreadsheet AI', 'no', 0, 1, 'Traditional spreadsheets', ARRAY['Excel Copilot', 'Google Sheets AI']),
(get_question_by_text('AI features in spreadsheet tools'), 'Yes, for formula assistance', 'formulas', 5, 2, 'Formula help', ARRAY['Excel Copilot', 'Sheets AI']),
(get_question_by_text('AI features in spreadsheet tools'), 'Yes, for data analysis', 'analysis', 8, 3, 'Data insights', ARRAY['Excel Copilot', 'Julius AI']),
(get_question_by_text('AI features in spreadsheet tools'), 'Yes, extensively for automation', 'automation', 10, 4, 'Full automation', ARRAY['Excel Copilot', 'Google Sheets AI']);

-- Question 47: Data visualization
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('created data visualizations with AI assistance'), 'No, I create charts manually', 'no', 0, 1, 'Manual viz', ARRAY['Tableau AI', 'Power BI Copilot']),
(get_question_by_text('created data visualizations with AI assistance'), 'Yes, for basic charts', 'basic', 6, 2, 'Simple charts', ARRAY['Excel Copilot', 'Sheets']),
(get_question_by_text('created data visualizations with AI assistance'), 'Yes, for interactive dashboards', 'dashboards', 10, 3, 'Complex viz', ARRAY['Tableau AI', 'Power BI']),
(get_question_by_text('created data visualizations with AI assistance'), 'Yes, for automated reporting', 'automated', 12, 4, 'Auto reports', ARRAY['Tableau', 'Power BI', 'ThoughtSpot']);

-- Question 48: Data tasks
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description) VALUES
(get_question_by_text('data tasks do you perform with AI'), 'Data cleaning and preparation', 'cleaning', 3, 1, 'Data prep'),
(get_question_by_text('data tasks do you perform with AI'), 'Statistical analysis', 'analysis', 3, 2, 'Analytics'),
(get_question_by_text('data tasks do you perform with AI'), 'Data visualization', 'visualization', 3, 3, 'Charts and graphs'),
(get_question_by_text('data tasks do you perform with AI'), 'Automated reporting', 'reporting', 3, 4, 'Report generation'),
(get_question_by_text('data tasks do you perform with AI'), 'Forecasting and predictions', 'forecasting', 4, 5, 'Predictive analytics'),
(get_question_by_text('data tasks do you perform with AI'), 'None', 'none', 0, 6, 'No data tasks');

-- Question 49: Business intelligence
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI for business intelligence or analytics'), 'No, traditional BI tools only', 'no', 0, 1, 'Traditional BI', ARRAY['ThoughtSpot', 'Tableau AI', 'Power BI Copilot']),
(get_question_by_text('AI for business intelligence or analytics'), 'Yes, for data exploration', 'exploration', 8, 2, 'Data discovery', ARRAY['ThoughtSpot', 'Tableau']),
(get_question_by_text('AI for business intelligence or analytics'), 'Yes, for automated insights', 'insights', 12, 3, 'Smart insights', ARRAY['ThoughtSpot', 'Power BI Copilot']),
(get_question_by_text('AI for business intelligence or analytics'), 'Yes, comprehensive AI-powered BI', 'comprehensive', 15, 4, 'Full AI BI stack', ARRAY['ThoughtSpot', 'Qlik Sense']);

-- Question 50: Predictive analytics
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI for predictive analytics or forecasting'), 'No, I don''t do forecasting', 'no', 0, 1, 'No forecasting', ARRAY['Julius AI', 'ChatGPT', 'ThoughtSpot']),
(get_question_by_text('AI for predictive analytics or forecasting'), 'Yes, basic trend analysis', 'basic', 8, 2, 'Simple forecasting', ARRAY['Excel', 'ChatGPT']),
(get_question_by_text('AI for predictive analytics or forecasting'), 'Yes, statistical forecasting', 'statistical', 12, 3, 'Advanced forecasting', ARRAY['Julius AI', 'ThoughtSpot']),
(get_question_by_text('AI for predictive analytics or forecasting'), 'Yes, ML-powered predictions', 'ml', 15, 4, 'Machine learning', ARRAY['ThoughtSpot', 'H2O.ai']);

-- Question 51: Interpreting insights (scale)
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index) VALUES
(get_question_by_text('comfortable are you interpreting AI-generated data'), 'Not comfortable - I struggle with AI insights', '1', 2, 1),
(get_question_by_text('comfortable are you interpreting AI-generated data'), 'Somewhat comfortable - Basic understanding', '2', 4, 2),
(get_question_by_text('comfortable are you interpreting AI-generated data'), 'Comfortable - Good understanding', '3', 7, 3),
(get_question_by_text('comfortable are you interpreting AI-generated data'), 'Very comfortable - Expert interpretation', '4', 10, 4);

-- Question 52: Reports and dashboards
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI to create reports or dashboards'), 'No, I create reports manually', 'no', 0, 1, 'Manual reports', ARRAY['Tableau', 'Power BI', 'ThoughtSpot']),
(get_question_by_text('AI to create reports or dashboards'), 'Yes, with AI assistance for layout', 'layout', 6, 2, 'Design help', ARRAY['Tableau AI', 'Power BI']),
(get_question_by_text('AI to create reports or dashboards'), 'Yes, AI generates insights automatically', 'insights', 10, 3, 'Auto insights', ARRAY['ThoughtSpot', 'Power BI Copilot']),
(get_question_by_text('AI to create reports or dashboards'), 'Yes, fully automated reporting', 'automated', 12, 4, 'Complete automation', ARRAY['ThoughtSpot', 'Power BI']);

-- Question 53: Data cleaning
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI for data cleaning or preparation'), 'No, I clean data manually', 'no', 0, 1, 'Manual cleaning', ARRAY['ChatGPT', 'Julius AI', 'Excel Copilot']),
(get_question_by_text('AI for data cleaning or preparation'), 'Yes, for identifying issues', 'identify', 6, 2, 'Issue detection', ARRAY['ChatGPT', 'Excel']),
(get_question_by_text('AI for data cleaning or preparation'), 'Yes, for cleaning and formatting', 'clean', 10, 3, 'Auto cleaning', ARRAY['Julius AI', 'Excel Copilot']),
(get_question_by_text('AI for data cleaning or preparation'), 'Yes, fully automated data prep', 'automated', 12, 4, 'Complete automation', ARRAY['Julius AI', 'Alteryx']);

-- Question 54: Data-driven decisions
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description) VALUES
(get_question_by_text('data-related decisions do you make using AI'), 'Strategic business decisions', 'strategic', 4, 1, 'High-level strategy'),
(get_question_by_text('data-related decisions do you make using AI'), 'Operational decisions', 'operational', 3, 2, 'Day-to-day operations'),
(get_question_by_text('data-related decisions do you make using AI'), 'Customer-facing decisions', 'customer', 3, 3, 'Customer experience'),
(get_question_by_text('data-related decisions do you make using AI'), 'Financial decisions', 'financial', 4, 4, 'Budget and finance'),
(get_question_by_text('data-related decisions do you make using AI'), 'Product decisions', 'product', 3, 5, 'Product development'),
(get_question_by_text('data-related decisions do you make using AI'), 'None', 'none', 0, 6, 'No data decisions');

-- Continue with Automation, Creative, and Development sections in next part...