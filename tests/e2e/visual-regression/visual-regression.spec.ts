/**
 * Visual Regression Testing
 * Tests for visual consistency across different pages and components
 */

import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession } from '../utils/auth';

test.describe('Visual Regression - Public Pages', () => {
  test('should match homepage screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should match courses page screenshot', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('courses-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should match login page screenshot', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('login-page.png', {
      maxDiffPixels: 50,
    });
  });

  test('should match signup page screenshot', async ({ page }) => {
    await page.goto('/auth?mode=signup');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('signup-page.png', {
      maxDiffPixels: 50,
    });
  });
});

test.describe('Visual Regression - Authenticated Pages', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page, 'student');
  });

  test('should match profile page screenshot', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('profile-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should match dashboard screenshot', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });

  test('should match my courses screenshot', async ({ page }) => {
    await page.goto('/my-courses');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('my-courses.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

test.describe('Visual Regression - Admin Pages', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page, 'admin');
  });

  test('should match admin dashboard screenshot', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('admin-dashboard.png', {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });

  test('should match user management screenshot', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('user-management.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should match analytics screenshot', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('analytics.png', {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });
});

test.describe('Visual Regression - Components', () => {
  test('should match navigation header', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const header = page.locator('header, nav').first();
    await expect(header).toHaveScreenshot('navigation-header.png', {
      maxDiffPixels: 50,
    });
  });

  test('should match footer', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const footer = page.locator('footer').first();
    if (await footer.isVisible()) {
      await expect(footer).toHaveScreenshot('footer.png', {
        maxDiffPixels: 50,
      });
    }
  });

  test('should match course card', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    const courseCard = page.locator('[data-testid="course-card"]').first();
    if (await courseCard.isVisible()) {
      await expect(courseCard).toHaveScreenshot('course-card.png', {
        maxDiffPixels: 50,
      });
    }
  });
});

test.describe('Visual Regression - Responsive Design', () => {
  test('should match mobile homepage', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should match tablet homepage', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should match desktop homepage', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('homepage-desktop.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

test.describe('Visual Regression - Dark Mode', () => {
  test('should match homepage in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('homepage-dark.png', {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });

  test('should match courses page in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('courses-page-dark.png', {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });
});

test.describe('Visual Regression - Modals and Dialogs', () => {
  test('should match course details modal', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    const viewDetailsButton = page.locator('button:has-text("View Details")').first();
    if (await viewDetailsButton.isVisible()) {
      await viewDetailsButton.click();
      await page.waitForTimeout(1000);

      const modal = page.locator('[role="dialog"], [data-testid="modal"]').first();
      if (await modal.isVisible()) {
        await expect(modal).toHaveScreenshot('course-details-modal.png', {
          maxDiffPixels: 100,
        });
      }
    }
  });

  test('should match enrollment form', async ({ page }) => {
    await setupAuthenticatedSession(page, 'student');
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    const enrollButton = page.locator('button:has-text("Enroll")').first();
    if (await enrollButton.isVisible()) {
      await enrollButton.click();
      await page.waitForTimeout(1000);

      const enrollmentForm = page.locator('[data-testid="enrollment-form"]');
      if (await enrollmentForm.isVisible()) {
        await expect(enrollmentForm).toHaveScreenshot('enrollment-form.png', {
          maxDiffPixels: 100,
        });
      }
    }
  });
});

test.describe('Visual Regression - Error States', () => {
  test('should match 404 page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('404-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should match empty state', async ({ page }) => {
    await setupAuthenticatedSession(page, 'student');
    await page.goto('/my-courses');
    await page.waitForLoadState('networkidle');

    const emptyState = page.locator('[data-testid="empty-state"]');
    if (await emptyState.isVisible()) {
      await expect(emptyState).toHaveScreenshot('empty-state.png', {
        maxDiffPixels: 50,
      });
    }
  });
});

test.describe('Visual Regression - Loading States', () => {
  test('should match loading skeleton', async ({ page }) => {
    await page.goto('/courses');

    // Try to capture loading state
    const loadingSkeleton = page.locator('[data-testid="loading-skeleton"]');
    if (await loadingSkeleton.isVisible({ timeout: 1000 })) {
      await expect(loadingSkeleton).toHaveScreenshot('loading-skeleton.png', {
        maxDiffPixels: 50,
      });
    }
  });
});
