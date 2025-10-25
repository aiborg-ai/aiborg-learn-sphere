# Admin Question Management Guide

## 🎯 Overview

The Admin Question Management portal allows administrators to create, edit, and manage assessment
questions through a user-friendly interface without writing SQL.

## 📍 Accessing the Portal

**URL**: https://aiborg.ai/admin/assessment-questions

**Access**: Admin users only

---

## ✨ Features

### 1. **View All Questions**

- See all assessment questions in a table
- View question text, category, difficulty, audiences, and status
- Filter by difficulty level
- Filter by audience type
- Search questions by text

### 2. **Create New Questions**

- Click **"Add Question"** button
- Fill in question details:
  - **Category**: AI Fundamentals, AI Applications, etc.
  - **Question Text**: The actual question
  - **Help Text**: Optional hint for users
  - **Question Type**: Single choice, Multiple choice, Scale, Frequency
  - **Difficulty Level**: Foundational to Strategic
  - **Cognitive Level**: Remember to Create (Bloom's Taxonomy)
  - **IRT Difficulty**: -3 (easy) to +3 (hard)
  - **Target Audiences**: Primary, Secondary, Professional, Business
  - **Points Value**: How many points this question is worth

- **Add Answer Options** (for single/multiple choice):
  - Option text
  - Option value (slug)
  - Points awarded
  - Mark as correct answer

### 3. **Edit Questions**

- Click the **Edit** icon (pencil) on any question
- Modify any field
- Update answer options
- Save changes

### 4. **Delete Questions**

- Click the **Delete** icon (trash) on any question
- Confirm deletion
- Question and all options are permanently removed

### 5. **Filter & Search**

- **Search**: Type keywords to find questions
- **Difficulty Filter**: Show only specific difficulty levels
- **Audience Filter**: Show only questions for specific audiences

---

## 📝 Creating a Question - Step by Step

### Step 1: Click "Add Question"

### Step 2: Fill in Basic Details

```
Category: AI Fundamentals
Question Text: What is machine learning?
Help Text: Think about how computers learn from data
Question Type: Single Choice
Points Value: 10
```

### Step 3: Set Difficulty

```
Difficulty Level: Intermediate
Cognitive Level: Understand
IRT Difficulty: 0.0 (medium difficulty)
```

### Step 4: Select Audiences

✅ Primary ✅ Secondary ✅ Professional ☐ Business

### Step 5: Add Answer Options

**Option 1:**

- Text: "A way for computers to learn from data without being explicitly programmed"
- Value: "correct_answer"
- Points: 10
- ✅ Is Correct

**Option 2:**

- Text: "A programming language for AI"
- Value: "wrong_answer_1"
- Points: 0
- ☐ Is Correct

**Option 3:**

- Text: "A type of computer hardware"
- Value: "wrong_answer_2"
- Points: 0
- ☐ Is Correct

### Step 6: Save

Click **"Save Question"**

---

## 🔗 Linking Questions to Assessment Tools

After creating questions, you need to link them to assessment tools (AI-Awareness, AI-Fluency,
etc.).

**Option 1: Manual SQL** (for now)

```sql
-- Link question to AI-Awareness tool
INSERT INTO assessment_question_pools (tool_id, question_id, is_active, weight)
VALUES (
  (SELECT id FROM assessment_tools WHERE slug = 'ai-awareness'),
  'your-question-id-here',
  true,
  1.0
);
```

**Option 2: Bulk Link by Category** (recommended)

```sql
-- Link all AI Fundamentals questions to AI-Awareness
INSERT INTO assessment_question_pools (tool_id, question_id, is_active, weight)
SELECT
  (SELECT id FROM assessment_tools WHERE slug = 'ai-awareness'),
  id,
  true,
  1.0
FROM assessment_questions
WHERE is_active = true
  AND category_id IN (
    SELECT id FROM assessment_categories
    WHERE name = 'AI Fundamentals'
  )
ON CONFLICT (tool_id, question_id) DO NOTHING;
```

---

## 📊 Understanding Question Fields

### **Difficulty Level**

- **Foundational/Beginner**: Entry-level, basic concepts
- **Applied/Intermediate**: Practical application, medium difficulty
- **Advanced**: High difficulty, complex concepts
- **Expert/Strategic**: Expert-level, strategic thinking

### **Cognitive Level** (Bloom's Taxonomy)

- **Remember**: Recall facts
- **Understand**: Explain concepts
- **Apply**: Use in new situations
- **Analyze**: Break down into parts
- **Evaluate**: Make judgments
- **Create**: Produce new work

### **IRT Difficulty**

- **-3 to -1**: Very easy to easy
- **-0.5 to 0.5**: Medium difficulty
- **1 to 3**: Hard to very hard

### **Audience Filters**

- **Primary**: Young learners (ages 6-11)
- **Secondary**: Teenagers (ages 12-17)
- **Professional**: Working professionals
- **Business**: Business leaders, decision makers

---

## 🎨 Best Practices

### Question Writing

1. **Be Clear**: Write questions in simple, direct language
2. **Single Concept**: Test one concept per question
3. **Avoid Negatives**: Don't use "NOT" or "EXCEPT" unless necessary
4. **4 Options**: Provide 3-4 answer choices for multiple choice
5. **Plausible Distractors**: Wrong answers should be believable

### Difficulty Balance

- **Easy (30%)**: Foundational/Beginner questions
- **Medium (50%)**: Applied/Intermediate questions
- **Hard (20%)**: Advanced/Expert questions

### Audience Targeting

- **Primary**: Use simple language, relatable examples
- **Secondary**: Age-appropriate topics, engaging scenarios
- **Professional**: Work-relevant applications
- **Business**: Strategic, ROI-focused

---

## 🔍 Troubleshooting

### "Category dropdown is empty"

**Issue**: No categories exist **Fix**: Run migration to create categories or add them manually:

```sql
INSERT INTO assessment_categories (name)
VALUES
  ('AI Fundamentals'),
  ('AI Applications'),
  ('AI Ethics');
```

### "Can't save question"

**Issue**: Missing required fields or validation errors **Fix**: Check that:

- Question text is at least 5 characters
- Category is selected
- At least one audience is selected
- At least one option exists (for choice questions)
- At least one option is marked as correct

### "Question doesn't appear in assessment"

**Issue**: Question not linked to assessment tool **Fix**: Link the question to the tool using SQL
(see "Linking Questions" section)

---

## 🚀 Future Enhancements

Coming soon:

- ✅ Question preview before saving
- ✅ Bulk import questions from CSV
- ✅ Question duplication feature
- ✅ Visual question pool manager (drag & drop linking)
- ✅ Question analytics (difficulty calibration)
- ✅ Question versioning & history

---

## 📱 Screenshots

### Main Questions List

- Table view with all questions
- Search and filter controls
- Edit/Delete actions

### Add Question Form

- Comprehensive form with all fields
- Dynamic answer options
- Audience multi-select
- Validation messages

### Edit Question

- Pre-populated form
- Update any field
- Save changes instantly

---

## 🎓 Example Questions

### AI-Awareness (Beginner)

```
Question: What does AI stand for?
Category: AI Fundamentals
Difficulty: Foundational
Cognitive: Remember
IRT: -1.5
Audiences: Primary, Secondary, Professional

Options:
✅ Artificial Intelligence (10 pts)
☐ Amazing Internet (0 pts)
☐ Automatic Information (0 pts)
☐ Apple Intelligence (0 pts)
```

### AI-Fluency (Advanced)

```
Question: How would you craft a prompt to generate a creative story?
Category: Prompt Engineering
Difficulty: Applied
Cognitive: Apply
IRT: 0.3
Audiences: Secondary, Professional

Options:
✅ "Write a creative story about a friendly dragon who helps people in a medieval village, including dialogue and a moral lesson" (15 pts)
☐ "Story" (0 pts)
☐ "Write something creative" (0 pts)
☐ "Do my homework" (0 pts)
```

---

## 💡 Tips

1. **Start Small**: Create 5-10 questions first, test them, then add more
2. **Review Existing**: Check the current questions to match the style
3. **Test Assessments**: Take the assessments yourself after adding questions
4. **Monitor Analytics**: Track which questions are too easy/hard
5. **Iterate**: Update questions based on user performance data

---

## 📞 Support

Need help? Contact the development team or check:

- Main documentation: `ASSESSMENT_TOOLS_SETUP_GUIDE.md`
- Migration guide: `MIGRATION_SEQUENCE_GUIDE.md`
- API documentation: `src/hooks/useAssessmentQuestions.ts`

---

**Happy question creating!** 🎉
