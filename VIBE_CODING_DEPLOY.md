# Vibe Coding Course - Deployment Instructions

## ✅ Changes Made

The Vibe Coding course has been updated with the correct pricing and structure:

### Course Details

- **Title**: Vibe Coding: AI-Powered Development for Professionals
- **Price**: £20 (was £199)
- **Duration**: 4 weeks
- **Level**: Intermediate
- **Start Date**: 8th November 2025

### Pricing

- Regular price: **£20**
- **FREE for Family Pass holders**

### Live Sessions (Part of Course)

The course includes 4 live sessions in November 2025:

1. **Session 1**: Introduction to AI-Powered Development
   - Date: Saturday, November 8, 2025 at 7:00 PM GMT
   - Duration: 2 hours

2. **Session 2**: Mastering Claude Code Workflows
   - Date: Saturday, November 15, 2025 at 7:00 PM GMT
   - Duration: 2 hours

3. **Session 3**: ChatGPT & Copilot Power Techniques
   - Date: Saturday, November 22, 2025 at 7:00 PM GMT
   - Duration: 2 hours

4. **Session 4**: Real-World Projects & Pro Tips
   - Date: Saturday, November 29, 2025 at 7:00 PM GMT
   - Duration: 2 hours

**Meeting Platform**: Jitsi (browser-based, no download required) **Support**: WhatsApp +44
7404568207 **Capacity**: 50 participants per session

---

## 🚀 How to Deploy

### Option 1: Supabase Dashboard (Recommended)

1. **Go to Supabase SQL Editor**:
   - URL: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj
   - Navigate to: **SQL Editor** (left sidebar)

2. **Run the SQL**:
   - Click **"New Query"**
   - Copy the contents of `vibe_coding_complete.sql`
   - Paste into the editor
   - Click **"Run"** (or Ctrl+Enter)

3. **Verify Success**: You should see:
   ```
   NOTICE:  Found Vibe Coding course with ID: <number>
   NOTICE:  Successfully created 18 course materials for Vibe Coding course
   ```

### Option 2: Using psql (if you have database credentials)

```bash
psql $DATABASE_URL -f vibe_coding_complete.sql
```

---

## 📦 What Will Be Created

### 1 Course

- Vibe Coding: AI-Powered Development for Professionals
- Price: £20
- Includes 4 live sessions
- FREE for Family Pass holders

### 18 Course Materials

- **Session 1**: Handbook, slides, recording, quick reference (4 materials)
- **Session 2**: Handbook, slides, recording, code examples (4 materials)
- **Session 3**: Handbook, slides, recording, prompt library (4 materials)
- **Session 4**: Handbook, slides, recording, project repository (4 materials)
- **Bonus**: Certificate template, resources list (2 materials)

---

## 🔍 Verification Queries

After deployment, verify with these queries in Supabase SQL Editor:

### Check Course Created

```sql
SELECT id, title, price, start_date, is_active
FROM public.courses
WHERE title LIKE 'Vibe Coding%';
```

### Check Course Materials

```sql
SELECT
  cm.title,
  cm.material_type,
  cm.is_active,
  c.title as course_title
FROM public.course_materials cm
JOIN public.courses c ON c.id = cm.course_id
WHERE c.title LIKE 'Vibe Coding%'
ORDER BY cm.sort_order;
```

### Count Materials

```sql
SELECT COUNT(*) as total_materials
FROM public.course_materials cm
JOIN public.courses c ON c.id = cm.course_id
WHERE c.title LIKE 'Vibe Coding%';
```

Expected: 18 materials

---

## 📝 Next Steps After Deployment

1. **Update Material URLs**: The course materials use `storage.aiborg.ai` URLs. When you upload the
   actual files, update them:

   ```sql
   -- Option 1: Run the provided script
   psql $DATABASE_URL -f update_vibe_coding_urls.sql

   -- Option 2: Update manually in Supabase Dashboard
   UPDATE public.course_materials
   SET file_url = 'https://your-actual-storage-url/session-1-handbook.pdf'
   WHERE course_id = 807 AND title LIKE '%Session 1%Handbook%';
   ```

   **Note**: Use `update_vibe_coding_urls.sql` to update all URLs at once

2. **Enable Recordings**: After sessions are recorded, activate the recording materials:

   ```sql
   UPDATE public.course_materials
   SET is_active = true
   WHERE material_type = 'recording'
   AND title LIKE 'Session%Recording';
   ```

3. **Family Pass Integration**: Ensure the enrollment system checks for Family Pass holders and
   applies free pricing.

4. **Send Meeting Links**: Before each session, send Jitsi meeting links to enrolled students.

5. **Test Enrollment**: Try enrolling as a regular user (should cost £20) and as a Family Pass
   holder (should be free).

---

## 📧 Support

For questions or issues:

- Email: hirendra.vikram@aiborg.ai
- WhatsApp: +44 7404568207

---

_Last updated: October 30, 2025_
