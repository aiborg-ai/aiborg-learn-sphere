-- ========================================
-- STEP 1B - FIXED VERSION
-- This version handles existing data better
-- ========================================

-- First, check if categories already exist
DO $$
BEGIN
  -- Insert only if not exists
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

-- Verify the insert
SELECT * FROM assessment_categories ORDER BY display_order;
