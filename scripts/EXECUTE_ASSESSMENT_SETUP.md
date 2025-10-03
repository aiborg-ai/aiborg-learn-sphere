# Assessment Setup Execution Guide

## Status: Ready to Execute

✅ **Step 1 Complete**: Metadata migration has been run successfully

- Added: `difficulty_level`, `recommended_experience_level`, `tags`, `prerequisite_concepts`
- Created: `get_recommended_questions()` function
- Indexes created for fast filtering

## Next Steps

### Step 2: Insert Curated Questions (Execute in Order)

Run these SQL files in your Supabase SQL Editor:

#### Option A: Complete Setup (Recommended)

Use the comprehensive files with all questions and options:

1. **`ADD_PROMPT_ENGINEERING_QUESTIONS_FINAL.sql`** (25 questions + options)
   - Prompt Engineering category
   - All 25 questions with complete answer options
   - Includes answer key with correct answers marked

2. **`ADD_AI_AGENTS_LLM_QUESTIONS.sql`** (16 questions + options)
   - AI Agents: 5 questions
   - LLM Fundamentals: 6 questions
   - Development Platforms: 5 questions
   - All with complete answer options

**Total: 41 questions across 4 new categories**

#### Option B: Metadata-Enhanced Setup (Future)

If you want the enhanced metadata (difficulty, tags, etc.):

1. **`CURATED_ASSESSMENT_QUESTIONS_ALL.sql`** (41 questions with metadata)
   - All questions properly tagged
   - Difficulty levels assigned
   - Experience levels set
   - Tags for filtering

2. **Then manually add options** or run the existing option files

## Recommended Execution Order

```bash
# Already completed ✅
# psql ... -f supabase/migrations/20251002150000_add_question_metadata.sql

# Execute these in Supabase SQL Editor:
# 1. Prompt Engineering questions with options
```

**File:** `scripts/ADD_PROMPT_ENGINEERING_QUESTIONS_FINAL.sql`

```bash
# 2. AI Agents, LLM, and Development Platform questions with options
```

**File:** `scripts/ADD_AI_AGENTS_LLM_QUESTIONS.sql`

### Step 3: Update Metadata for Existing Questions (Optional)

After inserting questions, update their metadata for smart filtering:

```sql
-- Update Prompt Engineering questions with proper metadata
UPDATE assessment_questions
SET
  difficulty_level = CASE
    WHEN order_index BETWEEN 85 AND 89 THEN 'foundational'
    WHEN order_index BETWEEN 90 AND 94 THEN 'applied'
    WHEN order_index BETWEEN 95 AND 104 THEN 'advanced'
    ELSE 'applied'
  END,
  recommended_experience_level = CASE
    WHEN order_index IN (85, 86, 92, 94) THEN 'basic'
    WHEN order_index >= 98 THEN 'advanced'
    ELSE 'intermediate'
  END,
  tags = CASE
    WHEN order_index IN (85, 86) THEN ARRAY['basics', 'introduction', 'theory']
    WHEN order_index IN (88, 93) THEN ARRAY['techniques', 'chain-of-thought', 'reasoning']
    WHEN order_index = 92 THEN ARRAY['safety', 'limitations', 'awareness']
    WHEN order_index = 96 THEN ARRAY['security', 'vulnerabilities', 'safety']
    WHEN order_index >= 105 THEN ARRAY['technical', 'JSON', 'API']
    ELSE ARRAY['practical', 'techniques']
  END
WHERE category_id = (SELECT id FROM assessment_categories WHERE name = 'Prompt Engineering');

-- Update AI Agents questions
UPDATE assessment_questions
SET
  difficulty_level = CASE
    WHEN order_index = 110 THEN 'foundational'
    ELSE 'applied'
  END,
  recommended_experience_level = CASE
    WHEN order_index IN (110, 112) THEN 'basic'
    ELSE 'intermediate'
  END,
  tags = CASE
    WHEN order_index = 110 THEN ARRAY['basics', 'definition', 'theory']
    WHEN order_index = 113 THEN ARRAY['PEAS', 'frameworks', 'architecture']
    ELSE ARRAY['agent-types', 'practical', 'examples']
  END
WHERE category_id = (SELECT id FROM assessment_categories WHERE name = 'AI Agents');

-- Update LLM Fundamentals questions
UPDATE assessment_questions
SET
  difficulty_level = CASE
    WHEN order_index IN (115, 116) THEN 'foundational'
    WHEN order_index = 120 THEN 'strategic'
    ELSE 'applied'
  END,
  recommended_experience_level = CASE
    WHEN order_index IN (115, 116, 119, 120) THEN 'none'
    ELSE 'basic'
  END,
  tags = CASE
    WHEN order_index = 115 THEN ARRAY['problem-solving', 'programming', 'techniques']
    WHEN order_index = 116 THEN ARRAY['basics', 'LLM', 'introduction']
    WHEN order_index = 119 THEN ARRAY['hallucination', 'limitations', 'safety']
    WHEN order_index = 120 THEN ARRAY['ethics', 'education', 'responsibility']
    ELSE ARRAY['architecture', 'technical', 'processing']
  END
WHERE category_id = (SELECT id FROM assessment_categories WHERE name = 'LLM Fundamentals');

-- Update Development Platforms questions
UPDATE assessment_questions
SET
  difficulty_level = CASE
    WHEN order_index IN (122, 123) THEN 'strategic'
    ELSE 'applied'
  END,
  recommended_experience_level = CASE
    WHEN order_index IN (123, 125) THEN 'basic'
    ELSE 'intermediate'
  END,
  tags = ARRAY['lovable', 'platforms', 'development']
WHERE category_id = (SELECT id FROM assessment_categories WHERE name = 'Development Platforms');
```

### Step 4: Test the Recommendation Function

Verify the recommendation system works:

```sql
-- Test for a professional with intermediate experience interested in automation
SELECT
  question_text,
  category_name,
  difficulty_level,
  recommended_experience_level,
  relevance_score
FROM get_recommended_questions(
  p_audience_type := 'professional',
  p_experience_level := 'intermediate',
  p_goals := ARRAY['automation', 'productivity'],
  p_limit := 10
);

-- Test for a secondary student with basic experience
SELECT
  question_text,
  category_name,
  difficulty_level,
  recommended_experience_level,
  relevance_score
FROM get_recommended_questions(
  p_audience_type := 'secondary',
  p_experience_level := 'basic',
  p_goals := ARRAY['learning', 'college-prep'],
  p_limit := 15
);

-- Test for a business owner with no experience
SELECT
  question_text,
  category_name,
  difficulty_level,
  recommended_experience_level,
  relevance_score
FROM get_recommended_questions(
  p_audience_type := 'business',
  p_experience_level := 'none',
  p_goals := ARRAY['efficiency', 'cost-reduction'],
  p_limit := 20
);
```

### Step 5: Verify Data

Check that everything was inserted correctly:

```sql
-- Count questions by category
SELECT
  c.name AS category,
  COUNT(DISTINCT q.id) AS question_count,
  COUNT(o.id) AS option_count
FROM assessment_categories c
LEFT JOIN assessment_questions q ON q.category_id = c.id
LEFT JOIN assessment_question_options o ON o.question_id = q.id
WHERE c.name IN ('Prompt Engineering', 'AI Agents', 'LLM Fundamentals', 'Development Platforms')
GROUP BY c.name
ORDER BY c.name;

-- Expected results:
-- Prompt Engineering: 25 questions, ~96 options
-- AI Agents: 5 questions, ~19 options
-- LLM Fundamentals: 6 questions, ~23 options
-- Development Platforms: 5 questions, ~15 options

-- View sample questions with metadata
SELECT
  q.order_index,
  LEFT(q.question_text, 60) || '...' AS question,
  q.difficulty_level,
  q.recommended_experience_level,
  q.audience_filters,
  q.tags
FROM assessment_questions q
WHERE q.category_id IN (
  SELECT id FROM assessment_categories
  WHERE name IN ('Prompt Engineering', 'AI Agents', 'LLM Fundamentals', 'Development Platforms')
)
ORDER BY q.order_index
LIMIT 20;
```

## Success Criteria

After completion, you should have:

- ✅ 41 new assessment questions
- ✅ ~153 answer options with correct answers marked
- ✅ 4 new categories (Prompt Engineering, AI Agents, LLM Fundamentals, Development Platforms)
- ✅ All questions tagged with difficulty, experience level, and tags
- ✅ Working recommendation function for adaptive assessment

## Next Steps After Setup

1. **Frontend Updates**:
   - Update `AIAssessmentWizard.tsx` to use `get_recommended_questions()`
   - Implement adaptive difficulty based on performance
   - Add category selection for deep dives

2. **Testing**:
   - Test each audience type (primary, secondary, professional, business)
   - Test different experience levels (none, basic, intermediate, advanced)
   - Verify question relevance scores

3. **Documentation**:
   - Review `docs/ASSESSMENT_CURATION_STRATEGY.md` for implementation details
   - Share strategy with team

## Troubleshooting

**If questions already exist:**

```sql
-- Delete existing questions to re-insert
DELETE FROM assessment_questions
WHERE category_id IN (
  SELECT id FROM assessment_categories
  WHERE name IN ('Prompt Engineering', 'AI Agents', 'LLM Fundamentals', 'Development Platforms')
);
```

**If categories already exist:** The SQL uses `IF NOT EXISTS` checks, so it's safe to re-run.

**If you need to update metadata only:** Just run Step 3 (the UPDATE queries) without re-inserting
questions.
