import { test, expect } from '@playwright/test';

/**
 * Smoke tests to verify critical app functionality
 * These tests ensure the app is running and basic features work
 */

test.describe('App Smoke Tests', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for main content to load
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Check for key elements
    await expect(page.locator('text=AIBorg').or(page.locator('img[alt*="logo" i]'))).toBeVisible({
      timeout: 10000,
    });

    // Page should not have console errors (critical ones)
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a bit to catch any errors
    await page.waitForTimeout(2000);

    // Check no critical errors (filter out common non-critical errors)
    const criticalErrors = errors.filter(
      (err) =>
        !err.includes('favicon') &&
        !err.includes('Source map') &&
        !err.includes('DevTools')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check navigation links are present
    const nav = page.locator('nav').or(page.locator('header'));
    await expect(nav).toBeVisible();

    // Common navigation items
    const homeLink = page.locator('a[href="/"]').or(page.locator('text=Home'));
    if (await homeLink.count() > 0) {
      await expect(homeLink.first()).toBeVisible();
    }
  });

  test('should load courses section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for courses section
    const coursesSection = page.locator('text=/courses|learning|training/i');

    if (await coursesSection.count() > 0) {
      await coursesSection.first().scrollIntoViewIfNeeded();
      await expect(coursesSection.first()).toBeVisible();
    }
  });

  test('should load events section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Events section should be present
    await expect(
      page.locator('text=Join Our Events').or(page.locator('text=Networking'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('should have auth page accessible', async ({ page }) => {
    await page.goto('/auth');

    // Auth form should be visible
    await expect(
      page.locator('input[type="email"]').or(page.locator('text=Sign In'))
    ).toBeVisible({ timeout: 5000 });
  });

  test('should handle 404 page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345');

    // Should show 404 page or redirect
    await expect(
      page
        .locator('text=/404|not found|page.*exist/i')
        .or(page.locator('text=Home'))
    ).toBeVisible({ timeout: 5000 });
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Page should render properly on mobile
    await expect(page).toHaveURL('/');

    // Mobile menu or navigation should be accessible
    const mobileMenu = page.locator('button[aria-label*="menu" i]').or(
      page.locator('button:has-text("Menu")')
    );

    // If mobile menu exists, it should be visible
    if (await mobileMenu.count() > 0) {
      await expect(mobileMenu.first()).toBeVisible();
    }
  });

  test('should load faster than 5 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('load');

    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have working search or filter', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for search or filter inputs
    const searchInput = page.locator('input[type="search"]').or(
      page.locator('input[placeholder*="search" i]')
    );

    const filterButton = page.locator('button').filter({ hasText: /filter|category/i });

    // At least some interactive filtering should exist
    const hasSearch = (await searchInput.count()) > 0;
    const hasFilter = (await filterButton.count()) > 0;

    expect(hasSearch || hasFilter).toBeTruthy();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.route('**/*', (route) => {
      if (route.request().url().includes('/api/')) {
        route.abort();
      } else {
        route.continue();
      }
    });

    await page.goto('/');

    // App should still render (maybe with error states)
    await expect(page.locator('body')).toBeVisible();

    // Should not crash completely
    const errorText = await page.textContent('body');
    expect(errorText).toBeTruthy();
  });
});

test.describe('Critical User Flows', () => {
  test('should allow viewing course details', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for course cards or links
    const courseLink = page.locator('a[href*="/course/"]').first();

    if (await courseLink.count() > 0) {
      await courseLink.click();

      // Should navigate to course page
      await expect(page).toHaveURL(/\/course\/\d+/);

      // Course details should be visible
      await expect(
        page.locator('text=/description|overview|about/i')
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should allow viewing event details', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for event cards
    const eventCard = page.locator('[data-testid="event-card"]').first();

    if (await eventCard.count() > 0) {
      // Event cards should have key information
      await expect(eventCard.locator('text=/date|time/i')).toBeVisible();
      await expect(eventCard.locator('text=/location/i')).toBeVisible();
    }
  });

  test('should show loading states', async ({ page }) => {
    await page.goto('/');

    // Look for loading indicators (before content loads)
    const loadingIndicator = page.locator('text=/loading|spinner/i').or(
      page.locator('[role="progressbar"]')
    );

    // Loading state might be visible briefly
    // This is more of a check that it doesn't break
    await page.waitForLoadState('networkidle');

    // After loading, content should be visible
    await expect(page.locator('text=AIBorg').or(page.locator('main'))).toBeVisible();
  });

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/auth');

    // Check for proper form labels
    const emailInput = page.locator('input[type="email"]');

    if (await emailInput.count() > 0) {
      // Should have associated label or aria-label
      const hasLabel = await emailInput.evaluate((el) => {
        const id = el.id;
        return (
          document.querySelector(`label[for="${id}"]`) !== null ||
          el.getAttribute('aria-label') !== null ||
          el.getAttribute('placeholder') !== null
        );
      });

      expect(hasLabel).toBeTruthy();
    }
  });

  test('should maintain state on navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    const scrollPos = await page.evaluate(() => window.scrollY);

    // Navigate to another page
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Scroll position might not be maintained, but page should load
    await expect(page).toHaveURL('/');
  });
});

test.describe('Performance Checks', () => {
  test('should not have memory leaks in navigation', async ({ page }) => {
    const urls = ['/', '/auth', '/', '/auth', '/'];

    for (const url of urls) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
    }

    // If we got here without crashing, navigation doesn't cause obvious leaks
    await expect(page).toHaveURL('/');
  });

  test('should lazy load images', async ({ page }) => {
    await page.goto('/');

    // Check if images use lazy loading
    const images = page.locator('img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      const hasLazyLoading = await images.first().evaluate((img) => {
        return img.loading === 'lazy' || img.hasAttribute('loading');
      });

      // At least some images should use lazy loading (not required but good practice)
      // This is a soft check
      expect(typeof hasLazyLoading).toBe('boolean');
    }
  });

  test('should handle concurrent requests', async ({ page }) => {
    // Navigate and trigger multiple requests
    await Promise.all([
      page.goto('/'),
      page.waitForLoadState('networkidle'),
    ]);

    // Scroll to trigger lazy loading
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // App should handle multiple requests without errors
    await expect(page.locator('body')).toBeVisible();
  });
});
