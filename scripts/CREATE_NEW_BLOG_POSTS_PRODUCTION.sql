-- SQL Script to CREATE NEW blog posts in production
-- Run this in your Supabase SQL Editor

-- Temporarily disable RLS
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_media DISABLE ROW LEVEL SECURITY;

-- Get a category ID (we'll use the first available category)
WITH first_category AS (
  SELECT id FROM blog_categories LIMIT 1
)

-- Insert 5 NEW blog posts
INSERT INTO blog_posts (
  title,
  slug,
  excerpt,
  content,
  featured_image,
  category_id,
  status,
  published_at,
  reading_time,
  meta_title,
  meta_description,
  seo_keywords
)
SELECT
  'AI Voice Cloning: The Good, Bad, and Scary',
  'ai-voice-cloning-ethics',
  'Voice cloning technology can recreate anyone''s voice with just minutes of audio. Here''s what you need to know.',
  'Voice cloning has arrived, and it''s both amazing and terrifying. With just 3 minutes of audio, AI can now create a perfect digital clone of anyone''s voice...',
  'https://images.unsplash.com/photo-1589903308904-1010c2294adc?auto=format&fit=crop&w=1200&h=630',
  (SELECT id FROM first_category),
  'published',
  NOW(),
  12,
  'AI Voice Cloning: The Good, Bad, and Scary',
  'Voice cloning can recreate anyone''s voice with just 3 minutes of audio.',
  'voice cloning, AI voice, deepfake audio'
WHERE NOT EXISTS (
  SELECT 1 FROM blog_posts WHERE slug = 'ai-voice-cloning-ethics'
);

INSERT INTO blog_posts (
  title,
  slug,
  excerpt,
  content,
  featured_image,
  category_id,
  status,
  published_at,
  reading_time,
  meta_title,
  meta_description,
  seo_keywords
)
SELECT
  'Quantum Computing Breaks Encryption: What Now?',
  'quantum-computing-encryption-threat',
  'Quantum computers will crack current encryption in 5-10 years. Here''s how the world is preparing for Q-Day.',
  'The clock is ticking. In 5-10 years, quantum computers will break the encryption protecting your bank account, medical records, and private messages...',
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&h=630',
  (SELECT id FROM blog_categories LIMIT 1),
  'published',
  NOW(),
  14,
  'Quantum Computing Will Break Encryption',
  'Quantum computers will crack current encryption in 5-10 years.',
  'quantum computing, encryption, cybersecurity'
WHERE NOT EXISTS (
  SELECT 1 FROM blog_posts WHERE slug = 'quantum-computing-encryption-threat'
);

INSERT INTO blog_posts (
  title,
  slug,
  excerpt,
  content,
  featured_image,
  category_id,
  status,
  published_at,
  reading_time,
  meta_title,
  meta_description,
  seo_keywords
)
SELECT
  'Neuralink and Brain Chips: Your Thoughts Are No Longer Private',
  'neuralink-brain-privacy',
  'Brain-computer interfaces are here. But who owns your thoughts when they''re digital data?',
  'Elon Musk''s Neuralink has successfully implanted brain chips in humans. Patients are controlling computers with thoughts...',
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&h=630',
  (SELECT id FROM blog_categories LIMIT 1),
  'published',
  NOW(),
  15,
  'Neuralink: The End of Mental Privacy',
  'Brain chips can read thoughts, but who owns your neural data?',
  'Neuralink, brain chips, BCI, neural privacy'
WHERE NOT EXISTS (
  SELECT 1 FROM blog_posts WHERE slug = 'neuralink-brain-privacy'
);

INSERT INTO blog_posts (
  title,
  slug,
  excerpt,
  content,
  featured_image,
  category_id,
  status,
  published_at,
  reading_time,
  meta_title,
  meta_description,
  seo_keywords
)
SELECT
  'AI Girlfriends: The Loneliness Economy Worth Billions',
  'ai-girlfriends-loneliness-economy',
  'Millions are falling in love with AI. The psychology, the profits, and why it matters.',
  'Last year, 20 million people paid for AI companionship. By 2025, the AI relationship industry will be worth $2 billion...',
  'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&h=630',
  (SELECT id FROM blog_categories LIMIT 1),
  'published',
  NOW(),
  16,
  'AI Girlfriends: The Billion-Dollar Loneliness Economy',
  '20 million people pay for AI companionship.',
  'AI girlfriends, AI companions, digital relationships'
WHERE NOT EXISTS (
  SELECT 1 FROM blog_posts WHERE slug = 'ai-girlfriends-loneliness-economy'
);

INSERT INTO blog_posts (
  title,
  slug,
  excerpt,
  content,
  featured_image,
  category_id,
  status,
  published_at,
  reading_time,
  meta_title,
  meta_description,
  seo_keywords
)
SELECT
  'China''s AI Surveillance State: Coming to Your Country',
  'china-ai-surveillance-global',
  'China''s AI surveillance system monitors 1.4 billion people. Now they''re exporting it worldwide.',
  'China watches 1.4 billion people through 600 million cameras powered by AI. Every face recognized. Every movement tracked...',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&h=630',
  (SELECT id FROM blog_categories LIMIT 1),
  'published',
  NOW(),
  17,
  'China''s AI Surveillance State',
  'China monitors 1.4 billion people with AI surveillance.',
  'China surveillance, AI surveillance, facial recognition'
WHERE NOT EXISTS (
  SELECT 1 FROM blog_posts WHERE slug = 'china-ai-surveillance-global'
);

-- Re-enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_media ENABLE ROW LEVEL SECURITY;

-- Show what was created
SELECT
  title,
  slug,
  status,
  LENGTH(content) as content_length,
  reading_time
FROM blog_posts
WHERE slug IN (
  'ai-voice-cloning-ethics',
  'quantum-computing-encryption-threat',
  'neuralink-brain-privacy',
  'ai-girlfriends-loneliness-economy',
  'china-ai-surveillance-global'
)
ORDER BY created_at DESC;