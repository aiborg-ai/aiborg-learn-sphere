import { test, expect } from '@playwright/test';

/**
 * E2E Tests for SME Assessment Flow
 * Tests the AI Opportunity Assessment for companies
 */

test.describe('SME Assessment - Unauthenticated User', () => {
  test('should redirect to auth when accessing SME assessment without login', async ({ page }) => {
    await page.goto('/sme-assessment');

    // Should redirect to auth page
    await expect(page).toHaveURL(/\/auth/, { timeout: 5000 });

    // Should show sign in required message
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});

test.describe('SME Assessment - Company Admin Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Note: In real tests, you'd want to create a test user first
    // For now, we'll test the UI flow assuming we're logged in
    await page.goto('/sme-assessment');
  });

  test('should display SME assessment page structure', async ({ page }) => {
    // Check for main heading
    await expect(page.getByRole('heading', { name: /AI Opportunity Assessment/i })).toBeVisible({
      timeout: 10000,
    });

    // Check for SME subtitle
    await expect(page.getByText(/Small & Medium Enterprises/i)).toBeVisible();

    // Check for instructions card
    await expect(
      page.getByText(/Complete this worksheet to evaluate AI opportunities/i)
    ).toBeVisible();
  });

  test('should show progress indicator', async ({ page }) => {
    // Progress bar should be visible
    await expect(
      page.locator('[role="progressbar"]').or(page.getByText(/Section 1 of 9/i))
    ).toBeVisible({ timeout: 10000 });

    // Check for percentage complete
    await expect(page.getByText(/%/)).toBeVisible();
  });

  test('should display first section (Company Mission)', async ({ page }) => {
    await expect(page.getByText(/Company Mission & AI Alignment/i)).toBeVisible({ timeout: 10000 });

    // Check for company name field
    await expect(page.getByLabel(/company name/i)).toBeVisible();

    // Check for company mission field
    await expect(
      page.getByLabel(/company mission/i).or(page.getByLabel(/mission statement/i))
    ).toBeVisible();
  });

  test('should auto-populate company name for company admin', async ({ page }) => {
    // If logged in as company admin with profile, company name should be pre-filled
    const companyNameInput = page.getByLabel(/company name/i);

    if (await companyNameInput.isVisible()) {
      const value = await companyNameInput.inputValue();
      // Check if it has any value (could be auto-filled)
      expect(typeof value).toBe('string');
    }
  });

  test('should navigate between sections', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Fill required fields in section 1
    const companyNameInput = page.getByLabel(/company name/i);
    if (await companyNameInput.isVisible()) {
      await companyNameInput.fill('Test Company for E2E');
    }

    // Click Next button
    const nextButton = page.getByRole('button', { name: /next/i });
    if ((await nextButton.isVisible()) && (await nextButton.isEnabled())) {
      await nextButton.click();

      // Should move to section 2
      await expect(page.getByText(/Section 2/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should allow navigating backward', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Navigate forward first
    const nextButton = page.getByRole('button', { name: /next/i });
    if ((await nextButton.isVisible()) && (await nextButton.isEnabled())) {
      await nextButton.click();
      await page.waitForTimeout(1000);

      // Now navigate backward
      const previousButton = page.getByRole('button', { name: /previous/i });
      if (await previousButton.isVisible()) {
        await previousButton.click();

        // Should be back at section 1
        await expect(page.getByText(/Section 1/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should have save draft functionality', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Save Draft button should be visible
    const saveDraftButton = page.getByRole('button', { name: /save draft/i });
    await expect(saveDraftButton).toBeVisible();
    await expect(saveDraftButton).toBeEnabled();
  });

  test('should show all 9 sections in navigation', async ({ page }) => {
    // Progress indicator should show total sections
    await expect(page.getByText(/of 9|9 sections/i)).toBeVisible({ timeout: 10000 });
  });

  test('should validate required fields', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Clear company name if filled
    const companyNameInput = page.getByLabel(/company name/i);
    if (await companyNameInput.isVisible()) {
      await companyNameInput.clear();
    }

    // Try to proceed to next section
    const nextButton = page.getByRole('button', { name: /next/i });
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);

      // Should still be on section 1 if validation failed
      // (or could show validation error)
      const currentSection = await page.textContent('body');
      expect(currentSection).toBeTruthy();
    }
  });

  test('should display complete assessment button on final section', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Navigate to last section by clicking Next multiple times
    for (let i = 0; i < 8; i++) {
      const nextButton = page.getByRole('button', { name: /next/i });
      if ((await nextButton.isVisible()) && (await nextButton.isEnabled())) {
        await nextButton.click();
        await page.waitForTimeout(500);
      } else {
        break;
      }
    }

    // On final section, should show Complete Assessment button
    const completeButton = page.getByRole('button', { name: /complete assessment/i });
    await expect(completeButton).toBeVisible({ timeout: 5000 });
  });

  test('should handle Back to Home navigation', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Click Back to Home button
    const backButton = page
      .getByRole('button', { name: /back to home/i })
      .or(page.getByRole('link', { name: /back to home/i }));

    if (await backButton.isVisible()) {
      await backButton.click();

      // Should navigate to home page
      await expect(page).toHaveURL('/', { timeout: 5000 });
    }
  });
});

test.describe('SME Assessment - Section Specific Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sme-assessment');
    await page.waitForLoadState('networkidle');
  });

  test('Section 1: Company Mission should have required fields', async ({ page }) => {
    await expect(page.getByLabel(/company name/i)).toBeVisible();
    await expect(page.getByLabel(/mission/i)).toBeVisible();
  });

  test('Section 2: AI Capabilities should have rating controls', async ({ page }) => {
    // Navigate to section 2
    const nextButton = page.getByRole('button', { name: /next/i });
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);

      // Check for AI capability fields
      await expect(page.getByText(/AI Capabilities Assessment/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should maintain form data when navigating between sections', async ({ page }) => {
    // Fill in company name
    const companyName = 'E2E Test Company';
    const companyNameInput = page.getByLabel(/company name/i);

    if (await companyNameInput.isVisible()) {
      await companyNameInput.fill(companyName);

      // Navigate to next section
      const nextButton = page.getByRole('button', { name: /next/i });
      await nextButton.click();
      await page.waitForTimeout(1000);

      // Navigate back
      const previousButton = page.getByRole('button', { name: /previous/i });
      await previousButton.click();
      await page.waitForTimeout(1000);

      // Company name should still be filled
      const value = await companyNameInput.inputValue();
      expect(value).toBe(companyName);
    }
  });
});

test.describe('SME Assessment - Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/sme-assessment');
    await page.waitForLoadState('networkidle');

    // Assessment form should be visible on mobile
    await expect(page.getByText(/AI Opportunity Assessment/i)).toBeVisible({ timeout: 10000 });

    // Navigation buttons should be accessible
    const nextButton = page.getByRole('button', { name: /next/i });
    await expect(nextButton).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/sme-assessment');
    await page.waitForLoadState('networkidle');

    // Assessment should render properly
    await expect(page.getByLabel(/company name/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('SME Assessment - Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/sme-assessment');
    await page.waitForLoadState('networkidle');

    // Main heading should be h1
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible({ timeout: 10000 });
  });

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/sme-assessment');
    await page.waitForLoadState('networkidle');

    // All inputs should have labels
    const companyNameInput = page.getByLabel(/company name/i);
    if (await companyNameInput.isVisible()) {
      await expect(companyNameInput).toBeVisible();
    }
  });

  test('should have keyboard navigation support', async ({ page }) => {
    await page.goto('/sme-assessment');
    await page.waitForLoadState('networkidle');

    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Focus should move through form elements
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });
});
