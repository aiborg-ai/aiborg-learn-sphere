# E2E Testing with Playwright

## Overview

This directory contains end-to-end tests for the AIborg Learn Sphere student content access features using Playwright.

## Test Coverage

### Features Tested

1. **PDF Viewer** (`pdf-viewer.spec.ts`)
   - Document loading and navigation
   - Zoom controls
   - Search functionality
   - Annotations (add, edit, delete)
   - Progress tracking
   - Download

2. **Bookmarks** (`bookmarks.spec.ts`)
   - Create bookmarks (courses, materials, videos, PDFs)
   - View and filter bookmarks
   - Edit and delete bookmarks
   - Navigate from bookmarks
   - Metadata capture (timestamps, pages)

3. **Downloads** (`downloads.spec.ts`) - To be implemented
   - Track downloads
   - View download history
   - Re-download files
   - Clear download records

4. **Watch Later** (`watch-later.spec.ts`) - To be implemented
   - Add to queue
   - Reorder queue
   - Play items
   - Clear queue

5. **Playlists** (`playlists.spec.ts`) - To be implemented
   - Create playlists
   - Add items to playlists
   - Play playlists
   - Share playlists

6. **Integration** (`integration.spec.ts`)
   - Cross-feature workflows
   - Data persistence
   - Navigation between pages
   - Button visibility logic

## Setup

### Install Dependencies

```bash
npm install
```

This will install Playwright automatically as a dev dependency.

### Install Browsers

```bash
npx playwright install
```

This downloads Chromium, Firefox, and WebKit browsers for testing.

## Running Tests

### Run All Tests

```bash
npm run test:e2e
```

### Run in UI Mode (Interactive)

```bash
npm run test:e2e:ui
```

This opens the Playwright UI where you can:
- See all tests in a tree view
- Run tests selectively
- Watch tests execute in real-time
- Time travel through test steps

### Run in Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

### Debug Mode

```bash
npm run test:e2e:debug
```

Opens Playwright Inspector for step-by-step debugging.

### Run Specific Test File

```bash
npx playwright test bookmarks
```

### Run Specific Test

```bash
npx playwright test -g "should bookmark a course"
```

### Run on Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## View Test Reports

After tests run, view the HTML report:

```bash
npm run test:e2e:report
```

## Test Configuration

Configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:5173` (Vite dev server)
- **Browsers**: Chromium, Firefox, WebKit
- **Timeouts**: Default 30s
- **Retries**: 2 retries on CI, 0 locally
- **Parallel**: Tests run in parallel
- **Artifacts**: Screenshots and videos on failure

## Prerequisites for Tests

### Test Data Requirements

Before running tests, ensure:

1. **Test User Account**
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Role: Student
   - Must be created in Supabase Auth

2. **Test Course**
   - Course ID: 1 (or update test files)
   - Test user must be enrolled
   - Course must have materials:
     - At least 1 PDF (multi-page)
     - At least 1 video
     - At least 1 presentation

3. **Database Setup**
   - All migrations must be run
   - Tables: `bookmarks`, `downloads`, `watch_later`, `playlists`, `playlist_items`

### Environment Setup

1. **Start Dev Server**

   Tests automatically start the dev server via `webServer` in config.

   Or manually:
   ```bash
   npm run dev
   ```

2. **Supabase Configuration**

   Ensure `.env` has correct Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

## Writing New Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { login, TEST_USER } from './utils/auth';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);
  });

  test('should do something', async ({ page }) => {
    // Navigate
    await page.goto('/some-page');

    // Interact
    await page.click('button:has-text("Click Me")');

    // Assert
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

### Best Practices

1. **Use Data Test IDs**
   ```typescript
   await page.click('[data-testid="submit-button"]');
   ```

2. **Wait for Elements**
   ```typescript
   await page.waitForSelector('[data-testid="content"]');
   await expect(page.locator('text=Loaded')).toBeVisible();
   ```

3. **Use Locators Over Selectors**
   ```typescript
   const button = page.locator('button:has-text("Submit")');
   await button.click();
   ```

4. **Handle Timeouts**
   ```typescript
   await page.waitForSelector('canvas', { timeout: 10000 });
   ```

5. **Clean Up After Tests**
   ```typescript
   test.afterEach(async ({ page }) => {
     // Delete test data
     await page.goto('/bookmarks');
     // ... cleanup logic
   });
   ```

## Debugging Tests

### Visual Debugging

1. **Use UI Mode**
   ```bash
   npm run test:e2e:ui
   ```

2. **Use Headed Mode**
   ```bash
   npm run test:e2e:headed
   ```

3. **Pause Execution**
   ```typescript
   await page.pause();
   ```

### Inspect Elements

```typescript
// Take screenshot
await page.screenshot({ path: 'debug.png' });

// Print page content
console.log(await page.content());

// Print element text
const text = await page.locator('h1').textContent();
console.log(text);
```

### Trace Viewer

Tests automatically record traces on failure. View them:

```bash
npx playwright show-trace trace.zip
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Tests Timing Out

- Increase timeout in `playwright.config.ts`
- Use explicit waits: `await page.waitForSelector()`
- Check if dev server started properly

### Element Not Found

- Use Playwright Inspector to check selectors
- Add waits before interactions
- Check if element is in viewport

### Flaky Tests

- Add proper waits instead of `waitForTimeout`
- Use `toBeVisible()` instead of checking count
- Ensure stable test data

### Authentication Issues

- Verify test user exists in Supabase
- Check credentials in `utils/auth.ts`
- Ensure cookies/session persists

## Coverage Report

Current test coverage:

- **PDF Viewer**: ✅ 90% (core features covered)
- **Bookmarks**: ✅ 85% (main workflows covered)
- **Downloads**: ⏳ 0% (tests to be written)
- **Watch Later**: ⏳ 0% (tests to be written)
- **Playlists**: ⏳ 0% (tests to be written)
- **Integration**: ✅ 70% (key scenarios covered)

## Next Steps

1. Complete downloads tests
2. Complete watch later tests
3. Complete playlists tests
4. Add accessibility tests
5. Add performance tests
6. Add mobile viewport tests
7. Increase test data coverage
8. Set up CI/CD pipeline

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Test Specification Document](./TEST_SPECIFICATION.md)
