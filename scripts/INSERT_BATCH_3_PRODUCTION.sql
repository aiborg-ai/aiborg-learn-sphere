-- SQL Script to insert Batch 3 blog posts directly into production Supabase
-- Run this in your Supabase SQL Editor

-- Temporarily disable RLS
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_media DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags DISABLE ROW LEVEL SECURITY;

-- Insert 5 new compelling blog posts for Batch 3
-- Using subqueries to get author and category IDs dynamically

INSERT INTO blog_posts (
  title,
  slug,
  excerpt,
  content,
  featured_image,
  author_id,
  category_id,
  status,
  published_at,
  reading_time,
  meta_title,
  meta_description,
  seo_keywords
)
SELECT
  'GPT-5 Is Coming: What OpenAI Isn''t Telling You',
  'gpt-5-coming-openai-secrets',
  'Leaked documents reveal GPT-5''s capabilities. The jump from GPT-4 to GPT-5 will be bigger than GPT-3 to GPT-4.',
  'The whispers from inside OpenAI are getting louder. GPT-5 isn''t just an incremental upgrade – it''s a paradigm shift that will make current AI look like a pocket calculator. Leaked documents, anonymous sources, and patent filings paint a picture of an AI so advanced, OpenAI is genuinely concerned about releasing it.',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&h=630',
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM blog_categories WHERE slug = 'technology' OR slug = 'ai-coding' LIMIT 1),
  'published',
  NOW(),
  13,
  'GPT-5 Release: Leaked Capabilities and Hidden Dangers',
  'Insider leaks reveal GPT-5''s terrifying capabilities. Why OpenAI is scared of their own creation.',
  'GPT-5, OpenAI, AGI, artificial general intelligence, AI safety'
WHERE NOT EXISTS (
  SELECT 1 FROM blog_posts WHERE slug = 'gpt-5-coming-openai-secrets'
);

INSERT INTO blog_posts (
  title,
  slug,
  excerpt,
  content,
  featured_image,
  author_id,
  category_id,
  status,
  published_at,
  reading_time,
  meta_title,
  meta_description,
  seo_keywords
)
SELECT
  'How AI Doctors Will Replace 40% of Healthcare Jobs',
  'ai-doctors-replace-healthcare-jobs',
  'IBM Watson diagnoses cancer better than oncologists. Google''s AI catches diseases doctors miss. The healthcare revolution is here.',
  'Your next doctor might not be human. AI is already diagnosing cancer more accurately than oncologists, predicting heart attacks 5 years early, and performing surgery with superhuman precision. By 2030, 40% of healthcare jobs will be automated or augmented by AI.',
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&h=630',
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM blog_categories WHERE slug = 'industry-insights' OR slug = 'professionals' LIMIT 1),
  'published',
  NOW(),
  14,
  'AI Doctors: 40% of Healthcare Jobs Will Disappear by 2030',
  'AI diagnoses cancer better than oncologists. Robots perform surgery. Which healthcare jobs survive?',
  'AI healthcare, AI doctors, medical AI, healthcare automation'
WHERE NOT EXISTS (
  SELECT 1 FROM blog_posts WHERE slug = 'ai-doctors-replace-healthcare-jobs'
);

INSERT INTO blog_posts (
  title,
  slug,
  excerpt,
  content,
  featured_image,
  author_id,
  category_id,
  status,
  published_at,
  reading_time,
  meta_title,
  meta_description,
  seo_keywords
)
SELECT
  'The $100K AI Side Hustle Nobody''s Talking About',
  '100k-ai-side-hustle-secret',
  'While everyone''s selling ChatGPT prompts for $5, smart entrepreneurs are building six-figure AI businesses. Here''s how.',
  'Everyone''s trying to make $50 selling ChatGPT prompts on Etsy. Meanwhile, smart entrepreneurs are quietly building $100K+ AI businesses with zero coding skills and minimal investment. These are real businesses solving real problems with AI.',
  'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=1200&h=630',
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM blog_categories WHERE slug = 'business-owners' OR slug = 'professionals' LIMIT 1),
  'published',
  NOW(),
  11,
  'The $100K AI Side Hustle: 5 Businesses Nobody''s Talking About',
  'Skip the $5 ChatGPT prompts. These AI businesses generate $100K+ with no coding required.',
  'AI side hustle, AI business, make money with AI, AI consulting'
WHERE NOT EXISTS (
  SELECT 1 FROM blog_posts WHERE slug = '100k-ai-side-hustle-secret'
);

INSERT INTO blog_posts (
  title,
  slug,
  excerpt,
  content,
  featured_image,
  author_id,
  category_id,
  status,
  published_at,
  reading_time,
  meta_title,
  meta_description,
  seo_keywords
)
SELECT
  'Why Schools Are Banning ChatGPT (And Why They''re Wrong)',
  'schools-banning-chatgpt-wrong',
  'Schools think they''re protecting education by banning AI. They''re actually guaranteeing their students will be unemployable.',
  'New York City schools banned ChatGPT. Los Angeles followed. Seattle, too. By 2024, over 50% of U.S. school districts had some form of AI restriction. They think they''re saving education from cheating. In reality, they''re preparing students for a world that no longer exists.',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&h=630',
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM blog_categories WHERE slug = 'young-learners' OR slug = 'teenagers' LIMIT 1),
  'published',
  NOW(),
  10,
  'ChatGPT School Bans: The Biggest Mistake in Education History',
  'Schools think banning AI protects education. They''re guaranteeing unemployable graduates.',
  'ChatGPT in schools, AI education, ChatGPT ban, AI literacy'
WHERE NOT EXISTS (
  SELECT 1 FROM blog_posts WHERE slug = 'schools-banning-chatgpt-wrong'
);

INSERT INTO blog_posts (
  title,
  slug,
  excerpt,
  content,
  featured_image,
  author_id,
  category_id,
  status,
  published_at,
  reading_time,
  meta_title,
  meta_description,
  seo_keywords
)
SELECT
  'DeepFakes 2025: You Can''t Trust Your Eyes Anymore',
  'deepfakes-2025-trust-crisis',
  'A CEO''s deepfake caused a $25M loss. Politicians'' fake videos swing elections. Your face might be in porn you never made.',
  'Last week, a Fortune 500 CEO appeared on a Zoom call and ordered a $25 million transfer. Except it wasn''t him – it was a deepfake. Yesterday, explicit videos of Taylor Swift flooded social media. She never made them. Welcome to 2025, where reality is negotiable.',
  'https://images.unsplash.com/photo-1617791160505-6f00504e3519?auto=format&fit=crop&w=1200&h=630',
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM blog_categories WHERE slug = 'technology' OR slug = 'ai-coding' LIMIT 1),
  'published',
  NOW(),
  12,
  'DeepFakes 2025: The End of Truth and Trust in Digital Media',
  'CEOs losing millions to deepfake calls. Elections swayed by fake videos. Reality is now optional.',
  'deepfakes, deepfake detection, AI video manipulation, synthetic media'
WHERE NOT EXISTS (
  SELECT 1 FROM blog_posts WHERE slug = 'deepfakes-2025-trust-crisis'
);

-- Create tags if they don't exist
INSERT INTO blog_tags (name, slug)
SELECT * FROM (VALUES
  ('GPT-5', 'gpt-5'),
  ('Healthcare', 'healthcare'),
  ('Business', 'business'),
  ('Education', 'education'),
  ('DeepFakes', 'deepfakes')
) AS t(name, slug)
WHERE NOT EXISTS (
  SELECT 1 FROM blog_tags WHERE slug = t.slug
);

-- Update counts
UPDATE blog_categories
SET post_count = (
  SELECT COUNT(*) FROM blog_posts
  WHERE category_id = blog_categories.id
  AND status = 'published'
);

UPDATE blog_tags
SET post_count = (
  SELECT COUNT(*) FROM blog_post_tags
  WHERE tag_id = blog_tags.id
);

-- Re-enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;

-- Show results
SELECT
  'Batch 3: Created ' || COUNT(*) || ' new blog posts' as result,
  STRING_AGG(title, ' | ') as posts
FROM blog_posts
WHERE slug IN (
  'gpt-5-coming-openai-secrets',
  'ai-doctors-replace-healthcare-jobs',
  '100k-ai-side-hustle-secret',
  'schools-banning-chatgpt-wrong',
  'deepfakes-2025-trust-crisis'
);