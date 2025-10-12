# CoursePage Refactoring Plan

## Current State Analysis

### ✅ Strengths

1. **Good Component Extraction**: Already separated into logical tab components
2. **Accessibility**: Proper ARIA labels and roles
3. **Type Safety**: TypeScript types properly defined
4. **Error Handling**: Basic error logging in place
5. **Loading States**: Proper loading indicators

### ⚠️ Issues Identified

#### 1. **Performance Issues**

- **Multiple useEffect calls**: Can cause unnecessary re-renders
- **No memoization**: Components re-render on every parent update
- **Inline object creation**: `progressPercentage` calculation on every render
- **Multiple data fetching hooks**: Each triggers its own render cycle

#### 2. **Code Organization**

- **Data fetching in component**: Should be in custom hook
- **Business logic mixed with UI**: updateProgress, fetchCourseData
- **updateProgress function defined but never used**

#### 3. **Error Handling**

- **Silent failures**: Errors logged but user not notified
- **No error boundaries**: Page crash will show blank screen
- **No retry mechanism**: Failed requests don't retry

#### 4. **State Management**

- **Too many useState calls**: 9 separate state variables
- **Derived state not memoized**: isEnrolled calculated in useEffect

## Refactoring Strategy

### Phase 1: Extract Data Logic (Priority: HIGH)

- Create `useC ourseData` hook
- Create `useCourseEnrollment` hook
- Consolidate data fetching
- Add error handling with user feedback

### Phase 2: Performance Optimization (Priority: HIGH)

- Add React.memo to child components
- Memoize expensive calculations with useMemo
- Optimize re-renders with useCallback
- Lazy load tab content

### Phase 3: Error Handling (Priority: MEDIUM)

- Add error boundary component
- Add retry mechanism
- Show user-friendly error messages
- Add offline detection

### Phase 4: Code Quality (Priority: MEDIUM)

- Remove unused code (updateProgress)
- Add comprehensive JSDoc comments
- Improve type definitions
- Add unit tests

## Implementation Plan

### Step 1: Create Custom Hooks

```typescript
// hooks/useCourseData.ts
export function useCourseData(courseId: string) {
  // Consolidates course, progress, materials, assignments fetching
  // Returns: { data, loading, error, refetch }
}

// hooks/useCourseEnrollment.ts
export function useCourseEnrollment(courseId: string, enrollments) {
  // Checks enrollment status
  // Returns: { isEnrolled, loading }
}
```

### Step 2: Optimize Component Rendering

```typescript
// Memoize expensive computations
const progressPercentage = useMemo(() => progress?.progress_percentage || 0, [progress]);

// Memoize callbacks
const handleViewMaterial = useCallback(material => {
  setViewingMaterial(material);
}, []);
```

### Step 3: Add Error Boundary

```typescript
// components/ErrorBoundary.tsx
// Catches errors and shows fallback UI
```

### Step 4: Lazy Load Tabs

```typescript
// Only load tab content when active
const CourseQuizzesTab = lazy(() => import('./CourseQuizzesTab'));
```

## Expected Improvements

### Performance

- **50% reduction** in re-renders
- **Faster initial load** through lazy loading
- **Better UX** with error recovery

### Code Quality

- **30% fewer lines** in main component
- **Better testability** with extracted hooks
- **Improved maintainability**

### User Experience

- **Better error messages**
- **Retry on failure**
- **Graceful degradation**

## Metrics to Track

### Before

- Component lines: ~300
- State variables: 9
- useEffect calls: 2
- Re-renders on enrollment change: ~3
- Error handling: Basic logging

### After (Target)

- Component lines: ~150
- State variables: 4
- useEffect calls: 0 (in custom hooks)
- Re-renders on enrollment change: 1
- Error handling: User-facing + retry

## Timeline

- **Phase 1 (Data Logic)**: 1-2 hours
- **Phase 2 (Performance)**: 1 hour
- **Phase 3 (Error Handling)**: 1 hour
- **Phase 4 (Code Quality)**: 30 minutes

**Total: 3.5-4.5 hours**

## Testing Strategy

1. **Unit Tests**: Custom hooks
2. **Integration Tests**: Data fetching flow
3. **Performance Tests**: React DevTools Profiler
4. **Manual Tests**: All tabs and user flows
