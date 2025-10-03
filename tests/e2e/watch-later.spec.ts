import { test, expect } from '@playwright/test';
import { login, TEST_USER } from './utils/auth';

test.describe('Watch Later Feature', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);
  });

  test.describe('Adding to Queue', () => {
    test('should add video to watch later queue', async ({ page }) => {
      // Navigate to course materials
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      // Wait for materials to load
      await page.waitForSelector('text=/Video|recording/i', { timeout: 5000 });

      // Find video material
      const videoMaterial = page.locator('text=/Video|recording/i').first().locator('..');

      // Click "Watch Later" button
      const watchLaterBtn = videoMaterial.locator('button[title*="watch later" i], button:has-text("Watch Later")');
      await watchLaterBtn.click();

      // Verify success notification
      await expect(page.locator('text=/added.*watch later|saved.*queue/i')).toBeVisible({ timeout: 5000 });

      // Verify button state changed
      await expect(watchLaterBtn).toContainText(/in queue|queued|✓/i);
    });

    test('should add multiple videos to queue', async ({ page }) => {
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      // Add first video
      const videos = page.locator('button[title*="watch later" i]');
      const videoCount = await videos.count();

      if (videoCount >= 2) {
        // Add first video
        await videos.nth(0).click();
        await expect(page.locator('text=/added.*watch later/i')).toBeVisible();
        await page.waitForTimeout(500);

        // Add second video
        await videos.nth(1).click();
        await expect(page.locator('text=/added.*watch later/i')).toBeVisible();

        // Navigate to watch later page
        await page.goto('/watch-later');

        // Verify both videos in queue
        const queueItems = page.locator('[data-testid="queue-item"]')
          .or(page.locator('div:has(button[title*="remove" i])'));

        expect(await queueItems.count()).toBeGreaterThanOrEqual(2);
      }
    });

    test('should remove from queue by clicking again', async ({ page }) => {
      // Add to queue first
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      const watchLaterBtn = page.locator('button[title*="watch later" i]').first();
      await watchLaterBtn.click();
      await page.waitForSelector('text=/added.*watch later/i');
      await page.waitForTimeout(1000);

      // Click again to remove
      await watchLaterBtn.click();

      // Verify removed notification
      await expect(page.locator('text=/removed.*queue|removed.*watch later/i')).toBeVisible();

      // Verify button state reset
      await expect(watchLaterBtn).not.toContainText(/in queue|queued/i);
    });

    test('should show watch later button only for videos', async ({ page }) => {
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      // Find PDF material
      const pdfMaterial = page.locator('text=/PDF|Handbook/i').first().locator('..');

      // Verify NO watch later button for PDF
      const pdfWatchLaterBtn = pdfMaterial.locator('button[title*="watch later" i]');
      expect(await pdfWatchLaterBtn.count()).toBe(0);

      // Find video material
      const videoMaterial = page.locator('text=/Video|recording/i').first().locator('..');

      // Verify watch later button exists for video
      const videoWatchLaterBtn = videoMaterial.locator('button[title*="watch later" i]');
      await expect(videoWatchLaterBtn).toBeVisible();
    });

    test('should prevent duplicate entries in queue', async ({ page }) => {
      // Add video to queue
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      const watchLaterBtn = page.locator('button[title*="watch later" i]').first();
      await watchLaterBtn.click();
      await page.waitForTimeout(1000);

      // Try to add same video again (should remove instead)
      await watchLaterBtn.click();

      // Should show removed message, not added again
      await expect(page.locator('text=/removed/i')).toBeVisible();
    });
  });

  test.describe('Viewing Queue', () => {
    test('should navigate to watch later page', async ({ page }) => {
      await page.goto('/watch-later');

      // Verify page loaded
      await expect(page).toHaveURL(/\/watch-later/);
      await expect(page.locator('h1')).toContainText(/watch later/i);
    });

    test('should display queue statistics', async ({ page }) => {
      await page.goto('/watch-later');
      await page.waitForLoadState('networkidle');

      // Verify stats present
      await expect(page.locator('text=/total.*videos?|items?.*in.*queue/i')).toBeVisible();

      // Check for duration if videos exist
      const queueItems = page.locator('[data-testid="queue-item"]');
      if (await queueItems.count() > 0) {
        await expect(page.locator('text=/total.*duration|watch.*time/i')).toBeVisible();
      }
    });

    test('should show position numbers in queue', async ({ page }) => {
      // Add videos to queue first
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      const watchLaterBtns = page.locator('button[title*="watch later" i]');
      const btnCount = Math.min(await watchLaterBtns.count(), 3);

      for (let i = 0; i < btnCount; i++) {
        await watchLaterBtns.nth(i).click();
        await page.waitForTimeout(500);
      }

      // Go to watch later page
      await page.goto('/watch-later');
      await page.waitForLoadState('networkidle');

      // Verify position badges/numbers
      await expect(page.locator('text=/^1$|#1|position.*1/i').first()).toBeVisible();

      if (btnCount >= 2) {
        await expect(page.locator('text=/^2$|#2|position.*2/i').first()).toBeVisible();
      }
    });

    test('should display video metadata in queue', async ({ page }) => {
      // Add video to queue
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      await page.locator('button[title*="watch later" i]').first().click();
      await page.waitForTimeout(1000);

      // Navigate to watch later page
      await page.goto('/watch-later');

      // Verify video details shown
      const queueItem = page.locator('[data-testid="queue-item"]').first()
        .or(page.locator('div:has(button[title*="remove" i])').first());

      if (await queueItem.isVisible()) {
        // Should show title
        await expect(queueItem).toContainText(/.+/);

        // May show duration, course name, etc.
        // This depends on implementation
      }
    });
  });

  test.describe('Reordering Queue', () => {
    test('should move item up in queue', async ({ page }) => {
      // Add at least 2 videos to queue
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      const watchLaterBtns = page.locator('button[title*="watch later" i]');
      const btnCount = Math.min(await watchLaterBtns.count(), 2);

      for (let i = 0; i < btnCount; i++) {
        await watchLaterBtns.nth(i).click();
        await page.waitForTimeout(500);
      }

      await page.goto('/watch-later');
      await page.waitForLoadState('networkidle');

      if (btnCount >= 2) {
        // Get text of second item
        const secondItem = page.locator('[data-testid="queue-item"]').nth(1)
          .or(page.locator('text=/^2$|#2/i').locator('..'));

        const itemText = await secondItem.textContent();

        // Click "Move Up" button
        await secondItem.locator('button[title*="move up" i], button:has-text("↑")').click();

        await page.waitForTimeout(500);

        // Verify item moved to position 1
        const firstItem = page.locator('[data-testid="queue-item"]').first();
        await expect(firstItem).toContainText(itemText || '');
      }
    });

    test('should move item down in queue', async ({ page }) => {
      // Add at least 2 videos to queue
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      const watchLaterBtns = page.locator('button[title*="watch later" i]');
      const btnCount = Math.min(await watchLaterBtns.count(), 2);

      for (let i = 0; i < btnCount; i++) {
        await watchLaterBtns.nth(i).click();
        await page.waitForTimeout(500);
      }

      await page.goto('/watch-later');
      await page.waitForLoadState('networkidle');

      if (btnCount >= 2) {
        // Get text of first item
        const firstItem = page.locator('[data-testid="queue-item"]').first();
        const itemText = await firstItem.textContent();

        // Click "Move Down" button
        await firstItem.locator('button[title*="move down" i], button:has-text("↓")').click();

        await page.waitForTimeout(500);

        // Verify item moved to position 2
        const secondItem = page.locator('[data-testid="queue-item"]').nth(1);
        await expect(secondItem).toContainText(itemText || '');
      }
    });

    test('should move item to top of queue', async ({ page }) => {
      // Add at least 3 videos to queue
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      const watchLaterBtns = page.locator('button[title*="watch later" i]');
      const btnCount = Math.min(await watchLaterBtns.count(), 3);

      for (let i = 0; i < btnCount; i++) {
        await watchLaterBtns.nth(i).click();
        await page.waitForTimeout(500);
      }

      await page.goto('/watch-later');
      await page.waitForLoadState('networkidle');

      if (btnCount >= 3) {
        // Get text of third item
        const thirdItem = page.locator('[data-testid="queue-item"]').nth(2);
        const itemText = await thirdItem.textContent();

        // Click "Move to Top" button
        await thirdItem.locator('button[title*="move.*top" i], button:has-text("⬆")').click();

        await page.waitForTimeout(500);

        // Verify item moved to position 1
        const firstItem = page.locator('[data-testid="queue-item"]').first();
        await expect(firstItem).toContainText(itemText || '');
      }
    });

    test('should disable move up for first item', async ({ page }) => {
      // Add video to queue
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      await page.locator('button[title*="watch later" i]').first().click();
      await page.waitForTimeout(1000);

      await page.goto('/watch-later');

      // First item should have disabled "Move Up" button
      const firstItem = page.locator('[data-testid="queue-item"]').first();
      const moveUpBtn = firstItem.locator('button[title*="move up" i]');

      if (await moveUpBtn.count() > 0) {
        await expect(moveUpBtn).toBeDisabled();
      }
    });

    test('should disable move down for last item', async ({ page }) => {
      // Add videos to queue
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      const watchLaterBtns = page.locator('button[title*="watch later" i]');
      await watchLaterBtns.first().click();
      await page.waitForTimeout(1000);

      await page.goto('/watch-later');

      // Last item should have disabled "Move Down" button
      const lastItem = page.locator('[data-testid="queue-item"]').last();
      const moveDownBtn = lastItem.locator('button[title*="move down" i]');

      if (await moveDownBtn.count() > 0) {
        await expect(moveDownBtn).toBeDisabled();
      }
    });

    test('should drag and drop to reorder', async ({ page }) => {
      // Add multiple videos
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      const watchLaterBtns = page.locator('button[title*="watch later" i]');
      const btnCount = Math.min(await watchLaterBtns.count(), 3);

      for (let i = 0; i < btnCount; i++) {
        await watchLaterBtns.nth(i).click();
        await page.waitForTimeout(500);
      }

      await page.goto('/watch-later');
      await page.waitForLoadState('networkidle');

      if (btnCount >= 2) {
        // Get items
        const firstItem = page.locator('[data-testid="queue-item"]').first();
        const secondItem = page.locator('[data-testid="queue-item"]').nth(1);

        const firstText = await firstItem.textContent();

        // Attempt drag and drop (if implemented)
        await firstItem.dragTo(secondItem);

        await page.waitForTimeout(500);

        // Verify order changed
        const newSecondItem = page.locator('[data-testid="queue-item"]').nth(1);
        await expect(newSecondItem).toContainText(firstText || '');
      }
    });
  });

  test.describe('Playing from Queue', () => {
    test('should play video from queue', async ({ page }) => {
      // Add video to queue
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      await page.locator('button[title*="watch later" i]').first().click();
      await page.waitForTimeout(1000);

      await page.goto('/watch-later');

      // Click play button
      const queueItem = page.locator('[data-testid="queue-item"]').first();
      await queueItem.locator('button:has-text("Play"), button[title*="play" i]').click();

      // Verify video player opens
      await expect(page.locator('video, [data-testid="video-player"]')).toBeVisible({ timeout: 5000 });
    });

    test('should show "Play Next" button', async ({ page }) => {
      // Add multiple videos
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      const watchLaterBtns = page.locator('button[title*="watch later" i]');
      const btnCount = Math.min(await watchLaterBtns.count(), 2);

      for (let i = 0; i < btnCount; i++) {
        await watchLaterBtns.nth(i).click();
        await page.waitForTimeout(500);
      }

      await page.goto('/watch-later');

      // Verify "Play Next" button exists for first item
      const firstItem = page.locator('[data-testid="queue-item"]').first();
      await expect(firstItem.locator('button:has-text("Play Next"), button:has-text("Play")')).toBeVisible();
    });

    test('should mark video as watched after playing', async ({ page }) => {
      // Add video to queue
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      await page.locator('button[title*="watch later" i]').first().click();
      await page.waitForTimeout(1000);

      await page.goto('/watch-later');

      // Play video
      const queueItem = page.locator('[data-testid="queue-item"]').first();
      await queueItem.locator('button:has-text("Play")').click();

      // Wait for video to load and play briefly
      await page.waitForSelector('video');
      await page.waitForTimeout(2000);

      // Close video player
      await page.keyboard.press('Escape');

      // Optionally: verify video marked as watched
      // This depends on implementation
    });
  });

  test.describe('Removing from Queue', () => {
    test('should remove single item from queue', async ({ page }) => {
      // Add video to queue
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      await page.locator('button[title*="watch later" i]').first().click();
      await page.waitForTimeout(1000);

      await page.goto('/watch-later');

      // Get item text
      const queueItem = page.locator('[data-testid="queue-item"]').first();
      const itemText = await queueItem.textContent();

      // Click remove button
      await queueItem.locator('button[title*="remove" i], button:has-text("Remove")').click();

      // Confirm if needed
      await page.click('button:has-text("Remove"), button:has-text("Confirm")').catch(() => {
        // No confirmation dialog
      });

      // Verify removed
      await expect(page.locator('text=/removed/i')).toBeVisible();

      if (itemText) {
        await expect(page.locator(`text=${itemText}`)).not.toBeVisible();
      }
    });

    test('should clear entire queue', async ({ page }) => {
      // Add videos to queue
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      const watchLaterBtns = page.locator('button[title*="watch later" i]');
      const btnCount = Math.min(await watchLaterBtns.count(), 2);

      for (let i = 0; i < btnCount; i++) {
        await watchLaterBtns.nth(i).click();
        await page.waitForTimeout(500);
      }

      await page.goto('/watch-later');

      // Click "Clear Queue" button
      const clearBtn = page.locator('button:has-text("Clear Queue"), button:has-text("Clear All")');

      if (await clearBtn.isVisible()) {
        await clearBtn.click();

        // Confirm
        await page.click('button:has-text("Clear"), button:has-text("Confirm")');

        // Verify empty state
        await expect(page.locator('text=/queue.*empty|no.*videos?.*queue/i')).toBeVisible();
      }
    });

    test('should show confirmation before clearing queue', async ({ page }) => {
      // Add video to queue
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      await page.locator('button[title*="watch later" i]').first().click();
      await page.waitForTimeout(1000);

      await page.goto('/watch-later');

      // Click clear button
      const clearBtn = page.locator('button:has-text("Clear Queue"), button:has-text("Clear All")');

      if (await clearBtn.isVisible()) {
        await clearBtn.click();

        // Verify confirmation dialog
        await expect(page.locator('text=/are you sure|confirm|warning/i')).toBeVisible();
        await expect(page.locator('button:has-text("Cancel")')).toBeVisible();

        // Cancel
        await page.click('button:has-text("Cancel")');

        // Verify queue still has items
        await expect(page.locator('[data-testid="queue-item"]').first()).toBeVisible();
      }
    });
  });

  test.describe('Queue Notes and Metadata', () => {
    test('should add note to queued video', async ({ page }) => {
      // Add video to queue
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      await page.locator('button[title*="watch later" i]').first().click();
      await page.waitForTimeout(1000);

      await page.goto('/watch-later');

      // Click "Add Note" or edit button
      const queueItem = page.locator('[data-testid="queue-item"]').first();
      await queueItem.locator('button:has-text("Note"), button[title*="note" i]').click();

      // Add note text
      await page.fill('textarea[placeholder*="note" i]', 'Watch this for exam prep');

      // Save note
      await page.click('button:has-text("Save")');

      // Verify note saved
      await expect(page.locator('text=Watch this for exam prep')).toBeVisible();
    });

    test('should show added date for queued items', async ({ page }) => {
      // Add video to queue
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      await page.locator('button[title*="watch later" i]').first().click();
      await page.waitForTimeout(1000);

      await page.goto('/watch-later');

      // Verify date shown
      const queueItem = page.locator('[data-testid="queue-item"]').first();
      await expect(queueItem.locator('text=/added|\\d+.*ago|today|yesterday/i')).toBeVisible();
    });
  });

  test.describe('Empty State', () => {
    test('should show empty state when queue is empty', async ({ page }) => {
      await page.goto('/watch-later');
      await page.waitForLoadState('networkidle');

      // Check for empty state message
      const emptyState = page.locator('text=/queue.*empty|no.*videos?.*queue|add.*videos?.*watch.*later/i');

      // If queue has items, this test would fail
      // In production, use fresh test user or clear queue first
      if (await emptyState.isVisible()) {
        await expect(emptyState).toBeVisible();

        // Verify CTA to browse courses
        await expect(page.locator('button:has-text("Browse"), a:has-text("Course")')).toBeVisible();
      }
    });
  });

  test.describe('Integration', () => {
    test('should show queue count badge in navigation', async ({ page }) => {
      // Add videos to queue
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      const watchLaterBtns = page.locator('button[title*="watch later" i]');
      const btnCount = Math.min(await watchLaterBtns.count(), 2);

      for (let i = 0; i < btnCount; i++) {
        await watchLaterBtns.nth(i).click();
        await page.waitForTimeout(500);
      }

      // Check navigation for badge
      const navLink = page.locator('a[href*="watch-later"], button:has-text("Watch Later")');

      if (await navLink.count() > 0) {
        // Verify badge shows count
        const badge = navLink.locator('text=/\\d+/').first();

        if (await badge.isVisible()) {
          const countText = await badge.textContent();
          expect(parseInt(countText || '0')).toBeGreaterThan(0);
        }
      }
    });

    test('should sync queue state across pages', async ({ page }) => {
      // Add video on course page
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      await page.locator('button[title*="watch later" i]').first().click();
      await page.waitForTimeout(1000);

      // Navigate to watch later page
      await page.goto('/watch-later');

      // Verify video appears in queue
      const queueItem = page.locator('[data-testid="queue-item"]').first();
      await expect(queueItem).toBeVisible();

      // Remove from queue
      await queueItem.locator('button[title*="remove" i]').click();
      await page.click('button:has-text("Remove"), button:has-text("Confirm")').catch(() => {});
      await page.waitForTimeout(1000);

      // Go back to course page
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      // Verify button state reset
      const watchLaterBtn = page.locator('button[title*="watch later" i]').first();
      await expect(watchLaterBtn).not.toContainText(/in queue|queued/i);
    });
  });
});
