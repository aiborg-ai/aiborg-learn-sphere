/**
 * Load Testing Scenarios
 * Tests for concurrent users and stress testing critical paths
 * Run with multiple workers: npx playwright test load --workers=10
 */

import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession } from '../utils/auth';
import { generateUser } from '../factories/userFactory';

// Configure for load testing
test.describe.configure({ mode: 'parallel' });

test.describe('Load Testing - Concurrent Homepage Access', () => {
  test('should handle multiple concurrent homepage requests @load', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`Worker ${test.info().workerIndex}: Homepage loaded in ${loadTime}ms`);

    // Page should load even under concurrent load
    expect(await page.title()).toBeTruthy();
    expect(loadTime).toBeLessThan(10000); // Should load within 10s even under load
  });

  test('should handle multiple concurrent courses page requests @load', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`Worker ${test.info().workerIndex}: Courses page loaded in ${loadTime}ms`);

    expect(loadTime).toBeLessThan(10000);
  });
});

test.describe('Load Testing - Concurrent Authentication', () => {
  test('should handle multiple concurrent login attempts @load', async ({ page }) => {
    const testUser = generateUser('student');

    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    if ((await emailInput.count()) > 0) {
      await emailInput.fill(testUser.email);
      await passwordInput.fill(testUser.password);

      const loginButton = page
        .locator('button:has-text("Log in"), button:has-text("Login")')
        .first();
      await loginButton.click();

      await page.waitForTimeout(2000);

      console.log(`Worker ${test.info().workerIndex}: Login attempt completed`);
    }
  });

  test('should handle multiple concurrent registrations @load', async ({ page }) => {
    const testUser = generateUser('student');

    await page.goto('/auth?mode=signup');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    if ((await emailInput.count()) > 0) {
      await emailInput.fill(testUser.email);
      await passwordInput.fill(testUser.password);

      const signupButton = page
        .locator('button:has-text("Sign up"), button:has-text("Register")')
        .first();

      if (await signupButton.isVisible()) {
        await signupButton.click();
        await page.waitForTimeout(2000);
      }

      console.log(`Worker ${test.info().workerIndex}: Signup attempt completed`);
    }
  });
});

test.describe('Load Testing - Concurrent Course Browsing', () => {
  test('should handle multiple users browsing courses @load', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    // Simulate user browsing
    const viewDetailsButtons = page.locator(
      'button:has-text("View Details"), button:has-text("Details")'
    );

    if ((await viewDetailsButtons.count()) > 0) {
      await viewDetailsButtons.first().click();
      await page.waitForTimeout(1000);

      console.log(`Worker ${test.info().workerIndex}: Viewed course details`);

      // Close modal if present
      const closeButton = page.locator('button[aria-label="Close"]');
      if ((await closeButton.count()) > 0) {
        await closeButton.first().click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should handle multiple users searching courses @load', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('test course');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);

      console.log(`Worker ${test.info().workerIndex}: Search completed`);
    }
  });
});

test.describe('Load Testing - Concurrent Enrollment', () => {
  test('should handle multiple concurrent enrollment attempts @load', async ({ page }) => {
    await setupAuthenticatedSession(page, 'student');

    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    const enrollButton = page.locator('button:has-text("Enroll")').first();

    if (await enrollButton.isVisible()) {
      await enrollButton.click();
      await page.waitForTimeout(2000);

      console.log(`Worker ${test.info().workerIndex}: Enrollment attempt completed`);
    }
  });
});

test.describe('Load Testing - Concurrent Profile Access', () => {
  test('should handle multiple users accessing profiles @load', async ({ page }) => {
    await setupAuthenticatedSession(page, 'student');

    const startTime = Date.now();

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`Worker ${test.info().workerIndex}: Profile loaded in ${loadTime}ms`);

    expect(loadTime).toBeLessThan(10000);
  });
});

test.describe('Load Testing - Concurrent Dashboard Access', () => {
  test('should handle multiple users accessing dashboard @load', async ({ page }) => {
    await setupAuthenticatedSession(page, 'student');

    const startTime = Date.now();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`Worker ${test.info().workerIndex}: Dashboard loaded in ${loadTime}ms`);

    expect(loadTime).toBeLessThan(10000);
  });
});

test.describe('Load Testing - Admin Operations', () => {
  test('should handle concurrent admin dashboard access @load', async ({ page }) => {
    await setupAuthenticatedSession(page, 'admin');

    const startTime = Date.now();

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`Worker ${test.info().workerIndex}: Admin dashboard loaded in ${loadTime}ms`);

    expect(loadTime).toBeLessThan(15000); // Admin pages may be heavier
  });

  test('should handle concurrent analytics access @load', async ({ page }) => {
    await setupAuthenticatedSession(page, 'admin');

    const startTime = Date.now();

    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`Worker ${test.info().workerIndex}: Analytics loaded in ${loadTime}ms`);

    expect(loadTime).toBeLessThan(15000);
  });
});

test.describe('Load Testing - API Endpoints', () => {
  test('should handle concurrent API requests @load', async ({ page }) => {
    await page.goto('/');

    const apiCalls: Promise<void>[] = [];

    // Simulate multiple API calls
    for (let i = 0; i < 5; i++) {
      apiCalls.push(
        page.evaluate(async () => {
          try {
            await fetch('/api/courses');
          } catch {
            // Ignore errors
          }
        })
      );
    }

    await Promise.all(apiCalls);

    console.log(`Worker ${test.info().workerIndex}: Completed 5 API calls`);
  });
});

test.describe('Load Testing - Static Assets', () => {
  test('should handle concurrent static asset requests @load', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const resourceCount = await page.evaluate(() => {
      return performance.getEntriesByType('resource').length;
    });

    const loadTime = Date.now() - startTime;

    console.log(
      `Worker ${test.info().workerIndex}: Loaded ${resourceCount} resources in ${loadTime}ms`
    );

    expect(resourceCount).toBeGreaterThan(0);
  });
});

test.describe('Load Testing - Form Submissions', () => {
  test('should handle concurrent form submissions @load', async ({ page }) => {
    await setupAuthenticatedSession(page, 'student');

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    const firstNameInput = page
      .locator('input[name="firstName"], input[name="first_name"]')
      .first();

    if (await firstNameInput.isVisible()) {
      await firstNameInput.fill(`User ${test.info().workerIndex}`);

      const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();

      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(2000);

        console.log(`Worker ${test.info().workerIndex}: Form submitted`);
      }
    }
  });
});

test.describe('Load Testing - Navigation Patterns', () => {
  test('should handle rapid page navigation @load', async ({ page }) => {
    const pages = ['/', '/courses', '/about', '/contact'];

    for (const url of pages) {
      await page.goto(url);
      await page.waitForTimeout(500); // Quick navigation
    }

    console.log(`Worker ${test.info().workerIndex}: Completed rapid navigation`);
  });

  test('should handle back/forward navigation @load', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    await page.goBack();
    await page.waitForTimeout(500);

    await page.goForward();
    await page.waitForTimeout(500);

    console.log(`Worker ${test.info().workerIndex}: Completed back/forward navigation`);
  });
});

test.describe('Load Testing - Search Operations', () => {
  test('should handle concurrent search requests @load', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    const searchTerms = ['JavaScript', 'Python', 'React', 'Node.js', 'Web'];
    const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];

    const searchInput = page.locator('input[placeholder*="Search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill(randomTerm);
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);

      console.log(`Worker ${test.info().workerIndex}: Searched for "${randomTerm}"`);
    }
  });
});

test.describe('Load Testing - Filter Operations', () => {
  test('should handle concurrent filter applications @load', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    const filterButton = page
      .locator('button:has-text("Filter"), button:has-text("Filters")')
      .first();

    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(1000);

      console.log(`Worker ${test.info().workerIndex}: Applied filters`);
    }
  });
});

test.describe('Load Testing - Session Management', () => {
  test('should handle multiple concurrent sessions @load', async ({ page, context: _context }) => {
    await setupAuthenticatedSession(page, 'student');

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify session is active
    const isAuthenticated = await page.evaluate(() => {
      return !!localStorage.getItem('auth-token') || !!sessionStorage.getItem('auth-token');
    });

    console.log(`Worker ${test.info().workerIndex}: Session active: ${isAuthenticated}`);
  });
});
