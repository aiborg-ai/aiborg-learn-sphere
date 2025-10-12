# Real-Time Collaboration - Component Index

Quick reference guide for all real-time collaboration components, hooks, and utilities.

---

## 📁 File Structure

```
src/
├── hooks/
│   ├── useClassroomPresence.ts     # Presence management
│   ├── useClassroomQuestions.ts    # Live Q&A
│   └── useRealtimeProgress.ts      # Progress tracking
├── components/
│   ├── classroom/
│   │   ├── ActiveStudentsBar.tsx   # Student presence display
│   │   ├── LiveQuestionPanel.tsx   # Student Q&A interface
│   │   └── ProgressSync.tsx        # Background progress sync
│   └── instructor/
│       ├── QuestionQueue.tsx       # Instructor Q&A management
│       ├── CohortProgressMap.tsx   # Progress visualization
│       └── LiveClassroomDashboard.tsx  # Main instructor dashboard
└── pages/
    └── instructor/
        └── ClassroomPage.tsx       # Classroom page with routing

supabase/migrations/
└── 20251012000000_realtime_classroom.sql  # Database schema

docs/
├── REALTIME_COLLABORATION.md       # Main documentation
├── REALTIME_IMPLEMENTATION_SUMMARY.md  # Implementation details
└── REALTIME_COMPONENTS_INDEX.md    # This file
```

---

## 🎣 Hooks

### `useClassroomPresence`

**File**: `src/hooks/useClassroomPresence.ts`

Manages student presence in classroom sessions with auto-heartbeat.

**Returns**:

```typescript
{
  students: ClassroomStudent[];
  currentSession: ClassroomSession | null;
  isJoined: boolean;
  activeCount: number;
  loading: boolean;
  error: string | null;
  joinSession: () => Promise<void>;
  leaveSession: () => Promise<void>;
  updatePosition: (position: string) => Promise<void>;
}
```

**Usage**:

```tsx
const { students, activeCount, joinSession } = useClassroomPresence({
  courseId: 123,
  lessonId: 'intro',
  autoJoin: true,
  updateInterval: 30000,
});
```

---

### `useClassroomQuestions`

**File**: `src/hooks/useClassroomQuestions.ts`

Handles live Q&A with upvoting and real-time updates.

**Returns**:

```typescript
{
  questions: ClassroomQuestion[];
  loading: boolean;
  error: string | null;
  isInstructor: boolean;
  unresolvedCount: number;
  pinnedQuestions: ClassroomQuestion[];
  askQuestion: (text: string, context?: string) => Promise<ClassroomQuestion | null>;
  answerQuestion: (id: string, answer: string) => Promise<boolean>;
  upvoteQuestion: (id: string) => Promise<boolean>;
  pinQuestion: (id: string, pinned: boolean) => Promise<boolean>;
  resolveQuestion: (id: string, resolved: boolean) => Promise<boolean>;
  refetch: () => Promise<void>;
}
```

**Usage**:

```tsx
const { questions, askQuestion, answerQuestion } = useClassroomQuestions({
  sessionId: session.id,
  autoSubscribe: true,
});
```

---

### `useRealtimeProgress`

**File**: `src/hooks/useRealtimeProgress.ts`

Tracks real-time student progress and broadcasts events.

**Returns**:

```typescript
{
  studentProgress: StudentProgress[];
  recentEvents: ProgressEvent[];
  loading: boolean;
  error: string | null;
  stats: {
    averageProgress: number;
    completedCount: number;
    inProgressCount: number;
    notStartedCount: number;
    totalStudents: number;
  };
  studentsNeedingHelp: StudentProgress[];
  updateProgress: (percentage: number, time: number, position?: string) => Promise<boolean>;
  broadcastEvent: (type: string, data: object) => Promise<boolean>;
  requestHelp: (reason?: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}
```

**Usage**:

```tsx
const { studentProgress, stats, updateProgress } = useRealtimeProgress({
  sessionId: session.id,
  courseId: 123,
  autoSubscribe: true,
});
```

---

## 🎨 Student Components

### `ActiveStudentsBar`

**File**: `src/components/classroom/ActiveStudentsBar.tsx`

Displays active students with avatars and presence indicators.

**Props**:

```typescript
{
  courseId: number;
  lessonId?: string;
  compact?: boolean;      // Default: false
  maxDisplay?: number;    // Default: 10
}
```

**Usage**:

```tsx
<ActiveStudentsBar courseId={123} lessonId="intro" compact={false} maxDisplay={10} />
```

**Features**:

- Live student avatars
- Green pulse for active status
- Tooltip with join time and position
- Compact mode for sidebars
- "+X more" overflow indicator

---

### `LiveQuestionPanel`

**File**: `src/components/classroom/LiveQuestionPanel.tsx`

Full Q&A interface for students with upvoting.

**Props**:

```typescript
{
  sessionId: string | null;
  compact?: boolean;  // Default: false
}
```

**Usage**:

```tsx
<LiveQuestionPanel sessionId={session.id} compact={false} />
```

**Features**:

- Ask questions with Cmd/Ctrl+Enter
- Upvote classmate questions
- See instructor answers in real-time
- Resolved/unresolved badges
- Pinned questions highlighted
- Scrollable question list

---

### `ProgressSync`

**File**: `src/components/classroom/ProgressSync.tsx`

Background component that auto-syncs progress (no UI).

**Props**:

```typescript
{
  sessionId: string | null;
  courseId: number | null;
  currentProgress: number;      // 0-100
  timeSpent: number;            // minutes
  currentPosition?: string;     // e.g., video timestamp
  onMilestone?: (milestone: number) => void;
}
```

**Usage**:

```tsx
<ProgressSync
  sessionId={session.id}
  courseId={123}
  currentProgress={65}
  timeSpent={45}
  currentPosition="12:34"
  onMilestone={m => console.log(`Reached ${m}%`)}
/>
```

**Features**:

- Debounced syncing (30s intervals)
- Immediate sync at 100% completion
- Broadcasts milestone events (25%, 50%, 75%, 100%)
- Handles offline/online transitions
- Syncs on visibility change

---

## 👨‍🏫 Instructor Components

### `QuestionQueue`

**File**: `src/components/instructor/QuestionQueue.tsx`

Instructor-only question management interface.

**Props**:

```typescript
{
  sessionId: string | null;
}
```

**Usage**:

```tsx
<QuestionQueue sessionId={session.id} />
```

**Features**:

- Prioritized question queue (pinned → upvotes → time)
- Quick answer textarea
- Pin/unpin questions
- Mark as resolved
- Accordion for pending/resolved sections
- Real-time updates

---

### `CohortProgressMap`

**File**: `src/components/instructor/CohortProgressMap.tsx`

Real-time progress visualization for all students.

**Props**:

```typescript
{
  sessionId: string | null;
  courseId: number | null;
}
```

**Usage**:

```tsx
<CohortProgressMap sessionId={session.id} courseId={123} />
```

**Features**:

- Stats overview (total, completed, in progress, need help)
- Average progress bar
- Three sort modes (progress, activity, name)
- Student rows with progress bars
- Identify inactive/struggling students
- Recent activity feed
- Real-time updates

---

### `LiveClassroomDashboard`

**File**: `src/components/instructor/LiveClassroomDashboard.tsx`

Main instructor dashboard with session controls.

**Props**:

```typescript
{
  courseId: number;
  courseName: string;
  lessonId?: string;
  lessonTitle?: string;
}
```

**Usage**:

```tsx
<LiveClassroomDashboard
  courseId={123}
  courseName="AI Fundamentals"
  lessonId="intro"
  lessonTitle="Introduction to AI"
/>
```

**Features**:

- Start/stop session controls
- Live status badge
- Quick stats cards (students, questions, status)
- Three tabs: Overview, Q&A Queue, Progress
- Integrated ActiveStudentsBar, QuestionQueue, CohortProgressMap
- Auto-join/leave session management

---

## 📄 Pages

### `ClassroomPage`

**File**: `src/pages/instructor/ClassroomPage.tsx`

Full-page classroom view with access control and routing.

**Route**: `/instructor/classroom/:courseId?lessonId=xxx&lessonTitle=xxx`

**Features**:

- Instructor/admin access control
- Auto-redirect unauthorized users
- Course validation
- Navigation breadcrumb
- Integrates LiveClassroomDashboard

**Usage**:

```tsx
// Navigate programmatically
navigate(`/instructor/classroom/${courseId}?lessonId=intro&lessonTitle=Introduction`);

// Or use Link
<Link to={`/instructor/classroom/${courseId}?lessonId=intro`}>Open Classroom</Link>;
```

---

## 🗄️ Database

### Migration File

**File**: `supabase/migrations/20251012000000_realtime_classroom.sql`

**Tables Created**:

1. `classroom_sessions` - Active sessions
2. `classroom_presence` - Student presence tracking
3. `classroom_questions` - Q&A questions
4. `question_upvotes` - Question voting
5. `classroom_progress_events` - Progress milestones

**Functions**:

- `update_presence_last_seen()` - Auto-update trigger
- `mark_inactive_presence()` - Cleanup inactive users
- `update_question_upvotes()` - Auto-increment upvote count
- `get_active_students_count()` - Count active students
- `get_top_questions()` - Get prioritized questions

**Realtime Enabled**: ✅ All tables

**RLS Policies**: ✅ Complete security

---

## 🔐 Security

All components and hooks respect Row Level Security (RLS):

- **Students**: Can only see their own sessions and data
- **Instructors**: Full access to their classroom sessions
- **Admins**: Same as instructors
- **Guests**: No access (authentication required)

---

## 🎯 Quick Start Examples

### Minimal Student Integration

```tsx
import { ActiveStudentsBar } from '@/components/classroom/ActiveStudentsBar';
import { LiveQuestionPanel } from '@/components/classroom/LiveQuestionPanel';
import { ProgressSync } from '@/components/classroom/ProgressSync';

function StudentCourseView({ courseId, sessionId }) {
  const [progress, setProgress] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);

  return (
    <div>
      <ProgressSync
        sessionId={sessionId}
        courseId={courseId}
        currentProgress={progress}
        timeSpent={timeSpent}
      />

      <ActiveStudentsBar courseId={courseId} compact />
      <LiveQuestionPanel sessionId={sessionId} />
    </div>
  );
}
```

### Minimal Instructor Integration

```tsx
import { LiveClassroomDashboard } from '@/components/instructor/LiveClassroomDashboard';

function InstructorView({ course }) {
  return <LiveClassroomDashboard courseId={course.id} courseName={course.title} />;
}
```

---

## 📊 Component Dependencies

```
ActiveStudentsBar
├── useClassroomPresence
├── Avatar (shadcn/ui)
├── Badge (shadcn/ui)
└── Tooltip (shadcn/ui)

LiveQuestionPanel
├── useClassroomQuestions
├── Button (shadcn/ui)
├── Card (shadcn/ui)
├── Textarea (shadcn/ui)
├── ScrollArea (shadcn/ui)
└── date-fns

ProgressSync
└── useRealtimeProgress

QuestionQueue
├── useClassroomQuestions
├── Accordion (shadcn/ui)
└── All standard UI components

CohortProgressMap
├── useRealtimeProgress
├── Tabs (shadcn/ui)
├── Progress (shadcn/ui)
└── ScrollArea (shadcn/ui)

LiveClassroomDashboard
├── useClassroomPresence
├── useClassroomQuestions
├── ActiveStudentsBar
├── QuestionQueue
├── CohortProgressMap
└── Tabs (shadcn/ui)

ClassroomPage
├── useAuth
├── useCourses
├── LiveClassroomDashboard
└── react-router-dom
```

---

## 📝 Notes

- All components use TypeScript strict mode
- All components have proper loading and error states
- All hooks have proper cleanup on unmount
- All real-time subscriptions auto-unsubscribe
- All database queries use RLS for security

---

**Last Updated**: 2025-10-13 **Version**: 1.0.0 **Status**: Production Ready ✅
