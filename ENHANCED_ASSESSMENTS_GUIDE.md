# Enhanced Question Types - Advanced Assessments Guide

## Overview

AIBorg Learn Sphere now supports advanced question types that go beyond traditional multiple-choice assessments. This enhancement provides a richer, more engaging assessment experience with multimedia support, interactive elements, and real-world scenarios.

## New Question Types

### 1. **Scenario-Based Questions with Multimedia** 🎬

Presents learners with rich contextual scenarios supplemented by images, videos, audio, or documents.

**Use Cases:**
- Real-world business scenarios with supporting visuals
- Video demonstrations requiring analysis
- Audio-based comprehension questions
- Document analysis tasks

**Features:**
- **Media Types**: Image, Video, Audio, Document
- **Scenario Context**: Rich text description of the situation
- **Collapsible Sections**: Users can show/hide context
- **Hints System**: Optional progressive hints
- **Time Limits**: Configurable time constraints

**Example:**
```typescript
{
  question_type: 'scenario_multimedia',
  media_type: 'video',
  media_url: '/path/to/workflow-demo.mp4',
  media_caption: 'Business process demonstration',
  scenario_context: 'Your company processes 500+ orders daily...',
  metadata: {
    time_limit_seconds: 120,
    hints: ['Consider automation tools', 'Think about email processing']
  }
}
```

**Component:** `ScenarioQuestion.tsx`

---

### 2. **Drag-and-Drop Ranking/Ordering** 📊

Interactive questions where users must arrange items in correct order or rank them by importance.

**Use Cases:**
- Prioritization tasks (rank by importance, urgency, impact)
- Sequential process ordering (steps in a workflow)
- Timeline arrangement
- Hierarchical categorization

**Features:**
- **Drag-and-Drop Interface**: Smooth, intuitive reordering
- **Arrow Button Fallback**: Accessibility-friendly alternative
- **Visual Feedback**: Highlighting and hover states
- **Current Order Summary**: Shows user's arrangement
- **Partial Credit**: Awards points for correctly positioned items

**Question Types:**
- `drag_drop_ranking`: Rank items from highest to lowest
- `drag_drop_ordering`: Arrange in correct sequential order

**Example:**
```typescript
{
  question_type: 'drag_drop_ranking',
  question_text: 'Rank these AI tools by ease of adoption for beginners',
  metadata: {
    instruction: 'Drag to reorder from easiest (top) to hardest (bottom)',
    ranking_criteria: 'Ease of adoption'
  },
  options: [
    { id: '1', option_text: 'ChatGPT', correct_position: 1 },
    { id: '2', option_text: 'TensorFlow', correct_position: 4 },
    { id: '3', option_text: 'Midjourney', correct_position: 2 }
  ]
}
```

**Component:** `DragDropRanking.tsx`

---

### 3. **Code Evaluation** 💻

Presents code snippets with syntax highlighting and asks questions about functionality, bugs, or optimization.

**Use Cases:**
- Code comprehension assessment
- Bug identification
- Algorithm analysis
- Best practices evaluation
- Output prediction

**Features:**
- **Syntax Highlighting**: 20+ languages supported (Python, JavaScript, Java, etc.)
- **Dark/Light Theme Support**: Automatic theme adaptation
- **Copy Code Button**: Easy code copying
- **Complexity Analysis**: Display time/space complexity
- **Expected Output**: Show sample output
- **Concept Tags**: Badge system for related concepts

**Supported Languages:**
Python, JavaScript, TypeScript, Java, C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin, SQL, HTML, CSS, and more

**Example:**
```typescript
{
  question_type: 'code_evaluation',
  code_snippet: `
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
  `,
  code_language: 'python',
  metadata: {
    time_complexity: 'O(2^n)',
    space_complexity: 'O(n)',
    concepts: ['Recursion', 'Dynamic Programming', 'Time Complexity'],
    expected_output: 'Calculates Fibonacci sequence recursively'
  }
}
```

**Component:** `CodeEvaluation.tsx`

---

### 4. **Case Studies** 📚

Comprehensive business or technical case studies with multiple data points, stakeholders, and challenges.

**Use Cases:**
- Business decision-making scenarios
- Technical architecture choices
- Problem-solving assessments
- Strategic planning questions
- Multi-factor analysis

**Features:**
- **Tabbed Interface**: Overview, Situation, Data, Stakeholders
- **Company Profile**: Industry, size, background
- **Metrics Dashboard**: Key performance indicators with trends
- **Stakeholder Analysis**: Roles and concerns
- **Goals & Constraints**: Clear objectives and limitations
- **Collapsible Sections**: Manage information density

**Data Structure:**
```typescript
{
  question_type: 'case_study',
  case_study_data: {
    company_name: 'TechCorp Solutions',
    industry: 'E-commerce',
    company_size: '50-200 employees',
    background: 'Founded in 2020...',
    challenge: 'Customer support response time exceeds 24 hours...',
    current_situation: 'Manual ticket processing...',
    goals: ['Reduce response time to <2 hours', 'Improve satisfaction'],
    constraints: ['Budget: $50k', 'Implementation: 3 months'],
    metrics: [
      { name: 'Avg. Response Time', value: '26 hours', trend: 'down' },
      { name: 'Customer Satisfaction', value: '3.2/5', trend: 'stable' }
    ],
    stakeholders: [
      { role: 'CTO', concern: 'Technical feasibility and integration' },
      { role: 'CFO', concern: 'ROI and budget constraints' }
    ]
  },
  metadata: {
    difficulty: 'Advanced',
    time_estimate: '10-15 minutes',
    real_world_company: 'Similar to Zendesk, Intercom'
  }
}
```

**Component:** `CaseStudy.tsx`

---

## Database Schema

### Enhanced `assessment_questions` Table

```sql
-- New columns added
media_type VARCHAR(20)           -- 'image', 'video', 'audio', 'document'
media_url TEXT                   -- URL or storage path
media_caption TEXT               -- Accessibility caption
scenario_context TEXT            -- Rich text scenario
code_snippet TEXT                -- Code for evaluation
code_language VARCHAR(50)        -- Programming language
case_study_data JSONB            -- Structured case study data
metadata JSONB                   -- Flexible configuration
irt_difficulty DECIMAL(4,2)      -- IRT difficulty parameter
```

### Enhanced `assessment_question_options` Table

```sql
-- New columns added
correct_position INTEGER         -- For drag-drop (1-indexed)
option_image_url TEXT           -- Visual options
```

---

## Validation Functions

### Drag-Drop Validation

```sql
SELECT * FROM validate_drag_drop_answer(
  p_question_id := 'uuid-here',
  p_user_ordering := ARRAY['uuid1', 'uuid2', 'uuid3']
);
```

**Returns:**
- `is_correct`: Perfect match boolean
- `points_earned`: Total points (with partial credit)
- `correct_ordering`: The correct order
- `position_scores`: Per-item breakdown

### Code Evaluation Validation

```sql
SELECT * FROM validate_code_evaluation(
  p_question_id := 'uuid-here',
  p_selected_options := ARRAY['uuid1', 'uuid2']
);
```

---

## Adaptive Question Selection

The enhanced `get_next_adaptive_question` function now returns:

```typescript
{
  question_id: UUID,
  question_text: string,
  question_type: string,
  difficulty_level: string,
  irt_difficulty: number,
  category_name: string,
  // Enhanced fields
  media_type?: string,
  media_url?: string,
  media_caption?: string,
  scenario_context?: string,
  code_snippet?: string,
  code_language?: string,
  case_study_data?: object,
  metadata?: object,
  options: array
}
```

---

## Frontend Integration

### Component Usage

```tsx
import { ScenarioQuestion } from '@/components/ai-assessment/ScenarioQuestion';
import { DragDropRanking } from '@/components/ai-assessment/DragDropRanking';
import { CodeEvaluation } from '@/components/ai-assessment/CodeEvaluation';
import { CaseStudy } from '@/components/ai-assessment/CaseStudy';

// Render based on question type
switch (question.question_type) {
  case 'scenario_multimedia':
    return <ScenarioQuestion question={question} />;

  case 'drag_drop_ranking':
    return <DragDropRanking question={question} />;

  case 'code_evaluation':
    return <CodeEvaluation question={question} />;

  case 'case_study':
    return <CaseStudy question={question} />;
}
```

### Type Definitions

All question types are defined in `AdaptiveAssessmentEngine.ts`:

```typescript
export interface AdaptiveQuestion {
  id: string;
  question_type: 'single_choice' | 'multiple_choice' |
                 'scenario_multimedia' | 'drag_drop_ranking' |
                 'drag_drop_ordering' | 'code_evaluation' |
                 'case_study';
  // ... enhanced fields
}
```

---

## Deployment Steps

### 1. Run Database Migration

```bash
# Execute in Supabase SQL Editor
psql -h [host] -U postgres -d postgres \
  -f supabase/migrations/20251004100000_enhanced_question_types.sql
```

### 2. Install Dependencies

```bash
npm install react-syntax-highlighter @types/react-syntax-highlighter
```

### 3. Verify Components

Check that all new components are created:
- ✅ `ScenarioQuestion.tsx`
- ✅ `DragDropRanking.tsx`
- ✅ `CodeEvaluation.tsx`
- ✅ `CaseStudy.tsx`

### 4. Test Question Types

Create sample questions for each type and verify rendering in the assessment wizard.

---

## Creating Sample Questions

### Example: Scenario Question

```sql
INSERT INTO assessment_questions (
  question_text,
  question_type,
  difficulty_level,
  irt_difficulty,
  category_id,
  media_type,
  media_url,
  media_caption,
  scenario_context,
  metadata
) VALUES (
  'Based on the workflow diagram, which AI tool would best automate this process?',
  'scenario_multimedia',
  'applied',
  0.5,
  (SELECT id FROM assessment_categories WHERE name = 'Automation' LIMIT 1),
  'image',
  '/assets/workflow-diagram.png',
  'Manual order processing workflow',
  'Your company processes 200+ daily orders manually: 1) Email reception, 2) Data entry, 3) Inventory check, 4) Invoice creation, 5) Email confirmation. This takes 3 hours/day.',
  '{"time_limit_seconds": 120, "hints": ["Think about email automation", "Consider spreadsheet tools"]}'::jsonb
);
```

### Example: Drag-Drop Ranking

```sql
-- Insert question
INSERT INTO assessment_questions (
  question_text,
  question_type,
  difficulty_level,
  metadata
) VALUES (
  'Rank these AI adoption barriers by impact on small businesses',
  'drag_drop_ranking',
  'applied',
  '{"instruction": "Rank from highest impact (top) to lowest impact (bottom)", "ranking_criteria": "Impact on SMEs"}'::jsonb
)
RETURNING id;

-- Insert options with correct_position
INSERT INTO assessment_question_options (question_id, option_text, correct_position, points)
VALUES
  ('[question-id]', 'High initial cost', 1, 10),
  ('[question-id]', 'Lack of technical expertise', 2, 8),
  ('[question-id]', 'Data privacy concerns', 3, 6),
  ('[question-id]', 'Integration complexity', 4, 4);
```

---

## Benefits of Enhanced Question Types

### For Learners
- ✅ More engaging and interactive assessments
- ✅ Real-world scenario practice
- ✅ Visual and multimedia learning support
- ✅ Hands-on problem-solving experience

### For Instructors
- ✅ Richer assessment of practical skills
- ✅ Better alignment with job requirements
- ✅ More accurate skill measurement
- ✅ Enhanced content variety

### For the Platform
- ✅ Differentiation from competitors
- ✅ Higher completion rates
- ✅ Better learning outcomes
- ✅ Premium feature positioning

---

## Future Enhancements

Potential additions to consider:

1. **Interactive Simulations**: Embedded sandbox environments
2. **Peer Review Questions**: Evaluate code/solutions from other learners
3. **Branching Scenarios**: Choose-your-own-adventure style assessments
4. **Timed Challenges**: Speed-based competitive assessments
5. **Voice Response**: Spoken answer recording and analysis
6. **Collaborative Questions**: Team-based problem solving

---

## Support & Feedback

For questions or issues with enhanced question types:
- **Documentation**: This file
- **Code Examples**: Check `/src/components/ai-assessment/*`
- **Database Functions**: `/supabase/migrations/20251004100000_enhanced_question_types.sql`

---

**Last Updated**: October 4, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
