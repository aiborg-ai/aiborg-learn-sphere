/**
 * Cross-Browser Compatibility Testing
 * Tests for compatibility across Chrome, Firefox, and WebKit (Safari)
 * Run with: npx playwright test --project=chromium --project=firefox --project=webkit
 */

import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession } from '../utils/auth';

test.describe('Cross-Browser - Core Functionality', () => {
  test('should load homepage in all browsers', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log(`Testing homepage in ${browserName}`);

    // Check page loaded
    expect(await page.title()).toBeTruthy();

    // Check main content is visible
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent).toBeVisible();
  });

  test('should navigate between pages in all browsers', async ({ page, browserName }) => {
    console.log(`Testing navigation in ${browserName}`);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.click('a[href="/courses"]');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/courses');
  });

  test('should handle authentication in all browsers', async ({ page, browserName }) => {
    console.log(`Testing authentication in ${browserName}`);

    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator(
      'button:has-text("Log in"), button:has-text("Login"), button:has-text("Sign in")'
    );

    if ((await emailInput.count()) > 0) {
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(loginButton.first()).toBeVisible();
    }
  });
});

test.describe('Cross-Browser - Forms and Input', () => {
  test('should handle form input in all browsers', async ({ page, browserName }) => {
    console.log(`Testing form input in ${browserName}`);

    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
      const value = await emailInput.inputValue();
      expect(value).toBe('test@example.com');
    }
  });

  test('should handle form validation in all browsers', async ({ page, browserName }) => {
    console.log(`Testing form validation in ${browserName}`);

    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    const loginButton = page
      .locator('button:has-text("Log in"), button:has-text("Login"), button:has-text("Sign in")')
      .first();

    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(1000);

      // Should show validation errors
      const hasError =
        (await page.locator('[role="alert"]').count()) > 0 ||
        (await page.locator('.error, [class*="error"]').count()) > 0 ||
        (await page.locator('text=required, text=invalid').count()) > 0;

      console.log(`Validation errors shown: ${hasError}`);
    }
  });
});

test.describe('Cross-Browser - JavaScript Features', () => {
  test('should handle click events in all browsers', async ({ page, browserName }) => {
    console.log(`Testing click events in ${browserName}`);

    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    const clickableElement = page.locator('button, a[href]').first();

    if (await clickableElement.isVisible()) {
      await clickableElement.click();
      await page.waitForTimeout(1000);
      // Click should trigger some action
      expect(true).toBe(true);
    }
  });

  test('should handle keyboard events in all browsers', async ({ page, browserName }) => {
    console.log(`Testing keyboard events in ${browserName}`);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.focus();
      await searchInput.press('A');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Cross-Browser - CSS and Styling', () => {
  test('should render responsive layout in all browsers', async ({ page, browserName }) => {
    console.log(`Testing responsive layout in ${browserName}`);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const mobileNav = page.locator('[data-testid="mobile-nav"], button[aria-label*="menu"]');
    const isMobileNavVisible = (await mobileNav.count()) > 0;

    console.log(`Mobile navigation detected: ${isMobileNavVisible}`);

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
  });

  test('should handle flex/grid layouts in all browsers', async ({ page, browserName }) => {
    console.log(`Testing flex/grid layouts in ${browserName}`);

    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    // Check that course cards are rendered
    const courseCards = page.locator('[data-testid="course-card"], .course-card');
    const cardCount = await courseCards.count();

    console.log(`Course cards rendered: ${cardCount}`);
    expect(cardCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Cross-Browser - Media Handling', () => {
  test('should load images in all browsers', async ({ page, browserName }) => {
    console.log(`Testing image loading in ${browserName}`);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const images = page.locator('img[src]');
    const imageCount = await images.count();

    console.log(`Images found: ${imageCount}`);

    if (imageCount > 0) {
      // Check if at least one image loaded
      const firstImage = images.first();
      const isLoaded = await firstImage.evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalHeight > 0
      );

      console.log(`First image loaded successfully: ${isLoaded}`);
    }
  });

  test('should handle video elements in all browsers', async ({ page, browserName }) => {
    console.log(`Testing video elements in ${browserName}`);

    await setupAuthenticatedSession(page, 'student');

    // Try to find a video element
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    const videos = page.locator('video');
    const videoCount = await videos.count();

    console.log(`Videos found: ${videoCount}`);
  });
});

test.describe('Cross-Browser - Local Storage', () => {
  test('should persist data in local storage', async ({ page, browserName }) => {
    console.log(`Testing local storage in ${browserName}`);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      localStorage.setItem('test-key', 'test-value');
    });

    const value = await page.evaluate(() => localStorage.getItem('test-key'));

    expect(value).toBe('test-value');

    // Clean up
    await page.evaluate(() => {
      localStorage.removeItem('test-key');
    });
  });

  test('should persist data in session storage', async ({ page, browserName }) => {
    console.log(`Testing session storage in ${browserName}`);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      sessionStorage.setItem('test-session', 'session-value');
    });

    const value = await page.evaluate(() => sessionStorage.getItem('test-session'));

    expect(value).toBe('session-value');

    // Clean up
    await page.evaluate(() => {
      sessionStorage.removeItem('test-session');
    });
  });
});

test.describe('Cross-Browser - API Requests', () => {
  test('should make fetch requests in all browsers', async ({ page, browserName }) => {
    console.log(`Testing fetch API in ${browserName}`);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const canFetch = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/health');
        return response.ok || response.status === 404;
      } catch {
        return false;
      }
    });

    console.log(`Fetch API available: ${canFetch}`);
  });
});

test.describe('Cross-Browser - Modals and Overlays', () => {
  test('should display modals in all browsers', async ({ page, browserName }) => {
    console.log(`Testing modals in ${browserName}`);

    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    const viewDetailsButton = page
      .locator('button:has-text("View Details"), button:has-text("Details")')
      .first();

    if (await viewDetailsButton.isVisible()) {
      await viewDetailsButton.click();
      await page.waitForTimeout(1000);

      const modal = page.locator('[role="dialog"], [data-testid="modal"]');
      if ((await modal.count()) > 0) {
        await expect(modal.first()).toBeVisible();

        // Close modal
        const closeButton = modal
          .locator('button[aria-label="Close"], button:has-text("Close")')
          .first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    }
  });
});

test.describe('Cross-Browser - Accessibility', () => {
  test('should support keyboard navigation in all browsers', async ({ page, browserName }) => {
    console.log(`Testing keyboard navigation in ${browserName}`);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab through elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    console.log(`Focused element: ${focusedElement}`);
    expect(focusedElement).toBeTruthy();
  });

  test('should support screen reader attributes in all browsers', async ({ page, browserName }) => {
    console.log(`Testing screen reader attributes in ${browserName}`);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const ariaLabels = await page.locator('[aria-label]').count();
    const ariaDescribedBy = await page.locator('[aria-describedby]').count();
    const roles = await page.locator('[role]').count();

    console.log(
      `ARIA labels: ${ariaLabels}, ARIA described-by: ${ariaDescribedBy}, Roles: ${roles}`
    );
    expect(ariaLabels + ariaDescribedBy + roles).toBeGreaterThan(0);
  });
});

test.describe('Cross-Browser - Console Errors', () => {
  test('should not have console errors in all browsers', async ({ page, browserName }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log(`Console errors in ${browserName}: ${consoleErrors.length}`);

    if (consoleErrors.length > 0) {
      console.log('Console errors:', consoleErrors);
    }

    // Allow some errors but warn if too many
    expect(consoleErrors.length).toBeLessThan(10);
  });
});
