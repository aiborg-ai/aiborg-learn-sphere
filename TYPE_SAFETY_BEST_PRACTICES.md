# Type Safety Best Practices & Guidelines

## 📚 Overview
This document outlines the type safety standards and best practices for the Aiborg Learn Sphere codebase.

**Current Status**: ✅ **100% Type-Safe** (0 explicit `any` types)

---

## 🎯 TypeScript Configuration

### Strict Mode Settings (tsconfig.app.json)
Our codebase uses **maximum strictness** for type safety:

```json
{
  "strict": true,
  "noImplicitAny": true,              // ✅ Enforced
  "strictNullChecks": true,           // ✅ Enforced
  "strictFunctionTypes": true,        // ✅ Enforced
  "strictBindCallApply": true,        // ✅ Enforced
  "strictPropertyInitialization": true, // ✅ Enforced
  "noImplicitThis": true,             // ✅ Enforced
  "noUnusedLocals": true,             // ✅ Enforced
  "noUnusedParameters": true,         // ✅ Enforced
  "noImplicitReturns": true,          // ✅ Enforced
  "noFallthroughCasesInSwitch": true, // ✅ Enforced
  "noUncheckedIndexedAccess": true    // ✅ Enforced
}
```

---

## ✅ DO's - Type Safety Best Practices

### 1. Use `unknown` Instead of `any`
```typescript
// ❌ BAD - Disables type checking
function process(data: any) {
  return data.value; // No type safety
}

// ✅ GOOD - Forces type narrowing
function process(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
  throw new Error('Invalid data');
}
```

### 2. Define Proper Interfaces
```typescript
// ❌ BAD - Using any for dynamic data
const fetchUser = async (): Promise<any> => {
  const response = await fetch('/api/user');
  return response.json();
};

// ✅ GOOD - Define proper interface
interface User {
  id: string;
  name: string;
  email: string;
}

const fetchUser = async (): Promise<User> => {
  const response = await fetch('/api/user');
  return response.json();
};
```

### 3. Use Type Guards for Runtime Checks
```typescript
// ✅ GOOD - Type guard function
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'email' in data
  );
}

// Usage
const data: unknown = await fetchData();
if (isUser(data)) {
  console.log(data.email); // Type-safe!
}
```

### 4. Properly Type Function Parameters
```typescript
// ❌ BAD
const handleClick = (event: any) => {
  event.preventDefault();
};

// ✅ GOOD
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  event.preventDefault();
};
```

### 5. Use Generic Types for Reusable Components
```typescript
// ✅ GOOD - Generic type for flexibility with safety
interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: unknown, row: T, index: number) => ReactNode;
}

function Table<T extends Record<string, unknown>>({ 
  data, 
  columns 
}: { 
  data: T[]; 
  columns: Column<T>[] 
}) {
  // Type-safe implementation
}
```

### 6. Properly Type Async Functions
```typescript
// ❌ BAD
async function getData() {
  return fetch('/api/data').then(r => r.json());
}

// ✅ GOOD
async function getData(): Promise<DataType> {
  const response = await fetch('/api/data');
  return response.json();
}
```

### 7. Use Discriminated Unions for State
```typescript
// ✅ GOOD - Discriminated union
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// Type-safe switch
function handleState<T>(state: RequestState<T>) {
  switch (state.status) {
    case 'success':
      return state.data; // TypeScript knows data exists
    case 'error':
      return state.error; // TypeScript knows error exists
    default:
      return null;
  }
}
```

---

## ❌ DON'Ts - Anti-Patterns to Avoid

### 1. Never Use `any`
```typescript
// ❌ NEVER DO THIS
const data: any = await fetchData();

// ✅ DO THIS INSTEAD
const data: unknown = await fetchData();
// or
interface DataShape { /* ... */ }
const data: DataShape = await fetchData();
```

### 2. Avoid Type Assertions Without Validation
```typescript
// ❌ BAD - Unsafe assertion
const user = data as User;

// ✅ GOOD - Validate before asserting
if (isUser(data)) {
  const user: User = data;
}
```

### 3. Don't Use `@ts-ignore` or `@ts-expect-error`
```typescript
// ❌ BAD - Hiding type errors
// @ts-ignore
const result = someFunction(wrongType);

// ✅ GOOD - Fix the underlying issue
const result = someFunction(properlyTypedValue);
```

### 4. Avoid Empty Interfaces
```typescript
// ❌ BAD
interface Props extends Record<string, any> {}

// ✅ GOOD
interface Props {
  id: string;
  name: string;
  onUpdate: (value: string) => void;
}
```

### 5. Don't Disable Strict Checks
```typescript
// ❌ BAD in tsconfig
{
  "strict": false,
  "noImplicitAny": false
}

// ✅ GOOD - Keep strict mode
{
  "strict": true,
  "noImplicitAny": true
}
```

---

## 🔧 Handling Special Cases

### 1. Dynamic Data from APIs (Supabase, REST)
```typescript
// ✅ Pattern for API data
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data; // Properly typed!
}
```

### 2. Event Handlers
```typescript
// ✅ Properly typed event handlers
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  // ...
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.stopPropagation();
};
```

### 3. Third-Party Libraries Without Types
```typescript
// ✅ Create declaration file: types/library-name.d.ts
declare module 'untyped-library' {
  export function doSomething(param: string): Promise<Result>;
  
  export interface Result {
    success: boolean;
    data: unknown;
  }
}
```

### 4. Test Files (Acceptable `as any` Use Case)
```typescript
// ✅ ACCEPTABLE in test files only
it('should handle mock data', () => {
  const mockSupabase = {
    from: vi.fn(),
    select: vi.fn(),
  } as any; // OK for mocking complex objects in tests

  // Test implementation
});
```

### 5. Complex Generics and Refs
```typescript
// ✅ When dealing with polymorphic components
type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

const Heading = forwardRef<
  HTMLHeadingElement,
  { as?: HeadingLevel } & HTMLAttributes<HTMLHeadingElement>
>(({ as: Comp = 'h2', ...props }, ref) => {
  return (
    <Comp 
      ref={ref as React.Ref<HTMLHeadingElement & HTMLElement>} 
      {...props} 
    />
  );
});
```

---

## 📋 Code Review Checklist

Before committing code, verify:

- [ ] No explicit `any` types in source code
- [ ] No `@ts-ignore` or `@ts-expect-error` comments
- [ ] All function parameters properly typed
- [ ] All function return types explicitly defined
- [ ] API responses have proper type definitions
- [ ] Event handlers use specific React event types
- [ ] Generic components properly constrained
- [ ] `unknown` used instead of `any` for truly dynamic data
- [ ] Type guards used for runtime type narrowing
- [ ] `npm run typecheck` passes without errors

---

## 🧪 Testing Type Safety

```bash
# Run type check
npm run typecheck

# Check for explicit any types
grep -r ":\s*any\b" src --include="*.ts" --include="*.tsx" | grep -v "__tests__"

# Check for type suppressions
grep -r "@ts-ignore\|@ts-expect-error" src --include="*.ts" --include="*.tsx"

# Verify ESLint passes
npm run lint
```

---

## 📊 Current Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Explicit `any` types | < 20 | 0 | ✅ Excellent |
| Type suppressions | 0 | 0 | ✅ Perfect |
| `as any` in tests | Acceptable | 17 | ✅ OK |
| `as any` in source | 0 | 0 | ✅ Perfect |
| Strict mode | Enabled | Yes | ✅ Enabled |
| Type coverage | > 95% | 100% | ✅ Excellent |

---

## 🎓 Learning Resources

- [TypeScript Handbook - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Type-safe Error Handling](https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript)
- [Advanced TypeScript Patterns](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)

---

## 🔄 Enforcement

### Pre-commit Hooks
Our Husky pre-commit hooks run:
1. TypeScript type checking (`npm run typecheck`)
2. ESLint validation (`npm run lint`)
3. Prettier formatting

### CI/CD Pipeline
Automated checks on every PR:
- Type compilation verification
- ESLint rule enforcement
- Build validation

---

## 📝 Updating This Guide

When adding new type safety patterns or discovering anti-patterns:

1. Document the pattern/anti-pattern
2. Provide code examples (before/after)
3. Update the metrics section
4. Share with the team

---

**Last Updated**: 2025-10-31  
**Maintained By**: Development Team  
**Status**: ✅ Active & Enforced
