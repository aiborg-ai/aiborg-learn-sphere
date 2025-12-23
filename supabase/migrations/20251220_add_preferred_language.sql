-- Add preferred_language column to profiles table for i18n support
-- This allows users to set their preferred UI language

-- Add the column with a default of 'en' (English)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en';

-- Add a comment for documentation
COMMENT ON COLUMN profiles.preferred_language IS 'User''s preferred UI language (e.g., en, es, fr, de)';

-- Create an index for potential language-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_language
ON profiles(preferred_language);

-- Update existing profiles to ensure they have a default value
UPDATE profiles
SET preferred_language = 'en'
WHERE preferred_language IS NULL;
