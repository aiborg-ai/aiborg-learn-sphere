# 🚀 Deployment Guide - AI-Borg Learning Platform

## Complete Migration Sequence

Run these migrations **in the exact order listed** in your Supabase Dashboard SQL Editor.

---

## ✅ Step-by-Step Migration Instructions

### **Step 1: Base Assessment Tables**
**File**: `supabase/migrations/20240101_create_ai_assessment_tables.sql`

**What it does**:
- Creates `assessment_categories` table
- Creates `assessment_questions` table
- Creates `assessment_question_options` table
- Creates user assessment tracking tables
- Sets up RLS policies

**Run this FIRST** - It creates the foundation for assessments.

---

### **Step 2: AI Study Assistant Tables**
**File**: `supabase/migrations/20251002010000_ai_study_assistant.sql`

**What it does**:
- Creates `ai_study_sessions` table
- Creates `ai_conversations` table
- Creates `ai_study_recommendations` table
- Creates `ai_learning_insights` table
- Adds AI profile columns to existing tables

**Run this SECOND** - Enables the AI Study Assistant feature.

---

### **Step 3: AI/ML Assessment Questions**
**File**: `supabase/migrations/20251002100000_ai_assessment_questions.sql`

**What it does**:
- Adds missing columns (difficulty_level, cognitive_level, irt_difficulty, is_correct)
- Inserts 8 assessment categories
- Inserts 40 questions with Bloom's Taxonomy
- Maps to IRT difficulty parameters

**Run this THIRD** - Populates the question bank.

---

### **Step 4: Assessment Answer Options**
**File**: `supabase/migrations/20251002100001_ai_assessment_options.sql`

**What it does**:
- Inserts ~200 answer options for questions
- Sets correct answers
- Adds descriptions and help text
- Creates performance indexes

**Run this FOURTH** - Completes the assessment system.

---

## 🎯 Quick Copy-Paste Sequence

### **In Supabase Dashboard → SQL Editor:**

**Migration 1:**
```sql
-- Copy entire contents of:
-- supabase/migrations/20240101_create_ai_assessment_tables.sql
-- Then click RUN
```

**Migration 2:**
```sql
-- Copy entire contents of:
-- supabase/migrations/20251002010000_ai_study_assistant.sql
-- Then click RUN
```

**Migration 3:**
```sql
-- Copy entire contents of:
-- supabase/migrations/20251002100000_ai_assessment_questions.sql
-- Then click RUN
```

**Migration 4:**
```sql
-- Copy entire contents of:
-- supabase/migrations/20251002100001_ai_assessment_options.sql
-- Then click RUN
```

---

## ✅ Verification Commands

After running all migrations, verify with:

```sql
-- Check categories (should return 8)
SELECT COUNT(*) as category_count FROM assessment_categories;

-- Check questions (should return 40+)
SELECT COUNT(*) as question_count FROM assessment_questions;

-- Check options (should return ~200)
SELECT COUNT(*) as option_count FROM assessment_question_options;

-- Check AI tables
SELECT COUNT(*) as ai_sessions FROM ai_study_sessions;
SELECT COUNT(*) as ai_conversations FROM ai_conversations;
SELECT COUNT(*) as ai_recommendations FROM ai_study_recommendations;

-- View sample questions
SELECT
  ac.name as category,
  aq.question_text,
  aq.difficulty_level,
  aq.cognitive_level,
  aq.points_value
FROM assessment_questions aq
JOIN assessment_categories ac ON ac.id = aq.category_id
ORDER BY ac.display_order, aq.order_index
LIMIT 10;
```

---

## 🎨 What Each Feature Does

### **AI Assessment System**
- **URL**: `/ai-assessment`
- **What works**: 40-question AI/ML knowledge assessment
- **Features**: Bloom's Taxonomy, IRT difficulty, adaptive ready
- **Results**: Detailed breakdown by category and cognitive level

### **AI Study Assistant**
- **URL**: Floating brain icon on `/dashboard`
- **What works**: ChatGPT-powered learning assistant
- **Features**: Context-aware, personalized recommendations
- **Data**: Session tracking, conversation history, insights

---

## 🔧 Troubleshooting

### **Error: "relation does not exist"**
**Solution**: Run migrations in correct order (1 → 2 → 3 → 4)

### **Error: "column does not exist"**
**Solution**: Check that base migration (Step 1) completed successfully

### **Error: "foreign key constraint"**
**Solution**: The migrations have been updated to handle missing tables

### **No questions in assessment**
**Solution**: Verify migrations 3 and 4 completed (check with verification commands above)

---

## 📊 Expected Results

### **After Migration 1:**
- ✅ 8 default assessment categories
- ✅ Empty questions table
- ✅ Empty options table
- ✅ RLS policies active

### **After Migration 2:**
- ✅ AI study tables created
- ✅ Profile columns added
- ✅ Function for study context created

### **After Migration 3:**
- ✅ 8 AI/ML categories inserted
- ✅ 40 questions inserted
- ✅ Difficulty levels assigned
- ✅ Bloom's taxonomy mapped

### **After Migration 4:**
- ✅ ~200 answer options inserted
- ✅ Correct answers marked
- ✅ Descriptions added
- ✅ Assessment ready to use

---

## 🎉 Testing the Features

### **Test AI Assessment:**
1. Navigate to: `http://localhost:8080/ai-assessment`
2. Click "Start Assessment"
3. Questions should load (40 total)
4. Answer questions
5. View results

### **Test AI Study Assistant:**
1. Navigate to: `http://localhost:8080/dashboard`
2. Click floating brain icon (bottom right)
3. Type a question about studying
4. AI should respond (requires OpenAI key in Edge Function)

### **Test All Features:**
- `/my-courses` - Course management
- `/achievements` - Badges system
- `/learning-paths` - Learning journeys
- `/analytics` - Progress charts
- `/gamification` - Levels & leaderboard

---

## 🔑 Environment Variables Needed

**For AI Study Assistant** (in Supabase Edge Functions):
```bash
OPENAI_API_KEY=sk-your-openai-key-here
```

Set this in:
**Supabase Dashboard** → **Edge Functions** → **Environment Variables**

---

## 📈 Database Statistics

After full deployment:

**Tables Created**: 20+
- Assessment system: 11 tables
- AI features: 6 tables
- LMS core: 10+ tables

**Data Inserted**:
- 8 AI/ML assessment categories
- 40 expert-crafted questions
- ~200 answer options with explanations
- Default categories and configurations

**Features Enabled**:
- ✅ AI Assessment System
- ✅ AI Study Assistant
- ✅ Analytics Dashboard
- ✅ Gamification Hub
- ✅ Learning Paths
- ✅ Achievements
- ✅ My Courses

---

## 📝 Migration Summary

| Order | File | Purpose | Tables Created | Rows Inserted |
|-------|------|---------|----------------|---------------|
| 1 | `20240101_create_ai_assessment_tables.sql` | Base assessment structure | 11 | ~8 |
| 2 | `20251002010000_ai_study_assistant.sql` | AI assistant features | 6 | 0 |
| 3 | `20251002100000_ai_assessment_questions.sql` | Question bank | 0 | 48 |
| 4 | `20251002100001_ai_assessment_options.sql` | Answer options | 0 | ~200 |

**Total**: 17 tables, ~250 rows

---

## ✨ Success Indicators

You'll know it worked when:

1. ✅ No errors in SQL Editor
2. ✅ `/ai-assessment` loads questions
3. ✅ AI Study Assistant opens on dashboard
4. ✅ All analytics charts display
5. ✅ Gamification levels work
6. ✅ Learning paths show

---

## 🆘 Support

**If you encounter issues:**

1. **Check migration order** - Must run 1 → 2 → 3 → 4
2. **Verify table existence** - Use verification commands above
3. **Check RLS policies** - Ensure you're authenticated
4. **Review error messages** - Note which table/column is missing
5. **Re-run failed migration** - Safe to run multiple times

---

**Created**: October 2, 2025
**Platform**: AI-Borg Learning Sphere
**Status**: Production Ready
**Version**: 2.0.0
