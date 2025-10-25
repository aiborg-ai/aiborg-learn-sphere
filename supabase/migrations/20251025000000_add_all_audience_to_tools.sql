-- =====================================================
-- Add 'All' to target_audiences for all assessment tools
-- This ensures tools are visible when no specific audience is selected
-- =====================================================

-- Update AI-Readiness Assessment
UPDATE assessment_tools
SET target_audiences = ARRAY['All', 'business']
WHERE slug = 'ai-readiness';

-- Update AI-Awareness Assessment
UPDATE assessment_tools
SET target_audiences = ARRAY['All', 'primary', 'secondary', 'professional']
WHERE slug = 'ai-awareness';

-- Update AI-Fluency Assessment
UPDATE assessment_tools
SET target_audiences = ARRAY['All', 'primary', 'secondary', 'professional']
WHERE slug = 'ai-fluency';

-- Verify updates
SELECT slug, name, target_audiences
FROM assessment_tools
ORDER BY display_order;
