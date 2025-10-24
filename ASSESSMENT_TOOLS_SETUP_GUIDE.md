# Assessment Tools Setup Guide

## ✅ Migrations Applied

You've successfully run the main migration:

- ✅ `20251023000000_assessment_tools_category.sql` - Core schema, functions, and seed data

## 📋 Next Steps Checklist

### Step 1: Run Sample Questions Migrations (REQUIRED)

The assessment tools need questions to work. Run these two migrations:

```bash
# From Supabase Dashboard SQL Editor, run:
# 1. AI-Awareness Questions (20+ sample questions)
```

**File**: `supabase/migrations/20251023010000_sample_ai_awareness_questions.sql`

```bash
# 2. AI-Fluency Questions (20+ sample questions)
```

**File**: `supabase/migrations/20251023020000_sample_ai_fluency_questions.sql`

**How to run:**

1. Go to https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor**
4. Copy the contents of each file
5. Paste and execute them one by one

---

### Step 2: Link Questions to Assessment Tools

After adding questions, you need to link them to the assessment tools via the
`assessment_question_pools` table.

**Option A: Use the Admin Panel** (Recommended - UI-based)

1. Login as admin at https://aiborg.ai/auth
2. Go to Admin Panel
3. Navigate to "Assessment Tools Management"
4. For each tool (AI-Awareness, AI-Fluency):
   - Click "Manage Questions"
   - Select questions from the pool
   - Add them to the tool

**Option B: Run SQL Directly** (Quick setup)

```sql
-- Link AI-Awareness questions to AI-Awareness tool
INSERT INTO assessment_question_pools (tool_id, question_id, is_active, weight)
SELECT
  (SELECT id FROM assessment_tools WHERE slug = 'ai-awareness'),
  id,
  true,
  1.0
FROM assessment_questions
WHERE 'primary' = ANY(audience_filters) OR 'secondary' = ANY(audience_filters) OR 'professional' = ANY(audience_filters)
  AND category_id IN (SELECT id FROM assessment_categories WHERE name IN ('AI Fundamentals', 'AI Applications', 'AI Ethics'))
ON CONFLICT (tool_id, question_id) DO NOTHING;

-- Link AI-Fluency questions to AI-Fluency tool
INSERT INTO assessment_question_pools (tool_id, question_id, is_active, weight)
SELECT
  (SELECT id FROM assessment_tools WHERE slug = 'ai-fluency'),
  id,
  true,
  1.0
FROM assessment_questions
WHERE 'primary' = ANY(audience_filters) OR 'secondary' = ANY(audience_filters) OR 'professional' = ANY(audience_filters)
  AND category_id IN (SELECT id FROM assessment_categories WHERE name IN ('AI Tools & Frameworks', 'Prompt Engineering'))
ON CONFLICT (tool_id, question_id) DO NOTHING;

-- Update total_questions_pool count for each tool
UPDATE assessment_tools SET total_questions_pool = (
  SELECT COUNT(*) FROM assessment_question_pools
  WHERE tool_id = assessment_tools.id AND is_active = true
);
```

---

### Step 3: Verify Setup

**Check Database Tables:**

```sql
-- Verify 3 assessment tools were created
SELECT name, slug, category_type, total_questions_pool
FROM assessment_tools
WHERE is_active = true
ORDER BY display_order;

-- Expected results:
-- 1. AI-Readiness Assessment (ai-readiness) - readiness
-- 2. AI-Awareness Assessment (ai-awareness) - awareness
-- 3. AI-Fluency Assessment (ai-fluency) - fluency

-- Check questions were added
SELECT
  t.name as tool_name,
  COUNT(aqp.id) as question_count
FROM assessment_tools t
LEFT JOIN assessment_question_pools aqp ON t.id = aqp.tool_id
WHERE t.is_active = true
GROUP BY t.name
ORDER BY t.display_order;

-- Check database functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN (
  'get_assessment_tools_for_audience',
  'get_latest_attempt_for_tool',
  'get_attempt_history'
);
```

---

### Step 4: Test on Production

1. **Visit Production Site**: https://aiborg.ai
2. **Navigate to Assessments Section** (should be visible on homepage or navigation)
3. **Verify You See**:
   - ✅ AI-Readiness Assessment (Business audience)
   - ✅ AI-Awareness Assessment (Primary, Secondary, Professional audiences)
   - ✅ AI-Fluency Assessment (Primary, Secondary, Professional audiences)

4. **Try Taking an Assessment**:
   - Click on "AI-Awareness Assessment"
   - Start the assessment
   - Answer questions (should use adaptive algorithm)
   - Complete and see results

---

## 📊 What You Should Have Now

### Database Tables (Created ✅)

- ✅ `assessment_tools` - 3 tools seeded
- ✅ `assessment_tool_attempts` - Tracks user attempts
- ✅ `assessment_question_pools` - Links questions to tools

### Database Functions (Created ✅)

- ✅ `get_assessment_tools_for_audience(p_audience TEXT)` - Get tools filtered by audience
- ✅ `get_latest_attempt_for_tool(p_user_id UUID, p_tool_id UUID)` - Get user's latest attempt
- ✅ `get_attempt_history(p_user_id UUID, p_tool_id UUID)` - Get attempt trends

### Sample Data

- ✅ 3 Assessment Tools (AI-Readiness, AI-Awareness, AI-Fluency)
- ⏳ Sample Questions (pending - Step 1)
- ⏳ Question-Tool Linkage (pending - Step 2)

---

## 🎯 Assessment Tool Features

Once fully set up, users can:

1. **Take Assessments**:
   - Adaptive questioning (CAT algorithm)
   - Questions adjust based on performance
   - Multiple difficulty levels

2. **View Results**:
   - Overall score and percentage
   - Pass/Fail status
   - Performance by category
   - Percentile ranking
   - Personalized recommendations

3. **Track Progress**:
   - Unlimited retakes
   - Full attempt history
   - Score trends over time
   - Improvement tracking

4. **Audience Targeting**:
   - Content personalized for:
     - Young Learners (primary)
     - Teenagers (secondary)
     - Professionals
     - Business users

---

## 🚨 Troubleshooting

### "No questions available"

**Cause**: Questions haven't been added to the question pool **Fix**: Run Step 1 & Step 2 above

### "Assessment tools not loading"

**Cause**: Database functions missing (already fixed with fallback) **Status**: ✅ Fixed (fallback
queries implemented)

### "Can't start assessment"

**Cause**: No questions linked to the tool **Fix**: Run Step 2 (link questions to tools)

### "RLS Policy Error"

**Cause**: Missing RLS policies **Fix**: Already handled in migration (public read access enabled)

---

## 📝 Admin Features

As an admin, you can:

1. **Create New Assessment Tools**
   - Define tool name, slug, description
   - Set target audiences
   - Configure passing score
   - Set difficulty and duration

2. **Manage Question Pools**
   - Add/remove questions from tools
   - Adjust question weights
   - Enable/disable questions

3. **View Analytics**
   - User completion rates
   - Average scores by tool
   - Question difficulty analysis
   - Performance trends

---

## 🔄 AI-Readiness Assessment

**Note**: The AI-Readiness assessment is for **business users only** and may require additional
questions to be added. The existing questions from the `user_ai_assessments` table can be linked to
this tool.

To link existing AI-Readiness questions:

```sql
-- Link existing AI-Readiness questions to the new tool
INSERT INTO assessment_question_pools (tool_id, question_id, is_active, weight)
SELECT
  (SELECT id FROM assessment_tools WHERE slug = 'ai-readiness'),
  id,
  true,
  1.0
FROM assessment_questions
WHERE 'business' = ANY(audience_filters)
  AND category_id IN (
    SELECT id FROM assessment_categories
    WHERE name IN ('Strategic Alignment', 'Data Readiness', 'Infrastructure', 'Team Capabilities')
  )
ON CONFLICT (tool_id, question_id) DO NOTHING;
```

---

## 📚 Documentation References

- **Assessment Tools README**: `/ASSESSMENT_TOOLS_README.md`
- **Migration Files**: `/supabase/migrations/20251023*.sql`
- **Frontend Components**: `/src/components/assessment-tools/`
- **Hooks**: `/src/hooks/useAssessmentTools.ts`, `/src/hooks/useAssessmentAttempts.ts`
- **Services**: `/src/services/assessment-tools/AssessmentToolService.ts`

---

## ✅ Quick Verification Commands

Run these in Supabase SQL Editor to verify everything:

```sql
-- 1. Check tools
SELECT COUNT(*) as tool_count FROM assessment_tools WHERE is_active = true;
-- Expected: 3

-- 2. Check questions
SELECT COUNT(*) as question_count FROM assessment_questions WHERE is_active = true;
-- Expected: 40+ (after running sample question migrations)

-- 3. Check question pools
SELECT t.name, COUNT(aqp.id) as questions
FROM assessment_tools t
LEFT JOIN assessment_question_pools aqp ON t.id = aqp.tool_id
GROUP BY t.name;
-- Expected: Each tool should have 15-20+ questions

-- 4. Test database function
SELECT * FROM get_assessment_tools_for_audience('professional');
-- Expected: Returns AI-Awareness and AI-Fluency tools
```

---

## 🎉 What's Next?

Once you complete Steps 1-4:

1. **Users can start taking assessments** immediately
2. **Results will be tracked** in `assessment_tool_attempts`
3. **Adaptive algorithm** will adjust question difficulty
4. **Gamification** features will award badges and points
5. **Recommendations** will guide learning paths

Good luck! 🚀
