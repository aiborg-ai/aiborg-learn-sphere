# Early Submission Detection - Implementation Guide

## Overview

Early submission detection has been fully implemented for both **homework assignments** and **AI
assessments**. The system rewards users for completing work efficiently while maintaining quality.

## Features

### 1. Homework/Assignment Early Submission

- **Location**: `src/components/homework/SubmissionForm.tsx`
- **Utility**: `src/utils/earlySubmissionDetection.ts`
- **Badge Component**: `src/components/homework/EarlySubmissionBadge.tsx`

**Tiers**:

- **Very Early**: 7+ days before due date → 5% bonus
- **Early**: 3-7 days before due date → 3% bonus
- **On Time**: 1-3 days before due date → 1% bonus

### 2. AI Assessment Early Completion

- **Location**: `src/components/ai-assessment/wizard/hooks/useAssessmentSubmit.ts`
- **Incentive Component**: `src/components/ai-assessment/EarlyCompletionIncentive.tsx`

**Tiers** (based on estimated completion time):

- **Excellent**: Completed in < 50% of estimated time → 5% bonus
- **Great**: Completed in 50-70% of estimated time → 3% bonus
- **Good**: Completed in 70-90% of estimated time → 1% bonus

**Requirements for Bonus**:

- Score must be ≥ 50% to qualify for early completion bonus
- Encourages both speed AND accuracy

## Database Fields

### AI Assessments Table

The following fields are now tracked in `user_ai_assessments`:

```sql
early_completion_bonus: integer          -- Bonus points earned
early_completion_category: text          -- 'very-early', 'early', 'on-time', etc.
time_efficiency_percentage: numeric      -- Percentage of estimated time used
```

## Usage Examples

### In Homework Submissions

```typescript
import { detectEarlySubmission, calculateBonusPoints } from '@/utils/earlySubmissionDetection';

const result = detectEarlySubmission(submissionDate, {
  dueDate: assignment.due_date,
  postedDate: assignment.posted_date,
  bonusPoints: { enabled: true },
});

const bonus = calculateBonusPoints(baseScore, result);
```

### In AI Assessments

```typescript
import { EarlyCompletionIncentive } from '@/components/ai-assessment/EarlyCompletionIncentive';

<EarlyCompletionIncentive
  estimatedTimeMinutes={questionCount * 2}
  elapsedTimeMinutes={elapsedMinutes}
  questionCount={totalQuestions}
  questionsAnswered={answeredCount}
  currentScore={currentScorePercentage}
/>
```

### Display Badges

```typescript
import { EarlySubmissionBadge } from '@/components/homework/EarlySubmissionBadge';

<EarlySubmissionBadge
  result={earlySubmissionResult}
  showBonus={true}
  bonusPoints={calculatedBonus}
  variant="alert"
/>
```

## Key Functions

### detectEarlySubmission

Analyzes submission timing and returns detailed results:

- Category (very-early, early, on-time, late, overdue)
- Days/hours before due date
- Time percentage used
- Bonus percentage
- Human-readable message
- Recommended badge icon and color scheme

### calculateBonusPoints

Computes actual bonus points based on base score and submission result.

### getSubmissionUrgency

Returns urgency level and messaging for UI alerts:

- Critical: < 24 hours or past due
- High: 1-3 days remaining
- Medium: 4-7 days remaining
- Low: 7+ days remaining

### formatTimeRemaining

Converts time difference to human-readable format:

- "5d 3h remaining"
- "2h 45m remaining"
- "3 days overdue"

## Benefits

1. **Motivates Early Work**: Visual incentives encourage students to start early
2. **Rewards Efficiency**: Bonus points for quick, accurate completion
3. **Reduces Procrastination**: Gamification elements reduce last-minute rushes
4. **Fair Grading**: Bonus only applies when quality meets threshold
5. **Analytics**: Track completion patterns and student behavior

## Future Enhancements

- [ ] Streak bonuses for consistent early submissions
- [ ] Leaderboard for fastest completions
- [ ] Achievement badges for early completion milestones
- [ ] Email notifications for upcoming deadlines
- [ ] Calendar integration with early submission goals

## Testing

Run the following to verify implementation:

```bash
npm run typecheck  # Verify TypeScript types
npm run build      # Ensure builds successfully
```

All components are fully typed with zero TypeScript errors.
