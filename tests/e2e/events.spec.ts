import { test, expect } from '@playwright/test';

test.describe('Events Section - Public View', () => {
  test('should display events section on homepage', async ({ page }) => {
    await page.goto('/');

    // Wait for events section to load
    await page.waitForSelector('text=Join Our Events', { timeout: 10000 });

    // Check section header
    await expect(page.locator('text=Join Our Events')).toBeVisible();
    await expect(page.locator('text=Networking & Events')).toBeVisible();

    // Check for stats cards
    await expect(page.locator('text=Upcoming Events')).toBeVisible();
    await expect(page.locator('text=Network Members')).toBeVisible();
  });

  test('should display event cards', async ({ page }) => {
    await page.goto('/');

    // Wait for events to load
    await page.waitForSelector('text=Join Our Events', { timeout: 10000 });

    // Check if at least one event card is present or empty state
    const eventCards = page.locator('[data-testid="event-card"]');
    const emptyState = page.locator('text=No events found');

    // Either events exist or empty state is shown
    await expect(
      eventCards.first().or(emptyState)
    ).toBeVisible({ timeout: 5000 });
  });

  test('should filter events by category', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Join Our Events', { timeout: 10000 });

    // Check filter buttons
    const allFilter = page.locator('button:has-text("All Events")');
    const upcomingFilter = page.locator('button:has-text("Upcoming")');

    await expect(allFilter).toBeVisible();
    await expect(upcomingFilter).toBeVisible();

    // Click upcoming filter
    await upcomingFilter.click();

    // Verify filter is active (button should have primary styling)
    await expect(upcomingFilter).toHaveClass(/bg-primary|text-primary-foreground/);
  });

  test('should display past events section if available', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Join Our Events', { timeout: 10000 });

    // Scroll to check for past events section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check if past events section exists
    const pastEventsSection = page.locator('text=Past Events Gallery');
    const reliveTheMoments = page.locator('text=Relive the Moments');

    // If past events exist, verify section is properly displayed
    if (await pastEventsSection.count() > 0) {
      await expect(pastEventsSection).toBeVisible();
      await expect(reliveTheMoments).toBeVisible();
    }
  });

  test('should display event photo gallery for past events', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Join Our Events', { timeout: 10000 });

    // Look for past events section
    const pastEventsSection = page.locator('text=Past Events Gallery');

    if (await pastEventsSection.count() > 0) {
      await pastEventsSection.scrollIntoViewIfNeeded();

      // Check for photo gallery
      const photoGallery = page.locator('text=Event Photos');

      if (await photoGallery.count() > 0) {
        await expect(photoGallery).toBeVisible();

        // Check if photos are displayed
        const photos = page.locator('img[alt*="photo"]');
        expect(await photos.count()).toBeGreaterThan(0);
      }
    }
  });

  test('should open lightbox when clicking on event photo', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Join Our Events', { timeout: 10000 });

    // Look for past events with photos
    const photoGallery = page.locator('text=Event Photos');

    if (await photoGallery.count() > 0) {
      // Click on first photo
      const firstPhoto = page.locator('img[alt*="photo"]').first();
      await firstPhoto.click();

      // Check if lightbox/dialog opened
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 3000 });

      // Check for navigation buttons
      const closeButton = dialog.locator('button').filter({ hasText: /close|×/i });
      await expect(closeButton).toBeVisible();

      // Close the lightbox
      await closeButton.click();
      await expect(dialog).not.toBeVisible();
    }
  });

  test('should navigate photos in lightbox', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Join Our Events', { timeout: 10000 });

    const photoGallery = page.locator('text=Event Photos');

    if (await photoGallery.count() > 0) {
      const photos = page.locator('img[alt*="photo"]');
      const photoCount = await photos.count();

      if (photoCount > 1) {
        // Click first photo
        await photos.first().click();

        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible();

        // Try to find next button
        const nextButton = dialog.locator('button').filter({ has: page.locator('svg') }).nth(1);

        if (await nextButton.count() > 0) {
          await nextButton.click();

          // Verify photo changed (dialog still visible)
          await expect(dialog).toBeVisible();
        }

        // Close dialog
        await page.keyboard.press('Escape');
        await expect(dialog).not.toBeVisible();
      }
    }
  });

  test('should show/hide more past events', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Join Our Events', { timeout: 10000 });

    const pastEventsSection = page.locator('text=Past Events Gallery');

    if (await pastEventsSection.count() > 0) {
      await pastEventsSection.scrollIntoViewIfNeeded();

      // Look for "View All" or "Show More" button
      const showMoreButton = page.locator('button').filter({ hasText: /view all|show more/i });

      if (await showMoreButton.count() > 0) {
        await showMoreButton.click();

        // Button text should change to "Show Less"
        await expect(page.locator('button:has-text("Show Less")')).toBeVisible({ timeout: 2000 });

        // Click again to collapse
        await page.locator('button:has-text("Show Less")').click();
        await expect(showMoreButton).toBeVisible({ timeout: 2000 });
      }
    }
  });
});

test.describe('Events Section - Responsiveness', () => {
  test('should display correctly on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForSelector('text=Join Our Events', { timeout: 10000 });

    // Check that events section is visible
    await expect(page.locator('text=Join Our Events')).toBeVisible();

    // Check filter buttons are accessible
    const filterButtons = page.locator('button').filter({ hasText: /All Events|Upcoming/ });
    await expect(filterButtons.first()).toBeVisible();
  });

  test('should display correctly on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/');
    await page.waitForSelector('text=Join Our Events', { timeout: 10000 });

    // Check that events section is visible
    await expect(page.locator('text=Join Our Events')).toBeVisible();

    // Stats cards should be visible in grid
    const statsCards = page.locator('text=Upcoming Events').locator('..');
    await expect(statsCards).toBeVisible();
  });
});
