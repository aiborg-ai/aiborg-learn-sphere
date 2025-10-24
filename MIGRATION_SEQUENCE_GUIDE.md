# 📋 Assessment Tools Migration Sequence Guide

## ⚠️ Important: Run Migrations in This Exact Order!

You encountered an error because the sample question migrations require columns that don't exist
yet. Follow this guide to run migrations in the correct sequence.

---

## ✅ Correct Migration Sequence

### Already Completed ✅

1. ✅ **Main Assessment Tools Schema**
   - File: `20251023000000_assessment_tools_category.sql`
   - Creates: `assessment_tools`, `assessment_tool_attempts`, `assessment_question_pools` tables
   - Creates: Database functions for adaptive testing
   - Seeds: 3 assessment tools (AI-Readiness, AI-Awareness, AI-Fluency)

---

### Step 1: Add Adaptive Assessment Support

**Run this migration FIRST before sample questions:**

```sql
-- File: supabase/migrations/20251003000000_adaptive_assessment_engine.sql
```

**What it does:**

- Adds `irt_difficulty` column to `assessment_questions`
- Adds `difficulty_level` column to `assessment_questions`
- Adds adaptive tracking columns to `user_ai_assessments`
- Creates `assessment_answer_performance` table for IRT tracking

**How to run:**

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20251003000000_adaptive_assessment_engine.sql`
3. Paste and execute

---

### Step 2: Add Cognitive Level Column (FIX)

**Run this new fix migration:**

```sql
-- File: supabase/migrations/20251023005000_add_cognitive_level_column.sql
```

**What it does:**

- Adds `cognitive_level` column to `assessment_questions` (missing column)
- Adds `is_correct` column to `assessment_question_options` if missing
- Updates existing options to set `is_correct = true` where `points > 0`

**How to run:**

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20251023005000_add_cognitive_level_column.sql`
3. Paste and execute

---

### Step 3: Add AI-Awareness Sample Questions

**Now you can safely run the sample questions:**

```sql
-- File: supabase/migrations/20251023010000_sample_ai_awareness_questions.sql
```

**What it does:**

- Adds 20+ sample questions for AI-Awareness assessment
- Covers audiences: Young Learners (primary), Teenagers (secondary), Professionals
- Topics: AI Fundamentals, AI Applications, AI Ethics
- Difficulty levels: beginner, intermediate, applied

**How to run:**

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20251023010000_sample_ai_awareness_questions.sql`
3. Paste and execute

---

### Step 4: Add AI-Fluency Sample Questions

```sql
-- File: supabase/migrations/20251023020000_sample_ai_fluency_questions.sql
```

**What it does:**

- Adds 20+ sample questions for AI-Fluency assessment
- Covers audiences: Young Learners (primary), Teenagers (secondary), Professionals
- Topics: AI Tools & Frameworks, Prompt Engineering
- Difficulty levels: applied, advanced, expert

**How to run:**

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20251023020000_sample_ai_fluency_questions.sql`
3. Paste and execute

---

## 🎯 Quick Copy-Paste Migration Sequence

Run these in order in Supabase SQL Editor:

### Migration 1: Adaptive Assessment Engine

```bash
# Copy from: supabase/migrations/20251003000000_adaptive_assessment_engine.sql
```

### Migration 2: Add Cognitive Level Column (FIX)

```bash
# Copy from: supabase/migrations/20251023005000_add_cognitive_level_column.sql
```

### Migration 3: AI-Awareness Questions

```bash
# Copy from: supabase/migrations/20251023010000_sample_ai_awareness_questions.sql
```

### Migration 4: AI-Fluency Questions

```bash
# Copy from: supabase/migrations/20251023020000_sample_ai_fluency_questions.sql
```

---

## ✅ Verification After All Migrations

Run this in Supabase SQL Editor to verify everything:

```sql
-- 1. Check assessment_questions has all required columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'assessment_questions'
  AND column_name IN ('cognitive_level', 'difficulty_level', 'irt_difficulty')
ORDER BY column_name;

-- Expected result: 3 rows showing all three columns exist

-- 2. Count questions
SELECT COUNT(*) as total_questions
FROM assessment_questions
WHERE is_active = true;

-- Expected: 40+ questions after running both sample question migrations

-- 3. Count questions by audience
SELECT
  UNNEST(audience_filters) as audience,
  COUNT(*) as question_count
FROM assessment_questions
WHERE is_active = true
GROUP BY audience
ORDER BY audience;

-- Expected: primary (20+), secondary (20+), professional (20+)

-- 4. Count questions by category
SELECT
  ac.name as category_name,
  COUNT(aq.id) as question_count
FROM assessment_categories ac
LEFT JOIN assessment_questions aq ON ac.id = aq.category_id AND aq.is_active = true
GROUP BY ac.name
HAVING COUNT(aq.id) > 0
ORDER BY question_count DESC;

-- Expected: Multiple categories with questions
```

---

## 🔗 Step 5: Link Questions to Assessment Tools

After adding all questions, link them to the tools:

```sql
-- Link AI-Awareness questions to AI-Awareness tool
INSERT INTO assessment_question_pools (tool_id, question_id, is_active, weight)
SELECT
  (SELECT id FROM assessment_tools WHERE slug = 'ai-awareness'),
  id,
  true,
  1.0
FROM assessment_questions
WHERE is_active = true
  AND ('primary' = ANY(audience_filters) OR 'secondary' = ANY(audience_filters) OR 'professional' = ANY(audience_filters))
  AND category_id IN (
    SELECT id FROM assessment_categories
    WHERE name IN ('AI Fundamentals', 'AI Applications', 'AI Ethics')
  )
ON CONFLICT (tool_id, question_id) DO NOTHING;

-- Link AI-Fluency questions to AI-Fluency tool
INSERT INTO assessment_question_pools (tool_id, question_id, is_active, weight)
SELECT
  (SELECT id FROM assessment_tools WHERE slug = 'ai-fluency'),
  id,
  true,
  1.0
FROM assessment_questions
WHERE is_active = true
  AND ('primary' = ANY(audience_filters) OR 'secondary' = ANY(audience_filters) OR 'professional' = ANY(audience_filters))
  AND category_id IN (
    SELECT id FROM assessment_categories
    WHERE name IN ('AI Tools & Frameworks', 'Prompt Engineering')
  )
ON CONFLICT (tool_id, question_id) DO NOTHING;

-- Update question pool counts
UPDATE assessment_tools
SET total_questions_pool = (
  SELECT COUNT(*)
  FROM assessment_question_pools
  WHERE tool_id = assessment_tools.id AND is_active = true
)
WHERE slug IN ('ai-awareness', 'ai-fluency');

-- Verify linkage
SELECT
  t.name,
  t.slug,
  COUNT(aqp.id) as questions_in_pool
FROM assessment_tools t
LEFT JOIN assessment_question_pools aqp ON t.id = aqp.tool_id AND aqp.is_active = true
WHERE t.is_active = true
GROUP BY t.id, t.name, t.slug
ORDER BY t.display_order;

-- Expected: AI-Awareness (~20 questions), AI-Fluency (~20 questions)
```

---

## 🚀 Final Test

After completing all steps:

1. Visit **https://aiborg.ai**
2. Navigate to Assessments section
3. You should see:
   - ✅ AI-Readiness Assessment (for Business users)
   - ✅ AI-Awareness Assessment (with 20+ questions)
   - ✅ AI-Fluency Assessment (with 20+ questions)

4. Try taking the **AI-Awareness Assessment**:
   - Questions should appear one at a time
   - Difficulty should adapt based on your answers
   - You should be able to complete the assessment
   - Results should show score, category performance, and recommendations

---

## 🐛 Troubleshooting

### Error: "column cognitive_level does not exist"

**Solution**: You skipped Step 2. Run migration `20251023005000_add_cognitive_level_column.sql`

### Error: "column difficulty_level does not exist"

**Solution**: You skipped Step 1. Run migration `20251003000000_adaptive_assessment_engine.sql`

### Assessment has no questions

**Solution**: Run Step 5 to link questions to assessment tools

### "Failed to load assessment tools"

**Status**: ✅ Fixed (fallback queries implemented in code)

---

## 📝 Migration Files Summary

| Order | File                                               | Purpose                 | Status |
| ----- | -------------------------------------------------- | ----------------------- | ------ |
| ✅    | `20251023000000_assessment_tools_category.sql`     | Main schema & functions | DONE   |
| 1     | `20251003000000_adaptive_assessment_engine.sql`    | Add IRT columns         | TODO   |
| 2     | `20251023005000_add_cognitive_level_column.sql`    | Add missing column      | TODO   |
| 3     | `20251023010000_sample_ai_awareness_questions.sql` | Sample questions        | TODO   |
| 4     | `20251023020000_sample_ai_fluency_questions.sql`   | Sample questions        | TODO   |

---

## 🎉 Success Criteria

After completing all steps, you should have:

- ✅ 3 Assessment Tools in database
- ✅ 40+ Questions across different audiences
- ✅ Questions linked to tools via question pools
- ✅ Adaptive assessment engine working
- ✅ Users can take assessments and see results
- ✅ No errors when loading assessment tools page

---

**Need Help?**

Check the detailed setup guide: `ASSESSMENT_TOOLS_SETUP_GUIDE.md`
