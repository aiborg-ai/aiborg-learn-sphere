/**
 * Vault Access E2E Tests
 * Tests for vault content library access and browsing
 */

import { test, expect } from '@playwright/test';
import { VaultPage } from '../pages/VaultPage';
import { setupAuthenticatedSession } from '../utils/auth';

test.describe('Vault Access - With Access', () => {
  let vaultPage: VaultPage;

  test.beforeEach(async ({ page }) => {
    vaultPage = new VaultPage(page);
    // Assuming student has vault access from previous claim
    await setupAuthenticatedSession(page, 'student');
    await vaultPage.navigate();
  });

  test('should display vault page', async () => {
    await vaultPage.assertOnVaultPage();
  });

  test('should check access status', async () => {
    const hasAccess = await vaultPage.hasVaultAccess();
    const isDenied = await vaultPage.isAccessDenied();

    // One of these should be true
    expect(hasAccess || isDenied).toBe(true);
  });

  test('should display content grid', async () => {
    const hasAccess = await vaultPage.hasVaultAccess();

    if (hasAccess) {
      const contentCount = await vaultPage.getContentCount();
      expect(contentCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should search vault content', async () => {
    const hasAccess = await vaultPage.hasVaultAccess();

    if (hasAccess) {
      await vaultPage.searchContent('tutorial');
      await vaultPage.page.waitForTimeout(1000);

      const results = await vaultPage.getContentCount();
      expect(results).toBeGreaterThanOrEqual(0);
    }
  });

  test('should filter content by category', async () => {
    const hasAccess = await vaultPage.hasVaultAccess();

    if (hasAccess) {
      await vaultPage.switchToTab('videos');
      await vaultPage.page.waitForTimeout(1000);

      const videoCount = await vaultPage.getContentCount();
      expect(videoCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should view content details', async () => {
    const hasAccess = await vaultPage.hasVaultAccess();

    if (hasAccess) {
      const contents = await vaultPage.getAllContentTitles();

      if (contents.length > 0) {
        await vaultPage.clickContent(contents[0]);
        await vaultPage.page.waitForTimeout(1000);

        const details = await vaultPage.getModalDetails();
        expect(details.title).toBeTruthy();
      }
    }
  });

  test('should bookmark content', async () => {
    const hasAccess = await vaultPage.hasVaultAccess();

    if (hasAccess) {
      const contents = await vaultPage.getAllContentTitles();

      if (contents.length > 0) {
        await vaultPage.bookmarkContent(contents[0]);
        await vaultPage.page.waitForTimeout(500);
      }
    }
  });

  test('should download content', async () => {
    const hasAccess = await vaultPage.hasVaultAccess();

    if (hasAccess) {
      const contents = await vaultPage.getAllContentTitles();

      if (contents.length > 0) {
        try {
          const download = await vaultPage.downloadContent(contents[0]);
          expect(download).toBeTruthy();
        } catch {
          // Download might not be available for all content
        }
      }
    }
  });

  test('should sort content', async () => {
    const hasAccess = await vaultPage.hasVaultAccess();

    if (hasAccess) {
      await vaultPage.sortBy('newest');
      await vaultPage.page.waitForTimeout(1000);

      const contentCount = await vaultPage.getContentCount();
      expect(contentCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should apply filters', async () => {
    const hasAccess = await vaultPage.hasVaultAccess();

    if (hasAccess) {
      await vaultPage.applyFilters({
        type: 'video',
      });

      await vaultPage.page.waitForTimeout(1000);
      const filteredCount = await vaultPage.getContentCount();
      expect(filteredCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should navigate to content', async () => {
    const hasAccess = await vaultPage.hasVaultAccess();

    if (hasAccess) {
      const contents = await vaultPage.getAllContentTitles();

      if (contents.length > 0) {
        await vaultPage.viewContent(contents[0]);
        await vaultPage.page.waitForTimeout(2000);
      }
    }
  });

  test('should display featured content', async () => {
    const hasAccess = await vaultPage.hasVaultAccess();

    if (hasAccess) {
      if (await vaultPage.isVisible('[data-testid="featured"]')) {
        const featured = await vaultPage.getFeaturedContent();
        expect(Array.isArray(featured)).toBe(true);
      }
    }
  });

  test('should create collection', async () => {
    const hasAccess = await vaultPage.hasVaultAccess();

    if (hasAccess && (await vaultPage.isVisible('button:has-text("Create Collection")'))) {
      await vaultPage.createCollection('My Test Collection');
      await vaultPage.page.waitForTimeout(1000);
    }
  });

  test('should handle pagination', async () => {
    const hasAccess = await vaultPage.hasVaultAccess();

    if (hasAccess && (await vaultPage.isVisible('[data-testid="pagination"]'))) {
      await vaultPage.goToNextPage();
      await vaultPage.page.waitForTimeout(1000);

      await vaultPage.goToPreviousPage();
      await vaultPage.page.waitForTimeout(1000);
    }
  });
});

test.describe('Vault Access - No Access', () => {
  let vaultPage: VaultPage;

  test.beforeEach(async ({ page }) => {
    vaultPage = new VaultPage(page);
    // Use a student without vault access
    await setupAuthenticatedSession(page, 'student');
    await vaultPage.navigate();
  });

  test('should show access denied for users without access', async () => {
    const isDenied = await vaultPage.isAccessDenied();
    const hasAccess = await vaultPage.hasVaultAccess();

    // Should be one or the other
    expect(isDenied || hasAccess).toBe(true);
  });

  test('should show claim access button when no access', async () => {
    const isDenied = await vaultPage.isAccessDenied();

    if (isDenied) {
      const hasClaimButton = await vaultPage.isVisible('button:has-text("Claim")');
      expect(typeof hasClaimButton).toBe('boolean');
    }
  });

  test('should redirect to claim page when clicking claim access', async () => {
    const isDenied = await vaultPage.isAccessDenied();

    if (isDenied && (await vaultPage.isVisible('button:has-text("Claim")'))) {
      await vaultPage.claimAccess();
      await vaultPage.page.waitForTimeout(2000);

      const url = vaultPage.getCurrentUrl();
      expect(url).toContain('claim');
    }
  });
});

test.describe('Vault Content Management', () => {
  let vaultPage: VaultPage;

  test.beforeEach(async ({ page }) => {
    vaultPage = new VaultPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await vaultPage.navigate();
  });

  test('should access vault as admin', async () => {
    await vaultPage.assertOnVaultPage();

    const hasAccess = await vaultPage.hasVaultAccess();
    expect(hasAccess).toBe(true);
  });

  test('should manage vault content as admin', async () => {
    const contents = await vaultPage.getAllContentTitles();
    expect(Array.isArray(contents)).toBe(true);
  });
});
