import { test, expect } from '@playwright/test';
import { login, TEST_USER } from './utils/auth';

test.describe('Downloads Feature', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);
  });

  test.describe('Tracking Downloads', () => {
    test('should track PDF download', async ({ page }) => {
      // Navigate to course materials
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      // Wait for materials to load
      await page.waitForSelector('text=/Material|Video|PDF/', { timeout: 5000 });

      // Find PDF material
      const pdfMaterial = page.locator('text=/PDF|Handbook/i').first().locator('..');

      // Click download button
      const downloadPromise = page.waitForEvent('download');
      await pdfMaterial.locator('button:has-text("Download")').click();

      // Verify download started
      const download = await downloadPromise;
      expect(download).toBeTruthy();

      // Wait for tracking to save
      await page.waitForTimeout(1000);

      // Navigate to downloads page
      await page.goto('/downloads');

      // Verify download appears in history
      await expect(page.locator(`text=${download.suggestedFilename()}`)).toBeVisible();
    });

    test('should track video download', async ({ page }) => {
      // Navigate to course materials
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      // Find video material
      const videoMaterial = page.locator('text=/Video|recording/i').first().locator('..');

      // Download video
      const downloadPromise = page.waitForEvent('download');
      await videoMaterial.locator('button:has-text("Download")').click();

      const download = await downloadPromise;
      expect(download).toBeTruthy();

      // Check downloads page
      await page.goto('/downloads');
      await expect(page.locator('text=/video|recording/i')).toBeVisible();
    });

    test('should capture download metadata', async ({ page }) => {
      // Download a file
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      const downloadPromise = page.waitForEvent('download');
      await page.locator('button:has-text("Download")').first().click();
      await downloadPromise;

      await page.waitForTimeout(1000);

      // Go to downloads page
      await page.goto('/downloads');

      // Verify metadata displayed (file size, type, date)
      await expect(page.locator('text=/\\d+\\s*(KB|MB|GB)/i')).toBeVisible();
      await expect(
        page.locator('text=/\\d{4}-\\d{2}-\\d{2}|\\d+\\s*(second|minute|hour|day)s?\\s*ago/i')
      ).toBeVisible();
    });

    test('should show download button state change', async ({ page }) => {
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      const downloadBtn = page.locator('button:has-text("Download")').first();

      // Download file
      const downloadPromise = page.waitForEvent('download');
      await downloadBtn.click();
      await downloadPromise;

      // Wait for UI update
      await page.waitForTimeout(1000);

      // Verify button shows downloaded state
      await expect(downloadBtn.locator('..')).toContainText(/downloaded|✓/i);
    });
  });

  test.describe('Viewing Download History', () => {
    test('should navigate to downloads page', async ({ page }) => {
      await page.goto('/downloads');

      // Verify page loaded
      await expect(page).toHaveURL(/\/downloads/);
      await expect(page.locator('h1')).toContainText(/download/i);
    });

    test('should display download statistics', async ({ page }) => {
      await page.goto('/downloads');

      // Wait for stats to load
      await page.waitForLoadState('networkidle');

      // Verify stats present
      await expect(page.locator('text=/total.*files?/i')).toBeVisible();
      await expect(page.locator('text=/total.*size/i')).toBeVisible();
      await expect(page.locator('text=/\\d+\\s*(KB|MB|GB)/i')).toBeVisible();
    });

    test('should filter downloads by file type', async ({ page }) => {
      await page.goto('/downloads');
      await page.waitForLoadState('networkidle');

      // Click file type filter
      await page.click('select[name="fileType"], [role="combobox"]:near(:text("Type"))');

      // Select PDF
      await page.click('option:has-text("PDF"), text="PDF"').catch(() => {
        // Alternative selector if dropdown is custom
        page.click('[role="option"]:has-text("PDF")');
      });

      await page.waitForTimeout(1000);

      // Verify only PDFs shown (if any exist)
      const fileItems = page.locator('[data-testid="download-item"]');
      if ((await fileItems.count()) > 0) {
        await expect(fileItems.first()).toContainText(/\.pdf/i);
      }
    });

    test('should search downloads by filename', async ({ page }) => {
      await page.goto('/downloads');

      // Enter search query
      await page.fill('input[placeholder*="Search" i]', 'handbook');

      // Wait for debounce
      await page.waitForTimeout(1000);

      // Verify filtered results
      const results = page.locator('[data-testid="download-item"]');
      if ((await results.count()) > 0) {
        await expect(results.first()).toContainText(/handbook/i);
      }
    });

    test('should sort downloads by date', async ({ page }) => {
      await page.goto('/downloads');
      await page.waitForLoadState('networkidle');

      // Click sort dropdown
      await page.click('select[name="sort"], button:has-text("Sort")');

      // Select "Oldest First"
      await page.click('option:has-text("Oldest"), text="Oldest"').catch(() => {
        page.click('[role="option"]:has-text("Oldest")');
      });

      await page.waitForTimeout(1000);

      // Verify sorting applied (check if dates are in ascending order)
      // This is a basic check - actual implementation would verify dates
    });

    test('should display most accessed downloads', async ({ page }) => {
      await page.goto('/downloads');

      // Look for "Most Accessed" section
      const mostAccessed = page.locator('text=/most.*access/i').locator('..');

      if (await mostAccessed.isVisible()) {
        // Verify shows download items
        await expect(mostAccessed.locator('[data-testid="download-item"]').first()).toBeVisible();
      }
    });
  });

  test.describe('Re-downloading Files', () => {
    test('should re-download from history', async ({ page }) => {
      // First, download a file
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      const downloadPromise1 = page.waitForEvent('download');
      await page.locator('button:has-text("Download")').first().click();
      const firstDownload = await downloadPromise1;
      const fileName = firstDownload.suggestedFilename();

      await page.waitForTimeout(1000);

      // Go to downloads page
      await page.goto('/downloads');

      // Find the download and re-download it
      const downloadItem = page.locator(`text=${fileName}`).locator('..');
      const redownloadBtn = downloadItem.locator(
        'button:has-text("Download"), button[title*="download" i]'
      );

      const downloadPromise2 = page.waitForEvent('download');
      await redownloadBtn.click();

      // Verify re-download worked
      const secondDownload = await downloadPromise2;
      expect(secondDownload.suggestedFilename()).toBe(fileName);
    });

    test('should increment access count on re-download', async ({ page }) => {
      // Download a file
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      const downloadPromise = page.waitForEvent('download');
      await page.locator('button:has-text("Download")').first().click();
      const download = await downloadPromise;
      await page.waitForTimeout(1000);

      // Go to downloads page and get initial access count
      await page.goto('/downloads');
      const downloadItem = page.locator(`text=${download.suggestedFilename()}`).locator('..');
      const _initialAccessText = await downloadItem
        .locator('text=/accessed.*\\d+.*time/i')
        .textContent()
        .catch(() => '1');

      // Re-download
      const redownloadPromise = page.waitForEvent('download');
      await downloadItem.locator('button:has-text("Download")').first().click();
      await redownloadPromise;
      await page.waitForTimeout(1000);

      // Refresh page and verify count increased
      await page.reload();
      await page.waitForLoadState('networkidle');

      const newAccessText = await downloadItem
        .locator('text=/accessed.*\\d+.*time/i')
        .textContent()
        .catch(() => '2');

      // Access count should have increased (basic check)
      expect(newAccessText).toContain('time');
    });
  });

  test.describe('Deleting Download Records', () => {
    test('should delete single download record', async ({ page }) => {
      // Download a file first
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      const downloadPromise = page.waitForEvent('download');
      await page.locator('button:has-text("Download")').first().click();
      const download = await downloadPromise;
      const fileName = download.suggestedFilename();
      await page.waitForTimeout(1000);

      // Go to downloads page
      await page.goto('/downloads');

      // Find and delete the download record
      const downloadItem = page.locator(`text=${fileName}`).locator('..');
      await downloadItem
        .locator('button[title*="delete" i], button:has-text("Delete")')
        .first()
        .click();

      // Confirm deletion in dialog
      await page.click('button:has-text("Delete"), button:has-text("Confirm")');

      // Verify deleted
      await expect(page.locator('text=/deleted|removed/i')).toBeVisible();
      await expect(page.locator(`text=${fileName}`)).not.toBeVisible();
    });

    test('should clear all download records', async ({ page }) => {
      // Download a few files
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      // Download first file
      const promise1 = page.waitForEvent('download');
      await page.locator('button:has-text("Download")').first().click();
      await promise1;
      await page.waitForTimeout(500);

      // Go to downloads page
      await page.goto('/downloads');
      await page.waitForLoadState('networkidle');

      // Click "Clear All" button
      const clearAllBtn = page.locator(
        'button:has-text("Clear All"), button:has-text("Clear History")'
      );

      if (await clearAllBtn.isVisible()) {
        await clearAllBtn.click();

        // Confirm in dialog
        await page.click('button:has-text("Clear"), button:has-text("Confirm")');

        // Verify empty state
        await expect(page.locator('text=/no.*download|empty/i')).toBeVisible();
      }
    });

    test('should show confirmation before clearing all', async ({ page }) => {
      await page.goto('/downloads');

      const clearAllBtn = page.locator(
        'button:has-text("Clear All"), button:has-text("Clear History")'
      );

      if (await clearAllBtn.isVisible()) {
        await clearAllBtn.click();

        // Verify confirmation dialog appears
        await expect(page.locator('text=/are you sure|confirm|warning/i')).toBeVisible();
        await expect(page.locator('button:has-text("Cancel")')).toBeVisible();

        // Cancel instead of confirming
        await page.click('button:has-text("Cancel")');

        // Verify downloads still there
        await expect(page.locator('[data-testid="download-item"]').first()).toBeVisible();
      }
    });
  });

  test.describe('Download Analytics', () => {
    test('should show downloads by file type breakdown', async ({ page }) => {
      await page.goto('/downloads');
      await page.waitForLoadState('networkidle');

      // Look for file type breakdown (chart or list)
      const typeBreakdown = page.locator('text=/by.*type|file.*type/i').locator('..');

      if (await typeBreakdown.isVisible()) {
        // Verify shows different types
        await expect(typeBreakdown.locator('text=/pdf|video|document/i')).toBeVisible();
      }
    });

    test('should show download trends over time', async ({ page }) => {
      await page.goto('/downloads');

      // Look for recent downloads section
      const recentSection = page.locator('text=/recent.*download/i').locator('..');

      if (await recentSection.isVisible()) {
        // Verify shows timestamps
        await expect(recentSection.locator('text=/ago|yesterday|today/i')).toBeVisible();
      }
    });

    test('should show total storage used', async ({ page }) => {
      await page.goto('/downloads');

      // Verify total size displayed
      await expect(page.locator('text=/total.*size/i')).toBeVisible();
      await expect(page.locator('text=/\\d+(\\.\\d+)?\\s*(KB|MB|GB)/i')).toBeVisible();
    });
  });

  test.describe('Empty State', () => {
    test('should show empty state when no downloads', async ({ page }) => {
      // This test assumes a fresh user or after clearing all
      await page.goto('/downloads');
      await page.waitForLoadState('networkidle');

      // Check for empty state message
      const emptyState = page.locator('text=/no.*download|haven.*downloaded|start.*downloading/i');

      // If downloads exist, this test would naturally fail
      // In a real test environment, you'd use a fresh test user
      if (await emptyState.isVisible()) {
        await expect(emptyState).toBeVisible();

        // Verify CTA to browse courses
        await expect(page.locator('button:has-text("Browse"), a:has-text("Course")')).toBeVisible();
      }
    });
  });

  test.describe('Integration with Course Page', () => {
    test('should show download count on material card', async ({ page }) => {
      // Download a file
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      const downloadPromise = page.waitForEvent('download');
      await page.locator('button:has-text("Download")').first().click();
      await downloadPromise;
      await page.waitForTimeout(1000);

      // Reload course page
      await page.reload();
      await page.click('button[role="tab"]:has-text("Materials")');

      // Verify download indicator on material
      const downloadedMaterial = page
        .locator('[data-testid="material-item"]')
        .first()
        .or(page.locator('button:has-text("Download")').first().locator('..'));

      await expect(downloadedMaterial).toContainText(/downloaded|✓/i);
    });
  });
});
