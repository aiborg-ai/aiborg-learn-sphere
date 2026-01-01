# Progressive Onboarding System

## Overview

The progressive onboarding system provides contextual tips and guidance as users naturally explore
the Aiborg Learn Sphere platform. Instead of overwhelming new users with upfront tutorials, tips
appear progressively as they interact with different features.

## Key Features

- ✨ **Progressive Tooltips**: Contextual tips that appear when users encounter new features
- 📊 **Progress Tracking**: Visual progress indicator showing onboarding completion
- 🎯 **Milestone System**: Track key user achievements (first enrollment, profile completion, etc.)
- 🔄 **Persistent State**: User progress saved to database and synced across sessions
- 🎨 **Beautiful UI**: Smooth animations and polished design
- ⚡ **Performance**: Minimal overhead, tips load on-demand
- 🎭 **Role-Based**: Different tips for different user roles (admin, instructor, student)

## Architecture

### Components

1. **Database Layer** (`supabase/migrations/20250101000000_progressive_onboarding.sql`)
   - `user_onboarding_progress`: Tracks user progress and completed tips
   - `onboarding_tips`: Predefined tips with categories and priorities

2. **React Components** (`src/components/onboarding/`)
   - `OnboardingTooltip`: Main tooltip component that wraps interactive elements
   - `OnboardingHighlight`: Alternative component that attaches to DOM elements via selectors
   - `OnboardingProgress`: Progress widget showing milestones and completion percentage
   - `OnboardingDemo`: Reference implementation showing integration examples

3. **Hooks & Context** (`src/hooks/`, `src/contexts/`)
   - `useOnboarding`: Hook for managing onboarding state and operations
   - `OnboardingProvider`: Context provider making onboarding state available app-wide

4. **Types** (`src/types/onboarding.ts`)
   - TypeScript interfaces for type-safe development

## Quick Start

### 1. Enable Onboarding Provider

Wrap your app with `OnboardingProvider` (already integrated if using standard setup):

```tsx
import { OnboardingProvider } from '@/contexts/OnboardingContext';

function App() {
  return <OnboardingProvider>{/* Your app */}</OnboardingProvider>;
}
```

### 2. Add Tooltips to Components

```tsx
import { OnboardingTooltip } from '@/components/onboarding';
import { useOnboardingContext } from '@/contexts/OnboardingContext';

function MyComponent() {
  const { shouldShowTip } = useOnboardingContext();

  return shouldShowTip('my-unique-tip-id') ? (
    <OnboardingTooltip
      tipId="my-unique-tip-id"
      title="Feature Title"
      description="Helpful description of what this feature does"
      icon="BookOpen"
      placement="bottom"
    >
      <Button>My Feature</Button>
    </OnboardingTooltip>
  ) : (
    <Button>My Feature</Button>
  );
}
```

### 3. Track Milestones

Mark milestones when users complete important actions:

```tsx
import { useOnboardingContext } from '@/contexts/OnboardingContext';

function EnrollmentForm() {
  const { markMilestone } = useOnboardingContext();

  const handleEnroll = async () => {
    // ... enrollment logic
    await markMilestone('has_enrolled_in_course');
  };

  return <Button onClick={handleEnroll}>Enroll</Button>;
}
```

### 4. Show Progress Widget

Display the onboarding progress widget in the dashboard:

```tsx
import { OnboardingProgress } from '@/components/onboarding';

function Dashboard() {
  return (
    <div className="space-y-6">
      <OnboardingProgress />
      {/* Other dashboard content */}
    </div>
  );
}
```

## API Reference

### OnboardingTooltip Props

```typescript
interface OnboardingTooltipProps {
  tipId: string; // Unique identifier for this tip
  title: string; // Tooltip title
  description: string; // Detailed explanation
  placement?: 'top' | 'bottom' | 'left' | 'right'; // Default: 'bottom'
  icon?: string; // Lucide icon name
  actionLabel?: string; // Custom action button text (default: 'Got it')
  children: React.ReactNode; // Element to wrap
  delay?: number; // Delay before showing (ms, default: 800)
  showOnce?: boolean; // Only show once per session (default: true)
}
```

### useOnboarding Hook

```typescript
const {
  // State
  progress, // Current user progress
  loading, // Loading state
  error, // Error state

  // Tip Management
  isTipCompleted, // (tipId: string) => boolean
  markTipCompleted, // (tipId: string) => Promise<void>
  markMultipleTipsCompleted, // (tipIds: string[]) => Promise<void>

  // Milestones
  markMilestone, // (milestone: MilestoneKey) => Promise<void>

  // Overall Onboarding
  completeOnboarding, // () => Promise<void>
  skipOnboarding, // () => Promise<void>
  resetOnboarding, // () => Promise<void>

  // Utilities
  shouldShowTip, // (tipId: string, category?: string) => boolean
  getCompletionPercentage, // () => number
} = useOnboarding();
```

### Available Milestones

```typescript
-'has_completed_profile' - // User filled out their profile
  'has_enrolled_in_course' - // User enrolled in first course
  'has_attended_event' - // User attended first event
  'has_completed_assessment' - // User completed first assessment
  'has_explored_dashboard' - // User viewed dashboard
  'has_used_ai_chat' - // User interacted with AI chatbot
  'has_created_content'; // User created content (admin/instructor)
```

## Pre-Defined Tips

The system comes with these default tips (see database migration):

### Navigation Tips

- `nav-welcome`: Welcome message
- `nav-courses`: Browse courses
- `nav-events`: Attend events
- `nav-studio`: Content Studio (admin only)

### Dashboard Tips

- `dashboard-welcome`: Dashboard overview
- `dashboard-progress`: Progress tracking
- `dashboard-recommendations`: AI recommendations

### Course Tips

- `courses-enroll`: How to enroll
- `courses-filter`: Using filters

### Studio Tips (Admin Only)

- `studio-create`: Create content
- `studio-wizard`: Wizard interface
- `studio-ai`: AI assistance

### Other Tips

- `profile-complete`: Complete profile
- `profile-achievements`: Unlock achievements
- `assessment-adaptive`: Adaptive assessments
- `chat-ai`: AI learning assistant

## Integration Examples

### Example 1: Dashboard Integration

```tsx
import { useEffect } from 'react';
import { OnboardingTooltip, OnboardingProgress } from '@/components/onboarding';
import { useOnboardingContext } from '@/contexts/OnboardingContext';

function Dashboard() {
  const { shouldShowTip, markMilestone } = useOnboardingContext();

  // Mark that user explored dashboard
  useEffect(() => {
    markMilestone('has_explored_dashboard');
  }, [markMilestone]);

  return (
    <div className="space-y-6">
      {/* Progress Widget */}
      <OnboardingProgress />

      {/* Courses Section with Tooltip */}
      {shouldShowTip('dashboard-courses') ? (
        <OnboardingTooltip
          tipId="dashboard-courses"
          title="Your Enrolled Courses"
          description="Track your progress and continue learning from your enrolled courses."
          icon="BookOpen"
        >
          <CoursesSection />
        </OnboardingTooltip>
      ) : (
        <CoursesSection />
      )}
    </div>
  );
}
```

### Example 2: Studio Integration (Admin)

```tsx
import { OnboardingTooltip } from '@/components/onboarding';
import { useOnboardingContext } from '@/contexts/OnboardingContext';

function Studio() {
  const { shouldShowTip, markMilestone } = useOnboardingContext();

  const handleCreateContent = () => {
    markMilestone('has_created_content');
    // ... creation logic
  };

  return (
    <div>
      {shouldShowTip('studio-create') ? (
        <OnboardingTooltip
          tipId="studio-create"
          title="Create Your First Content"
          description="Use our AI-powered wizards to create professional courses, events, and blogs in minutes."
          icon="Wand2"
          placement="bottom"
        >
          <Button onClick={handleCreateContent}>Create Content</Button>
        </OnboardingTooltip>
      ) : (
        <Button onClick={handleCreateContent}>Create Content</Button>
      )}
    </div>
  );
}
```

### Example 3: Profile Completion

```tsx
import { useOnboardingContext } from '@/contexts/OnboardingContext';

function ProfileForm() {
  const { markMilestone } = useOnboardingContext();

  const handleSave = async data => {
    // Save profile
    await saveProfile(data);

    // Mark milestone
    await markMilestone('has_completed_profile');
  };

  return <form onSubmit={handleSave}>...</form>;
}
```

## Styling

### CSS Classes

The system includes these CSS animations (in `src/index.css`):

- `.onboarding-highlight`: Pulsing outline animation for highlighted elements
- Automatic animations for tooltip appearance/dismissal

### Customization

To customize tooltip appearance, edit the `OnboardingTooltip` component or override Tailwind
classes:

```tsx
<OnboardingTooltip
  tipId="custom-tip"
  title="Custom Title"
  description="Custom description"
  // Card will inherit your theme colors
>
  <YourComponent />
</OnboardingTooltip>
```

## Best Practices

### 1. Tip Placement

- Use `placement="bottom"` for top-aligned elements (buttons in header)
- Use `placement="top"` for bottom-aligned elements
- Use `placement="right"` for left sidebar items
- Use `placement="left"` for right sidebar items

### 2. Timing

- Set `delay={800}` for elements visible on page load (default)
- Set `delay={1500}` for secondary features
- Set `delay={0}` for critical first-time actions

### 3. Tip Content

- Keep titles short (3-5 words)
- Descriptions should be 1-2 sentences
- Use action-oriented language ("Click here to...", "Use this to...")
- Include icons for visual recognition

### 4. Milestone Tracking

- Mark milestones immediately after user action completes
- Don't mark milestones prematurely (e.g., on button click before API call)
- Use appropriate milestone for the action

### 5. Conditional Rendering

- Always use `shouldShowTip()` to check before rendering tooltips
- This prevents showing completed tips and respects user preferences

## Database Schema

### user_onboarding_progress

```sql
CREATE TABLE public.user_onboarding_progress (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  completed_tips TEXT[],
  has_completed_profile BOOLEAN DEFAULT FALSE,
  has_enrolled_in_course BOOLEAN DEFAULT FALSE,
  has_attended_event BOOLEAN DEFAULT FALSE,
  has_completed_assessment BOOLEAN DEFAULT FALSE,
  has_explored_dashboard BOOLEAN DEFAULT FALSE,
  has_used_ai_chat BOOLEAN DEFAULT FALSE,
  has_created_content BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_skipped BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### onboarding_tips

```sql
CREATE TABLE public.onboarding_tips (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_element TEXT,
  placement TEXT DEFAULT 'bottom',
  category TEXT NOT NULL,
  role TEXT,
  icon TEXT,
  action_label TEXT DEFAULT 'Got it',
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Migration Steps

To apply the onboarding system to your database:

```bash
# Apply migration
npx supabase db push

# Or in development
npx supabase migration up
```

## Demo Page

Visit `/onboarding-demo` to see live examples of all tooltip variations and integration patterns.

## Troubleshooting

### Tips Not Showing

1. Check that `OnboardingProvider` is wrapping your app
2. Verify user is authenticated
3. Check that tip hasn't already been completed: `isTipCompleted('tip-id')`
4. Ensure `shouldShowTip('tip-id')` returns `true`

### Progress Not Saving

1. Check browser console for errors
2. Verify RLS policies allow user to update their progress
3. Check network tab for failed requests to Supabase

### Styling Issues

1. Ensure Tailwind CSS is properly configured
2. Check that custom CSS animations are loaded (`index.css`)
3. Verify z-index conflicts with other components

## Support

For questions or issues:

- Check the demo page for examples
- Review this documentation
- Check component source code for inline comments
- Examine database schema and RLS policies
