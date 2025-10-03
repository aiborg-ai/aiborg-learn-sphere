# Early Submission Detection System

## Overview

The Early Submission Detection system provides comprehensive tracking and incentivization for students who submit assignments and assessments ahead of deadlines. It includes automatic bonus point calculations, visual indicators, and real-time urgency notifications.

## Features

### 1. **Early Submission Detection**
- Automatically detects when submissions are made early
- Categorizes submissions into: Very Early, Early, On-Time, Late, or Overdue
- Calculates time metrics (days/hours before due date)
- Computes percentage of time period used

### 2. **Bonus Points System**
- **Very Early** (7+ days before): 5% bonus
- **Early** (3-6 days before): 3% bonus
- **On-Time** (1-2 days before): 1% bonus
- Customizable bonus percentages per assignment
- Automatic calculation of bonus points based on base score

### 3. **Visual Indicators**
- **Trophy Badge** 🏆: Very early submissions
- **Star Badge** ⭐: Early submissions
- **Checkmark Badge** ✓: On-time submissions
- **Clock Badge** 🕐: Late submissions
- **Warning Badge** ⚠️: Overdue submissions

### 4. **Real-Time Urgency Tracking**
- **Critical**: <24 hours remaining (red, pulsing animation)
- **High**: 1-3 days remaining (orange)
- **Medium**: 4-7 days remaining (yellow)
- **Low**: 7+ days remaining (green)

### 5. **Incentive Display**
- Shows available bonus percentages before submission
- Encourages students to submit early
- Updates dynamically based on time remaining

## Usage

### Basic Usage

```typescript
import {
  detectEarlySubmission,
  calculateBonusPoints
} from '@/utils/earlySubmissionDetection';

// Detect early submission
const result = detectEarlySubmission(
  new Date('2025-10-01'), // Submission date
  {
    dueDate: new Date('2025-10-10'), // Due date
    bonusPoints: {
      enabled: true,
      veryEarly: 5,
      early: 3,
      onTime: 1
    }
  }
);

// Calculate bonus points
const baseScore = 90;
const bonus = calculateBonusPoints(baseScore, result);
// If submitted 8 days early: bonus = 4.5 points (5% of 90)
```

### UI Components

#### EarlySubmissionBadge

Displays early submission status with customizable variants:

```tsx
import { EarlySubmissionBadge } from '@/components/homework/EarlySubmissionBadge';

// Badge variant (compact)
<EarlySubmissionBadge
  result={earlySubmissionResult}
  variant="badge"
  showBonus={true}
/>

// Alert variant (detailed)
<EarlySubmissionBadge
  result={earlySubmissionResult}
  variant="alert"
  showBonus={true}
  bonusPoints={4.5}
/>

// Inline variant
<EarlySubmissionBadge
  result={earlySubmissionResult}
  variant="inline"
/>
```

#### SubmissionUrgencyIndicator

Shows countdown and urgency level for pending submissions:

```tsx
import { SubmissionUrgencyIndicator } from '@/components/homework/EarlySubmissionBadge';

<SubmissionUrgencyIndicator
  dueDate={dueDate}
  urgency={urgencyData}
  timeRemaining="2d 5h remaining"
/>
```

#### EarlySubmissionIncentive

Encourages early submission by displaying available bonuses:

```tsx
import { EarlySubmissionIncentive } from '@/components/homework/EarlySubmissionBadge';

<EarlySubmissionIncentive
  daysUntilDue={8}
  bonusConfig={{
    veryEarly: 5,
    early: 3,
    onTime: 1
  }}
/>
```

## Configuration

### Custom Thresholds

You can customize the early submission thresholds:

```typescript
const result = detectEarlySubmission(submissionDate, {
  dueDate: dueDate,
  customThresholds: {
    veryEarly: 10, // 10 days instead of default 7
    early: 5,      // 5 days instead of default 3
    onTime: 2      // 2 days instead of default 1
  }
});
```

### Custom Bonus Points

```typescript
const result = detectEarlySubmission(submissionDate, {
  dueDate: dueDate,
  bonusPoints: {
    enabled: true,
    veryEarly: 10, // 10% bonus
    early: 5,      // 5% bonus
    onTime: 2      // 2% bonus
  }
});
```

### Posted Date for Percentage Calculation

```typescript
const result = detectEarlySubmission(submissionDate, {
  dueDate: dueDate,
  postedDate: new Date('2025-09-01'), // Assignment posted date
  bonusPoints: { enabled: true }
});

// result.timePercentageUsed will show % of time period used
```

## Utility Functions

### Time Calculations

```typescript
import {
  getDaysUntilDue,
  getHoursUntilDue,
  formatTimeRemaining
} from '@/utils/earlySubmissionDetection';

const daysLeft = getDaysUntilDue(dueDate);
const hoursLeft = getHoursUntilDue(dueDate);
const formatted = formatTimeRemaining(dueDate); // "2d 5h remaining"
```

### Submission Window Check

```typescript
import { isSubmissionWindowOpen } from '@/utils/earlySubmissionDetection';

const canSubmit = isSubmissionWindowOpen(
  dueDate,
  allowLateSubmission,
  lateSubmissionDeadline
);
```

### Urgency Assessment

```typescript
import { getSubmissionUrgency } from '@/utils/earlySubmissionDetection';

const urgency = getSubmissionUrgency(dueDate);
// Returns: { level, message, colorScheme }
```

## Data Structure

### EarlySubmissionResult

```typescript
interface EarlySubmissionResult {
  isEarly: boolean;
  category: 'very-early' | 'early' | 'on-time' | 'late' | 'overdue';
  daysBeforeDue: number;        // Positive = early, negative = late
  hoursBeforeDue: number;
  timePercentageUsed: number;   // 0-100%
  bonusPercentage: number;      // 0-100
  message: string;              // Human-readable message
  badge: 'trophy' | 'star' | 'checkmark' | 'clock' | 'warning';
  colorScheme: 'green' | 'blue' | 'yellow' | 'orange' | 'red';
}
```

## Integration Points

### Current Integrations

1. **SubmissionForm Component** (`src/components/homework/SubmissionForm.tsx`)
   - Shows early submission badges after submission
   - Displays urgency indicators before submission
   - Shows bonus incentive alerts

2. **AssignmentDetails Component** (`src/components/homework/AssignmentDetails.tsx`)
   - Enhanced time remaining display
   - Color-coded urgency indicators

### Future Integration Opportunities

1. **Dashboard**
   - Show early submission achievements
   - Display upcoming deadlines with urgency levels
   - Track student early submission patterns

2. **Gamification**
   - Award badges for consistent early submissions
   - Leaderboards for timely submissions
   - Achievement system integration

3. **Analytics**
   - Track early submission rates
   - Analyze impact on grades
   - Identify procrastination patterns

4. **Notifications**
   - Send reminders based on urgency level
   - Notify about bonus opportunities
   - Congratulate early submissions

5. **AI Assessment**
   - Apply similar logic to quiz/assessment submissions
   - Time-based difficulty adjustments
   - Adaptive deadline recommendations

## Best Practices

1. **Configurable Bonuses**: Allow instructors to enable/disable and customize bonus percentages per assignment
2. **Clear Communication**: Display bonus structure prominently before students start work
3. **Fair Grading**: Ensure bonus points don't disadvantage students with valid reasons for later submission
4. **Accessibility**: Use color + icons to convey urgency (not just color)
5. **Mobile-Friendly**: Ensure all indicators work well on small screens

## Testing

```typescript
// Example test cases
describe('Early Submission Detection', () => {
  it('should detect very early submission (8 days before)', () => {
    const result = detectEarlySubmission(
      new Date('2025-10-02'),
      { dueDate: new Date('2025-10-10'), bonusPoints: { enabled: true } }
    );
    expect(result.category).toBe('very-early');
    expect(result.bonusPercentage).toBe(5);
  });

  it('should calculate correct bonus points', () => {
    const result = { bonusPercentage: 5 };
    const bonus = calculateBonusPoints(100, result);
    expect(bonus).toBe(5);
  });
});
```

## License

Part of the Aiborg Learn Sphere platform.
