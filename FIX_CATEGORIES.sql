-- ========================================
-- FIX: Add missing display_order column and insert data
-- ========================================

-- Step 1: Add the display_order column if it doesn't exist
ALTER TABLE assessment_categories
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Step 2: Now insert the categories (this should work now)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM assessment_categories WHERE name = 'AI Fundamentals') THEN
    INSERT INTO assessment_categories (name, description, icon, display_order)
    VALUES ('AI Fundamentals', 'Core AI concepts', 'brain', 1);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM assessment_categories WHERE name = 'Machine Learning') THEN
    INSERT INTO assessment_categories (name, description, icon, display_order)
    VALUES ('Machine Learning', 'ML algorithms', 'trending-up', 2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM assessment_categories WHERE name = 'Deep Learning') THEN
    INSERT INTO assessment_categories (name, description, icon, display_order)
    VALUES ('Deep Learning', 'Neural networks', 'layers', 3);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM assessment_categories WHERE name = 'NLP') THEN
    INSERT INTO assessment_categories (name, description, icon, display_order)
    VALUES ('NLP', 'Text processing', 'message-square', 4);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM assessment_categories WHERE name = 'Computer Vision') THEN
    INSERT INTO assessment_categories (name, description, icon, display_order)
    VALUES ('Computer Vision', 'Image AI', 'eye', 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM assessment_categories WHERE name = 'AI Ethics') THEN
    INSERT INTO assessment_categories (name, description, icon, display_order)
    VALUES ('AI Ethics', 'Responsible AI', 'shield', 6);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM assessment_categories WHERE name = 'AI Tools') THEN
    INSERT INTO assessment_categories (name, description, icon, display_order)
    VALUES ('AI Tools', 'Frameworks', 'wrench', 7);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM assessment_categories WHERE name = 'Applications') THEN
    INSERT INTO assessment_categories (name, description, icon, display_order)
    VALUES ('Applications', 'Real-world use', 'briefcase', 8);
  END IF;
END $$;

-- Step 3: Verify
SELECT
  name,
  description,
  icon,
  display_order,
  created_at
FROM assessment_categories
ORDER BY display_order;
