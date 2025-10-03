# Adaptive AIBORG Assessment - Implementation Guide

## Overview

The Adaptive AIBORG Assessment is an intelligent testing system that adjusts question difficulty in real-time based on user performance. It uses **Item Response Theory (IRT)** to estimate user ability and select optimal questions that maximize information gain.

## Key Features

✅ **Real-time Difficulty Adaptation** - Questions get harder/easier based on correctness
✅ **Intelligent Question Selection** - IRT-based algorithm chooses optimal difficulty
✅ **Shorter Assessments** - 8-15 questions vs. fixed 20+ questions
✅ **More Accurate Scoring** - Confidence-based ability estimation
✅ **Better User Experience** - No wasted time on too-easy or too-hard questions
✅ **Performance Tracking** - Visual feedback on progress and ability trends

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface                            │
│             (AIAssessmentWizardAdaptive.tsx)                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                Adaptive Assessment Engine                    │
│            (AdaptiveAssessmentEngine.ts)                    │
│                                                              │
│  • Initialize State                                          │
│  • Get Next Question (IRT-based selection)                  │
│  • Record Answer & Update Ability                           │
│  • Calculate Stopping Criterion                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database Functions                          │
│                                                              │
│  • get_next_adaptive_question()                             │
│  • record_adaptive_answer()                                 │
│  • calculate_ability_estimate()                             │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Instructions

### Step 1: Run Database Migrations

Execute these SQL files in order:

```bash
# 1. Adaptive assessment engine (tables, functions)
psql -h your-db-host -U postgres -d your-db -f supabase/migrations/20251003000000_adaptive_assessment_engine.sql

# 2. Update question metadata (IRT scores, difficulty levels)
psql -h your-db-host -U postgres -d your-db -f scripts/UPDATE_QUESTION_METADATA.sql

# 3. Fix any questions with missing options
psql -h your-db-host -U postgres -d your-db -f scripts/FIX_MISSING_OPTIONS.sql
```

**For Supabase users:**
- Go to SQL Editor in Supabase Dashboard
- Copy and paste each file's content
- Run sequentially

### Step 2: Enable Adaptive Mode

In `/src/pages/AIAssessment.tsx`, set the feature flag:

```typescript
const USE_ADAPTIVE_ASSESSMENT = true; // Currently set to true
```

### Step 3: Configure Adaptive Parameters (Optional)

Edit `/src/config/adaptiveAssessment.ts` to tune:

```typescript
export const ADAPTIVE_CONFIG = {
  MIN_QUESTIONS: 8,              // Minimum questions
  MAX_QUESTIONS: 15,             // Maximum questions
  STOPPING_SEM_THRESHOLD: 0.3,   // Stop when confident enough
  DIFFICULTY_INCREMENT_CORRECT: 0.5,  // Increase after correct
  DIFFICULTY_DECREMENT_INCORRECT: 0.3, // Decrease after incorrect
  // ... more options
};
```

### Step 4: Deploy to Production

```bash
# Build and deploy
npm run build
npx vercel --prod --token YOUR_TOKEN

# Or push to GitHub (auto-deploys on Vercel)
git add .
git commit -m "Enable adaptive assessment"
git push origin main
```

## How It Works

### 1. **Ability Estimation (IRT)**

The system maintains an ability score (theta) for each user:

- **Range:** -3.0 (beginner) to +3.0 (expert)
- **Starting point:** 0.0 (average)
- **Updates:** After each answer based on correctness and question difficulty

**Formula (simplified):**
```
new_ability = avg_difficulty_of_correct_answers +
              (success_rate - 0.5) * 2.0
```

### 2. **Question Selection**

For each question, the algorithm:

1. Calculates target difficulty: `current_ability + 0.3`
2. Searches for questions within ±0.5 of target
3. Scores candidates based on:
   - Difficulty match (50 points max)
   - Category preference (10 points bonus)
   - Random factor for variety (5 points max)
4. Selects highest-scoring unused question

### 3. **Stopping Criterion**

Assessment ends when:
- **Minimum met:** User answered at least 8 questions
- **Confident:** Standard error < 0.3 (high confidence in ability estimate)
- **Maximum reached:** User answered 15 questions

### 4. **Performance Feedback**

Users see:
- Current question number
- Estimated questions remaining
- Confidence level (0-100%)
- Performance trend (↑ improving, ↓ declining, → stable)
- Difficulty level of each question

## Database Schema

### New Tables

**`assessment_answer_performance`**
- Tracks each answer with timestamp
- Records ability before/after each question
- Stores question difficulty at time of answer

### New Columns on `user_ai_assessments`

- `current_ability_estimate` - Current theta score
- `ability_standard_error` - Confidence in estimate
- `questions_answered_count` - Number answered so far
- `is_adaptive` - Whether using adaptive mode

### New Functions

1. **`calculate_ability_estimate(assessment_id)`**
   - Returns: ability, standard_error, confidence%
   - Called after each answer

2. **`get_next_adaptive_question(assessment_id, ability, answered_ids)`**
   - Returns: Optimal next question with options
   - Uses IRT for selection

3. **`record_adaptive_answer(assessment_id, question_id, options, time)`**
   - Records answer
   - Updates ability estimate
   - Returns: correctness, points, new_ability

## Question Difficulty Levels

All questions must have:

### Difficulty Level (4 categories)

| Level | IRT Range | Description | Example |
|-------|-----------|-------------|---------|
| **Foundational** | -2.0 to -0.5 | Basic concepts | "What does AI stand for?" |
| **Applied** | -0.5 to +0.5 | Practical usage | "How do you use chain-of-thought?" |
| **Advanced** | +0.5 to +1.5 | Deep knowledge | "What is prompt injection?" |
| **Strategic** | +1.5 to +2.5 | Business/leadership | "How to implement AI at scale?" |

### IRT Difficulty Score

- Precise difficulty on continuous scale
- Lower = easier, Higher = harder
- Used for fine-grained question selection

## Configuration Options

### UI Settings

```typescript
ADAPTIVE_CONFIG.UI = {
  SHOW_DIFFICULTY_LEVEL: true,    // Show badge for question difficulty
  SHOW_PERFORMANCE_TREND: true,   // Show ↑↓→ indicators
  SHOW_LIVE_ABILITY: false,       // Show current ability score (can cause anxiety)
  SHOW_QUESTIONS_REMAINING: true, // Show estimated questions left
  ENABLE_PROGRESS_VIZ: true,      // Show confidence progress bar
};
```

### Testing Configuration

For development/testing, you can:

1. **Lower minimum questions:**
   ```typescript
   MIN_QUESTIONS: 3  // Faster testing
   ```

2. **Disable adaptive mode:**
   ```typescript
   const USE_ADAPTIVE_ASSESSMENT = false
   ```

3. **Adjust difficulty curve:**
   ```typescript
   DIFFICULTY_INCREMENT_CORRECT: 1.0  // Harder progression
   DIFFICULTY_DECREMENT_INCORRECT: 0.1  // Slower regression
   ```

## Monitoring & Analytics

### Check Assessment Performance

```sql
-- Average ability by assessment
SELECT
  a.id,
  a.current_ability_estimate,
  a.ability_standard_error,
  a.questions_answered_count,
  a.completed_at - a.started_at AS duration
FROM user_ai_assessments a
WHERE a.is_adaptive = true
  AND a.is_complete = true
ORDER BY a.completed_at DESC
LIMIT 10;
```

### Question Usage Statistics

```sql
-- Which questions are being shown most?
SELECT
  q.question_text,
  q.difficulty_level,
  q.irt_difficulty,
  COUNT(p.id) as times_shown,
  AVG(CASE WHEN p.is_correct THEN 1.0 ELSE 0.0 END) as success_rate
FROM assessment_questions q
JOIN assessment_answer_performance p ON q.id = p.question_id
GROUP BY q.id, q.question_text, q.difficulty_level, q.irt_difficulty
ORDER BY times_shown DESC
LIMIT 20;
```

### User Ability Distribution

```sql
-- See how users are scoring
SELECT
  CASE
    WHEN current_ability_estimate < -1.0 THEN 'Beginner'
    WHEN current_ability_estimate < 0.5 THEN 'Intermediate'
    WHEN current_ability_estimate < 1.5 THEN 'Advanced'
    ELSE 'Expert'
  END as level,
  COUNT(*) as count,
  ROUND(AVG(current_ability_estimate)::numeric, 2) as avg_ability,
  ROUND(AVG(questions_answered_count)::numeric, 1) as avg_questions
FROM user_ai_assessments
WHERE is_adaptive = true AND is_complete = true
GROUP BY 1
ORDER BY avg_ability;
```

## Troubleshooting

### Problem: Questions repeat or run out

**Solution:** Ensure enough questions exist at each difficulty level

```sql
-- Check question distribution
SELECT
  difficulty_level,
  COUNT(*) as count,
  ROUND(AVG(irt_difficulty)::numeric, 2) as avg_irt
FROM assessment_questions
WHERE is_active = true
GROUP BY difficulty_level;
```

Need at least:
- 10+ foundational
- 15+ applied
- 10+ advanced
- 5+ strategic

### Problem: Assessment always takes maximum questions

**Solution:** Lower stopping threshold or add more discriminating questions

```typescript
STOPPING_SEM_THRESHOLD: 0.4  // Less strict (was 0.3)
```

### Problem: Questions too easy/hard for everyone

**Solution:** Recalibrate IRT difficulty scores

Run the metadata update script again with adjusted values.

## A/B Testing

To compare adaptive vs. traditional:

1. Set `USE_ADAPTIVE_ASSESSMENT = Math.random() > 0.5` for random split
2. Track in database: `is_adaptive` column
3. Compare metrics:
   - Average completion time
   - User satisfaction
   - Dropout rate
   - Score accuracy (re-test consistency)

## Next Steps

1. ✅ Deploy database migrations
2. ✅ Enable adaptive mode
3. ⏳ Run with real users
4. ⏳ Monitor performance metrics
5. ⏳ Tune configuration based on data
6. ⏳ Add ability progression charts to results page

## Support

For issues or questions:
- Check logs: `console` for frontend, Supabase logs for database
- Review configuration in `/src/config/adaptiveAssessment.ts`
- Test with different user profiles to validate algorithm

---

**Implementation completed:** 2025-10-03
**Version:** 1.0
**Status:** Ready for testing
