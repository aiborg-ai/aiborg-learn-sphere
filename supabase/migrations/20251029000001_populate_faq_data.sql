-- Populate FAQ Table with Initial Content
-- Created: 2025-10-29
-- Purpose: Add 30 common questions across all categories and audiences

INSERT INTO public.faqs (question, answer, category, tags, difficulty_level, audience, is_published) VALUES

-- ENROLLMENT QUESTIONS (5)
(
  'How do I enroll in a course?',
  'You can enroll in a course by clicking the "Enroll Now" button on any course page. For free courses, you''ll get instant access. For paid courses, you''ll be directed to a secure payment page. After payment, you''ll immediately receive access to all course materials.',
  'enrollment',
  ARRAY['enrollment', 'getting-started', 'access'],
  'beginner',
  'all',
  TRUE
),
(
  'Can I enroll in multiple courses at once?',
  'Yes! You can enroll in as many courses as you like. We recommend starting with 1-2 courses if you''re new to AI, so you can focus and complete them. Our AI Study Assistant can help you plan your learning path across multiple courses.',
  'enrollment',
  ARRAY['enrollment', 'multiple-courses', 'planning'],
  'beginner',
  'all',
  TRUE
),
(
  'What happens after I enroll in a course?',
  'After enrollment, you''ll get immediate access to all course materials, including videos, exercises, quizzes, and workshops. You''ll also receive a welcome email with next steps. Your progress is automatically tracked, and you can access the course from your student dashboard.',
  'enrollment',
  ARRAY['enrollment', 'access', 'getting-started'],
  'beginner',
  'all',
  TRUE
),
(
  'Is there a family plan available?',
  'Yes! We offer a Family Pass subscription (£20/month) that gives access to all courses for up to 5 family members. This is perfect for families learning AI together. Visit our Family Membership page to learn more.',
  'enrollment',
  ARRAY['family', 'subscription', 'pricing'],
  'beginner',
  'all',
  TRUE
),
(
  'Do I get a certificate after completing a course?',
  'Yes! Upon successfully completing a course (passing all quizzes and exercises with 70%+ score), you''ll receive a digital certificate of completion that you can share on LinkedIn or add to your resume.',
  'enrollment',
  ARRAY['certificate', 'completion', 'credentials'],
  'beginner',
  'all',
  TRUE
),

-- PRICING QUESTIONS (6)
(
  'How much do courses cost?',
  'Course prices vary by audience: Primary (ages 6-12): £25 for 4-week courses, Secondary (ages 13-18): £39 for 6-week courses, Professional: £89-£199 for 6-10 week courses, Business/Executive: £199-£499 for 8-16 week courses. We also offer a Family Pass at £20/month for unlimited access to all courses.',
  'pricing',
  ARRAY['pricing', 'cost', 'payment'],
  'beginner',
  'all',
  TRUE
),
(
  'Are there any free courses?',
  'While most of our courses are paid to ensure high-quality content and support, we occasionally offer free introductory workshops and webinars. Sign up for our newsletter to be notified about free learning opportunities.',
  'pricing',
  ARRAY['free', 'pricing', 'trial'],
  'beginner',
  'all',
  TRUE
),
(
  'What payment methods do you accept?',
  'We accept all major credit and debit cards (Visa, Mastercard, American Express) through our secure Stripe payment gateway. For the Family Pass subscription, payments are processed monthly automatically.',
  'pricing',
  ARRAY['payment', 'stripe', 'methods'],
  'beginner',
  'all',
  TRUE
),
(
  'Can I get a refund?',
  'Yes, we offer a 14-day money-back guarantee. If you''re not satisfied with a course within the first 14 days of enrollment, contact us at support@aiborg.ai for a full refund. This does not apply to the Family Pass subscription after the first month.',
  'pricing',
  ARRAY['refund', 'guarantee', 'money-back'],
  'beginner',
  'all',
  TRUE
),
(
  'Do you offer discounts for groups or organizations?',
  'Yes! For businesses and organizations enrolling 10+ employees, we offer custom group pricing and enterprise plans. Contact us at +44 7404568207 or email business@aiborg.ai for a quote.',
  'pricing',
  ARRAY['discount', 'enterprise', 'group'],
  'intermediate',
  'business',
  TRUE
),
(
  'What is included in the course price?',
  'Your course enrollment includes: lifetime access to all course materials, video lessons, hands-on exercises and projects, quizzes and assessments, certificate of completion, AI Study Assistant support, community access, and instructor support.',
  'pricing',
  ARRAY['value', 'included', 'features'],
  'beginner',
  'all',
  TRUE
),

-- COURSES QUESTIONS (5)
(
  'What courses do you offer for beginners?',
  'For young learners (6-12): Kickstarter AI Adventures, Creative Robots Coding Jam, AI Storytellers'' Studio. For teens (13-18): Ultimate Academic Advantage by AI, Teen Machine Learning Bootcamp. For adults: AI Fundamentals for Professionals is our most popular beginner course.',
  'courses',
  ARRAY['beginner', 'courses', 'recommendations'],
  'beginner',
  'all',
  TRUE
),
(
  'How long does it take to complete a course?',
  'Course durations vary: Primary courses: 4 weeks, Secondary courses: 6 weeks, Professional courses: 6-10 weeks, Executive courses: 8-16 weeks. However, all courses offer lifetime access, so you can learn at your own pace.',
  'courses',
  ARRAY['duration', 'timeline', 'schedule'],
  'beginner',
  'all',
  TRUE
),
(
  'Can I access courses on mobile devices?',
  'Yes! Our platform is fully responsive and works on desktops, laptops, tablets, and smartphones. You can learn anywhere, anytime. We recommend using a laptop or desktop for coding exercises for the best experience.',
  'courses',
  ARRAY['mobile', 'access', 'devices'],
  'beginner',
  'all',
  TRUE
),
(
  'What programming languages do I need to know?',
  'Most of our courses require no prior programming experience! We teach everything from scratch. For advanced courses like "Code Your Own ChatGPT", basic Python knowledge is helpful but not required - we provide refresher materials.',
  'courses',
  ARRAY['prerequisites', 'programming', 'skills'],
  'beginner',
  'all',
  TRUE
),
(
  'Do courses have deadlines or can I learn at my own pace?',
  'You can learn at your own pace! While courses have a suggested timeline, all content is available immediately upon enrollment with lifetime access. Some workshops have scheduled live sessions, but recordings are provided if you can''t attend.',
  'courses',
  ARRAY['flexibility', 'self-paced', 'deadlines'],
  'beginner',
  'all',
  TRUE
),

-- AI CONCEPTS QUESTIONS (5)
(
  'What is AI and why should I learn it?',
  'AI (Artificial Intelligence) is technology that enables computers to learn, reason, and make decisions like humans. Learning AI is crucial because it''s transforming every industry - from healthcare to entertainment. AI skills are among the most in-demand in the job market, with salaries averaging 30% higher than non-AI roles.',
  'ai_concepts',
  ARRAY['basics', 'definition', 'career'],
  'beginner',
  'all',
  TRUE
),
(
  'What''s the difference between AI, Machine Learning, and Deep Learning?',
  'AI is the broadest concept - any technique that enables computers to mimic human intelligence. Machine Learning is a subset of AI where computers learn from data without explicit programming. Deep Learning is a subset of ML using neural networks with multiple layers. Think of it as: AI > Machine Learning > Deep Learning.',
  'ai_concepts',
  ARRAY['ml', 'deep-learning', 'definitions'],
  'intermediate',
  'all',
  TRUE
),
(
  'What is ChatGPT and how does it work?',
  'ChatGPT is an AI chatbot developed by OpenAI that uses Large Language Models (LLMs) to understand and generate human-like text. It was trained on vast amounts of text data and uses deep learning to predict the most likely next words in a conversation. Our courses teach you how these systems work and how to use them effectively.',
  'ai_concepts',
  ARRAY['chatgpt', 'llm', 'nlp'],
  'beginner',
  'all',
  TRUE
),
(
  'What is prompt engineering?',
  'Prompt engineering is the skill of crafting effective instructions (prompts) to get the best results from AI tools like ChatGPT. It''s one of the most practical AI skills you can learn - our "Advanced Prompt Engineering" course teaches you proven techniques to 10x your productivity with AI.',
  'ai_concepts',
  ARRAY['prompts', 'chatgpt', 'productivity'],
  'intermediate',
  'professional',
  TRUE
),
(
  'Is AI going to replace my job?',
  'AI won''t replace you, but someone using AI might! Rather than replacing jobs, AI is augmenting roles and creating new opportunities. The key is to learn how to use AI tools to enhance your work. Our courses help you become "AI-fluent" so you can leverage these tools in your career.',
  'ai_concepts',
  ARRAY['career', 'future', 'jobs'],
  'beginner',
  'all',
  TRUE
),

-- LEARNING PATHS QUESTIONS (4)
(
  'What learning path should I follow as a complete beginner?',
  'Start with AI Fundamentals to understand core concepts. Then choose based on your goals: For developers → Machine Learning for Business → Advanced Prompt Engineering. For business leaders → AI Strategy & Implementation → Enterprise AI Implementation. Our AI Study Assistant can create a personalized learning path based on your goals.',
  'learning_paths',
  ARRAY['beginner', 'path', 'recommendations'],
  'beginner',
  'all',
  TRUE
),
(
  'Can children really learn AI?',
  'Absolutely! Our Primary courses (ages 6-12) use gamification, storytelling, and hands-on projects to teach AI concepts in age-appropriate ways. Kids build AI-powered games, create art with AI, and learn computational thinking - skills that will benefit them throughout their education and careers.',
  'learning_paths',
  ARRAY['kids', 'primary', 'children'],
  'beginner',
  'primary',
  TRUE
),
(
  'How do I prepare for AI career opportunities?',
  'Follow our Professional learning path: 1) AI Fundamentals for Professionals (foundational concepts), 2) Advanced Prompt Engineering (practical skills), 3) Machine Learning for Business (technical depth), 4) Build a portfolio with real projects. Our career-focused courses include portfolio projects recognized by employers.',
  'learning_paths',
  ARRAY['career', 'jobs', 'professional'],
  'intermediate',
  'professional',
  TRUE
),
(
  'What''s the best path for executives and business leaders?',
  'For executives, start with AI Leadership & Strategy to understand business applications, then Enterprise AI Implementation for execution strategies, and AI ROI & Analytics to measure success. These courses focus on decision-making, team leadership, and organizational transformation rather than coding.',
  'learning_paths',
  ARRAY['executive', 'leadership', 'business'],
  'intermediate',
  'business',
  TRUE
),

-- TECHNICAL QUESTIONS (3)
(
  'Do I need a powerful computer for AI courses?',
  'No! Our courses are designed to work on any modern computer (Windows, Mac, or Linux) from the last 5 years. For coding exercises, we use cloud-based platforms that run in your browser, so you don''t need expensive hardware or GPU power.',
  'technical',
  ARRAY['requirements', 'computer', 'hardware'],
  'beginner',
  'all',
  TRUE
),
(
  'What software or tools will I need?',
  'Most courses require only a web browser and internet connection. For coding courses, we''ll guide you through installing free tools like Python, VS Code, or Google Colab. All necessary software is free and works on Windows, Mac, and Linux.',
  'technical',
  ARRAY['software', 'tools', 'setup'],
  'beginner',
  'all',
  TRUE
),
(
  'Is internet required for courses?',
  'Yes, an internet connection is required to access course videos and materials. However, some resources (like PDFs and exercises) can be downloaded for offline study. We recommend a stable connection of at least 5 Mbps for smooth video streaming.',
  'technical',
  ARRAY['internet', 'connectivity', 'requirements'],
  'beginner',
  'all',
  TRUE
),

-- SUPPORT QUESTIONS (2)
(
  'How do I get help if I''m stuck?',
  'We offer multiple support channels: 1) AI Study Assistant (24/7 instant help), 2) Course discussion forums, 3) WhatsApp support (+44 7404568207) during business hours (9 AM - 6 PM GMT), 4) Email support (support@aiborg.ai) with 24-hour response time, 5) Instructor office hours for advanced courses.',
  'support',
  ARRAY['help', 'support', 'assistance'],
  'beginner',
  'all',
  TRUE
),
(
  'What are your business hours for support?',
  'Our AI Study Assistant is available 24/7 for instant help. Human support via WhatsApp and email is available Monday-Saturday, 9 AM - 6 PM GMT. We typically respond to emails within 24 hours on business days.',
  'support',
  ARRAY['hours', 'availability', 'contact'],
  'beginner',
  'all',
  TRUE
);

-- Update helpful counts to simulate popular FAQs
UPDATE public.faqs SET helpful_count = 50 WHERE question LIKE '%How do I enroll%';
UPDATE public.faqs SET helpful_count = 45 WHERE question LIKE '%How much do courses cost%';
UPDATE public.faqs SET helpful_count = 40 WHERE question LIKE '%What is AI%';
UPDATE public.faqs SET helpful_count = 35 WHERE question LIKE '%certificate%';
UPDATE public.faqs SET helpful_count = 30 WHERE question LIKE '%refund%';
UPDATE public.faqs SET helpful_count = 28 WHERE question LIKE '%family plan%';
UPDATE public.faqs SET helpful_count = 25 WHERE question LIKE '%beginner%';
UPDATE public.faqs SET helpful_count = 22 WHERE question LIKE '%ChatGPT%';
UPDATE public.faqs SET helpful_count = 20 WHERE question LIKE '%mobile%';
UPDATE public.faqs SET helpful_count = 18 WHERE question LIKE '%get help%';
