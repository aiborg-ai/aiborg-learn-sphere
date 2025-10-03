-- Comprehensive AI Augmentation Assessment Question Options (2024-2025)
-- Answer choices for assessment questions based on current AI tools and trends

-- Helper function to get question ID by partial text match
CREATE OR REPLACE FUNCTION get_question_by_text(q_text TEXT)
RETURNS UUID AS $$
  SELECT id FROM assessment_questions
  WHERE question_text LIKE '%' || q_text || '%'
  LIMIT 1;
$$ LANGUAGE SQL;

-- =====================================================
-- DAILY PRODUCTIVITY OPTIONS
-- =====================================================

-- Question 1: How often do you use AI tools for daily tasks?
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description) VALUES
(get_question_by_text('How often do you use AI tools to help with your daily tasks'), 'Never - I don''t use AI tools', 'never', 0, 1, 'No AI augmentation yet'),
(get_question_by_text('How often do you use AI tools to help with your daily tasks'), 'Rarely - Once a month or less', 'rarely', 2, 2, 'Minimal AI usage'),
(get_question_by_text('How often do you use AI tools to help with your daily tasks'), 'Sometimes - A few times per month', 'sometimes', 4, 3, 'Occasional AI user'),
(get_question_by_text('How often do you use AI tools to help with your daily tasks'), 'Often - A few times per week', 'often', 7, 4, 'Regular AI user'),
(get_question_by_text('How often do you use AI tools to help with your daily tasks'), 'Daily - Multiple times per day', 'daily', 10, 5, 'Highly augmented');

-- Question 2: Which AI productivity tools have you used?
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI-powered productivity tools have you used'), 'ChatGPT', 'chatgpt', 3, 1, 'General-purpose AI assistant', ARRAY['Claude', 'Gemini', 'Perplexity']),
(get_question_by_text('AI-powered productivity tools have you used'), 'Claude', 'claude', 3, 2, 'Advanced reasoning and analysis', ARRAY['ChatGPT', 'Gemini']),
(get_question_by_text('AI-powered productivity tools have you used'), 'Google Gemini', 'gemini', 3, 3, 'Integrated with Google Workspace', ARRAY['ChatGPT', 'Claude']),
(get_question_by_text('AI-powered productivity tools have you used'), 'Notion AI', 'notion', 2, 4, 'AI-powered note-taking', ARRAY['Obsidian', 'Mem', 'Reflect']),
(get_question_by_text('AI-powered productivity tools have you used'), 'Grammarly', 'grammarly', 2, 5, 'Writing enhancement', ARRAY['Wordtune', 'ProWritingAid']),
(get_question_by_text('AI-powered productivity tools have you used'), 'Perplexity AI', 'perplexity', 2, 6, 'AI-powered search', ARRAY['Arc Search', 'You.com']),
(get_question_by_text('AI-powered productivity tools have you used'), 'Microsoft Copilot', 'copilot', 3, 7, 'Integrated with Microsoft 365', ARRAY['Google Workspace AI']),
(get_question_by_text('AI-powered productivity tools have you used'), 'None yet', 'none', 0, 8, 'No AI tools used', NULL);

-- Question 3: AI for emails
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('use AI to help write or improve your emails'), 'No, I write all emails manually', 'never', 0, 1, 'Traditional email writing', ARRAY['Gmail Smart Compose', 'Superhuman AI']),
(get_question_by_text('use AI to help write or improve your emails'), 'Yes, occasionally for difficult emails', 'occasional', 5, 2, 'Selective AI assistance', ARRAY['ChatGPT', 'Grammarly']),
(get_question_by_text('use AI to help write or improve your emails'), 'Yes, regularly for drafting and editing', 'regular', 8, 3, 'Frequent AI user', ARRAY['Superhuman', 'Shortwave']),
(get_question_by_text('use AI to help write or improve your emails'), 'Yes, AI handles most of my email writing', 'automated', 10, 4, 'Highly automated', ARRAY['SaneBox', 'EmailTree']);

-- Question 4: Calendar and scheduling
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('manage your calendar and scheduling'), 'Manually - I schedule everything myself', 'manual', 0, 1, 'No automation', ARRAY['Reclaim AI', 'Motion', 'Clockwise']),
(get_question_by_text('manage your calendar and scheduling'), 'Basic tools - Google/Outlook Calendar only', 'basic', 3, 2, 'Standard calendar', ARRAY['Reclaim AI', 'Motion']),
(get_question_by_text('manage your calendar and scheduling'), 'Smart scheduling - Using AI suggestions', 'smart', 7, 3, 'AI-assisted scheduling', ARRAY['Motion', 'Clockwise']),
(get_question_by_text('manage your calendar and scheduling'), 'Fully automated - AI manages my calendar', 'automated', 12, 4, 'Complete automation', ARRAY['Reclaim AI', 'Motion', 'Clockwise']);

-- Question 5: AI note-taking
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI-powered note-taking tools'), 'No, I use traditional note-taking', 'no', 0, 1, 'Traditional notes', ARRAY['Notion AI', 'Obsidian', 'Reflect']),
(get_question_by_text('AI-powered note-taking tools'), 'Yes, for organizing and searching notes', 'organize', 5, 2, 'AI organization', ARRAY['Notion AI', 'Mem', 'Obsidian']),
(get_question_by_text('AI-powered note-taking tools'), 'Yes, for generating and enhancing notes', 'generate', 8, 3, 'AI generation', ARRAY['Notion AI', 'Reflect', 'Roam Research']),
(get_question_by_text('AI-powered note-taking tools'), 'Yes, AI is central to my note-taking system', 'central', 10, 4, 'Fully integrated', ARRAY['Mem', 'Reflect', 'Notion AI']);

-- Question 6: Summarization
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description) VALUES
(get_question_by_text('use AI to summarize long documents'), 'Never', 'never', 0, 1, 'No summarization'),
(get_question_by_text('use AI to summarize long documents'), 'Rarely', 'rarely', 3, 2, 'Occasional use'),
(get_question_by_text('use AI to summarize long documents'), 'Sometimes', 'sometimes', 5, 3, 'Regular use'),
(get_question_by_text('use AI to summarize long documents'), 'Often', 'often', 7, 4, 'Frequent use'),
(get_question_by_text('use AI to summarize long documents'), 'Always', 'always', 10, 5, 'Constant use');

-- Question 7: Task management
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI-powered task management'), 'No, I manage tasks manually', 'no', 0, 1, 'Manual task management', ARRAY['Asana AI', 'ClickUp Brain', 'Monday AI']),
(get_question_by_text('AI-powered task management'), 'Yes, for task suggestions and prioritization', 'suggestions', 6, 2, 'AI recommendations', ARRAY['Asana AI', 'Motion']),
(get_question_by_text('AI-powered task management'), 'Yes, for automated task creation and tracking', 'automated', 10, 3, 'Automated workflows', ARRAY['ClickUp Brain', 'Monday AI']),
(get_question_by_text('AI-powered task management'), 'Yes, AI manages my entire task workflow', 'full', 12, 4, 'Complete automation', ARRAY['Motion', 'Asana AI', 'ClickUp Brain']);

-- Question 8: Automated workflows
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description) VALUES
(get_question_by_text('productivity workflows have you automated'), 'Email filtering and organization', 'email', 3, 1, 'Email automation'),
(get_question_by_text('productivity workflows have you automated'), 'Calendar management and scheduling', 'calendar', 3, 2, 'Calendar automation'),
(get_question_by_text('productivity workflows have you automated'), 'Note-taking and documentation', 'notes', 3, 3, 'Documentation automation'),
(get_question_by_text('productivity workflows have you automated'), 'Task creation and tracking', 'tasks', 3, 4, 'Task automation'),
(get_question_by_text('productivity workflows have you automated'), 'File organization and backup', 'files', 2, 5, 'File management'),
(get_question_by_text('productivity workflows have you automated'), 'Meeting preparation and follow-up', 'meetings', 3, 6, 'Meeting automation'),
(get_question_by_text('productivity workflows have you automated'), 'None yet', 'none', 0, 7, 'No automation');

-- Question 9: Search and discovery
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI for information search and discovery'), 'Traditional search engines only', 'traditional', 0, 1, 'Google, Bing', ARRAY['Perplexity', 'You.com', 'Arc Search']),
(get_question_by_text('AI for information search and discovery'), 'AI-powered search occasionally', 'occasional', 5, 2, 'Perplexity, ChatGPT', ARRAY['Arc Search', 'You.com']),
(get_question_by_text('AI for information search and discovery'), 'AI search as my primary method', 'primary', 8, 3, 'Perplexity, Claude', ARRAY['You.com', 'Kagi']),
(get_question_by_text('AI for information search and discovery'), 'Multiple AI tools for comprehensive research', 'advanced', 10, 4, 'Multi-tool research', ARRAY['Consensus', 'Elicit', 'Research Rabbit']);

-- Question 10: Browser extensions
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('browser extensions with AI capabilities'), 'ChatGPT for search/browsing', 'chatgpt_ext', 2, 1, 'ChatGPT extension', NULL),
(get_question_by_text('browser extensions with AI capabilities'), 'Grammarly for writing', 'grammarly_ext', 2, 2, 'Writing assistant', NULL),
(get_question_by_text('browser extensions with AI capabilities'), 'Compose AI / TextBlaze for shortcuts', 'compose', 2, 3, 'Text expansion', ARRAY['TextBlaze', 'aText']),
(get_question_by_text('browser extensions with AI capabilities'), 'Web scraping / data extraction tools', 'scraping', 3, 4, 'Data extraction', ARRAY['Browse AI', 'Octoparse']),
(get_question_by_text('browser extensions with AI capabilities'), 'Video/meeting transcription', 'transcription', 2, 5, 'Transcription tools', ARRAY['Otter', 'Fireflies']),
(get_question_by_text('browser extensions with AI capabilities'), 'Summarization extensions', 'summarization', 2, 6, 'Quick summaries', ARRAY['TLDR This', 'Recall']),
(get_question_by_text('browser extensions with AI capabilities'), 'None', 'none', 0, 7, 'No extensions', NULL);

-- Question 11-12: Scale questions (time savings and task percentage)
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index) VALUES
-- Time savings per week
(get_question_by_text('time do AI productivity tools save you'), 'None - I don''t use AI tools', '0', 0, 1),
(get_question_by_text('time do AI productivity tools save you'), '1-2 hours per week', '1-2', 3, 2),
(get_question_by_text('time do AI productivity tools save you'), '3-5 hours per week', '3-5', 7, 3),
(get_question_by_text('time do AI productivity tools save you'), '6-10 hours per week', '6-10', 11, 4),
(get_question_by_text('time do AI productivity tools save you'), 'More than 10 hours per week', '10+', 15, 5),

-- Task percentage
(get_question_by_text('percentage of your routine tasks are now AI-assisted'), '0-20% - Just getting started', '0-20', 3, 1),
(get_question_by_text('percentage of your routine tasks are now AI-assisted'), '21-40% - Growing adoption', '21-40', 6, 2),
(get_question_by_text('percentage of your routine tasks are now AI-assisted'), '41-60% - Moderate integration', '41-60', 9, 3),
(get_question_by_text('percentage of your routine tasks are now AI-assisted'), '61-80% - Highly augmented', '61-80', 12, 4),
(get_question_by_text('percentage of your routine tasks are now AI-assisted'), '81-100% - Fully AI-integrated', '81-100', 15, 5);

-- =====================================================
-- CONTENT CREATION OPTIONS
-- =====================================================

-- Question 13: AI for writing
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('used AI to help you write content'), 'No, I haven''t used AI for writing', 'no', 0, 1, 'Traditional writing', ARRAY['ChatGPT', 'Claude', 'Jasper']),
(get_question_by_text('used AI to help you write content'), 'Yes, occasionally for brainstorming', 'brainstorm', 4, 2, 'Idea generation', ARRAY['ChatGPT', 'Claude']),
(get_question_by_text('used AI to help you write content'), 'Yes, regularly for drafting', 'draft', 7, 3, 'First drafts', ARRAY['Jasper', 'Copy.ai', 'Wordtune']),
(get_question_by_text('used AI to help you write content'), 'Yes, extensively for content creation', 'extensive', 10, 4, 'Full content pipeline', ARRAY['Jasper', 'Copy.ai', 'Rytr']);

-- Question 14: AI writing tools used
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description) VALUES
(get_question_by_text('AI writing tools do you use regularly'), 'ChatGPT / Claude / Gemini', 'chatbots', 2, 1, 'General AI assistants'),
(get_question_by_text('AI writing tools do you use regularly'), 'Jasper / Copy.ai', 'copywriting', 3, 2, 'Specialized copywriting'),
(get_question_by_text('AI writing tools do you use regularly'), 'Grammarly / Wordtune', 'editing', 2, 3, 'Writing enhancement'),
(get_question_by_text('AI writing tools do you use regularly'), 'Notion AI / Google Docs AI', 'integrated', 2, 4, 'Integrated writing'),
(get_question_by_text('AI writing tools do you use regularly'), 'Rytr / Writesonic', 'specialized', 2, 5, 'Content-specific tools'),
(get_question_by_text('AI writing tools do you use regularly'), 'QuillBot for paraphrasing', 'paraphrase', 2, 6, 'Rewriting tools'),
(get_question_by_text('AI writing tools do you use regularly'), 'None', 'none', 0, 7, 'No AI writing tools');

-- Question 15: AI for images
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('used AI to generate or edit images'), 'No, I haven''t used AI for images', 'no', 0, 1, 'Traditional image work', ARRAY['Midjourney', 'DALL-E', 'Stable Diffusion']),
(get_question_by_text('used AI to generate or edit images'), 'Yes, for basic image generation', 'basic', 6, 2, 'Simple AI images', ARRAY['Midjourney', 'DALL-E 3']),
(get_question_by_text('used AI to generate or edit images'), 'Yes, for image editing and enhancement', 'editing', 8, 3, 'Photo editing', ARRAY['Adobe Firefly', 'Canva AI', 'Remove.bg']),
(get_question_by_text('used AI to generate or edit images'), 'Yes, extensively for professional projects', 'professional', 12, 4, 'Advanced usage', ARRAY['Midjourney', 'Adobe Firefly', 'Stable Diffusion']);

-- Question 16: AI for video
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI for video creation or editing'), 'No, I haven''t used AI for video', 'no', 0, 1, 'Traditional video work', ARRAY['Synthesia', 'Runway', 'Descript']),
(get_question_by_text('AI for video creation or editing'), 'Yes, for basic video generation', 'basic', 6, 2, 'AI video creation', ARRAY['Synthesia', 'Pictory']),
(get_question_by_text('AI for video creation or editing'), 'Yes, for video editing and enhancement', 'editing', 8, 3, 'Video editing', ARRAY['Descript', 'Runway', 'CapCut']),
(get_question_by_text('AI for video creation or editing'), 'Yes, for full video production workflows', 'production', 12, 4, 'Complete pipeline', ARRAY['Runway', 'Descript', 'Adobe Premiere Pro AI']);

-- Question 17: AI voice
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI voice generation or cloning'), 'No, I haven''t used AI voice tools', 'no', 0, 1, 'Traditional voice recording', ARRAY['ElevenLabs', 'Murf', 'Descript']),
(get_question_by_text('AI voice generation or cloning'), 'Yes, for voice generation', 'generation', 6, 2, 'Text-to-speech', ARRAY['ElevenLabs', 'Murf']),
(get_question_by_text('AI voice generation or cloning'), 'Yes, for voice cloning', 'cloning', 10, 3, 'Voice replication', ARRAY['ElevenLabs', 'Descript', 'Respeecher']),
(get_question_by_text('AI voice generation or cloning'), 'Yes, for professional audio production', 'professional', 12, 4, 'Advanced audio work', ARRAY['ElevenLabs Pro', 'Respeecher', 'Adobe Podcast AI']);

-- Question 18: Social media content
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description) VALUES
(get_question_by_text('AI for social media content'), 'Caption and copy writing', 'captions', 3, 1, 'Post writing'),
(get_question_by_text('AI for social media content'), 'Image and graphics creation', 'images', 3, 2, 'Visual content'),
(get_question_by_text('AI for social media content'), 'Hashtag generation', 'hashtags', 2, 3, 'Tag optimization'),
(get_question_by_text('AI for social media content'), 'Content scheduling suggestions', 'scheduling', 3, 4, 'Timing optimization'),
(get_question_by_text('AI for social media content'), 'Trend analysis and ideas', 'trends', 3, 5, 'Content strategy'),
(get_question_by_text('AI for social media content'), 'Video content creation', 'video', 4, 6, 'Video posts'),
(get_question_by_text('AI for social media content'), 'None', 'none', 0, 7, 'No social media AI');

-- Question 19: Brainstorming
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index) VALUES
(get_question_by_text('AI for brainstorming and ideation'), 'Never', 'never', 0, 1),
(get_question_by_text('AI for brainstorming and ideation'), 'Rarely', 'rarely', 3, 2),
(get_question_by_text('AI for brainstorming and ideation'), 'Sometimes', 'sometimes', 5, 3),
(get_question_by_text('AI for brainstorming and ideation'), 'Often', 'often', 7, 4),
(get_question_by_text('AI for brainstorming and ideation'), 'Always', 'always', 10, 5);

-- Question 20: Content formats
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description) VALUES
(get_question_by_text('content formats do you create with AI'), 'Blog posts and articles', 'blogs', 2, 1, 'Written content'),
(get_question_by_text('content formats do you create with AI'), 'Social media posts', 'social', 2, 2, 'Social content'),
(get_question_by_text('content formats do you create with AI'), 'Videos', 'videos', 3, 3, 'Video content'),
(get_question_by_text('content formats do you create with AI'), 'Podcasts or audio', 'audio', 3, 4, 'Audio content'),
(get_question_by_text('content formats do you create with AI'), 'Infographics', 'infographics', 2, 5, 'Visual data'),
(get_question_by_text('content formats do you create with AI'), 'Presentations', 'presentations', 2, 6, 'Slides and decks'),
(get_question_by_text('content formats do you create with AI'), 'Email newsletters', 'newsletters', 2, 7, 'Email content'),
(get_question_by_text('content formats do you create with AI'), 'None', 'none', 0, 8, 'No AI content');

-- Question 21: AI presentations
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI-generated presentations'), 'No, I create presentations manually', 'no', 0, 1, 'Traditional slides', ARRAY['Gamma', 'Beautiful.ai', 'Slides AI']),
(get_question_by_text('AI-generated presentations'), 'Yes, for generating outlines', 'outlines', 5, 2, 'Structure help', ARRAY['ChatGPT', 'Gamma']),
(get_question_by_text('AI-generated presentations'), 'Yes, for creating full presentations', 'full', 8, 3, 'Complete decks', ARRAY['Gamma', 'Beautiful.ai']),
(get_question_by_text('AI-generated presentations'), 'Yes, for both creation and design', 'comprehensive', 10, 4, 'End-to-end', ARRAY['Gamma', 'Slides AI', 'Beautiful.ai']);

-- Question 22: Content repurposing
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI for content repurposing'), 'No, I don''t repurpose content', 'no', 0, 1, 'Single-use content', ARRAY['Repurpose.io', 'OpusClip']),
(get_question_by_text('AI for content repurposing'), 'Yes, between written formats', 'written', 6, 2, 'Text adaptations', ARRAY['ChatGPT', 'Jasper']),
(get_question_by_text('AI for content repurposing'), 'Yes, from video to text/social', 'video_to_text', 8, 3, 'Video breakdown', ARRAY['OpusClip', 'Descript']),
(get_question_by_text('AI for content repurposing'), 'Yes, across multiple formats', 'multi_format', 12, 4, 'Omnichannel', ARRAY['Repurpose.io', 'OpusClip', 'Descript']);

-- Question 23: Confidence editing AI content
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index) VALUES
(get_question_by_text('confident are you in editing'), 'Not confident - I struggle to improve AI outputs', '1', 2, 1),
(get_question_by_text('confident are you in editing'), 'Somewhat confident - I can make basic edits', '2', 4, 2),
(get_question_by_text('confident are you in editing'), 'Confident - I can significantly improve AI content', '3', 7, 3),
(get_question_by_text('confident are you in editing'), 'Very confident - I expertly refine AI outputs', '4', 10, 4);

-- Question 24: Content creation percentage
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index) VALUES
(get_question_by_text('percentage of your content creation involves AI'), '0-20% - Minimal AI use', '0-20', 3, 1),
(get_question_by_text('percentage of your content creation involves AI'), '21-40% - Some AI assistance', '21-40', 6, 2),
(get_question_by_text('percentage of your content creation involves AI'), '41-60% - Half AI-assisted', '41-60', 9, 3),
(get_question_by_text('percentage of your content creation involves AI'), '61-80% - Mostly AI-assisted', '61-80', 12, 4),
(get_question_by_text('percentage of your content creation involves AI'), '81-100% - Fully AI-integrated', '81-100', 15, 5);

-- =====================================================
-- LEARNING & RESEARCH OPTIONS
-- =====================================================

-- Question 25: AI for studying
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI tools to help with studying or learning'), 'No, I don''t use AI for learning', 'no', 0, 1, 'Traditional studying', ARRAY['Khan Academy AI', 'Quizlet', 'Duolingo']),
(get_question_by_text('AI tools to help with studying or learning'), 'Yes, for quick questions and answers', 'questions', 5, 2, 'Q&A help', ARRAY['ChatGPT', 'Socratic']),
(get_question_by_text('AI tools to help with studying or learning'), 'Yes, for study materials and summaries', 'materials', 7, 3, 'Study aids', ARRAY['Quizlet AI', 'Exam AI']),
(get_question_by_text('AI tools to help with studying or learning'), 'Yes, as my primary learning assistant', 'primary', 10, 4, 'Main study tool', ARRAY['Khan Academy AI', 'Tutor AI', 'Socratic']);

-- Question 26: AI learning tools
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description) VALUES
(get_question_by_text('AI learning tools have you tried'), 'Quizlet AI for flashcards', 'quizlet', 3, 1, 'Flashcard study'),
(get_question_by_text('AI learning tools have you tried'), 'Khan Academy AI tutor', 'khan', 3, 2, 'Personalized tutoring'),
(get_question_by_text('AI learning tools have you tried'), 'Duolingo for languages', 'duolingo', 3, 3, 'Language learning'),
(get_question_by_text('AI learning tools have you tried'), 'Socratic by Google', 'socratic', 3, 4, 'Homework help'),
(get_question_by_text('AI learning tools have you tried'), 'ChatGPT for explanations', 'chatgpt', 3, 5, 'Concept explanations'),
(get_question_by_text('AI learning tools have you tried'), 'Exam AI for test prep', 'exam', 3, 6, 'Practice tests'),
(get_question_by_text('AI learning tools have you tried'), 'None', 'none', 0, 7, 'No learning tools');

-- Question 27: Research tools
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI for research and finding academic sources'), 'No, I use traditional research methods', 'no', 0, 1, 'Traditional research', ARRAY['Perplexity', 'Consensus', 'Elicit']),
(get_question_by_text('AI for research and finding academic sources'), 'Yes, for quick fact-checking', 'fact_check', 6, 2, 'Quick lookups', ARRAY['Perplexity', 'ChatGPT']),
(get_question_by_text('AI for research and finding academic sources'), 'Yes, for literature reviews', 'literature', 10, 3, 'Academic search', ARRAY['Consensus', 'Elicit', 'Research Rabbit']),
(get_question_by_text('AI for research and finding academic sources'), 'Yes, as my primary research tool', 'primary', 12, 4, 'Main research method', ARRAY['Perplexity', 'Consensus', 'Elicit']);

-- Question 28: PDF analysis
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI to read and summarize PDFs'), 'No, I read documents manually', 'no', 0, 1, 'Manual reading', ARRAY['ChatPDF', 'Claude', 'Humata']),
(get_question_by_text('AI to read and summarize PDFs'), 'Yes, for quick summaries', 'summaries', 6, 2, 'Document summaries', ARRAY['ChatPDF', 'LightPDF']),
(get_question_by_text('AI to read and summarize PDFs'), 'Yes, for analysis and Q&A', 'analysis', 10, 3, 'Deep analysis', ARRAY['Claude', 'ChatPDF', 'Humata']),
(get_question_by_text('AI to read and summarize PDFs'), 'Yes, for comprehensive document workflows', 'workflow', 12, 4, 'Full integration', ARRAY['Claude', 'Humata', 'LightPDF AI']);

-- Question 29: Language learning
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI for language learning'), 'No, I don''t use AI for languages', 'no', 0, 1, 'Traditional methods', ARRAY['Duolingo', 'Speak', 'Elsa']),
(get_question_by_text('AI for language learning'), 'Yes, with language learning apps', 'apps', 6, 2, 'App-based learning', ARRAY['Duolingo Max', 'Speak']),
(get_question_by_text('AI for language learning'), 'Yes, for conversation practice', 'conversation', 8, 3, 'Speaking practice', ARRAY['Speak', 'ChatGPT', 'Elsa']),
(get_question_by_text('AI for language learning'), 'Yes, comprehensively for language mastery', 'comprehensive', 10, 4, 'Full immersion', ARRAY['Speak', 'Elsa', 'Duolingo Max']);

-- Question 30: Learning new skills
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description) VALUES
(get_question_by_text('AI to learn new professional skills'), 'Self-paced tutorials with AI guidance', 'tutorials', 3, 1, 'Guided learning'),
(get_question_by_text('AI to learn new professional skills'), 'Interactive practice with AI feedback', 'practice', 4, 2, 'Hands-on learning'),
(get_question_by_text('AI to learn new professional skills'), 'AI-powered course recommendations', 'recommendations', 3, 3, 'Learning paths'),
(get_question_by_text('AI to learn new professional skills'), 'Real-time Q&A while learning', 'qa', 3, 4, 'On-demand help'),
(get_question_by_text('AI to learn new professional skills'), 'Project-based learning with AI mentorship', 'mentorship', 4, 5, 'Guided projects'),
(get_question_by_text('AI to learn new professional skills'), 'None', 'none', 0, 6, 'No AI for skills');

-- Question 31: Practice questions
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI to generate practice questions'), 'No, I don''t use AI for practice', 'no', 0, 1, 'Traditional practice', ARRAY['Exam AI', 'Quizlet', 'ChatGPT']),
(get_question_by_text('AI to generate practice questions'), 'Yes, occasionally for test prep', 'occasional', 5, 2, 'Some practice', ARRAY['Quizlet AI', 'Exam AI']),
(get_question_by_text('AI to generate practice questions'), 'Yes, regularly for studying', 'regular', 8, 3, 'Regular practice', ARRAY['Exam AI', 'Quizlet AI']),
(get_question_by_text('AI to generate practice questions'), 'Yes, it''s my main study method', 'primary', 10, 4, 'Primary practice', ARRAY['Exam AI', 'Khan Academy AI']);

-- Question 32: AI tutoring
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description, tool_recommendations) VALUES
(get_question_by_text('AI tutoring or personalized learning'), 'No, I don''t use AI tutors', 'no', 0, 1, 'No AI tutoring', ARRAY['Khan Academy AI', 'Tutor AI']),
(get_question_by_text('AI tutoring or personalized learning'), 'Yes, for specific subjects', 'specific', 6, 2, 'Subject help', ARRAY['Socratic', 'Khan Academy AI']),
(get_question_by_text('AI tutoring or personalized learning'), 'Yes, regularly across multiple subjects', 'regular', 10, 3, 'Multi-subject', ARRAY['Khan Academy AI', 'Tutor AI']),
(get_question_by_text('AI tutoring or personalized learning'), 'Yes, as my primary learning method', 'primary', 12, 4, 'Main tutor', ARRAY['Khan Academy AI', 'Tutor AI']);

-- Question 33: Information verification
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index) VALUES
(get_question_by_text('verify information provided by AI tools'), 'Never - I trust AI outputs', 'never', 0, 1),
(get_question_by_text('verify information provided by AI tools'), 'Rarely - Only for important facts', 'rarely', 3, 2),
(get_question_by_text('verify information provided by AI tools'), 'Sometimes - For key information', 'sometimes', 7, 3),
(get_question_by_text('verify information provided by AI tools'), 'Often - For most information', 'often', 9, 4),
(get_question_by_text('verify information provided by AI tools'), 'Always - I verify everything', 'always', 10, 5);

-- Question 34: Knowledge gaps
INSERT INTO assessment_question_options (question_id, option_text, option_value, points, order_index, description) VALUES
(get_question_by_text('knowledge gaps do you fill using AI'), 'Quick facts and definitions', 'facts', 2, 1, 'Basic information'),
(get_question_by_text('knowledge gaps do you fill using AI'), 'Deep concept understanding', 'concepts', 3, 2, 'In-depth learning'),
(get_question_by_text('knowledge gaps do you fill using AI'), 'Step-by-step procedures', 'procedures', 2, 3, 'How-to guidance'),
(get_question_by_text('knowledge gaps do you fill using AI'), 'New skills and techniques', 'skills', 3, 4, 'Skill development'),
(get_question_by_text('knowledge gaps do you fill using AI'), 'Complex problem-solving', 'problems', 3, 5, 'Advanced thinking'),
(get_question_by_text('knowledge gaps do you fill using AI'), 'None', 'none', 0, 6, 'No AI learning');

-- Continue with Communication, Data & Analytics, Automation, Creative, and Development sections...