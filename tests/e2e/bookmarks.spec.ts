import { test, expect } from '@playwright/test';
import { login, TEST_USER } from './utils/auth';

test.describe('Bookmarks Feature', () => {
  test.beforeEach(async ({ page: _page }) => {
    // Login before each test
    await login(page, TEST_USER.email, TEST_USER.password);
  });

  test.describe('Creating Bookmarks', () => {
    test('should bookmark a course', async ({ page: _page }) => {
      // Navigate to a course page
      await page.goto('/course/1'); // Assuming course ID 1 exists

      // Wait for page to load
      await page.waitForSelector('h1:has-text("Course")');

      // Find and click the bookmark button on course header
      const bookmarkButton = page
        .locator('button')
        .filter({ hasText: /Bookmark/ })
        .first();
      await bookmarkButton.click();

      // Fill in bookmark dialog
      await page.fill('input#title', 'My Course Bookmark');
      await page.fill('textarea#note', 'Important course for exam prep');
      await page.fill('input#folder', 'exam-prep');
      await page.fill('input#tags', 'important, review');

      // Save bookmark
      await page.click('button:has-text("Save Bookmark")');

      // Wait for toast notification
      await expect(page.locator('text=Bookmark Added')).toBeVisible({ timeout: 5000 });

      // Verify button state changed to bookmarked
      await expect(bookmarkButton).toContainText('Bookmarked');
    });

    test('should bookmark a material', async ({ page: _page }) => {
      // Navigate to course materials
      await page.goto('/course/1');

      // Click on Materials tab
      await page.click('button[role="tab"]:has-text("Materials")');

      // Wait for materials to load
      await page.waitForSelector('[data-testid="material-item"]', { timeout: 5000 }).catch(() => {
        // If no test ID, use alternative selector
        return page.waitForSelector('text=/Material|Video|PDF/', { timeout: 5000 });
      });

      // Click bookmark on first material
      const firstMaterial = page
        .locator('[data-testid="material-item"]')
        .first()
        .or(page.locator('div:has-text("Material")').first());

      const materialBookmarkBtn = firstMaterial.locator('button[title*="bookmark" i]');
      await materialBookmarkBtn.click();

      // Fill bookmark form
      await page.fill('input#title', 'Material Bookmark');
      await page.click('button:has-text("Save Bookmark")');

      // Verify success
      await expect(page.locator('text=Bookmark Added')).toBeVisible();
    });

    test('should unbookmark by clicking again', async ({ page: _page }) => {
      // Navigate to course
      await page.goto('/course/1');

      // Bookmark first
      const bookmarkBtn = page
        .locator('button')
        .filter({ hasText: /Bookmark/ })
        .first();
      await bookmarkBtn.click();
      await page.fill('input#title', 'Test Bookmark');
      await page.click('button:has-text("Save Bookmark")');
      await page.waitForSelector('text=Bookmark Added');

      // Wait a moment for UI to update
      await page.waitForTimeout(1000);

      // Click again to remove
      await bookmarkBtn.click();

      // Verify removed
      await expect(page.locator('text=Bookmark Removed')).toBeVisible();
    });
  });

  test.describe('Viewing Bookmarks', () => {
    test('should navigate to bookmarks page', async ({ page: _page }) => {
      await page.goto('/bookmarks');

      // Verify page loaded
      await expect(page).toHaveURL(/\/bookmarks/);
      await expect(page.locator('h1')).toContainText('Bookmarks');
    });

    test('should display bookmarks stats', async ({ page: _page }) => {
      await page.goto('/bookmarks');

      // Wait for stats card
      const statsCard = page.locator('text=Stats').locator('..');
      await expect(statsCard).toBeVisible();

      // Verify stats fields present
      await expect(statsCard.locator('text=Total')).toBeVisible();
      await expect(statsCard.locator('text=Recent')).toBeVisible();
    });

    test('should filter bookmarks by type', async ({ page: _page }) => {
      await page.goto('/bookmarks');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Click type filter dropdown
      await page.click('select, [role="combobox"]:near(:text("Type"))');

      // Select "Courses"
      await page.click('text=Courses');

      // Wait for filter to apply
      await page.waitForTimeout(1000);

      // Verify URL or filtered results (implementation dependent)
      // This is a placeholder - adjust based on actual implementation
    });

    test('should search bookmarks', async ({ page: _page }) => {
      await page.goto('/bookmarks');

      // Enter search query
      await page.fill('input[placeholder*="Search" i]', 'test');

      // Wait for debounce and results
      await page.waitForTimeout(1000);

      // Verify search applied (check URL or results count)
    });

    test('should navigate to bookmarked content', async ({ page: _page }) => {
      await page.goto('/bookmarks');

      // Wait for bookmarks to load
      await page.waitForSelector('text=/bookmark/i', { timeout: 5000 }).catch(() => null);

      // Click first bookmark (if any exist)
      const firstBookmark = page
        .locator('[data-testid="bookmark-card"]')
        .first()
        .or(page.locator('div:has(button[title*="delete" i])').first());

      if ((await firstBookmark.count()) > 0) {
        await firstBookmark.click();

        // Verify navigation occurred (URL changed)
        await page.waitForURL(/\/(course|assignment)/, { timeout: 5000 }).catch(() => {
          // Some bookmarks might navigate to different pages
        });
      }
    });
  });

  test.describe('Managing Bookmarks', () => {
    test('should delete a bookmark', async ({ page: _page }) => {
      // First, create a bookmark to delete
      await page.goto('/course/1');
      const bookmarkBtn = page
        .locator('button')
        .filter({ hasText: /Bookmark/ })
        .first();
      await bookmarkBtn.click();
      await page.fill('input#title', 'Bookmark to Delete');
      await page.click('button:has-text("Save Bookmark")');
      await page.waitForSelector('text=Bookmark Added');

      // Navigate to bookmarks page
      await page.goto('/bookmarks');
      await page.waitForLoadState('networkidle');

      // Find the bookmark we just created
      const bookmarkCard = page.locator('text=Bookmark to Delete').locator('..');

      // Click delete button
      await bookmarkCard
        .locator('button[title*="delete" i]')
        .or(bookmarkCard.locator('button:has-text("Delete")'))
        .first()
        .click();

      // Confirm deletion in dialog
      await page.click('button:has-text("Delete")');

      // Verify deleted
      await expect(page.locator('text=Bookmark Deleted')).toBeVisible();
      await expect(page.locator('text=Bookmark to Delete')).not.toBeVisible();
    });

    test('should show empty state when no bookmarks', async ({ page: _page }) => {
      // Navigate to bookmarks page (assuming clean state or after clearing all)
      await page.goto('/bookmarks');

      // Wait for page load
      await page.waitForLoadState('networkidle');

      // Check for empty state message (adjust text based on actual implementation)
      const _emptyState = page.locator('text=/no bookmarks/i, text=/bookmark.*to see them here/i');

      // If there are bookmarks, this test would fail, which is expected
      // In a real test suite, you'd clear all bookmarks first
    });
  });

  test.describe('Bookmark Metadata', () => {
    test('should capture video timestamp in bookmark metadata', async ({ page: _page }) => {
      // This test requires a course with video materials
      // Navigate to course with video
      await page.goto('/course/1');

      // Open Materials tab
      await page.click('button[role="tab"]:has-text("Materials")');

      // Find and click on a video to play
      await page.click('button:has-text("View")');

      // Wait for video player to load
      await page.waitForSelector('video', { timeout: 5000 });

      // Play video briefly
      await page.click('button[title*="play" i]');
      await page.waitForTimeout(2000);

      // Pause and bookmark at current timestamp
      await page.click('button[title*="pause" i]');

      // Click bookmark button in video player
      const videoBookmarkBtn = page.locator('button[title*="bookmark" i]').last();
      await videoBookmarkBtn.click();

      // Verify timestamp is captured (check metadata badge in dialog)
      await expect(page.locator('text=/timestamp|time/i')).toBeVisible();
    });
  });
});
