# E2E Testing Documentation

## Overview

This directory contains comprehensive End-to-End (E2E) tests for the AIBorg Learn Sphere platform
using Playwright. The test suite covers authentication, user roles, assessments, and critical user
flows.

## Test Structure

```
tests/e2e/
├── auth-company-admin.spec.ts       # Company admin signup and authentication
├── auth-individual-user.spec.ts     # Individual user (student) authentication
├── sme-assessment.spec.ts           # SME AI Opportunity Assessment flows
├── user-roles-permissions.spec.ts   # Role-based access control tests
├── app-smoke.spec.ts                # Smoke tests for critical functionality
├── bookmarks.spec.ts                # Bookmark feature tests
├── downloads.spec.ts                # Download management tests
├── playlists.spec.ts                # Playlist functionality tests
├── events.spec.ts                   # Event management tests
├── admin-events.spec.ts             # Admin event management
├── watch-later.spec.ts              # Watch later feature tests
├── pdf-viewer.spec.ts               # PDF viewer functionality
└── integration.spec.ts              # Integration tests
```

## Test Coverage

### Authentication Tests

#### Company Admin (`auth-company-admin.spec.ts`)

- ✅ Display company admin signup option
- ✅ Show/hide company fields based on account type selection
- ✅ Validate required company fields (name, industry, size)
- ✅ Successfully signup as company admin
- ✅ Handle duplicate email validation
- ✅ Validate company name length
- ✅ Sign in as company admin
- ✅ OAuth button availability (Google, GitHub)

#### Individual User (`auth-individual-user.spec.ts`)

- ✅ Individual signup as default option
- ✅ Successfully signup as student/individual
- ✅ Validate display name requirements
- ✅ Validate password strength (12+ chars, uppercase, lowercase, numbers, special chars)
- ✅ Validate password confirmation match
- ✅ Validate email format
- ✅ Sign in functionality
- ✅ Forgot password flow
- ✅ Password reset dialog
- ✅ Rate limiting on failed login attempts
- ✅ Tab navigation between signin/signup
- ✅ OAuth provider buttons

### SME Assessment Tests (`sme-assessment.spec.ts`)

#### Unauthenticated Access

- ✅ Redirect to auth when accessing without login

#### Company Admin Flow

- ✅ Display assessment page structure
- ✅ Show progress indicator (9 sections)
- ✅ Display first section (Company Mission)
- ✅ Auto-populate company name for company admins
- ✅ Navigate between sections (Next/Previous)
- ✅ Save draft functionality
- ✅ Validate required fields
- ✅ Complete assessment button on final section
- ✅ Back to home navigation
- ✅ Maintain form data across navigation

#### Section-Specific Tests

- ✅ Section 1: Company Mission required fields
- ✅ Section 2: AI Capabilities rating controls

#### Responsive Design

- ✅ Mobile viewport (375x667)
- ✅ Tablet viewport (768x1024)

#### Accessibility

- ✅ Proper heading hierarchy
- ✅ Accessible form labels
- ✅ Keyboard navigation support

### User Role Permission Tests (`user-roles-permissions.spec.ts`)

#### Public User Access

- ✅ Access public pages (home, blog, courses)
- ✅ Redirect to auth for protected pages
- ✅ Show "Sign In" button when unauthenticated

#### Student User Access

- 🔄 Access student features (dashboard, courses, assessments)
- 🔄 Restricted from admin features

#### Company Admin Access

- ✅ Access SME assessment page
- 🔄 Company profile management
- 🔄 Restricted from platform admin

#### Instructor Access

- 🔄 Instructor dashboard
- 🔄 Course creation/editing
- 🔄 Assignment management
- 🔄 Restricted from company admin features

#### Admin Access

- ✅ Admin panel existence check
- 🔄 User management
- 🔄 Content management
- 🔄 Analytics access

#### Feature Access Matrix

- ✅ Public pages accessible without auth
- ✅ Protected pages require authentication

#### Authorization

- ✅ Appropriate error messages for unauthorized access
- 🔄 Redirect to return URL after login
- 🔄 Session maintenance across reloads

Legend: ✅ = Implemented, 🔄 = Placeholder/Skipped (requires auth setup)

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Run All Tests

```bash
# Run all E2E tests
npm run test:e2e

# Or directly with Playwright
npx playwright test
```

### Run Specific Test Files

```bash
# Run company admin auth tests
npx playwright test auth-company-admin

# Run SME assessment tests
npx playwright test sme-assessment

# Run individual user auth tests
npx playwright test auth-individual-user

# Run role permission tests
npx playwright test user-roles-permissions
```

### Run Tests by Browser

```bash
# Chromium only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# WebKit (Safari) only
npx playwright test --project=webkit

# All browsers
npx playwright test --project=chromium --project=firefox --project=webkit
```

### Run in UI Mode (Interactive)

```bash
npx playwright test --ui
```

### Run in Debug Mode

```bash
npx playwright test --debug
```

### Run in Headed Mode (See Browser)

```bash
npx playwright test --headed
```

## Test Configuration

### Playwright Config (`playwright.config.ts`)

```typescript
{
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
  },
}
```

## Viewing Test Results

### HTML Report

```bash
# Generate and open HTML report
npx playwright show-report
```

### Trace Viewer

```bash
# Open trace for failed tests
npx playwright show-trace trace.zip
```

## Writing New Tests

### Test Structure Example

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await expect(page.getByText('Something')).toBeVisible();
  });
});
```

### Best Practices

1. **Use Descriptive Test Names**

   ```typescript
   test('should redirect to auth when accessing protected page without login', ...)
   ```

2. **Use Page Object Model for Complex Flows**

   ```typescript
   class LoginPage {
     constructor(private page: Page) {}
     async login(email: string, password: string) { ... }
   }
   ```

3. **Generate Unique Test Data**

   ```typescript
   const testUser = {
     email: `test-${Date.now()}@example.com`,
     password: 'SecurePassword123!@#',
   };
   ```

4. **Use Proper Locators**

   ```typescript
   // Good: Semantic locators
   page.getByRole('button', { name: /sign in/i });
   page.getByLabel(/email/i);

   // Avoid: Brittle selectors
   page.locator('#btn-123');
   ```

5. **Handle Timeouts Gracefully**

   ```typescript
   await expect(element).toBeVisible({ timeout: 5000 });
   ```

6. **Clean Up Test Data**
   ```typescript
   test.afterEach(async () => {
     // Clean up created test data
   });
   ```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run Playwright tests
  run: |
    npm ci
    npx playwright install --with-deps
    npx playwright test

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Test Data Management

### Database Seeding

For tests requiring specific data:

```typescript
test.beforeAll(async () => {
  // Seed test database
  await seedTestDatabase();
});

test.afterAll(async () => {
  // Clean up test data
  await cleanupTestDatabase();
});
```

### Environment Variables

```bash
# .env.test
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!@#
BASE_URL=http://localhost:8080
```

## Debugging Tips

1. **Use `page.pause()` for debugging**

   ```typescript
   await page.pause(); // Opens Playwright Inspector
   ```

2. **Take screenshots manually**

   ```typescript
   await page.screenshot({ path: 'screenshot.png' });
   ```

3. **Console logs**

   ```typescript
   page.on('console', msg => console.log(msg.text()));
   ```

4. **Network requests**
   ```typescript
   page.on('request', request => console.log(request.url()));
   ```

## Known Issues & Limitations

1. **Authentication State**
   - Currently, most authenticated tests are skipped
   - Requires setup of test users with proper authentication
   - Consider implementing `storageState` for session persistence

2. **Database State**
   - Tests may require specific database state
   - Consider implementing database fixtures/seeds

3. **Rate Limiting**
   - Some tests may hit rate limits if run repeatedly
   - Implement test-specific rate limit bypasses or delays

## Future Improvements

- [ ] Implement authentication fixtures for authenticated tests
- [ ] Add visual regression testing
- [ ] Add API testing alongside E2E tests
- [ ] Implement database seeding for consistent test data
- [ ] Add performance testing with Lighthouse
- [ ] Create reusable page objects for common flows
- [ ] Add cross-browser compatibility matrix
- [ ] Implement test data factories
- [ ] Add accessibility testing with axe-core

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)
- [Page Object Model](https://playwright.dev/docs/pom)

## Support

For issues with tests:

1. Check test output and error messages
2. Run in debug mode: `npx playwright test --debug`
3. Review trace files: `npx playwright show-report`
4. Check GitHub Issues for known problems
