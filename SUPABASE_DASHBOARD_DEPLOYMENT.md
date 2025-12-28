# Supabase Dashboard Deployment Guide

**Complete step-by-step guide for deploying the enhanced ai-chat-rag function via Supabase
Dashboard**

---

## 📋 Prerequisites

You'll need these 4 files ready:

- ✅ `index.ts` (main function)
- ✅ `domain-knowledge.ts` (NEW - domain expertise)
- ✅ `prompts.ts` (category prompts)
- ✅ `question-classifier.ts` (question classification)

**Location**: `/home/vik/aiborg_CC/aiborg-learn-sphere/supabase/functions/ai-chat-rag/`

---

## 🚀 Deployment Steps

### Step 1: Open Supabase Dashboard

1. **Go to**: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/functions

2. You should see the **Edge Functions** page with a list of your functions

### Step 2: Locate the ai-chat-rag Function

1. **Look for** `ai-chat-rag` in the functions list
2. **Click on it** to open the function details

**If you don't see ai-chat-rag:**

- Click **"New Edge Function"** button
- Enter name: `ai-chat-rag`
- Click **"Create function"**

### Step 3: Upload Function Files

#### Method A: Using the Web Editor (Recommended)

1. **Click on** the `index.ts` file tab (should open automatically)

2. **Open your local file**:

   ```bash
   # In a new terminal, open the file:
   cat /home/vik/aiborg_CC/aiborg-learn-sphere/supabase/functions/ai-chat-rag/index.ts
   ```

3. **Copy the entire contents** of `index.ts`

4. **In the Dashboard**:
   - Click inside the editor
   - Select all existing code (Ctrl+A)
   - Paste your copied code (Ctrl+V)

5. **Add the other files**:
   - Look for **"+ Add file"** or **"New file"** button
   - Create `domain-knowledge.ts`:
     - Click **"+ Add file"**
     - Name: `domain-knowledge.ts`
     - Copy content from local file:
       ```bash
       cat /home/vik/aiborg_CC/aiborg-learn-sphere/supabase/functions/ai-chat-rag/domain-knowledge.ts
       ```
     - Paste into editor

6. **Repeat for remaining files**:
   - Create `prompts.ts`
   - Create `question-classifier.ts`

#### Method B: Using File Upload (If Available)

1. **Look for "Upload" or "Import"** button

2. **Navigate to**:

   ```
   /home/vik/aiborg_CC/aiborg-learn-sphere/supabase/functions/ai-chat-rag/
   ```

3. **Select all 4 files** and upload

### Step 4: Verify Files Are Present

Before deploying, make sure you see all 4 files in the file list:

- ✅ index.ts
- ✅ domain-knowledge.ts
- ✅ prompts.ts
- ✅ question-classifier.ts

### Step 5: Deploy the Function

1. **Click the "Deploy" button** (usually in the top-right)

2. **Deployment starts**:
   - You'll see a progress indicator
   - Status will change from "Building" → "Deploying" → "Active"
   - This takes 30-60 seconds

3. **Wait for success message**:
   - ✅ "Function deployed successfully"
   - Status should show: **● Active**

### Step 6: Test the Deployment

#### Quick Test in Dashboard

1. **Look for "Invoke" or "Test" tab**

2. **Enter test payload**:

   ```json
   {
     "messages": [
       {
         "role": "user",
         "content": "I want to learn NLP, what should I study?"
       }
     ],
     "enable_rag": true,
     "include_user_context": false
   }
   ```

3. **Click "Send" or "Invoke"**

4. **Check the response**:
   - Should see a detailed response
   - Should mention specific courses like "NLP Mastery" or "Deep Learning Specialization"
   - Should include learning paths

#### Test via curl

```bash
curl -X POST "https://afrulkxxzcmngbrdfuzj.supabase.co/functions/v1/ai-chat-rag" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcnVsa3h4emNtbmdicmRmdXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzcyMTYsImV4cCI6MjA2ODcxMzIxNn0.Rr2pgSKeyUK1PdMpV7N0Mi6VU08CvWBQBfn75u4NqfY" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "What are the prerequisites for deep learning?"
      }
    ],
    "enable_rag": true
  }'
```

**Expected Response**: Should mention "Machine Learning Fundamentals", "Linear Algebra", "Python",
etc.

---

## ✅ Success Indicators

Your deployment is successful if:

1. ✅ **Status shows "Active"** (green dot)
2. ✅ **Response includes specific course names** (not generic advice)
3. ✅ **Mentions learning paths** like "NLP Specialist Track" or "Complete AI/ML Journey"
4. ✅ **References difficulty levels** (beginner, intermediate, advanced)
5. ✅ **No error messages** in the response

---

## 🐛 Troubleshooting

### Error: "Function failed to start"

**Possible Causes**:

- Missing files (need all 4 TypeScript files)
- Syntax error in one of the files

**Solution**:

1. Click on **"Logs"** tab to see error details
2. Check that all 4 files are present
3. Verify no copy-paste errors in the code

### Error: "Import not found"

**Cause**: One of the import statements can't find the module

**Solution**:

1. Make sure file names match exactly:
   - `domain-knowledge.ts` (not `domain-knowledge.tsx` or `domainKnowledge.ts`)
   - `prompts.ts`
   - `question-classifier.ts`

2. Check imports in `index.ts`:
   ```typescript
   import {
     generateDomainKnowledgePrompt,
     getCourseDetails,
     getRecommendedPath,
   } from './domain-knowledge.ts';
   import { generateSystemPrompt, calculateContextualWeight, type UserContext } from './prompts.ts';
   import { classifyQuestion, type QuestionCategory } from './question-classifier.ts';
   ```

### Response is Generic (No Domain Knowledge)

**Cause**: Deployment succeeded but domain knowledge not being used

**Check**:

1. Look for this code in deployed `index.ts` (around line 195):

   ```typescript
   systemPrompt += '\n\n' + generateDomainKnowledgePrompt(classification.category, userLevel);
   ```

2. If missing, the wrong version was deployed

**Solution**: Re-upload the correct `index.ts` file

---

## 📁 File Checklist

Before deploying, verify each file has these key sections:

### ✅ index.ts

- Lines 21-25: Imports from domain-knowledge, prompts, question-classifier
- Lines 195-201: Domain knowledge integration
- Line 329: `enrichDomainKnowledge` function

### ✅ domain-knowledge.ts

- Lines 89-168: `generateDomainKnowledgePrompt` function
- Lines 202-264: `getCurriculumKnowledge` function
- Lines 266-376: `getCourseMetadata` function
- Lines 378-497: `getLearningPaths` function

### ✅ prompts.ts

- Lines 25-59: `generateSystemPrompt` function
- Lines 361-409: `calculateContextualWeight` function

### ✅ question-classifier.ts

- Contains `classifyQuestion` function

---

## 🎯 Quick Copy Commands

To quickly copy file contents for pasting into Dashboard:

```bash
# Copy index.ts
cat /home/vik/aiborg_CC/aiborg-learn-sphere/supabase/functions/ai-chat-rag/index.ts

# Copy domain-knowledge.ts
cat /home/vik/aiborg_CC/aiborg-learn-sphere/supabase/functions/ai-chat-rag/domain-knowledge.ts

# Copy prompts.ts
cat /home/vik/aiborg_CC/aiborg-learn-sphere/supabase/functions/ai-chat-rag/prompts.ts

# Copy question-classifier.ts
cat /home/vik/aiborg_CC/aiborg-learn-sphere/supabase/functions/ai-chat-rag/question-classifier.ts
```

Select the output, copy it (Ctrl+Shift+C), then paste into Dashboard editor.

---

## 📊 Verification Test Script

After deploying, run this to verify domain knowledge is working:

```bash
# Test 1: Learning path recommendation
curl -s -X POST "https://afrulkxxzcmngbrdfuzj.supabase.co/functions/v1/ai-chat-rag" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcnVsa3h4emNtbmdicmRmdXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzcyMTYsImV4cCI6MjA2ODcxMzIxNn0.Rr2pgSKeyUK1PdMpV7N0Mi6VU08CvWBQBfn75u4NqfY" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "I want to learn NLP"}]
  }' | grep -o '"response":"[^"]*"' | head -c 500

echo ""
echo "---"
echo ""

# Test 2: Prerequisites
curl -s -X POST "https://afrulkxxzcmngbrdfuzj.supabase.co/functions/v1/ai-chat-rag" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcnVsa3h4emNtbmdicmRmdXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzcyMTYsImV4cCI6MjA2ODcxMzIxNn0.Rr2pgSKeyUK1PdMpV7N0Mi6VU08CvWBQBfn75u4NqfY" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "What are prerequisites for deep learning?"}]
  }' | grep -o '"response":"[^"]*"' | head -c 500
```

Look for these keywords in responses:

- ✅ "NLP Specialist Track" or "learning path"
- ✅ "Machine Learning Fundamentals"
- ✅ "Linear Algebra"
- ✅ Specific course names from your platform

---

## 🎉 You're Done!

Once deployment is successful and tests pass, your chatbot has:

✅ **Curriculum knowledge** (beginner → expert levels) ✅ **Course catalog** (6 detailed courses) ✅
**Learning paths** (4 structured paths) ✅ **Concept relationships** (prerequisites, related topics)
✅ **Teaching strategies** (pedagogical best practices)

Your AI chatbot is now a **domain expert learning advisor**! 🚀
