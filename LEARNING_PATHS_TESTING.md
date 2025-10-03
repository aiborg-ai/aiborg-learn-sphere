# AI Learning Paths - Testing Guide

## Prerequisites
1. ✅ Database migrations run (`20251004000000_ai_learning_paths.sql`)
2. ✅ Latest code deployed to production
3. ✅ User has completed at least one AI assessment

## Test Flow

### Test 1: Path Generation from Assessment
1. Complete an AI assessment
2. On results page, click "Create Personalized Learning Path"
3. **Expected**: Wizard opens with assessment data pre-loaded

### Test 2: Complete Wizard Flow
1. Step 1: Enter goal title (e.g., "Become AI Expert")
2. Select target level (e.g., "Advanced")
3. Click "Next"
4. Step 2: Verify weak categories are pre-selected
5. Adjust duration/hours if needed
6. Click "Next"
7. Step 3: Review selections
8. Click "Generate My Path"
9. **Expected**: Loading spinner → Success message → Redirect to path detail

### Test 3: Path Detail View
1. **Expected UI Elements:**
   - Progress stats (0% initially)
   - Current item card with "Start" button
   - Next milestone card
   - Week-by-week timeline
   - All items except first marked as "Locked"

2. Click "Start" on first item
   - **Expected**: Navigates to content (course/event/assessment)
   - Item status changes to "In Progress"

3. Return to path and click "Mark Complete"
   - **Expected**: Item marked "Completed"
   - Next item unlocks (status changes to "Available")
   - Progress percentage increases

### Test 4: Profile Integration
1. Navigate to `/profile?tab=learning-paths`
2. **Expected**:
   - "Learning Paths" tab visible
   - Empty state with "Create New Path" CTA
   - OR list of existing paths

### Test 5: Milestone System
1. Complete 25% of path items
2. **Expected**: First milestone unlocked
3. Verify badge and points awarded

## Common Issues & Fixes

### Issue: "No assessment found" error
**Fix**: Complete an AI assessment first at `/ai-assessment`

### Issue: Path generation fails
**Check**:
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%learning%';

-- Check RLS policies
SELECT tablename, policyname FROM pg_policies
WHERE tablename LIKE '%learning%';
```

### Issue: Items not unlocking
**Check**:
```sql
-- Verify triggers are active
SELECT tgname, tgtype, tgenabled
FROM pg_trigger
WHERE tgname LIKE '%learning%';

-- Manually unlock if needed
UPDATE learning_path_items
SET status = 'available'
WHERE order_index = 1
AND ai_learning_path_id = 'your-path-id';
```

### Issue: No courses/content in path
**Check**:
```sql
-- Verify courses exist
SELECT COUNT(*) FROM courses WHERE is_active = true;

-- Verify events exist
SELECT COUNT(*) FROM events WHERE is_active = true;
```

## SQL Queries for Debugging

### View all learning paths for user
```sql
SELECT
  p.*,
  g.goal_title,
  COUNT(i.id) as total_items
FROM ai_generated_learning_paths p
JOIN user_learning_goals g ON p.goal_id = g.id
LEFT JOIN learning_path_items i ON i.ai_learning_path_id = p.id
WHERE p.user_id = 'your-user-id'
GROUP BY p.id, g.goal_title;
```

### View path items with status
```sql
SELECT
  order_index,
  week_number,
  item_type,
  item_title,
  status,
  estimated_hours
FROM learning_path_items
WHERE ai_learning_path_id = 'your-path-id'
ORDER BY order_index;
```

### Check milestone progress
```sql
SELECT
  m.*,
  p.progress_percentage
FROM learning_path_milestones m
JOIN ai_generated_learning_paths p ON m.ai_learning_path_id = p.id
WHERE p.id = 'your-path-id'
ORDER BY m.milestone_order;
```

## Performance Monitoring

### Generation metrics
```sql
SELECT
  algorithm_version,
  AVG(computation_time_ms) as avg_time,
  AVG(items_generated) as avg_items,
  COUNT(*) as total_generations
FROM path_generation_logs
WHERE success = true
GROUP BY algorithm_version;
```

### User engagement
```sql
SELECT
  COUNT(DISTINCT user_id) as total_users,
  COUNT(*) as total_paths,
  AVG(progress_percentage) as avg_progress,
  COUNT(*) FILTER (WHERE progress_percentage = 100) as completed_paths
FROM ai_generated_learning_paths
WHERE is_active = true;
```

## Success Metrics

After testing, verify:
- ✅ Path generates within 5 seconds
- ✅ At least 15 items in generated path
- ✅ Items span appropriate difficulty range
- ✅ Prerequisites chain correctly
- ✅ Progress updates automatically
- ✅ Milestones trigger at right percentages
- ✅ UI is responsive and intuitive

## Next Steps After Testing

1. **Populate Content**: Add more courses, workshops, events to database
2. **Refine Algorithm**: Adjust IRT matching thresholds based on results
3. **User Feedback**: Add rating system for path quality
4. **Analytics**: Monitor generation success rates
5. **Notifications**: Add reminders for path progress
