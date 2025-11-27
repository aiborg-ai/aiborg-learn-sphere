# Type Contracts & Runtime Validation

This document explains the type safety and runtime validation system implemented in this project.

## Overview

The type contract system enforces type safety at three levels:

1. **Compile-time**: TypeScript types generated from Supabase database schema
2. **Runtime**: Zod validation of API responses
3. **Testing**: Contract tests validating schema compliance

## Table of Contents

- [Setup](#setup)
- [Generating Types](#generating-types)
- [Using Validation](#using-validation)
- [Writing Contract Tests](#writing-contract-tests)
- [Best Practices](#best-practices)

---

## Setup

### Prerequisites

- Node.js 18+
- Supabase CLI installed (`npm install -D supabase`)
- Access to Supabase project

### Installation

All dependencies are already installed. Key packages:

- `supabase` - Supabase CLI for type generation
- `zod` - Runtime validation
- `@supabase/supabase-js` - Supabase client
- `vitest` - Testing framework

---

## Generating Types

### Initial Setup

1. **Login to Supabase CLI** (one-time setup):

   ```bash
   npx supabase login
   ```

2. **Generate types from your database**:

   ```bash
   npm run types:generate
   ```

   This generates `/src/integrations/supabase/types.ts` with full database types.

### Available Commands

```bash
# Generate types from remote project
npm run types:generate

# Generate types from local Supabase instance
npm run types:local

# Type-check the entire codebase
npm run types:check
```

### Workflow

After making database schema changes:

1. Run migrations: `npx supabase db push`
2. Regenerate types: `npm run types:generate`
3. Update Zod schemas if needed (see below)
4. Run tests: `npm run types:check && npm run test:contracts`

---

## Using Validation

### Zod Schemas

Location: `/src/lib/schemas/database.schema.ts`

**Example schema:**

```typescript
import { z } from 'zod';

export const CourseSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(255),
  description: z.string(),
  price: z.number().nonnegative().nullable(),
  // ... other fields
});

export type Course = z.infer<typeof CourseSchema>;
```

### Validation Middleware

Location: `/src/lib/api-validation.ts`

**Validate array responses:**

```typescript
import { validateArray } from '@/lib/api-validation';
import { CourseSchema } from '@/lib/schemas/database.schema';

const query = supabase.from('courses').select('*');

const { data, error } = await validateArray(query, CourseSchema, {
  validateInProduction: false, // Skip in prod for performance
  logErrors: true, // Log validation errors
  throwOnError: false, // Return error instead of throwing
});

if (error) {
  console.error('Validation failed:', error);
}
```

**Validate single item:**

```typescript
import { validateSingle } from '@/lib/api-validation';

const query = supabase.from('courses').select('*').eq('id', 1).single();

const { data, error } = await validateSingle(query, CourseSchema);
```

**Validate without Supabase:**

```typescript
import { validateData } from '@/lib/api-validation';

const { data, error } = validateData(CourseSchema, unknownData);
```

### Hook Integration

**Example: Refactored hook with validation**

```typescript
// src/hooks/useCourses.ts
import { validateArray } from '@/lib/api-validation';
import { CourseSchema } from '@/lib/schemas/database.schema';

const fetchCourses = async () => {
  const query = supabase.from('courses').select('*').eq('is_active', true);

  const { data, error } = await validateArray(query, CourseSchema, {
    validateInProduction: false,
    logErrors: true,
  });

  if (error) throw error;
  return data || [];
};

export const useCourses = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });
};
```

### Validation Options

```typescript
interface ValidationOptions {
  throwOnError?: boolean; // Throw on validation error (default: dev only)
  logErrors?: boolean; // Log validation errors (default: dev only)
  errorPrefix?: string; // Custom error message prefix
  validateInProduction?: boolean; // Validate in production (default: false)
  samplingRate?: number; // Production sampling 0-1 (default: 0.01)
}
```

---

## Writing Contract Tests

### Setup

1. **Seed the database**:

   ```bash
   # Load seed data (requires service role access to auth.users)
   psql $DATABASE_URL -f supabase/seed/00_test_users.sql
   psql $DATABASE_URL -f supabase/seed/01_test_courses.sql
   ```

   **Note**: The seed file inserts into `auth.users` which requires elevated privileges. If you get
   permission errors:
   - **Option 1**: Use a database connection with superuser/service role privileges
   - **Option 2**: Use the alternative approach in the seed file (uncomment the section that
     disables FK constraints)
   - **Option 3**: Create test users manually via Supabase Auth API/Dashboard

2. **Set environment variables**:

   ```bash
   # .env.test
   VITE_SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### Running Tests

```bash
# Run all contract tests
npm run test:contracts

# Run with coverage
npm run test:contracts -- --coverage

# Run specific test file
npm run test:contracts src/__tests__/contracts/courses-api.contract.test.ts
```

### Writing a Contract Test

**Location:** `/src/__tests__/contracts/[entity]-api.contract.test.ts`

**Example:**

```typescript
import { describe, it, expect } from 'vitest';
import { supabase, canRunContractTests } from '@/tests/setup.contracts';
import { CourseSchema } from '@/lib/schemas/database.schema';
import { validateArray } from '@/lib/api-validation';

describe('Courses API Contract', () => {
  // Skip if database not configured
  if (!canRunContractTests()) {
    it.skip('requires database configuration', () => {});
    return;
  }

  it('should return courses matching schema', async () => {
    const query = supabase!.from('courses').select('*').limit(10);
    const { data, error } = await validateArray(query, CourseSchema);

    expect(error).toBeNull();
    expect(data).toBeDefined();

    // Additional assertions
    const zodResult = CourseSchema.safeParse(data![0]);
    expect(zodResult.success).toBe(true);
  });

  it('should have all required fields', async () => {
    const { data } = await supabase!.from('courses').select('*').limit(1).single();

    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('description');
  });

  it('should validate enum values', async () => {
    const { data } = await supabase!.from('courses').select('level');

    data!.forEach(course => {
      expect(['beginner', 'intermediate', 'advanced']).toContain(course.level);
    });
  });
});
```

### Test Patterns

**Testing data integrity:**

```typescript
it('should have valid URLs', async () => {
  const { data } = await supabase!.from('courses').select('thumbnail_url');

  data!.forEach(course => {
    if (course.thumbnail_url) {
      expect(() => new URL(course.thumbnail_url!)).not.toThrow();
    }
  });
});
```

**Testing schema drift:**

```typescript
it('should not have unexpected fields', async () => {
  const { data } = await supabase!.from('courses').select('*').single();

  const expectedFields = Object.keys(CourseSchema.shape);
  const actualFields = Object.keys(data);

  const extraFields = actualFields.filter(f => !expectedFields.includes(f));

  if (extraFields.length > 0) {
    console.warn('Schema drift detected:', extraFields);
  }
});
```

---

## Best Practices

### 1. Type Generation

- **Regenerate types after every schema change**
- **Commit generated types** to version control
- **Run type check** before committing: `npm run types:check`

### 2. Zod Schemas

- **Keep schemas in sync with database** types
- **Use strict validation** in development
- **Use lenient validation** in production (or sampling)
- **Document schema changes** in migration files

### 3. Validation

- **Validate critical paths** (authentication, payments, user data)
- **Skip validation in production** for performance (or use 1% sampling)
- **Log validation errors** for monitoring
- **Handle errors gracefully** - don't break UX on validation failure

### 4. Testing

- **Write contract tests for all major entities**
- **Seed database before running tests**
- **Clean up test data after tests**
- **Test both happy and error paths**

### 5. Performance

- **Validation is expensive** - use sampling in production
- **Cache validation results** when appropriate
- **Monitor validation overhead** in production
- **Disable validation for read-heavy endpoints** in production

---

## Troubleshooting

### Type Generation Fails

**Error:** "Your account does not have the necessary privileges"

**Solution:**

```bash
# Login to Supabase CLI
npx supabase login

# Then regenerate
npm run types:generate
```

### Validation Errors in Development

**Error:** "ValidationError: Failed to validate array"

**Solution:**

1. Check Zod schema matches database schema
2. Regenerate types: `npm run types:generate`
3. Update Zod schema in `/src/lib/schemas/database.schema.ts`
4. Check console for specific field errors

### Contract Tests Fail

**Error:** "Skipping contract tests: Database not configured"

**Solution:**

```bash
# Set environment variables
export VITE_SUPABASE_URL=your-url
export SUPABASE_SERVICE_ROLE_KEY=your-key

# Or add to .env.test
```

**Error:** "Test course not found"

**Solution:**

```bash
# Seed the database
psql $DATABASE_URL -f supabase/seed/00_test_users.sql
psql $DATABASE_URL -f supabase/seed/01_test_courses.sql
```

**Error:** "violates foreign key constraint profiles_user_id_fkey"

**Solution:**

This error occurs because `profiles` has a foreign key to `auth.users`. You need to insert into
`auth.users` first.

```bash
# Option 1: Use service role connection (recommended)
# The seed file automatically inserts into auth.users if you have permission

# Option 2: Use alternative approach (uncomment in seed file)
# Edit supabase/seed/00_test_users.sql and uncomment the ALTERNATIVE section
# This temporarily disables FK constraints for testing

# Option 3: Create users via Supabase Dashboard or Auth API
# Then manually insert the corresponding profiles
```

---

## File Structure

```
src/
├── lib/
│   ├── schemas/
│   │   └── database.schema.ts        # Zod schemas for all tables
│   └── api-validation.ts             # Validation middleware
├── hooks/
│   └── useCourses.ts                 # Example validated hook
├── __tests__/
│   └── contracts/
│       └── courses-api.contract.test.ts  # Example contract test
└── tests/
    └── setup.contracts.ts            # Contract test setup

supabase/
└── seed/
    ├── 00_test_users.sql             # Test user data
    └── 01_test_courses.sql           # Test course data

vitest.config.contracts.ts            # Contract test configuration
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Type Safety & Contract Tests

on: [push, pull_request]

jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run types:check

  contract-tests:
    runs-on: ubuntu-latest
    env:
      VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:contracts
```

---

## Additional Resources

- [Supabase Type Generation Docs](https://supabase.com/docs/guides/api/generating-types)
- [Zod Documentation](https://zod.dev/)
- [Vitest Documentation](https://vitest.dev/)

---

## Support

For questions or issues:

1. Check this documentation
2. Review example files in `src/hooks/useCourses.ts` and `src/__tests__/contracts/`
3. Check validation logs in browser console (development mode)
4. Open an issue in the project repository
