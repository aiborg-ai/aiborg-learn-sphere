# Database Deduplication Guide

## Problem

Assessment questions are appearing twice in the frontend because duplicate question records exist in
the database from running insert scripts multiple times.

## Solution: 3-Step Deduplication Process

---

## Step 1: Analyze (READ-ONLY)

**File:** `scripts/DEDUPLICATE_QUESTIONS_PLAN.sql`

Run this first to understand the scope of duplicates:

```bash
# In Supabase SQL Editor, run:
scripts/DEDUPLICATE_QUESTIONS_PLAN.sql
```

**What it shows:**

- How many duplicate questions exist
- Which questions are duplicated
- How many questions will be affected
- Whether any user answers reference duplicates

**Expected output:**

- List of duplicate question_text values
- Count of duplicates to remove
- Total questions: ~82 (41 × 2 if fully duplicated)
- Unique questions: 41
- Duplicates to remove: ~41

---

## Step 2: Execute Deduplication

You have **two options**:

### Option A: Soft Delete (RECOMMENDED) ⭐

**File:** `scripts/DEDUPLICATE_QUESTIONS_EXECUTE_SOFT.sql`

**Advantages:**

- ✅ Reversible - can undo if needed
- ✅ Preserves all data
- ✅ Safer for production
- ✅ No data loss risk

**How it works:**

- Sets `is_active = false` on duplicate questions
- Keeps the first occurrence of each question
- Frontend already filters by `is_active = true`

**To execute:**

1. Review the output showing what will be deactivated
2. Uncomment the UPDATE statement (line ~35)
3. Run the script

### Option B: Hard Delete (PERMANENT) ⚠️

**File:** `scripts/DEDUPLICATE_QUESTIONS_EXECUTE_HARD.sql`

**Advantages:**

- Cleaner database
- Removes unnecessary data

**Disadvantages:**

- ❌ Permanent - cannot undo
- ❌ Requires careful backup management
- ❌ Deletes related options
- ❌ May affect user answers

**To execute:**

1. Create backups (automatic in script)
2. Review what will be deleted
3. Uncomment the DELETE statements (lines ~70-82)
4. Run the script

---

## Step 3: Prevent Future Duplicates

**File:** `scripts/ADD_UNIQUE_CONSTRAINT.sql`

Run this **after** deduplication to prevent duplicates from being inserted again:

```bash
# In Supabase SQL Editor, run:
scripts/ADD_UNIQUE_CONSTRAINT.sql
```

**What it does:**

- Creates a unique partial index on `question_text`
- Only enforces uniqueness for active questions (`is_active = true`)
- Future INSERT attempts with duplicate text will fail with error

---

## Recommended Workflow

### For Production (Safest):

```bash
# Step 1: Analyze
Run: scripts/DEDUPLICATE_QUESTIONS_PLAN.sql

# Step 2: Soft delete duplicates
Run: scripts/DEDUPLICATE_QUESTIONS_EXECUTE_SOFT.sql
     (uncomment the UPDATE statement first)

# Step 3: Add constraint
Run: scripts/ADD_UNIQUE_CONSTRAINT.sql

# Step 4: Test frontend
# Reload assessment page and verify no duplicates appear

# Step 5 (Optional): After 1 week, hard delete if needed
Run: scripts/DEDUPLICATE_QUESTIONS_EXECUTE_HARD.sql
```

### For Development (Faster):

```bash
# Step 1: Analyze
Run: scripts/DEDUPLICATE_QUESTIONS_PLAN.sql

# Step 2: Hard delete (creates backups automatically)
Run: scripts/DEDUPLICATE_QUESTIONS_EXECUTE_HARD.sql
     (uncomment the DELETE statements first)

# Step 3: Add constraint
Run: scripts/ADD_UNIQUE_CONSTRAINT.sql
```

---

## Verification

After running deduplication, verify success:

```sql
-- Should return 0 rows (no duplicates)
SELECT
  question_text,
  COUNT(*) as count
FROM assessment_questions
WHERE is_active = true
GROUP BY question_text
HAVING COUNT(*) > 1;

-- Should show ~41 active questions
SELECT COUNT(*)
FROM assessment_questions
WHERE is_active = true;
```

---

## Rollback (if needed)

### If you used Soft Delete (Option A):

```sql
-- Reactivate specific questions
UPDATE assessment_questions
SET is_active = true
WHERE id IN ('question-id-1', 'question-id-2');
```

### If you used Hard Delete (Option B):

```sql
-- Restore from backup (created automatically)
DROP TABLE assessment_questions;
DROP TABLE assessment_question_options;

CREATE TABLE assessment_questions AS
SELECT * FROM assessment_questions_backup_20251003;

CREATE TABLE assessment_question_options AS
SELECT * FROM assessment_question_options_backup_20251003;
```

---

## Expected Results

✅ **Before deduplication:**

- User sees each question twice (10 questions × 2 = 20 total displays)
- Database has ~82 question records

✅ **After deduplication:**

- User sees each question once (10 questions exactly)
- Database has 41 active questions
- Future duplicate inserts are blocked

---

## Files Created

1. `DEDUPLICATE_QUESTIONS_PLAN.sql` - Analysis queries
2. `DEDUPLICATE_QUESTIONS_EXECUTE_SOFT.sql` - Soft delete (recommended)
3. `DEDUPLICATE_QUESTIONS_EXECUTE_HARD.sql` - Hard delete (permanent)
4. `ADD_UNIQUE_CONSTRAINT.sql` - Prevent future duplicates
5. `DEDUPLICATION_GUIDE.md` - This guide

---

## Questions?

- **"Which option should I choose?"** → Option A (Soft Delete) for production, safer and reversible
- **"Will this affect user data?"** → No, user answers remain intact with both options
- **"Can I test this first?"** → Yes, Option A is completely reversible
- **"What if something breaks?"** → Use rollback instructions above

---

**Ready to proceed?** Start with Step 1 (Analyze) to see the current state of duplicates.
