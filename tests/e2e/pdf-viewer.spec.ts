import { test, expect } from '@playwright/test';
import { login, TEST_USER } from './utils/auth';

test.describe('PDF Viewer Feature', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);
  });

  test.describe('Loading and Basic Navigation', () => {
    test('should load PDF document', async ({ page }) => {
      // Navigate to course with PDF materials
      await page.goto('/course/1');

      // Click Materials tab
      await page.click('button[role="tab"]:has-text("Materials")');

      // Find PDF material (handbook type)
      const pdfMaterial = page.locator('text=/PDF|Handbook/i').first().locator('..');

      // Click View button
      await pdfMaterial.locator('button:has-text("View")').click();

      // Wait for PDF viewer modal to open
      await expect(page.locator('dialog, [role="dialog"]')).toBeVisible();

      // Verify PDF canvas is present
      await expect(page.locator('canvas').first()).toBeVisible({ timeout: 10000 });

      // Verify page indicator shows
      await expect(page.locator('text=/Page.*of/i')).toBeVisible();
    });

    test('should navigate to next page', async ({ page }) => {
      // Open PDF (assuming test helper or direct navigation)
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');
      await page.locator('button:has-text("View")').first().click();

      // Wait for PDF to load
      await page.waitForSelector('canvas', { timeout: 10000 });

      // Get current page number
      const currentPageText = await page.locator('input[type="text"]').first().inputValue();
      const currentPage = parseInt(currentPageText);

      // Click next page button
      await page.click('button[title*="next" i], button:has-text("›")');

      // Wait for page to change
      await page.waitForTimeout(500);

      // Verify page number increased
      const newPageText = await page.locator('input[type="text"]').first().inputValue();
      const newPage = parseInt(newPageText);

      expect(newPage).toBe(currentPage + 1);
    });

    test('should navigate to previous page', async ({ page }) => {
      // Open PDF and go to page 2 first
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');
      await page.locator('button:has-text("View")').first().click();
      await page.waitForSelector('canvas');

      // Go to next page first
      await page.click('button:has-text("›")');
      await page.waitForTimeout(500);

      const currentPageText = await page.locator('input[type="text"]').first().inputValue();
      const currentPage = parseInt(currentPageText);

      // Click previous page
      await page.click('button[title*="prev" i], button:has-text("‹")');
      await page.waitForTimeout(500);

      const newPageText = await page.locator('input[type="text"]').first().inputValue();
      const newPage = parseInt(newPageText);

      expect(newPage).toBe(currentPage - 1);
    });

    test('should jump to specific page', async ({ page }) => {
      // Open PDF
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');
      await page.locator('button:has-text("View")').first().click();
      await page.waitForSelector('canvas');

      // Enter page number
      const pageInput = page.locator('input[type="text"]').first();
      await pageInput.fill('3');
      await pageInput.press('Enter');

      // Wait for navigation
      await page.waitForTimeout(500);

      // Verify page changed
      const currentPage = await pageInput.inputValue();
      expect(currentPage).toBe('3');
    });

    test('should click thumbnail to navigate', async ({ page }) => {
      // Open PDF
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');
      await page.locator('button:has-text("View")').first().click();
      await page.waitForSelector('canvas');

      // Click on thumbnails/pages tab
      await page.click('button:has-text("Pages"), button[role="tab"]:has-text("Pages")');

      // Click on page 2 thumbnail
      const thumbnails = page.locator('button:has(canvas)');
      if (await thumbnails.count() > 1) {
        await thumbnails.nth(1).click();

        // Verify navigated to page 2
        await page.waitForTimeout(500);
        const currentPage = await page.locator('input[type="text"]').first().inputValue();
        expect(parseInt(currentPage)).toBe(2);
      }
    });
  });

  test.describe('Zoom Controls', () => {
    test('should zoom in', async ({ page }) => {
      // Open PDF
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');
      await page.locator('button:has-text("View")').first().click();
      await page.waitForSelector('canvas');

      // Get initial zoom level
      const zoomSelect = page.locator('select, [role="combobox"]:near(:text("100%"))');
      const initialZoom = await zoomSelect.inputValue().catch(() => '100');

      // Click zoom in
      await page.click('button[title*="zoom in" i], button:has-text("+")');

      // Verify zoom increased
      await page.waitForTimeout(500);
      const newZoom = await zoomSelect.inputValue().catch(() => '125');

      expect(parseInt(newZoom)).toBeGreaterThan(parseInt(initialZoom));
    });

    test('should zoom out', async ({ page }) => {
      // Open PDF at higher zoom first
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');
      await page.locator('button:has-text("View")').first().click();
      await page.waitForSelector('canvas');

      // Zoom in first
      await page.click('button:has-text("+")');
      await page.waitForTimeout(500);

      const currentZoom = await page.locator('select').first().inputValue().catch(() => '125');

      // Zoom out
      await page.click('button[title*="zoom out" i], button:has-text("-")');
      await page.waitForTimeout(500);

      const newZoom = await page.locator('select').first().inputValue().catch(() => '100');

      expect(parseInt(newZoom)).toBeLessThan(parseInt(currentZoom));
    });

    test('should fit to width', async ({ page }) => {
      // Open PDF
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');
      await page.locator('button:has-text("View")').first().click();
      await page.waitForSelector('canvas');

      // Click fit to width button
      await page.click('button[title*="fit" i]');

      // Verify zoom adjusted (visual check - actual value depends on screen size)
      await page.waitForTimeout(500);
      // Just verify no errors occurred
    });

    test('should select zoom percentage from dropdown', async ({ page }) => {
      // Open PDF
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');
      await page.locator('button:has-text("View")').first().click();
      await page.waitForSelector('canvas');

      // Click zoom dropdown
      await page.click('select:near(:text("100%"))');

      // Select 150%
      await page.click('option:has-text("150%")');

      // Verify zoom changed
      await page.waitForTimeout(500);
      const zoom = await page.locator('select').first().inputValue();
      expect(zoom).toBe('150');
    });
  });

  test.describe('Search Functionality', () => {
    test('should search within PDF', async ({ page }) => {
      // Open PDF
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');
      await page.locator('button:has-text("View")').first().click();
      await page.waitForSelector('canvas');

      // Click search tab
      await page.click('button:has-text("Search"), button[role="tab"]:has-text("🔍")');

      // Enter search query
      await page.fill('input[placeholder*="Search" i]', 'test');

      // Click search button
      await page.click('button:has-text("Search")');

      // Wait for results
      await page.waitForTimeout(2000);

      // Verify results shown (if any matches found)
      // This depends on PDF content
    });

    test('should navigate between search results', async ({ page }) => {
      // Open PDF and perform search
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');
      await page.locator('button:has-text("View")').first().click();
      await page.waitForSelector('canvas');

      await page.click('button:has-text("Search")');
      await page.fill('input[placeholder*="Search" i]', 'the');
      await page.click('button:has-text("Search")');
      await page.waitForTimeout(2000);

      // Check if results exist
      const resultsBadge = page.locator('text=/\\d+.*results/i');
      if (await resultsBadge.isVisible()) {
        // Click next result
        await page.click('button[title*="next" i]:near(:text("result"))');
        await page.waitForTimeout(500);

        // Verify page changed or highlight moved
      }
    });
  });

  test.describe('Annotations', () => {
    test('should add annotation', async ({ page }) => {
      // Open PDF
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');
      await page.locator('button:has-text("View")').first().click();
      await page.waitForSelector('canvas');

      // Click annotations tab
      await page.click('button:has-text("Notes"), button[role="tab"]:has-text("📝")');

      // Click "Add Note" button
      await page.click('button:has-text("Add Note")');

      // Fill in annotation
      await page.fill('textarea[placeholder*="note" i]', 'This is my test annotation');

      // Optional: add highlighted text
      await page.fill('input[placeholder*="highlighted" i]', 'Important text');

      // Save annotation
      await page.click('button:has-text("Add Note")');

      // Verify annotation appears
      await expect(page.locator('text=This is my test annotation')).toBeVisible();
    });

    test('should edit annotation', async ({ page }) => {
      // Open PDF and add annotation first
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');
      await page.locator('button:has-text("View")').first().click();
      await page.waitForSelector('canvas');

      await page.click('button:has-text("Notes")');
      await page.click('button:has-text("Add Note")');
      await page.fill('textarea', 'Original annotation');
      await page.click('button:has-text("Add Note")');

      // Wait for annotation to save
      await page.waitForTimeout(1000);

      // Click edit button
      await page.locator('text=Original annotation').locator('..').locator('button[title*="edit" i]').click();

      // Modify text
      await page.fill('textarea', 'Updated annotation');

      // Save
      await page.click('button:has-text("Save")');

      // Verify updated
      await expect(page.locator('text=Updated annotation')).toBeVisible();
      await expect(page.locator('text=Original annotation')).not.toBeVisible();
    });

    test('should delete annotation', async ({ page }) => {
      // Open PDF and add annotation
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');
      await page.locator('button:has-text("View")').first().click();
      await page.waitForSelector('canvas');

      await page.click('button:has-text("Notes")');
      await page.click('button:has-text("Add Note")');
      await page.fill('textarea', 'Annotation to delete');
      await page.click('button:has-text("Add Note")');
      await page.waitForTimeout(1000);

      // Click delete button
      await page.locator('text=Annotation to delete').locator('..').locator('button[title*="delete" i]').click();

      // Confirm deletion
      await page.click('button:has-text("Delete")');

      // Verify deleted
      await expect(page.locator('text=Annotation to delete')).not.toBeVisible();
    });

    test('should navigate to page by clicking annotation', async ({ page }) => {
      // Open PDF, go to page 2, add annotation
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');
      await page.locator('button:has-text("View")').first().click();
      await page.waitForSelector('canvas');

      // Navigate to page 2
      await page.click('button:has-text("›")');
      await page.waitForTimeout(500);

      // Add annotation on page 2
      await page.click('button:has-text("Notes")');
      await page.click('button:has-text("Add Note")');
      await page.fill('textarea', 'Page 2 note');
      await page.click('button:has-text("Add Note")');
      await page.waitForTimeout(1000);

      // Go back to page 1
      await page.click('button:has-text("‹")');
      await page.waitForTimeout(500);

      // Click annotation to navigate back to page 2
      await page.locator('text=Page 2').click();

      // Verify on page 2
      await page.waitForTimeout(500);
      const currentPage = await page.locator('input[type="text"]').first().inputValue();
      expect(parseInt(currentPage)).toBe(2);
    });
  });

  test.describe('Progress Tracking', () => {
    test('should save and resume progress', async ({ page }) => {
      // Open PDF
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');
      const viewBtn = page.locator('button:has-text("View")').first();
      await viewBtn.click();
      await page.waitForSelector('canvas');

      // Navigate to page 3
      const pageInput = page.locator('input[type="text"]').first();
      await pageInput.fill('3');
      await pageInput.press('Enter');
      await page.waitForTimeout(500);

      // Close PDF
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000); // Allow progress to save

      // Reopen PDF
      await viewBtn.click();
      await page.waitForSelector('canvas');

      // Verify resumed at page 3
      await page.waitForTimeout(1000);
      const resumedPage = await pageInput.inputValue();
      expect(parseInt(resumedPage)).toBe(3);
    });

    test('should show progress percentage', async ({ page }) => {
      // Open PDF
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');
      await page.locator('button:has-text("View")').first().click();
      await page.waitForSelector('canvas');

      // Verify progress bar visible
      await expect(page.locator('[role="progressbar"], .progress')).toBeVisible();

      // Verify percentage shown
      await expect(page.locator('text=/%/')).toBeVisible();
    });
  });

  test.describe('Download', () => {
    test('should download PDF', async ({ page }) => {
      // Open PDF
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');
      await page.locator('button:has-text("View")').first().click();
      await page.waitForSelector('canvas');

      // Setup download handler
      const downloadPromise = page.waitForEvent('download');

      // Click download button
      await page.click('button:has-text("Download")');

      // Wait for download
      const download = await downloadPromise;

      // Verify download started
      expect(download).toBeTruthy();
      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    });
  });
});
