# 🗄️ Database Migrations - Run in Correct Order

The migrations MUST be run in this specific order because they have dependencies.

---

## ⚠️ IMPORTANT: Run in This Order!

### Migration 1: Create Plans Table (FIRST)
**File:** `supabase/migrations/20251017120000_membership_plans.sql`

This creates:
- `membership_plans` table
- Default Family Pass plan

### Migration 2: Create Subscriptions Table (SECOND)
**File:** `supabase/migrations/20251017120001_membership_subscriptions.sql`

This creates:
- `membership_subscriptions` table
- References `membership_plans` (requires table from Migration 1)

### Migration 3: Create Family Members Table (THIRD - if exists)
**File:** `supabase/migrations/20251017120003_family_members.sql`

This creates:
- `family_members` table
- References `membership_subscriptions` (requires table from Migration 2)

---

## 📝 Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/sql

### Step 2: Run Migration 1 (Plans)

1. Click **"New Query"**
2. Open this file in your editor:
   ```
   /home/vik/aiborg_CC/aiborg-learn-sphere/supabase/migrations/20251017120000_membership_plans.sql
   ```
3. Copy ALL contents (Ctrl+A, Ctrl+C)
4. Paste into Supabase SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)
6. ✅ Should see: "Success. No rows returned"

**Verify it worked:**
```sql
SELECT * FROM membership_plans;
```
You should see 2 rows (Family Pass and Individual Pass).

### Step 3: Run Migration 2 (Subscriptions)

1. Click **"New Query"**
2. Open this file:
   ```
   /home/vik/aiborg_CC/aiborg-learn-sphere/supabase/migrations/20251017120001_membership_subscriptions.sql
   ```
3. Copy ALL contents
4. Paste into Supabase SQL Editor
5. Click **"Run"**
6. ✅ Should see: "Success. No rows returned"

**Verify it worked:**
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'membership_subscriptions';
```
Should return 1 row.

### Step 4: Run Migration 3 (Family Members) - Optional

Check if this file exists:
```
/home/vik/aiborg_CC/aiborg-learn-sphere/supabase/migrations/20251017120003_family_members.sql
```

If it exists:
1. Click **"New Query"**
2. Copy ALL contents
3. Paste into Supabase SQL Editor
4. Click **"Run"**
5. ✅ Should see: "Success. No rows returned"

---

## ✅ Verify All Tables Created

Run this query:

```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND (tablename LIKE '%membership%' OR tablename LIKE '%family%')
ORDER BY tablename;
```

**Expected result:**
- `family_members` (if migration 3 exists)
- `membership_plans`
- `membership_subscriptions`

---

## 🚨 Common Errors and Solutions

### Error: "relation does not exist"

**Problem:** You're running migrations out of order.

**Solution:** Start over:
1. Run Migration 1 first
2. Then Migration 2
3. Then Migration 3

### Error: "already exists"

**Problem:** You already ran this migration.

**Solution:** Skip to the next migration or check what's missing:

```sql
-- Check what tables exist
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Error: "permission denied"

**Problem:** RLS policies or insufficient permissions.

**Solution:** Make sure you're logged in as the Supabase project owner.

---

## 🧹 Clean Start (If Needed)

If you need to start fresh and remove all tables:

```sql
-- DANGER: This will delete ALL data!
-- Only use in development/testing

DROP TABLE IF EXISTS public.family_members CASCADE;
DROP TABLE IF EXISTS public.membership_subscriptions CASCADE;
DROP TABLE IF EXISTS public.membership_plans CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;

-- Now run migrations again in order
```

---

## ✨ Quick Copy-Paste Commands

### Check if tables exist:
```sql
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'membership_plans')
    THEN '✅ membership_plans exists'
    ELSE '❌ membership_plans missing - RUN MIGRATION 1'
  END as plans_status,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'membership_subscriptions')
    THEN '✅ membership_subscriptions exists'
    ELSE '❌ membership_subscriptions missing - RUN MIGRATION 2'
  END as subscriptions_status,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'family_members')
    THEN '✅ family_members exists'
    ELSE '❌ family_members missing - RUN MIGRATION 3'
  END as family_status;
```

### Count plans:
```sql
SELECT COUNT(*) as plan_count FROM membership_plans;
-- Should return: 2 (or 1 if you only have Family Pass)
```

### View plans:
```sql
SELECT name, slug, price, currency, trial_days
FROM membership_plans
ORDER BY display_order;
```

---

## 📚 After Migrations Complete

Once all migrations are done, continue with:
1. Stripe setup (see `STRIPE_SETUP_GUIDE.md`)
2. Deploy Edge Functions
3. Configure webhooks
4. Test enrollment

---

**Need help? Run the diagnostic query above to see which tables are missing!**
