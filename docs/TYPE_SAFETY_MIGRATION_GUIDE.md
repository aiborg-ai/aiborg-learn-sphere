# Type Safety Migration Guide

## Overview

This guide documents the type safety improvements made to the codebase and provides instructions for migrating existing code to use the new strict TypeScript configuration.

## Changes Summary

### 1. New Type Definitions

Three comprehensive type definition files have been created:

```
src/types/
├── api.ts      # API response types (500+ lines)
├── hooks.ts    # Hook-related types (400+ lines)
├── utils.ts    # Utility types (400+ lines)
└── index.ts    # Barrel export
```

### 2. TypeScript Configuration Updates

**Before:**
```json
{
  "strict": false,
  "noImplicitAny": false,
  "strictNullChecks": false,
  "noUnusedLocals": false,
  "noUnusedParameters": false
}
```

**After:**
```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "strictBindCallApply": true,
  "strictPropertyInitialization": true,
  "noImplicitThis": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedIndexedAccess": true
}
```

## Migration Steps

### Step 1: Import Type Definitions

Replace `any` types with proper type definitions:

**Before:**
```typescript
import { useState } from 'react';

function useCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
}
```

**After:**
```typescript
import { useState } from 'react';
import type { Course, ApiError } from '@/types';

function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
}
```

### Step 2: Use Generic Hook Types

**Before:**
```typescript
function useAsync(asyncFunction: any) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
}
```

**After:**
```typescript
import type { UseAsyncResult } from '@/types';

function useAsync<T, Args extends unknown[] = []>(
  asyncFunction: (...args: Args) => Promise<T>
): UseAsyncResult<T, Args> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = async (...args: Args): Promise<T> => {
    setLoading(true);
    try {
      const result = await asyncFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { execute, data, loading, error, status: /* ... */ };
}
```

### Step 3: Fix Null/Undefined Checks

**Before:**
```typescript
function getUserName(user: User) {
  return user.full_name.toUpperCase(); // Error: might be null
}
```

**After:**
```typescript
function getUserName(user: User): string {
  return user.full_name?.toUpperCase() ?? 'Unknown';
}

// Or with explicit null check
function getUserName(user: User): string {
  if (!user.full_name) {
    return 'Unknown';
  }
  return user.full_name.toUpperCase();
}
```

### Step 4: Handle Array Index Access

**Before:**
```typescript
function getFirstCourse(courses: Course[]) {
  return courses[0].title; // Error: might be undefined
}
```

**After:**
```typescript
function getFirstCourse(courses: Course[]): string | undefined {
  return courses[0]?.title;
}

// Or with explicit check
function getFirstCourse(courses: Course[]): string {
  if (courses.length === 0) {
    throw new Error('No courses available');
  }
  return courses[0]!.title; // Non-null assertion
}
```

### Step 5: Type Event Handlers Properly

**Before:**
```typescript
const handleClick = (e: any) => {
  console.log(e.target.value);
};
```

**After:**
```typescript
import type { EventHandler, ChangeEvent } from '@/types';

const handleClick: EventHandler<React.MouseEvent<HTMLButtonElement>> = (e) => {
  console.log(e.currentTarget);
};

const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
  console.log(e.target.value);
};
```

### Step 6: Use Type Guards

**Before:**
```typescript
function processData(data: any) {
  if (data.type === 'course') {
    return data.title; // No type safety
  }
}
```

**After:**
```typescript
import type { Course, Event } from '@/types';

function isCourse(data: Course | Event): data is Course {
  return 'duration' in data;
}

function processData(data: Course | Event): string {
  if (isCourse(data)) {
    return data.title; // TypeScript knows this is Course
  }
  return data.name; // TypeScript knows this is Event
}
```

### Step 7: Use Utility Types

**Before:**
```typescript
function updateCourse(id: number, updates: any) {
  // Update logic
}
```

**After:**
```typescript
import type { Course, DeepPartial } from '@/types';

function updateCourse(id: number, updates: DeepPartial<Course>) {
  // Update logic - TypeScript ensures only valid Course fields
}
```

## Common Type Errors and Solutions

### Error 1: Object is possibly 'null' or 'undefined'

**Error:**
```typescript
const user = getCurrentUser();
console.log(user.email); // Error: Object is possibly 'null'
```

**Solutions:**
```typescript
// Optional chaining
console.log(user?.email);

// Nullish coalescing
console.log(user?.email ?? 'no-email@example.com');

// Type guard
if (user) {
  console.log(user.email);
}

// Non-null assertion (use sparingly)
console.log(user!.email);
```

### Error 2: Type 'any' is not assignable

**Error:**
```typescript
function fetchData(): any {
  return fetch('/api/data');
}
```

**Solution:**
```typescript
import type { ApiResponse, Course } from '@/types';

async function fetchData(): Promise<ApiResponse<Course[]>> {
  const response = await fetch('/api/data');
  return response.json();
}
```

### Error 3: Parameter has implicitly 'any' type

**Error:**
```typescript
const items = data.map(item => item.id); // Error: 'item' has type 'any'
```

**Solution:**
```typescript
import type { Course } from '@/types';

const data: Course[] = await fetchCourses();
const items = data.map((item: Course) => item.id);

// Or let TypeScript infer from typed array
const items = data.map(item => item.id); // OK if data is typed
```

### Error 4: Property does not exist on type

**Error:**
```typescript
const formData: any = {};
formData.title = 'New Course'; // Works but unsafe

function save(data: Course) {
  // Later usage
  console.log(data.titel); // Error: Property 'titel' does not exist
}
```

**Solution:**
```typescript
import type { Course, DeepPartial } from '@/types';

const formData: DeepPartial<Course> = {};
formData.title = 'New Course'; // Type-safe

// TypeScript will catch typos
console.log(data.title); // OK
```

### Error 5: Argument of type 'X' is not assignable to parameter of type 'Y'

**Error:**
```typescript
function setCourse(course: Course) {
  // ...
}

const data = { title: 'Test' };
setCourse(data); // Error: Type '{ title: string }' is missing properties
```

**Solution:**
```typescript
import type { Course } from '@/types';

// Option 1: Provide all required fields
const data: Course = {
  id: 1,
  title: 'Test',
  description: 'Test course',
  // ... all required fields
};
setCourse(data);

// Option 2: Use Partial for updates
function updateCourse(course: Partial<Course>) {
  // ...
}
updateCourse({ title: 'Test' }); // OK
```

## Best Practices

### 1. Avoid 'any'

❌ **Don't:**
```typescript
let data: any;
function process(input: any): any { }
```

✅ **Do:**
```typescript
let data: unknown; // Use 'unknown' if type is truly unknown
function process<T>(input: T): T { }
```

### 2. Use Type Assertions Sparingly

❌ **Don't:**
```typescript
const value = data as any as MyType; // Double assertion
```

✅ **Do:**
```typescript
// Use type guards
function isMyType(value: unknown): value is MyType {
  return typeof value === 'object' && value !== null && 'key' in value;
}

if (isMyType(data)) {
  // data is now MyType
}
```

### 3. Define Return Types Explicitly

❌ **Don't:**
```typescript
function fetchUser(id: string) {
  return fetch(`/api/users/${id}`).then(r => r.json());
}
```

✅ **Do:**
```typescript
import type { User, ApiResponse } from '@/types';

async function fetchUser(id: string): Promise<ApiResponse<User>> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}
```

### 4. Use Discriminated Unions

✅ **Do:**
```typescript
type LoadingState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Course[] }
  | { status: 'error'; error: Error };

function render(state: LoadingState) {
  switch (state.status) {
    case 'idle':
      return 'Not started';
    case 'loading':
      return 'Loading...';
    case 'success':
      return state.data.map(/* ... */); // TypeScript knows data exists
    case 'error':
      return state.error.message; // TypeScript knows error exists
  }
}
```

### 5. Use const assertions

✅ **Do:**
```typescript
const STATUSES = ['draft', 'published', 'archived'] as const;
type Status = typeof STATUSES[number]; // 'draft' | 'published' | 'archived'
```

## Gradual Migration Strategy

### Phase 1: Add Type Definitions (Completed)
- ✅ Created comprehensive type definitions
- ✅ Updated TypeScript configuration
- ✅ No breaking changes to existing code

### Phase 2: Fix Critical Paths (Recommended)
1. **Authentication & User Management**
   - Update useAuth hook
   - Fix user-related components

2. **API Layer**
   - Type all API calls
   - Add proper error handling types

3. **Form Handling**
   - Type form components
   - Add validation type safety

### Phase 3: Component-by-Component Migration
1. Start with leaf components (no dependencies)
2. Move up to container components
3. Finally update page components

### Phase 4: Remove 'any' Types
```bash
# Find all 'any' usages
grep -r "any" src --include="*.ts" --include="*.tsx"

# Focus on high-impact files first
- hooks/
- services/
- utils/
```

## Tools and Commands

### Type Checking

```bash
# Run type checker
npm run typecheck

# Watch mode
npx tsc --watch --noEmit

# Check specific file
npx tsc --noEmit src/path/to/file.tsx
```

### Finding Type Issues

```bash
# Find all 'any' types
grep -rn ": any" src/

# Find implicit any
grep -rn "implicitly has an 'any' type" <(npx tsc --noEmit)

# Find possible null/undefined errors
npx tsc --noEmit --strictNullChecks
```

### VS Code Settings

Add to `.vscode/settings.json`:
```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.preferences.strictNullChecks": true,
  "typescript.suggest.includeAutomaticOptionalChainCompletions": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

## ESLint Integration

Update `.eslintrc`:
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }],
    "@typescript-eslint/strict-boolean-expressions": "warn"
  }
}
```

## Testing Type Safety

```typescript
// Use type assertions in tests
import type { Course } from '@/types';

describe('Course', () => {
  it('should match Course type', () => {
    const course: Course = createTestCourse();
    // TypeScript will error if fields don't match
  });
});

// Use expect-type for type-level testing
import { expectType } from 'tsd';

expectType<Course>(fetchedData);
```

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Type Challenges](https://github.com/type-challenges/type-challenges)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

## Support

If you encounter type errors you can't resolve:

1. Check this guide for similar examples
2. Search existing types in `src/types/`
3. Use `unknown` temporarily and add a TODO comment
4. Ask for help with specific error messages

## Next Steps

1. Run `npm run typecheck` to see current type errors
2. Fix errors in critical paths (auth, API layer)
3. Gradually migrate components
4. Remove temporary `any` types
5. Add type tests for critical functions

Remember: The goal is safer, more maintainable code. Take it one step at a time!
