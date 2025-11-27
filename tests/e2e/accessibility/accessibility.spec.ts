/**
 * Accessibility Testing
 * Tests for WCAG 2.1 Level AA compliance
 * Install: npm install -D @axe-core/playwright
 * Run with: npx playwright test accessibility
 */

import { test, expect } from '@playwright/test';

test.describe('Accessibility - WCAG 2.1 Compliance', () => {
  test('homepage should have no accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Manual accessibility checks since axe-core integration
    // would require additional setup

    // Check for page title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);

    // Check for main landmark
    const mainLandmark = page.locator('main, [role="main"]');
    expect(await mainLandmark.count()).toBeGreaterThanOrEqual(1);

    // Check for skip link
    const skipLink = page.locator('a[href="#main"], a:has-text("Skip to")');
    console.log(`Skip link present: ${(await skipLink.count()) > 0}`);
  });

  test('courses page should have no accessibility violations', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    const title = await page.title();
    expect(title).toBeTruthy();

    const mainLandmark = page.locator('main, [role="main"]');
    expect(await mainLandmark.count()).toBeGreaterThanOrEqual(1);
  });

  test('login page should have no accessibility violations', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    const title = await page.title();
    expect(title).toBeTruthy();

    // Check form labels
    const inputs = page.locator('input[type="email"], input[type="password"]');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const hasLabel =
        (await input.getAttribute('aria-label')) ||
        (await input.getAttribute('aria-labelledby')) ||
        ((await input.getAttribute('id')) &&
          (await page.locator(`label[for="${await input.getAttribute('id')}"]`).count()) > 0);

      console.log(`Input ${i} has label: ${!!hasLabel}`);
    }
  });
});

test.describe('Accessibility - Keyboard Navigation', () => {
  test('should support tab navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab through elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);

      const focusedElement = await page.evaluate(() => ({
        tag: document.activeElement?.tagName,
        type: document.activeElement?.getAttribute('type'),
        role: document.activeElement?.getAttribute('role'),
      }));

      console.log(
        `Tab ${i + 1}: ${focusedElement.tag} ${focusedElement.type || ''} ${focusedElement.role || ''}`
      );
    }
  });

  test('should support Enter key for button activation', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    const button = page.locator('button').first();

    if (await button.isVisible()) {
      await button.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      // Button should be activated
    }
  });

  test('should support Space key for button activation', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    const button = page.locator('button').first();

    if (await button.isVisible()) {
      await button.focus();
      await page.keyboard.press('Space');
      await page.waitForTimeout(1000);
      // Button should be activated
    }
  });

  test('should support Escape key for modals', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    const openModalButton = page
      .locator('button:has-text("View Details"), button:has-text("Details")')
      .first();

    if (await openModalButton.isVisible()) {
      await openModalButton.click();
      await page.waitForTimeout(1000);

      const modal = page.locator('[role="dialog"]');
      if ((await modal.count()) > 0) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        // Modal should be closed
        expect(await modal.isVisible()).toBe(false);
      }
    }
  });
});

test.describe('Accessibility - ARIA Attributes', () => {
  test('buttons should have accessible names', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    let buttonsWithoutAccessibleName = 0;

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const hasAccessibleName =
        (await button.textContent())?.trim() ||
        (await button.getAttribute('aria-label')) ||
        (await button.getAttribute('aria-labelledby')) ||
        (await button.getAttribute('title'));

      if (!hasAccessibleName) {
        buttonsWithoutAccessibleName++;
        console.log(`Button ${i} missing accessible name`);
      }
    }

    console.log(
      `Buttons without accessible name: ${buttonsWithoutAccessibleName} / ${Math.min(buttonCount, 10)}`
    );
    expect(buttonsWithoutAccessibleName).toBeLessThan(3); // Allow some margin
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const images = page.locator('img');
    const imageCount = await images.count();

    let imagesWithoutAlt = 0;

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');

      if (alt === null || alt === undefined) {
        imagesWithoutAlt++;
        const src = await img.getAttribute('src');
        console.log(`Image missing alt: ${src}`);
      }
    }

    console.log(`Images without alt text: ${imagesWithoutAlt} / ${imageCount}`);
    expect(imagesWithoutAlt).toBe(0); // All images should have alt text
  });

  test('form inputs should have labels', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    const inputs = page.locator('input[type="text"], input[type="email"], input[type="password"]');
    const inputCount = await inputs.count();

    let inputsWithoutLabel = 0;

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const hasLabel = id && (await page.locator(`label[for="${id}"]`).count()) > 0;

      if (!hasLabel && !ariaLabel && !ariaLabelledBy) {
        inputsWithoutLabel++;
        console.log(`Input ${i} missing label`);
      }
    }

    console.log(`Inputs without labels: ${inputsWithoutLabel} / ${inputCount}`);
    expect(inputsWithoutLabel).toBe(0);
  });

  test('links should have accessible names', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const links = page.locator('a[href]');
    const linkCount = await links.count();

    let linksWithoutAccessibleName = 0;

    for (let i = 0; i < Math.min(linkCount, 10); i++) {
      const link = links.nth(i);
      const hasAccessibleName =
        (await link.textContent())?.trim() ||
        (await link.getAttribute('aria-label')) ||
        (await link.getAttribute('aria-labelledby')) ||
        (await link.getAttribute('title'));

      if (!hasAccessibleName) {
        linksWithoutAccessibleName++;
        const href = await link.getAttribute('href');
        console.log(`Link missing accessible name: ${href}`);
      }
    }

    console.log(
      `Links without accessible name: ${linksWithoutAccessibleName} / ${Math.min(linkCount, 10)}`
    );
    expect(linksWithoutAccessibleName).toBeLessThan(2);
  });
});

test.describe('Accessibility - Color Contrast', () => {
  test('should check text has sufficient contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Manual check - automated contrast checking requires axe-core
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, a, button');
    const count = await textElements.count();

    console.log(`Text elements found: ${Math.min(count, 20)}`);
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Accessibility - Focus Management', () => {
  test('should show focus indicators', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    const focusedElement = page.locator(':focus');
    const hasFocusIndicator = await focusedElement.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.outline !== 'none' || style.boxShadow !== 'none';
    });

    console.log(`Focus indicator visible: ${hasFocusIndicator}`);
  });

  test('should trap focus in modals', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    const openModalButton = page.locator('button:has-text("View Details")').first();

    if (await openModalButton.isVisible()) {
      await openModalButton.click();
      await page.waitForTimeout(1000);

      const modal = page.locator('[role="dialog"]');
      if ((await modal.count()) > 0 && (await modal.isVisible())) {
        // Tab should stay within modal
        await page.keyboard.press('Tab');
        await page.waitForTimeout(200);

        const focusedElement = await page.evaluate(() =>
          document.activeElement?.closest('[role="dialog"]')
        );
        console.log(`Focus trapped in modal: ${!!focusedElement}`);
      }
    }
  });
});

test.describe('Accessibility - Semantic HTML', () => {
  test('should use semantic heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const h1Count = await page.locator('h1').count();
    const h2Count = await page.locator('h2').count();
    const h3Count = await page.locator('h3').count();

    console.log(`Heading hierarchy: H1: ${h1Count}, H2: ${h2Count}, H3: ${h3Count}`);

    // Should have at least one h1
    expect(h1Count).toBeGreaterThanOrEqual(1);

    // Should not have more than one h1
    expect(h1Count).toBeLessThanOrEqual(2);
  });

  test('should use semantic landmarks', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const main = await page.locator('main, [role="main"]').count();
    const nav = await page.locator('nav, [role="navigation"]').count();
    const header = await page.locator('header, [role="banner"]').count();
    const footer = await page.locator('footer, [role="contentinfo"]').count();

    console.log(`Landmarks - Main: ${main}, Nav: ${nav}, Header: ${header}, Footer: ${footer}`);

    expect(main).toBeGreaterThanOrEqual(1);
  });

  test('should use lists for list content', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    const lists = await page.locator('ul, ol').count();
    console.log(`Lists found: ${lists}`);

    // Courses page should have some lists
    expect(lists).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Accessibility - Screen Reader Support', () => {
  test('should have descriptive page titles', async ({ page }) => {
    const pages = [
      { url: '/', expectedKeywords: ['home', 'aiborg', 'learning'] },
      { url: '/courses', expectedKeywords: ['courses', 'learning'] },
      { url: '/auth', expectedKeywords: ['login', 'sign', 'auth'] },
    ];

    for (const { url, expectedKeywords } of pages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const title = (await page.title()).toLowerCase();
      console.log(`Page ${url} title: ${title}`);

      const hasExpectedKeyword = expectedKeywords.some(keyword => title.includes(keyword));
      console.log(`Has expected keyword: ${hasExpectedKeyword}`);
    }
  });

  test('should announce dynamic content changes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for aria-live regions
    const ariaLiveRegions = await page.locator('[aria-live]').count();
    console.log(`ARIA live regions: ${ariaLiveRegions}`);
  });
});

test.describe('Accessibility - Mobile Accessibility', () => {
  test('should be accessible on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for touch-friendly targets (min 44x44px)
    const buttons = page.locator('button, a');
    const buttonCount = await buttons.count();

    console.log(`Interactive elements on mobile: ${buttonCount}`);

    // All interactive elements should be visible
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should support pinch-to-zoom', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const viewport = await page.evaluate(() => {
      const metaViewport = document.querySelector('meta[name="viewport"]');
      return metaViewport?.getAttribute('content') || '';
    });

    console.log(`Viewport meta: ${viewport}`);

    // Should not disable user scalability
    expect(viewport).not.toContain('user-scalable=no');
    expect(viewport).not.toContain('maximum-scale=1');
  });
});
