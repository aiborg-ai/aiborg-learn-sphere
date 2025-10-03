-- Comprehensive Assessment Options - Part 3 (Final)
-- Automation, Creative Tools, Development & Coding

-- =====================================================
-- AUTOMATION OPTIONS (Questions 55-64)
-- =====================================================

-- Question 55: Workflow automation tools
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('workflow automation tools with AI'), 'No, I don''t use automation tools', 'no', 0, 1, 'No automation', ARRAY['Zapier', 'Make', 'n8n']),
(get_question_by_text('workflow automation tools with AI'), 'Yes, for simple workflows', 'simple', 8, 2, 'Basic automation', ARRAY['Zapier', 'Make']),
(get_question_by_text('workflow automation tools with AI'), 'Yes, for complex multi-step workflows', 'complex', 12, 3, 'Advanced workflows', ARRAY['Make', 'n8n']),
(get_question_by_text('workflow automation tools with AI'), 'Yes, extensively across my work', 'extensive', 15, 4, 'Full automation stack', ARRAY['Zapier', 'Make', 'Power Automate']);

-- Question 56: Automated workflows
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description) VALUES
(get_question_by_text('workflows have you automated using AI'), 'Data entry and transfer', 'data_entry', 3, 1, 'Data automation'),
(get_question_by_text('workflows have you automated using AI'), 'Notifications and alerts', 'notifications', 2, 2, 'Alert systems'),
(get_question_by_text('workflows have you automated using AI'), 'File management and organization', 'files', 3, 3, 'File automation'),
(get_question_by_text('workflows have you automated using AI'), 'Report generation', 'reporting', 3, 4, 'Auto reporting'),
(get_question_by_text('workflows have you automated using AI'), 'Email processing', 'email', 3, 5, 'Email automation'),
(get_question_by_text('workflows have you automated using AI'), 'Social media posting', 'social', 2, 6, 'Social automation'),
(get_question_by_text('workflows have you automated using AI'), 'None', 'none', 0, 7, 'No automation');

-- Question 57: AI agents
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI agents or assistants for tasks'), 'No, I don''t use AI agents', 'no', 0, 1, 'No agents', ARRAY['Lindy', 'Relay', 'Magical']),
(get_question_by_text('AI agents or assistants for tasks'), 'Yes, for specific tasks', 'specific', 8, 2, 'Task-specific agents', ARRAY['Magical', 'Lindy']),
(get_question_by_text('AI agents or assistants for tasks'), 'Yes, custom GPTs or agents', 'custom', 12, 3, 'Custom agents', ARRAY['ChatGPT', 'Lindy']),
(get_question_by_text('AI agents or assistants for tasks'), 'Yes, comprehensive agent ecosystem', 'ecosystem', 15, 4, 'Full agent network', ARRAY['Lindy', 'Relay', 'AgentGPT']);

-- Question 58: Custom automation
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('created custom automation with AI integration'), 'No, I use pre-built solutions', 'no', 0, 1, 'Pre-built only', ARRAY['Zapier', 'Make']),
(get_question_by_text('created custom automation with AI integration'), 'Yes, simple custom workflows', 'simple', 8, 2, 'Basic custom', ARRAY['Zapier', 'Make']),
(get_question_by_text('created custom automation with AI integration'), 'Yes, complex integrations', 'complex', 12, 3, 'Advanced custom', ARRAY['n8n', 'Make']),
(get_question_by_text('created custom automation with AI integration'), 'Yes, I build sophisticated systems', 'sophisticated', 15, 4, 'Expert level', ARRAY['n8n', 'API integration']);

-- Question 59: Time saved (scale)
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index) VALUES
(get_question_by_text('time do you save through AI-powered automation'), 'None - No automation', '0', 0, 1),
(get_question_by_text('time do you save through AI-powered automation'), '1-3 hours per week', '1-3', 5, 2),
(get_question_by_text('time do you save through AI-powered automation'), '4-8 hours per week', '4-8', 9, 3),
(get_question_by_text('time do you save through AI-powered automation'), '9-15 hours per week', '9-15', 12, 4),
(get_question_by_text('time do you save through AI-powered automation'), 'More than 15 hours per week', '15+', 15, 5);

-- Question 60: RPA tools
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('RPA (Robotic Process Automation) tools'), 'No, I don''t use RPA', 'no', 0, 1, 'No RPA', ARRAY['UiPath', 'Power Automate']),
(get_question_by_text('RPA (Robotic Process Automation) tools'), 'Yes, for simple tasks', 'simple', 8, 2, 'Basic RPA', ARRAY['Power Automate', 'UiPath']),
(get_question_by_text('RPA (Robotic Process Automation) tools'), 'Yes, for business processes', 'business', 12, 3, 'Business RPA', ARRAY['UiPath', 'Automation Anywhere']),
(get_question_by_text('RPA (Robotic Process Automation) tools'), 'Yes, enterprise-wide automation', 'enterprise', 15, 4, 'Enterprise RPA', ARRAY['UiPath', 'Blue Prism']);

-- Question 61: Customer-facing automation
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('automated any customer-facing processes'), 'No, all customer interactions are manual', 'no', 0, 1, 'Manual processes', ARRAY['Intercom', 'Zendesk AI']),
(get_question_by_text('automated any customer-facing processes'), 'Yes, basic FAQs and routing', 'basic', 8, 2, 'Basic automation', ARRAY['Intercom', 'Tidio']),
(get_question_by_text('automated any customer-facing processes'), 'Yes, automated support and onboarding', 'support', 12, 3, 'Advanced automation', ARRAY['Ada', 'Intercom AI']),
(get_question_by_text('automated any customer-facing processes'), 'Yes, comprehensive customer journey automation', 'comprehensive', 15, 4, 'Full automation', ARRAY['Ada', 'ControlHippo']);

-- Question 62: Business processes automated
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description) VALUES
(get_question_by_text('business processes have you automated'), 'HR and recruitment', 'hr', 3, 1, 'Human resources'),
(get_question_by_text('business processes have you automated'), 'Finance and accounting', 'finance', 3, 2, 'Financial processes'),
(get_question_by_text('business processes have you automated'), 'Sales and CRM', 'sales', 3, 3, 'Sales automation'),
(get_question_by_text('business processes have you automated'), 'Marketing campaigns', 'marketing', 3, 4, 'Marketing automation'),
(get_question_by_text('business processes have you automated'), 'Operations and logistics', 'operations', 3, 5, 'Operational processes'),
(get_question_by_text('business processes have you automated'), 'None', 'none', 0, 6, 'No automation');

-- Question 63: Monitor and optimize
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index) VALUES
(get_question_by_text('monitor and optimize your automated workflows'), 'Never - Set and forget', 'never', 2, 1),
(get_question_by_text('monitor and optimize your automated workflows'), 'Rarely - Only when issues arise', 'rarely', 4, 2),
(get_question_by_text('monitor and optimize your automated workflows'), 'Sometimes - Quarterly reviews', 'sometimes', 7, 3),
(get_question_by_text('monitor and optimize your automated workflows'), 'Often - Monthly optimization', 'often', 10, 4),
(get_question_by_text('monitor and optimize your automated workflows'), 'Always - Continuous monitoring', 'always', 12, 5);

-- Question 64: Automation challenges
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description) VALUES
(get_question_by_text('automation challenges have you overcome'), 'Integration complexity', 'integration', 3, 1, 'Connecting systems'),
(get_question_by_text('automation challenges have you overcome'), 'Workflow design and logic', 'design', 3, 2, 'Building workflows'),
(get_question_by_text('automation challenges have you overcome'), 'Maintenance and updates', 'maintenance', 3, 3, 'Keeping systems running'),
(get_question_by_text('automation challenges have you overcome'), 'Data accuracy and reliability', 'accuracy', 3, 4, 'Ensuring quality'),
(get_question_by_text('automation challenges have you overcome'), 'Scale and performance', 'scale', 3, 5, 'Growing systems'),
(get_question_by_text('automation challenges have you overcome'), 'None', 'none', 0, 6, 'No challenges yet');

-- =====================================================
-- CREATIVE TOOLS OPTIONS (Questions 65-74)
-- =====================================================

-- Question 65: AI for graphic design
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('used AI for graphic design'), 'No, I design manually', 'no', 0, 1, 'Traditional design', ARRAY['Canva AI', 'Adobe Firefly', 'Recraft']),
(get_question_by_text('used AI for graphic design'), 'Yes, for simple graphics', 'simple', 6, 2, 'Basic designs', ARRAY['Canva AI', 'Recraft']),
(get_question_by_text('used AI for graphic design'), 'Yes, for professional designs', 'professional', 10, 3, 'Advanced design', ARRAY['Adobe Firefly', 'Canva AI']),
(get_question_by_text('used AI for graphic design'), 'Yes, as my primary design method', 'primary', 12, 4, 'Main design tool', ARRAY['Adobe Firefly', 'Recraft', 'Canva AI']);

-- Question 66: Photo generation/editing
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI to generate or edit photos'), 'No, I don''t edit photos', 'no', 0, 1, 'No photo editing', ARRAY['Remove.bg', 'Cleanup.pictures', 'Photor']),
(get_question_by_text('AI to generate or edit photos'), 'Yes, basic edits like background removal', 'basic', 5, 2, 'Simple edits', ARRAY['Remove.bg', 'Canva']),
(get_question_by_text('AI to generate or edit photos'), 'Yes, enhancement and restoration', 'enhancement', 8, 3, 'Photo enhancement', ARRAY['Photor', 'Remini']),
(get_question_by_text('AI to generate or edit photos'), 'Yes, extensive photo manipulation', 'extensive', 10, 4, 'Advanced editing', ARRAY['Adobe Firefly', 'Photoshop AI']);

-- Question 67: AI music generation
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('experimented with AI music generation'), 'No, I haven''t tried AI music', 'no', 0, 1, 'No AI music', ARRAY['Suno', 'Udio', 'Soundraw']),
(get_question_by_text('experimented with AI music generation'), 'Yes, for fun experimentation', 'fun', 5, 2, 'Casual creation', ARRAY['Suno', 'Udio']),
(get_question_by_text('experimented with AI music generation'), 'Yes, for projects and content', 'projects', 8, 3, 'Project use', ARRAY['Soundraw', 'AIVA']),
(get_question_by_text('experimented with AI music generation'), 'Yes, professionally', 'professional', 10, 4, 'Professional use', ARRAY['AIVA', 'Soundraw', 'Suno']);

-- Question 68: Creative projects
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description) VALUES
(get_question_by_text('creative projects have you completed with AI'), 'Digital art and illustrations', 'art', 3, 1, 'Visual art'),
(get_question_by_text('creative projects have you completed with AI'), 'Music or audio', 'music', 3, 2, 'Audio creation'),
(get_question_by_text('creative projects have you completed with AI'), 'Videos', 'videos', 3, 3, 'Video projects'),
(get_question_by_text('creative projects have you completed with AI'), 'Graphic designs', 'designs', 2, 4, 'Design work'),
(get_question_by_text('creative projects have you completed with AI'), '3D models', '3d', 3, 5, '3D creation'),
(get_question_by_text('creative projects have you completed with AI'), 'Animations', 'animations', 3, 6, 'Animation work'),
(get_question_by_text('creative projects have you completed with AI'), 'None', 'none', 0, 7, 'No creative projects');

-- Question 69: Brand design
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI for brand design or marketing materials'), 'No, I create designs manually', 'no', 0, 1, 'Traditional branding', ARRAY['Looka', 'Canva AI', 'Designs AI']),
(get_question_by_text('AI for brand design or marketing materials'), 'Yes, for marketing graphics', 'graphics', 6, 2, 'Marketing materials', ARRAY['Canva AI', 'Adobe Firefly']),
(get_question_by_text('AI for brand design or marketing materials'), 'Yes, for brand identity', 'identity', 10, 3, 'Brand creation', ARRAY['Looka', 'Brandmark']),
(get_question_by_text('AI for brand design or marketing materials'), 'Yes, for comprehensive brand systems', 'comprehensive', 12, 4, 'Full branding', ARRAY['Looka', 'Designs AI', 'Canva AI']);

-- Question 70: AI-generated art
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('created AI-generated art or illustrations'), 'No, I haven''t created AI art', 'no', 0, 1, 'No AI art', ARRAY['Midjourney', 'DALL-E', 'Stable Diffusion']),
(get_question_by_text('created AI-generated art or illustrations'), 'Yes, for personal projects', 'personal', 5, 2, 'Personal use', ARRAY['DALL-E', 'Midjourney']),
(get_question_by_text('created AI-generated art or illustrations'), 'Yes, for professional work', 'professional', 8, 3, 'Professional art', ARRAY['Midjourney', 'Adobe Firefly']),
(get_question_by_text('created AI-generated art or illustrations'), 'Yes, extensively and regularly', 'extensive', 10, 4, 'Regular creator', ARRAY['Midjourney', 'Stable Diffusion']);

-- Question 71: Animation/motion graphics
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI for animation or motion graphics'), 'No, I don''t create animations', 'no', 0, 1, 'No animation', ARRAY['Runway', 'Pika Labs', 'Kaiber']),
(get_question_by_text('AI for animation or motion graphics'), 'Yes, simple animations', 'simple', 6, 2, 'Basic animation', ARRAY['Pika Labs', 'Runway']),
(get_question_by_text('AI for animation or motion graphics'), 'Yes, motion graphics for content', 'content', 10, 3, 'Content animation', ARRAY['Runway', 'Kaiber']),
(get_question_by_text('AI for animation or motion graphics'), 'Yes, professional animation work', 'professional', 12, 4, 'Pro animation', ARRAY['Runway', 'Kling AI']);

-- Question 72: Combining AI with traditional methods
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description) VALUES
(get_question_by_text('combine AI tools with traditional creative methods'), 'I only use AI', 'ai_only', 5, 1, 'Pure AI workflow'),
(get_question_by_text('combine AI tools with traditional creative methods'), 'AI for ideation, manual for execution', 'idea_manual', 7, 2, 'AI assists planning'),
(get_question_by_text('combine AI tools with traditional creative methods'), 'AI for initial creation, manual refinement', 'ai_refine', 9, 3, 'AI base, manual polish'),
(get_question_by_text('combine AI tools with traditional creative methods'), 'Seamless blend of both methods', 'blend', 10, 4, 'Hybrid approach');

-- Question 73: Monetization
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description) VALUES
(get_question_by_text('monetized or professionally used AI-created content'), 'No, only personal use', 'no', 0, 1, 'Personal only'),
(get_question_by_text('monetized or professionally used AI-created content'), 'Yes, occasionally for clients', 'occasional', 8, 2, 'Some client work'),
(get_question_by_text('monetized or professionally used AI-created content'), 'Yes, regularly in my business', 'regular', 12, 3, 'Regular business use'),
(get_question_by_text('monetized or professionally used AI-created content'), 'Yes, it''s my primary income source', 'primary', 15, 4, 'Main income');

-- Question 74: Creative skills developed
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description) VALUES
(get_question_by_text('creative skills has AI helped you develop'), 'Design and visual composition', 'design', 2, 1, 'Design skills'),
(get_question_by_text('creative skills has AI helped you develop'), 'Video editing', 'video', 2, 2, 'Video skills'),
(get_question_by_text('creative skills has AI helped you develop'), 'Music and audio', 'music', 2, 3, 'Audio skills'),
(get_question_by_text('creative skills has AI helped you develop'), 'Storytelling', 'storytelling', 3, 4, 'Narrative skills'),
(get_question_by_text('creative skills has AI helped you develop'), 'Prompt engineering', 'prompting', 3, 5, 'AI interaction'),
(get_question_by_text('creative skills has AI helped you develop'), 'Creative direction', 'direction', 3, 6, 'Vision and direction'),
(get_question_by_text('creative skills has AI helped you develop'), 'None', 'none', 0, 7, 'No skills developed');

-- =====================================================
-- DEVELOPMENT & CODING OPTIONS (Questions 75-84)
-- =====================================================

-- Question 75: AI coding assistants
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('used AI coding assistants'), 'No, I code without AI assistance', 'no', 0, 1, 'Traditional coding', ARRAY['GitHub Copilot', 'Cursor', 'Codeium']),
(get_question_by_text('used AI coding assistants'), 'Yes, occasionally for help', 'occasional', 8, 2, 'Some AI use', ARRAY['GitHub Copilot', 'ChatGPT']),
(get_question_by_text('used AI coding assistants'), 'Yes, regularly in my workflow', 'regular', 12, 3, 'Regular AI use', ARRAY['Cursor', 'GitHub Copilot']),
(get_question_by_text('used AI coding assistants'), 'Yes, it''s essential to my development', 'essential', 15, 4, 'Core tool', ARRAY['Cursor', 'GitHub Copilot', 'Codeium']);

-- Question 76: Programming tasks with AI
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description) VALUES
(get_question_by_text('programming tasks do you use AI for'), 'Writing new code', 'writing', 3, 1, 'Code generation'),
(get_question_by_text('programming tasks do you use AI for'), 'Debugging and fixing errors', 'debugging', 3, 2, 'Error fixing'),
(get_question_by_text('programming tasks do you use AI for'), 'Code documentation', 'documentation', 2, 3, 'Writing docs'),
(get_question_by_text('programming tasks do you use AI for'), 'Testing and test generation', 'testing', 3, 4, 'Test creation'),
(get_question_by_text('programming tasks do you use AI for'), 'Learning new languages/frameworks', 'learning', 3, 5, 'Education'),
(get_question_by_text('programming tasks do you use AI for'), 'Code review and optimization', 'review', 3, 6, 'Code improvement'),
(get_question_by_text('programming tasks do you use AI for'), 'None', 'none', 0, 7, 'No AI programming');

-- Question 77: Code reviews/debugging
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI for code reviews or debugging'), 'No, I debug manually', 'no', 0, 1, 'Manual debugging', ARRAY['GitHub Copilot', 'Cursor']),
(get_question_by_text('AI for code reviews or debugging'), 'Yes, for error explanations', 'explanations', 6, 2, 'Understanding errors', ARRAY['ChatGPT', 'GitHub Copilot']),
(get_question_by_text('AI for code reviews or debugging'), 'Yes, for suggesting fixes', 'fixes', 10, 3, 'Fix suggestions', ARRAY['Cursor', 'GitHub Copilot']),
(get_question_by_text('AI for code reviews or debugging'), 'Yes, comprehensive code analysis', 'comprehensive', 12, 4, 'Full analysis', ARRAY['Cursor', 'DeepCode']);

-- Question 78: Learning programming
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('used AI to learn programming'), 'No, I use traditional resources', 'no', 0, 1, 'Traditional learning', ARRAY['ChatGPT', 'Claude', 'Replit AI']),
(get_question_by_text('used AI to learn programming'), 'Yes, for concept explanations', 'concepts', 5, 2, 'Understanding concepts', ARRAY['ChatGPT', 'Claude']),
(get_question_by_text('used AI to learn programming'), 'Yes, for practice problems', 'practice', 7, 3, 'Hands-on practice', ARRAY['Replit AI', 'ChatGPT']),
(get_question_by_text('used AI to learn programming'), 'Yes, as my primary learning tool', 'primary', 10, 4, 'Main learning method', ARRAY['ChatGPT', 'Claude', 'Replit']);

-- Question 79: Documentation generation
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI for generating documentation or comments'), 'No, I write docs manually', 'no', 0, 1, 'Manual documentation', ARRAY['Mintlify', 'Swimm', 'GitHub Copilot']),
(get_question_by_text('AI for generating documentation or comments'), 'Yes, for inline comments', 'comments', 6, 2, 'Code comments', ARRAY['GitHub Copilot', 'Cursor']),
(get_question_by_text('AI for generating documentation or comments'), 'Yes, for API documentation', 'api', 10, 3, 'API docs', ARRAY['Mintlify', 'Swimm']),
(get_question_by_text('AI for generating documentation or comments'), 'Yes, comprehensive documentation', 'comprehensive', 12, 4, 'Full docs', ARRAY['Mintlify', 'Swimm', 'GitBook AI']);

-- Question 80: Code AI-assistance percentage (scale)
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index) VALUES
(get_question_by_text('much of your code is AI-assisted'), '0-20% - Minimal AI assistance', '0-20', 3, 1),
(get_question_by_text('much of your code is AI-assisted'), '21-40% - Some AI assistance', '21-40', 7, 2),
(get_question_by_text('much of your code is AI-assisted'), '41-60% - Moderate AI assistance', '41-60', 11, 3),
(get_question_by_text('much of your code is AI-assisted'), '61-80% - Heavy AI assistance', '61-80', 13, 4),
(get_question_by_text('much of your code is AI-assisted'), '81-100% - Mostly AI-generated', '81-100', 15, 5);

-- Question 81: Automated testing
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('used AI for automated testing'), 'No, I write tests manually', 'no', 0, 1, 'Manual testing', ARRAY['GitHub Copilot', 'Testim']),
(get_question_by_text('used AI for automated testing'), 'Yes, for test generation', 'generation', 8, 2, 'Test creation', ARRAY['GitHub Copilot', 'ChatGPT']),
(get_question_by_text('used AI for automated testing'), 'Yes, for test maintenance', 'maintenance', 12, 3, 'Test updates', ARRAY['Testim', 'Mabl']),
(get_question_by_text('used AI for automated testing'), 'Yes, comprehensive AI testing', 'comprehensive', 15, 4, 'Full test automation', ARRAY['Testim', 'Mabl', 'Functionize']);

-- Question 82: Code conversion/refactoring
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI to convert or refactor code'), 'No, I refactor manually', 'no', 0, 1, 'Manual refactoring', ARRAY['GitHub Copilot', 'ChatGPT']),
(get_question_by_text('AI to convert or refactor code'), 'Yes, for language conversion', 'conversion', 8, 2, 'Code translation', ARRAY['ChatGPT', 'Cursor']),
(get_question_by_text('AI to convert or refactor code'), 'Yes, for code modernization', 'modernization', 10, 3, 'Updating code', ARRAY['Cursor', 'GitHub Copilot']),
(get_question_by_text('AI to convert or refactor code'), 'Yes, for optimization and refactoring', 'optimization', 12, 4, 'Code improvement', ARRAY['Cursor', 'DeepCode']);

-- Question 83: Confidence reviewing AI code (scale)
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index) VALUES
(get_question_by_text('confident are you reviewing AI-generated code'), 'Not confident - I struggle to verify AI code', '1', 2, 1),
(get_question_by_text('confident are you reviewing AI-generated code'), 'Somewhat confident - Basic review skills', '2', 5, 2),
(get_question_by_text('confident are you reviewing AI-generated code'), 'Confident - Good review capabilities', '3', 8, 3),
(get_question_by_text('confident are you reviewing AI-generated code'), 'Very confident - Expert code reviewer', '4', 10, 4);

-- Question 84: Development workflows enhanced
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description) VALUES
(get_question_by_text('development workflows have you enhanced with AI'), 'CI/CD pipelines', 'cicd', 3, 1, 'Build automation'),
(get_question_by_text('development workflows have you enhanced with AI'), 'Deployment processes', 'deployment', 3, 2, 'Release automation'),
(get_question_by_text('development workflows have you enhanced with AI'), 'Code monitoring and alerts', 'monitoring', 3, 3, 'System monitoring'),
(get_question_by_text('development workflows have you enhanced with AI'), 'Team collaboration', 'collaboration', 3, 4, 'Dev team tools'),
(get_question_by_text('development workflows have you enhanced with AI'), 'Code review processes', 'review', 3, 5, 'Review automation'),
(get_question_by_text('development workflows have you enhanced with AI'), 'None', 'none', 0, 6, 'No workflow enhancement');

-- Clean up helper function (optional)
-- DROP FUNCTION IF EXISTS get_question_by_text(TEXT);