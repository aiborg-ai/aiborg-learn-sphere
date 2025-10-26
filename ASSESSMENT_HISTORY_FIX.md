# Assessment History Fix - Implementation Guide

## Problem Summary

Users see "No assessment history found" even after completing assessments.

**Root Cause**: Database function `get_attempt_history()` is missing the `attempt_id` field that the
frontend requires for navigation to results pages.

## Solution

Apply the migration `20251025000002_fix_attempt_history_function.sql` to add `attempt_id` to the
function return table.

---

## MANUAL FIX - Option 1: Supabase Dashboard (Recommended)

### Steps:

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj
   - Navigate to: **SQL Editor** in the left sidebar
   - Click **New Query**

2. **Paste and Execute the Migration SQL**

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

3. **Click "Run"** and verify you see: `Success. No rows returned`

---

## MANUAL FIX - Option 2: Supabase CLI (If you have access)

```bash
cd /home/vik/aiborg_CC/aiborg-learn-sphere

# Link to Supabase project (requires proper credentials)
npx supabase link --project-ref afrulkxxzcmngbrdfuzj

# Push the migration
npx supabase db push
```

---

## Verification Steps

### 1. Check Function Definition

Run this query in SQL Editor to verify the fix was applied:

```sql
-- Check function signature
SELECT
  routine_name,
  data_type,
  ordinal_position,
  parameter_name
FROM information_schema.parameters
WHERE specific_schema = 'public'
  AND routine_name = 'get_attempt_history'
ORDER BY ordinal_position;
```

**Expected Output**: Should show `attempt_id` as one of the returned columns.

### 2. Check if Data Exists

```sql
-- Count completed assessment attempts
SELECT COUNT(*) as total_completed_attempts
FROM assessment_tool_attempts
WHERE is_completed = true;
```

**Expected**: If this returns 0, then users haven't completed any assessments yet (different issue).

### 3. Test the Function

```sql
-- Test with a sample user (replace with actual user_id and tool_id)
SELECT * FROM get_attempt_history(
  '<some-user-uuid>'::UUID,
  '<some-tool-uuid>'::UUID
);
```

**Expected**: Should return rows with `attempt_id, attempt_number, score_percentage, ...`

### 4. Get Sample UUIDs for Testing

```sql
-- Get a user who has completed assessments
SELECT
  user_id,
  tool_id,
  COUNT(*) as attempts
FROM assessment_tool_attempts
WHERE is_completed = true
GROUP BY user_id, tool_id
LIMIT 1;
```

---

## Frontend Testing

After applying the migration:

1. **Clear Browser Cache** (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
2. **Test Assessment History**:
   - Navigate to: `/assessment/ai-readiness/history`
   - Or: `/assessment/ai-awareness/history`
   - Or: `/assessment/ai-fluency/history`
3. **Expected Behavior**:
   - If user has completed assessments: History panel shows attempts
   - If user hasn't completed any: Shows "No assessment history found. Take the assessment to see
     your results here."
4. **Click "View Results"** on any attempt
   - Should navigate to: `/assessment/{tool-slug}/results/{attempt-id}`
   - Should NOT show `undefined` in URL

---

## Additional Fix (May Also Be Needed)

If users still can't see history after the above fix, also apply this RLS policy fix:

```sql
-- Fix RLS to allow users to complete their own attempts
DROP POLICY IF EXISTS "Users can update own incomplete attempts" ON assessment_tool_attempts;

CREATE POLICY "Users can update own attempts"
  ON assessment_tool_attempts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## Troubleshooting

### Issue: Still shows "No assessment history found"

**Possible causes**:

1. **No completed assessments**
   - Check: `SELECT COUNT(*) FROM assessment_tool_attempts WHERE is_completed = true;`
   - Solution: Users need to actually complete an assessment first

2. **Function not returning data**
   - Check: Test the function directly with sample UUIDs
   - Verify: `attempt_id` field is present in results

3. **Frontend not refetching**
   - Solution: Hard refresh browser (Ctrl+Shift+R)
   - Clear React Query cache by reloading the page

4. **Authentication issue**
   - Check: User is logged in
   - Verify: `useAuth()` hook returns valid user object

### Issue: Navigation to results shows "undefined"

**Cause**: Migration not applied correctly

**Solution**: Re-run the migration SQL and verify function signature

---

## Technical Details

### What Changed

**Before** (Broken):

```sql
RETURNS TABLE (
  attempt_number INTEGER,
  score_percentage DECIMAL,
  ...
)
```

**After** (Fixed):

```sql
RETURNS TABLE (
  attempt_id UUID,  -- ← ADDED
  attempt_number INTEGER,
  score_percentage DECIMAL,
  ...
)
```

### Why This Matters

Frontend TypeScript interface expects:

```typescript
interface AttemptHistoryItem {
  attempt_id: string;  // Required!
  attempt_number: number;
  score_percentage: number;
  ...
}
```

Without `attempt_id`, the frontend cannot construct navigation URLs:

```typescript
navigate(`/assessment/${toolSlug}/results/${attempt.attempt_id}`);
//                                           ^^^^^^^^^^^^^^^^
//                                           undefined! ❌
```

---

## Files Involved

- **Migration**: `supabase/migrations/20251025000002_fix_attempt_history_function.sql`
- **Frontend Hook**: `src/hooks/useAssessmentAttempts.ts`
- **Frontend Types**: `src/types/assessmentTools.ts`
- **UI Component**: `src/components/assessment-tools/AssessmentHistoryPanel.tsx`
- **Results Page**: `src/pages/AssessmentResultsPage.tsx`

---

## Contact

If you encounter issues after applying this fix, check:

1. Browser console for errors
2. Network tab for API responses
3. Supabase logs for database errors
