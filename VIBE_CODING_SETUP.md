# Vibe Coding Course Setup Guide

## 📚 Overview

This guide will help you set up the **Vibe Coding: AI-Powered Development for Professionals** course
in your AIBorg Learn Sphere platform.

### What's Included:

✅ **1 Course** - "Vibe Coding: AI-Powered Development for Professionals" ✅ **4 Free Sessions** -
November 8th, 15th, 22nd, 29th, 2025 (7 PM - 9 PM GMT) ✅ **18 Course Materials** - Handbooks,
presentations, recordings, code examples, and resources

---

## 🚀 Quick Start

### Step 1: Run the Course & Sessions Migration

```bash
# Navigate to your project directory
cd /home/vik/aiborg_CC/aiborg-learn-sphere

# Connect to your Supabase database and run the migration
# Option A: Using Supabase CLI
supabase db push

# Option B: Using psql directly
psql $DATABASE_URL -f supabase/migrations/20251029_vibe_coding_course.sql
```

### Step 2: Run the Course Materials Migration

```bash
# This will automatically find the course and create all materials
psql $DATABASE_URL -f supabase/migrations/20251029_vibe_coding_materials.sql
```

### Step 3: Verify Everything Was Created

```sql
-- Check the course
SELECT id, title, audience, price, start_date, is_active
FROM public.courses
WHERE title LIKE 'Vibe Coding%';

-- Check the sessions
SELECT id, title, session_date, capacity, registered_count, is_published
FROM public.free_sessions
WHERE title LIKE 'Vibe Coding%'
ORDER BY session_date;

-- Check the course materials
SELECT cm.title, cm.material_type, cm.is_active, c.title as course_title
FROM public.course_materials cm
JOIN public.courses c ON c.id = cm.course_id
WHERE c.title LIKE 'Vibe Coding%'
ORDER BY cm.sort_order;
```

---

## 📋 What Was Created

### 1. **Course: Vibe Coding**

| Field          | Value                                                 |
| -------------- | ----------------------------------------------------- |
| **Title**      | Vibe Coding: AI-Powered Development for Professionals |
| **Audience**   | Professional                                          |
| **Duration**   | 4 weeks                                               |
| **Price**      | £199                                                  |
| **Level**      | Intermediate                                          |
| **Start Date** | 8th November 2025                                     |
| **Status**     | Active ✅                                             |

**Features:**

- Hands-on with Claude Code
- ChatGPT for code generation
- GitHub Copilot best practices
- AI pair programming techniques
- Real-world project workflows
- Live Q&A with experts
- Certificate of completion
- Access to exclusive community

**Keywords:** claude-code, chatgpt, github-copilot, ai-coding, vibe-coding, pair-programming,
developer-tools, productivity

---

### 2. **Free Sessions (4 Total)**

#### Session 1: Introduction to AI-Powered Development

- **Date:** Saturday, November 8th, 2025
- **Time:** 7:00 PM - 9:00 PM (GMT)
- **Duration:** 2 hours
- **Capacity:** 50 participants
- **Status:** Scheduled & Published ✅
- **Meeting:** Jitsi (room: `vibe-coding-session-1`)

**Topics:**

- Introduction to AI-powered development tools
- Hands-on with Claude Code
- Basic AI pair programming techniques
- Fundamental workflows

---

#### Session 2: Mastering Claude Code Workflows

- **Date:** Saturday, November 15th, 2025
- **Time:** 7:00 PM - 9:00 PM (GMT)
- **Duration:** 2 hours
- **Capacity:** 50 participants
- **Status:** Scheduled & Published ✅
- **Meeting:** Jitsi (room: `vibe-coding-session-2`)

**Topics:**

- Advanced Claude Code techniques
- Code generation and refactoring
- Debugging strategies
- Test-driven development with AI
- Real-world workflows

---

#### Session 3: ChatGPT & Copilot Power Techniques

- **Date:** Saturday, November 22nd, 2025
- **Time:** 7:00 PM - 9:00 PM (GMT)
- **Duration:** 2 hours
- **Capacity:** 50 participants
- **Status:** Scheduled & Published ✅
- **Meeting:** Jitsi (room: `vibe-coding-session-3`)

**Topics:**

- Advanced ChatGPT prompt patterns
- GitHub Copilot power user techniques
- Multi-tool workflows
- Tool comparison and selection
- Case studies

---

#### Session 4: Real-World Projects & Pro Tips

- **Date:** Saturday, November 29th, 2025
- **Time:** 7:00 PM - 9:00 PM (GMT)
- **Duration:** 2 hours
- **Capacity:** 50 participants
- **Status:** Scheduled & Published ✅
- **Meeting:** Jitsi (room: `vibe-coding-session-4`)

**Topics:**

- Building complete projects with AI
- Production best practices
- Code quality and security
- Team collaboration
- Career insights and Q&A

---

### 3. **Course Materials (18 Total)**

| #   | Session   | Type           | Title                                   |
| --- | --------- | -------------- | --------------------------------------- |
| 1   | Session 1 | Handbook       | Getting Started with AI Coding Tools    |
| 2   | Session 1 | Presentation   | Introduction to AI-Powered Development  |
| 3   | Session 1 | Recording      | Live Session Recording                  |
| 4   | Session 1 | Quick Ref      | Keyboard Shortcuts & Commands           |
| 5   | Session 2 | Handbook       | Claude Code Mastery - Complete Handbook |
| 6   | Session 2 | Presentation   | Claude Code Deep Dive                   |
| 7   | Session 2 | Recording      | Live Session Recording                  |
| 8   | Session 2 | Code Examples  | Claude Code Examples & Templates        |
| 9   | Session 3 | Handbook       | ChatGPT & Copilot Power User Guide      |
| 10  | Session 3 | Presentation   | ChatGPT & Copilot Techniques            |
| 11  | Session 3 | Recording      | Live Session Recording                  |
| 12  | Session 3 | Prompt Library | Ultimate Prompt Library for Developers  |
| 13  | Session 4 | Handbook       | Production-Ready AI Coding              |
| 14  | Session 4 | Presentation   | Real-World Projects & Best Practices    |
| 15  | Session 4 | Recording      | Live Session Recording                  |
| 16  | Session 4 | Project Repo   | Complete Project Repository             |
| 17  | Bonus     | Certificate    | Certificate of Completion               |
| 18  | Bonus     | Resources      | Additional Resources & Community Links  |

---

## 🔧 Post-Setup Configuration

### Update Meeting URLs

Before the sessions start, update the meeting URLs:

```sql
-- Generate Jitsi meeting URLs (or use your own platform)
UPDATE public.free_sessions
SET meeting_url = 'https://meet.jit.si/vibe-coding-session-1'
WHERE meeting_room_name = 'vibe-coding-session-1';

UPDATE public.free_sessions
SET meeting_url = 'https://meet.jit.si/vibe-coding-session-2'
WHERE meeting_room_name = 'vibe-coding-session-2';

UPDATE public.free_sessions
SET meeting_url = 'https://meet.jit.si/vibe-coding-session-3'
WHERE meeting_room_name = 'vibe-coding-session-3';

UPDATE public.free_sessions
SET meeting_url = 'https://meet.jit.si/vibe-coding-session-4'
WHERE meeting_room_name = 'vibe-coding-session-4';
```

### Upload Course Materials

The course materials have placeholder URLs. You need to:

1. **Create actual materials** (PDFs, presentations, recordings)
2. **Upload to storage** (Supabase Storage, S3, etc.)
3. **Update file URLs** in the database:

```sql
-- Example: Update handbook URL for Session 1
UPDATE public.course_materials
SET file_url = 'https://your-actual-storage.com/path/to/session-1-handbook.pdf'
WHERE title = 'Session 1: Getting Started with AI Coding Tools - Handbook';
```

### Enable Session Recordings

After each session, upload the recording and activate it:

```sql
-- After Session 1
UPDATE public.course_materials
SET
  file_url = 'https://your-storage.com/session-1-recording.mp4',
  is_active = true
WHERE title = 'Session 1: Live Session Recording';
```

---

## 👥 User Experience

### For Students

**Finding Sessions:**

1. Navigate to: **`https://your-domain.com/sessions`**
2. All 4 Vibe Coding sessions will be displayed
3. Students can register directly or join waitlist if full

**Viewing Course:**

1. Navigate to: **`https://your-domain.com/course/{course_id}`**
2. Course details, features, and enrollment options shown
3. After enrollment, access to all course materials

**Registration Flow:**

1. Click "Register Now" on any session card
2. Fill in: Name, Email, Date of Birth
3. If under 13: Parent email & consent required (COPPA)
4. Automatic waitlist placement if session is full
5. Email confirmation sent

### For Admins

**Managing Registrations:**

```sql
-- View all registrations for Vibe Coding sessions
SELECT
  fs.title as session_title,
  sr.full_name,
  sr.email,
  sr.status,
  sr.registered_at
FROM public.session_registrations sr
JOIN public.free_sessions fs ON fs.id = sr.session_id
WHERE fs.title LIKE 'Vibe Coding%'
ORDER BY fs.session_date, sr.registered_at;

-- Check session capacity
SELECT
  title,
  session_date,
  capacity,
  registered_count,
  waitlist_count,
  capacity - registered_count as spots_available
FROM public.free_sessions
WHERE title LIKE 'Vibe Coding%'
ORDER BY session_date;
```

**Promoting from Waitlist:**

```sql
-- Automatically done by database triggers when someone cancels
-- Or manually promote using the admin panel (to be built)
```

---

## 🎯 Next Steps

### 1. **Create Course Content**

- [ ] Design handbooks for each session
- [ ] Create presentation slides
- [ ] Prepare code examples and templates
- [ ] Build the final project repository

### 2. **Set Up Recording Infrastructure**

- [ ] Configure recording software (OBS, Zoom, etc.)
- [ ] Set up storage for recordings (Supabase Storage or S3)
- [ ] Plan post-production workflow

### 3. **Marketing & Promotion**

- [ ] Create landing page content
- [ ] Social media announcements
- [ ] Email campaigns to existing users
- [ ] Partner with developer communities

### 4. **Admin Features** (Optional)

- [ ] Build admin panel for session management
- [ ] Waitlist promotion interface
- [ ] Attendance tracking
- [ ] Certificate generation system

### 5. **Test Everything**

- [ ] Test registration flow
- [ ] Test email notifications
- [ ] Test waitlist functionality
- [ ] Test course materials access
- [ ] Test meeting room access

---

## 📊 Analytics & Monitoring

### Track Key Metrics

```sql
-- Registration stats
SELECT
  COUNT(*) as total_registrations,
  COUNT(DISTINCT session_id) as sessions_with_registrations,
  COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
  COUNT(*) FILTER (WHERE status = 'waitlisted') as waitlisted
FROM public.session_registrations sr
JOIN public.free_sessions fs ON fs.id = sr.session_id
WHERE fs.title LIKE 'Vibe Coding%';

-- Popular sessions
SELECT
  fs.title,
  COUNT(sr.id) as registrations,
  fs.capacity,
  fs.waitlist_count
FROM public.free_sessions fs
LEFT JOIN public.session_registrations sr ON sr.session_id = fs.id
WHERE fs.title LIKE 'Vibe Coding%'
GROUP BY fs.id, fs.title, fs.capacity, fs.waitlist_count
ORDER BY COUNT(sr.id) DESC;
```

---

## 🆘 Troubleshooting

### Issue: Course not showing on website

**Solution:** Check `is_active` flag:

```sql
UPDATE public.courses SET is_active = true WHERE title LIKE 'Vibe Coding%';
```

### Issue: Sessions not visible to users

**Solution:** Ensure `is_published` is true:

```sql
UPDATE public.free_sessions SET is_published = true WHERE title LIKE 'Vibe Coding%';
```

### Issue: Materials not accessible

**Solution:** Check RLS policies and enrollment status

### Issue: Email notifications not sending

**Solution:** Verify Supabase Edge Functions are deployed and configured

---

## 📞 Support

For issues or questions:

- **Email:** hirendra.vikram@aiborg.ai
- **WhatsApp:** +44 7404568207
- **GitHub Issues:** https://github.com/aiborg-ai/aiborg-ai-web/issues

---

## ✅ Checklist

- [ ] Migrations executed successfully
- [ ] Course visible in database
- [ ] 4 sessions created and published
- [ ] 18 course materials created
- [ ] Meeting URLs configured
- [ ] Course materials uploaded
- [ ] Registration tested
- [ ] Email notifications working
- [ ] Landing page updated
- [ ] Marketing materials ready

---

**🎉 Congratulations! Your Vibe Coding course is now set up and ready for registrations!**

Visit `/sessions` to see your new sessions live!
