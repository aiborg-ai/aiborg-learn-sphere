# Fix Assessment History Issue

## Problem

Assessment history shows "No assessment history found" even after completing assessments.

## Root Cause

The database function `get_attempt_history` is missing the `attempt_id` field, which the frontend
needs to navigate to results pages.

## Solution

### Option 1: Apply via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the following SQL:

```sql
-- =====================================================
-- Fix get_attempt_history to include attempt ID
-- =====================================================

-- Drop existing function
DROP FUNCTION IF EXISTS get_attempt_history(UUID, UUID);

-- Recreate with attempt_id included
CREATE OR REPLACE FUNCTION get_attempt_history(
  p_user_id UUID,
  p_tool_id UUID
)
RETURNS TABLE (
  attempt_id UUID,
  attempt_number INTEGER,
  score_percentage DECIMAL,
  ability_estimate DECIMAL,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_taken_seconds INTEGER,
  improvement_from_previous DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id as attempt_id,
    a.attempt_number,
    a.score_percentage,
    a.ability_estimate,
    a.completed_at,
    a.time_taken_seconds,
    (a.score_percentage - LAG(a.score_percentage) OVER (ORDER BY a.attempt_number)) as improvement_from_previous
  FROM assessment_tool_attempts a
  WHERE a.user_id = p_user_id
    AND a.tool_id = p_tool_id
    AND a.is_completed = true
  ORDER BY a.attempt_number ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_attempt_history IS 'Returns complete attempt history with IDs, score trends and improvement metrics';
```

5. Click **Run** (or press Ctrl+Enter / Cmd+Enter)
6. You should see "Success. No rows returned"
7. Refresh your assessment history page

### Option 2: Verify Assessments Exist First

Before applying the fix, you can verify that your assessments were saved:

1. In Supabase Dashboard → SQL Editor
2. Run this query to check your assessments:

```sql
SELECT
  id,
  user_id,
  attempt_number,
  score_percentage,
  is_completed,
  completed_at
FROM assessment_tool_attempts
WHERE is_completed = true
ORDER BY created_at DESC
LIMIT 10;
```

If this returns rows, your assessments are saved and just need the function fix. If this returns no
rows, the assessments didn't save properly.

## What Changed

**Before (Missing attempt_id):**

```sql
RETURNS TABLE (
  attempt_number INTEGER,
  score_percentage DECIMAL,
  ...
)
```

**After (With attempt_id):**

```sql
RETURNS TABLE (
  attempt_id UUID,  -- ✅ Added this
  attempt_number INTEGER,
  score_percentage DECIMAL,
  ...
)
```

The frontend needs `attempt_id` to construct URLs like:

- `/assessment/ai-awareness/results/{attempt_id}`

Without it, the "View Details" button and history panel can't function properly.

## Migration File

The fix is already in: `supabase/migrations/20251025000002_fix_attempt_history_function.sql`

It just needs to be applied to the remote database.
