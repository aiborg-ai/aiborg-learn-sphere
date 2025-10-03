# Assessment Question Curation Strategy

## Overview

This document describes the intelligent curation and adaptive selection strategy for the AI
Augmentation Assessment system.

## System Architecture

### 1. Profiling System

**Purpose**: Collect user information before assessment to personalize question selection

**Data Collected**:

- **audience_type**: primary, secondary, professional, business
- **experience_level**: none, basic, intermediate, advanced
- **goals**: Array of selected goals (e.g., 'automation', 'productivity', 'learning')
- **industry/job_role**: For professionals/business users
- **current_tools**: AI tools already in use

### 2. Question Metadata

Each question now includes:

```sql
{
  "audience_filters": ["secondary", "professional"],
  "difficulty_level": "applied",  -- foundational|applied|advanced|strategic
  "recommended_experience_level": "intermediate",  -- none|basic|intermediate|advanced
  "tags": ["techniques", "chain-of-thought", "problem-solving"],
  "prerequisite_concepts": ["basic-prompting"]
}
```

### 3. Difficulty Levels Explained

| Level            | Description                 | Target Audience       | Example                            |
| ---------------- | --------------------------- | --------------------- | ---------------------------------- |
| **Foundational** | Basic concepts, definitions | All audiences         | "What is prompt engineering?"      |
| **Applied**      | Practical usage, techniques | Secondary+            | "When to use few-shot prompting?"  |
| **Advanced**     | Deep technical knowledge    | Professional          | "Troubleshooting prompt injection" |
| **Strategic**    | Business/leadership focus   | Professional/Business | "ROI of AI automation"             |

### 4. Experience Level Mapping

| Level            | Description                    | Assessment Behavior                              |
| ---------------- | ------------------------------ | ------------------------------------------------ |
| **None**         | No AI tool experience          | Start with foundational, max 15 questions        |
| **Basic**        | Tried a few tools              | Mix foundational (40%) + applied (60%)           |
| **Intermediate** | Regular AI user                | Applied (50%) + advanced (30%) + strategic (20%) |
| **Advanced**     | Proficient with multiple tools | Advanced (60%) + strategic (40%)                 |

## Question Distribution by Audience

### Primary (Young Learners, Ages 8-14)

**Total Questions**: 10-12 questions, 5-8 minutes **Categories**:

- LLM Fundamentals: 3 questions (simplified language)
  - Q: "What is the MAIN purpose of a large language model?"
  - Q: "Why do LLMs give wrong answers sometimes?"
  - Q: "How should you use AI for homework?"
- Daily Productivity: 2 questions (basic tools)
- Content Creation: 2 questions (fun/creative)
- Learning & Research: 3 questions (study aids)
- Creative Tools: 2 questions (age-appropriate)

**Excluded**: Prompt Engineering, AI Agents, Development Platforms, Data & Analytics, Automation

### Secondary (Teenagers, Ages 15-19)

**Total Questions**: 15-20 questions, 8-12 minutes **Categories Included**:

- LLM Fundamentals: 4-5 questions
- Prompt Engineering: 5-8 questions (foundational + applied)
  - Include: Q1-Q5, Q8, Q9, Q10, Q15
  - Focus: Basics, common techniques, safety
- AI Agents: 3 questions (Q1-Q3, real-world examples)
- Daily Productivity: 3-4 questions
- Content Creation: 3-4 questions
- Learning & Research: 4-5 questions
- Development & Coding: 2-3 questions (if interested)

**Excluded**: Business-specific, advanced technical, strategic questions

### Professional

**Total Questions**: 20-30 questions, 12-20 minutes **All Categories Available**: Personalized based
on job_role and goals

**Role-Based Selection**:

- **Developers**: Full Prompt Engineering + AI Agents + Development Platforms
- **Marketers**: Content Creation + Communication + Data & Analytics basics
- **Data Analysts**: Data & Analytics + Automation + Prompt Engineering
- **Managers**: Strategic questions across all categories

**Difficulty Distribution**:

- Experience=none: Foundational 60%, Applied 40%
- Experience=basic: Foundational 30%, Applied 60%, Advanced 10%
- Experience=intermediate: Applied 40%, Advanced 40%, Strategic 20%
- Experience=advanced: Advanced 50%, Strategic 50%

### Business (SMEs)

**Total Questions**: 15-25 questions, 10-15 minutes **Focus Areas**:

- Automation: 5-6 questions (ROI, efficiency)
- Data & Analytics: 4-5 questions (business intelligence)
- Communication: 3-4 questions (customer experience)
- Prompt Engineering: 5-7 questions (business-focused)
  - Q11, Q19, Q20 (enterprise, ethics, trends)
  - Q1, Q2, Q3 (basics)
  - Q5, Q17 (practical application)

**Excluded**: Deep technical implementation, coding specifics

## Adaptive Selection Algorithm

### Phase 1: Initial Scoring (First 5 Questions)

```
1. Select 5 foundational questions across 3-4 categories
2. Based on profiling, prioritize relevant categories
3. Track user performance (score %)
```

### Phase 2: Adaptive Difficulty (Next 10-15 Questions)

```
IF score > 80% THEN
  - Increase difficulty: More advanced/strategic questions
  - Expand to specialized categories
ELSE IF score < 50% THEN
  - Keep foundational level
  - Recommend learning resources
  - Limit to 10-12 total questions
ELSE
  - Continue with planned difficulty mix
END IF
```

### Phase 3: Category Deep Dive (Optional 5-10 Questions)

```
After core assessment:
- Show category scores
- "Want to test your knowledge in [Weak Category]?"
- User selects 1-2 categories for deep dive
```

## SQL Function for Recommendation

```sql
-- Get recommended questions for a user
SELECT * FROM get_recommended_questions(
  p_audience_type := 'professional',
  p_experience_level := 'intermediate',
  p_goals := ARRAY['automation', 'productivity'],
  p_limit := 25
);
```

**Relevance Scoring**:

- Perfect audience match: +20 points
- Experience level match: +15 points
- Goal alignment (tags match): +15 points
- Total possible: 50 points

## Implementation Checklist

- [x] Add metadata fields to questions table
- [x] Create relevance scoring function
- [x] Tag all 41 new questions with metadata
- [ ] Update AIAssessmentWizard.tsx to use scoring function
- [ ] Implement adaptive difficulty logic
- [ ] Add category deep-dive option
- [ ] Create recommendation engine for weak areas

## Quality Metrics

**Target Metrics**:

- Completion rate: 85%+
- Time per question: 20-30 seconds average
- User satisfaction: 4.5/5+ stars
- Assessment relevance score: 4.5/5+

**Assessment Length Guidelines**: | Audience | Questions | Time | Completion Target |
|----------|-----------|------|-------------------| | Primary | 10-12 | 5-8 min | 90%+ | | Secondary
| 15-20 | 8-12 min | 85%+ | | Professional | 20-30 | 12-20 min | 80%+ | | Business | 15-25 | 10-15
min | 85%+ |

## Next Steps

1. **Execute migrations** in order:

   ```bash
   # 1. Add metadata fields
   psql ... -f supabase/migrations/20251002150000_add_question_metadata.sql

   # 2. Insert curated questions
   psql ... -f scripts/CURATED_ASSESSMENT_QUESTIONS_ALL.sql

   # 3. Insert answer options
   psql ... -f scripts/CURATED_ASSESSMENT_OPTIONS.sql
   ```

2. **Update frontend**:
   - Modify `AIAssessmentWizard.tsx` to call `get_recommended_questions()`
   - Implement adaptive difficulty based on real-time performance
   - Add category selection UI for deep dives

3. **Testing**:
   - Test each audience type with different experience levels
   - Verify question relevance scores
   - Measure completion rates and time

4. **Monitor and iterate**:
   - Track which questions have high drop-off rates
   - Analyze score distributions
   - Refine difficulty classifications based on data

## Example User Journeys

### Journey 1: High School Student (Secondary, Basic Experience)

1. **Profiling**: Age 16, tried ChatGPT a few times, goals: college prep, AI career
2. **Questions** (18 total, ~10 min):
   - LLM Fundamentals: 5 questions (basics + safety)
   - Prompt Engineering: 6 questions (Q1-Q5, Q10)
   - AI Agents: 3 questions (Q1-Q3)
   - Learning & Research: 4 questions
3. **Performance**: 75% → Receives "Intermediate User" badge
4. **Recommendations**: Prompt engineering course, AI ethics resources

### Journey 2: Marketing Professional (Professional, Intermediate Experience)

1. **Profiling**: Marketer, uses ChatGPT & Canva AI daily, goals: productivity, content creation
2. **Questions** (25 total, ~15 min):
   - Content Creation: 6 questions
   - Prompt Engineering: 8 questions (applied + advanced)
   - Communication: 4 questions
   - Data & Analytics: 3 questions (basics)
   - LLM Fundamentals: 4 questions
3. **Performance**: 85% → Receives "Advanced User" badge
4. **Recommendations**: Advanced content automation, data visualization tools

### Journey 3: SME Owner (Business, Basic Experience)

1. **Profiling**: Restaurant owner, minimal AI use, goals: reduce costs, improve efficiency
2. **Questions** (18 total, ~12 min):
   - Automation: 5 questions (business ROI focus)
   - Communication: 3 questions (customer service)
   - Prompt Engineering: 5 questions (Q1, Q2, Q3, Q11, Q19)
   - Data & Analytics: 3 questions (basic BI)
   - LLM Fundamentals: 2 questions
3. **Performance**: 60% → Receives "Emerging User" badge
4. **Recommendations**: AI automation starter course, customer service chatbots

## Conclusion

This curation strategy ensures that every user receives a relevant, engaging, and appropriately
challenging assessment that accurately measures their AI augmentation level while providing
actionable insights for growth.
