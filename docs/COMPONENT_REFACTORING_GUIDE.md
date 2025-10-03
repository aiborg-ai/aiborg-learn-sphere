# Component Refactoring Guide

## Overview

This guide documents the refactoring approach for breaking down large components (800+ lines) into smaller, more maintainable sub-components.

## Completed: TemplateBuilder Refactoring

### Structure Created

```
src/components/admin/template-builder/
├── types.ts                      # Shared TypeScript types
├── templateFields.ts             # Field definitions (COURSE_FIELDS, EVENT_FIELDS)
├── TemplateFieldRenderer.tsx     # Renders individual form fields
└── TemplatePreview.tsx           # Preview component for template data
```

### Benefits

1. **Separation of Concerns**
   - Types isolated in `types.ts`
   - Field definitions in `templateFields.ts`
   - UI components split by responsibility

2. **Reusability**
   - `TemplateFieldRenderer` can be used in other forms
   - Field definitions can be imported anywhere
   - Type safety across all template components

3. **Maintainability**
   - Each file < 250 lines
   - Single responsibility per component
   - Easier to test and modify

### Usage Example

```typescript
import { TemplateFieldRenderer } from './template-builder/TemplateFieldRenderer';
import { COURSE_FIELDS } from './template-builder/templateFields';
import type { TemplateField } from './template-builder/types';

// Render a single field
<TemplateFieldRenderer
  field={COURSE_FIELDS[0]}
  value={formData.title}
  onChange={(value) => handleFieldChange('title', value)}
  error={errors.title}
/>
```

## Recommended: AchievementManager Refactoring

### Current Size
- **Lines**: 800+
- **Complexity**: High (achievements, criteria, progress tracking)

### Proposed Structure

```
src/components/admin/achievement-manager/
├── types.ts                          # Achievement types
├── AchievementForm.tsx               # Create/edit achievement form
├── AchievementList.tsx               # List view with filters
├── AchievementCriteria.tsx           # Criteria editor
├── AchievementPreview.tsx            # Preview card
├── useAchievements.ts                # Custom hook for data fetching
└── achievementValidation.ts          # Validation logic
```

### Refactoring Steps

1. **Extract Types** (20 lines)
   ```typescript
   export interface Achievement {
     id: string;
     name: string;
     description: string;
     criteria: AchievementCriteria;
     points: number;
     badge_icon: string;
   }
   ```

2. **Create Custom Hook** (~80 lines)
   ```typescript
   export function useAchievements() {
     const [achievements, setAchievements] = useState([]);
     const [loading, setLoading] = useState(true);

     const fetchAchievements = async () => { /* ... */ };
     const createAchievement = async (data) => { /* ... */ };
     const updateAchievement = async (id, data) => { /* ... */ };
     const deleteAchievement = async (id) => { /* ... */ };

     return { achievements, loading, /* CRUD operations */ };
   }
   ```

3. **Split UI Components** (150-200 lines each)
   - **AchievementForm**: Form inputs, validation
   - **AchievementList**: Table/grid view, filters, sorting
   - **AchievementCriteria**: Complex criteria builder UI
   - **AchievementPreview**: Display achievement details

4. **Extract Business Logic** (~50 lines)
   ```typescript
   export function validateAchievement(data: Achievement): ValidationResult {
     // Validation rules
   }

   export function calculateProgress(criteria, userStats): number {
     // Progress calculation
   }
   ```

### Benefits

- **Testing**: Each component can be unit tested independently
- **Code Reuse**: Achievement preview can be used in student dashboard
- **Performance**: Easier to optimize specific components
- **Collaboration**: Multiple developers can work on different parts

## Recommended: CoursePage Tabs Refactoring

### Current Size
- **Lines**: 795+
- **Complexity**: High (6+ tabs with different content)

### Current Tab Structure

1. Overview
2. Curriculum/Materials
3. Assignments
4. Discussions
5. Progress
6. Recordings/Resources

### Proposed Structure

```
src/pages/course-page/
├── CoursePage.tsx                    # Main container (routing, data fetching)
├── types.ts                          # Course-related types
├── useCourseData.ts                  # Data fetching hook
├── tabs/
│   ├── CourseOverviewTab.tsx         # Course info, enrollment
│   ├── CourseCurriculumTab.tsx       # Materials, lessons
│   ├── CourseAssignmentsTab.tsx      # Assignments list
│   ├── CourseDiscussionsTab.tsx      # Discussion forum
│   ├── CourseProgressTab.tsx         # Progress tracking
│   └── CourseRecordingsTab.tsx       # Video recordings
└── components/
    ├── CourseHeader.tsx              # Course title, stats
    ├── EnrollmentButton.tsx          # Enrollment CTA
    └── CourseNavigation.tsx          # Tab navigation
```

### Implementation Pattern

**Main Container** (CoursePage.tsx - ~150 lines):
```typescript
export default function CoursePage() {
  const { courseId } = useParams();
  const { course, loading, error } = useCourseData(courseId);
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) return <PageLoader />;
  if (error) return <ErrorView error={error} />;

  return (
    <div className="container">
      <CourseHeader course={course} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          {/* ... other tabs */}
        </TabsList>

        <TabsContent value="overview">
          <CourseOverviewTab course={course} />
        </TabsContent>
        <TabsContent value="curriculum">
          <CourseCurriculumTab courseId={course.id} />
        </TabsContent>
        {/* ... other tab contents */}
      </Tabs>
    </div>
  );
}
```

**Individual Tab** (CourseOverviewTab.tsx - ~120 lines):
```typescript
export function CourseOverviewTab({ course }: CourseOverviewTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>About This Course</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{course.description}</p>
        </CardContent>
      </Card>

      <CourseFeatures features={course.features} />
      <CourseInstructor instructor={course.instructor} />
      <EnrollmentSection course={course} />
    </div>
  );
}
```

**Custom Hook** (useCourseData.ts - ~100 lines):
```typescript
export function useCourseData(courseId: string) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourseData(courseId);
  }, [courseId]);

  const fetchCourseData = async (id: string) => {
    // Fetch course, materials, enrollment status, etc.
  };

  return { course, loading, error, refetch: fetchCourseData };
}
```

### Benefits

1. **Lazy Loading**: Each tab can be code-split
2. **Independent State**: Tab-specific state doesn't affect others
3. **Parallel Development**: Different tabs can be developed simultaneously
4. **SEO**: Easier to add server-side rendering per tab
5. **Testing**: Each tab can be tested in isolation

## General Refactoring Principles

### 1. Component Size Guidelines

- **Target**: < 250 lines per component
- **Maximum**: 400 lines (including comments)
- **Complexity**: McCabe complexity < 15

### 2. When to Split

Split a component when it:
- Exceeds 300 lines
- Has 3+ distinct responsibilities
- Contains complex state management
- Has nested conditional rendering 3+ levels deep
- Is difficult to understand in 5 minutes

### 3. How to Split

**By Responsibility (SRP)**:
```
LargeComponent.tsx (800 lines)
└── Split into:
    ├── ComponentLogic.ts (custom hook)
    ├── ComponentView.tsx (presentation)
    ├── ComponentForm.tsx (input handling)
    └── ComponentPreview.tsx (display)
```

**By Feature**:
```
DashboardPage.tsx (900 lines)
└── Split into:
    ├── DashboardPage.tsx (container)
    └── widgets/
        ├── StatsWidget.tsx
        ├── ActivityWidget.tsx
        ├── ChartWidget.tsx
        └── NotificationsWidget.tsx
```

**By Data Flow**:
```
ComplexForm.tsx (700 lines)
└── Split into:
    ├── useFormData.ts (state management)
    ├── FormValidation.ts (validation logic)
    ├── FormSection1.tsx (UI part 1)
    ├── FormSection2.tsx (UI part 2)
    └── FormActions.tsx (submit/cancel)
```

### 4. Refactoring Checklist

- [ ] Create types file with shared interfaces
- [ ] Extract custom hooks for data fetching/state
- [ ] Split UI into logical sub-components
- [ ] Move business logic to utility functions
- [ ] Update imports in parent components
- [ ] Add prop-types or TypeScript interfaces
- [ ] Write tests for new components
- [ ] Update documentation
- [ ] Remove old commented code
- [ ] Verify no functionality is lost

### 5. Testing Strategy

**Before Refactoring**:
```bash
# Run existing tests
npm test

# Create snapshot tests
npm test -- --updateSnapshot
```

**After Refactoring**:
```bash
# Verify all tests still pass
npm test

# Check for type errors
npm run typecheck

# Verify build works
npm run build
```

## Migration Path

### Phase 1: Create Sub-components (Non-breaking)
- Create new files in subdirectories
- Export from index files
- Old component still works

### Phase 2: Update Imports (Gradual)
- Update parent components one by one
- Test each update
- Can roll back if needed

### Phase 3: Deprecate Old Component
- Add deprecation warning
- Update all references
- Remove old component in next major version

## Performance Considerations

### Code Splitting

```typescript
// Before refactoring
import { HugeComponent } from './HugeComponent';

// After refactoring (lazy load tabs)
const OverviewTab = lazy(() => import('./tabs/OverviewTab'));
const CurriculumTab = lazy(() => import('./tabs/CurriculumTab'));
```

### Memoization

```typescript
// Memoize expensive renders
export const CourseCard = memo(function CourseCard({ course }) {
  // Component logic
}, (prevProps, nextProps) => {
  return prevProps.course.id === nextProps.course.id;
});
```

### Virtual Scrolling

```typescript
// For long lists, use virtualization
import { useVirtualizer } from '@tanstack/react-virtual';

export function AchievementList({ achievements }) {
  const parentRef = useRef();
  const virtualizer = useVirtualizer({
    count: achievements.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
  });

  // Render only visible items
}
```

## Next Steps

1. **Complete TemplateBuilder Refactoring**
   - Create TemplateActions.tsx
   - Create TemplateFormSection.tsx
   - Update main TemplateBuilder.tsx to use sub-components

2. **Refactor AchievementManager**
   - Follow the structure outlined above
   - Estimated time: 4-6 hours

3. **Refactor CoursePage**
   - Split into tab components
   - Create useCourseData hook
   - Estimated time: 5-7 hours

4. **Review and Optimize**
   - Run performance profiler
   - Check bundle sizes
   - Optimize imports

## Resources

- [React Component Patterns](https://reactpatterns.com/)
- [Refactoring UI](https://refactoringui.com/)
- [Clean Code React](https://github.com/ryanmcdermott/clean-code-javascript)
