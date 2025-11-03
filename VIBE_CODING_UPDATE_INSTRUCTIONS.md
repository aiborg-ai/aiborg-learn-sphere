# Vibe Coding Session Dates Update

## Overview
This update adds specific session dates and times to the "Vibe Coding with Claude Code" course card.

**Session Dates:**
- Session 1: 8 November from 7 PM (Online)
- Session 2: 15 November from 7 PM (Online)
- Session 3: 22 November from 7 PM (Online)
- Session 4: 29 November from 7 PM (Online)

## How to Apply the Update

### Option 1: Run SQL Script in Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Run the Script**
   - Open the file: `UPDATE_VIBE_CODING_SESSION_DATES.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" or press Ctrl+Enter

4. **Verify the Update**
   - The script will automatically show you the updated course details
   - Check that:
     - Description includes session dates
     - Features array shows session dates at the top
     - Start date is "8 November 2025"
     - Mode is "Online"

### Option 2: Using Supabase CLI (If Linked)

If you have Supabase CLI linked to your project:

```bash
npx supabase db push
```

This will apply the migration file:
`supabase/migrations/20251103_update_vibe_coding_dates.sql`

## What Gets Updated

### Course Description
**Before:**
```
Master modern AI-powered development tools in this hands-on professional course.
Learn to leverage Claude Code, ChatGPT, GitHub Copilot, and more to supercharge
your coding workflow. 4 live sessions in November 2025...
```

**After:**
```
Master modern AI-powered development tools in this hands-on professional course.
Learn to leverage Claude Code, ChatGPT, GitHub Copilot, and more to supercharge
your coding workflow. Sessions: 8 November, 15 November, 22 November, and 29 November
from 7 PM onwards (Online). Perfect for developers looking to stay ahead...
```

### Course Features
The features array will now show session dates at the top:
1. Session 1: 8 November from 7 PM (Online)
2. Session 2: 15 November from 7 PM (Online)
3. Session 3: 22 November from 7 PM (Online)
4. Session 4: 29 November from 7 PM (Online)
5. Hands-on with Claude Code
6. ChatGPT for code generation
7. ... (other features)

### Other Fields
- `start_date`: Updated to "8 November 2025"
- `mode`: Confirmed as "Online"
- `updated_at`: Set to current timestamp

## Course Details

- **Course ID**: 807
- **Title**: "Vibe Coding: AI-Powered Development for Professionals"
- **Price**: £20 (FREE for Family Pass holders)
- **Duration**: 4 weeks
- **Level**: Intermediate

## Verification

After running the script, you can verify the update by:

1. **In Supabase Dashboard:**
   ```sql
   SELECT title, description, features, start_date, mode
   FROM public.courses
   WHERE id = 807;
   ```

2. **On the Website:**
   - Visit the courses page
   - Find the "Vibe Coding" course card
   - Check that session dates are displayed

## Files Involved

- `UPDATE_VIBE_CODING_SESSION_DATES.sql` - Main update script (run this!)
- `supabase/migrations/20251103_update_vibe_coding_dates.sql` - Migration file
- `update_vibe_coding_dates.sql` - Alternative version

## Need Help?

If you encounter any issues:
1. Check that you're logged into the correct Supabase project
2. Verify the course exists: `SELECT * FROM courses WHERE id = 807;`
3. If the course_id is different, update the WHERE clause in the script
