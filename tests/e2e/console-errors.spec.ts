import { test, expect } from '@playwright/test';

test.describe('Console Errors Check', () => {
  test('homepage should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`Console Error: ${msg.text()}`);
      }
    });

    // Capture page errors (uncaught exceptions)
    page.on('pageerror', error => {
      errors.push(`Page Error: ${error.message}`);
    });

    // Navigate to the deployed site
    await page.goto('https://aiborg-ai-k7884eclh-hirendra-vikrams-projects.vercel.app', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    // Wait for page to stabilize
    await page.waitForTimeout(3000);

    // Log all errors found
    if (errors.length > 0) {
      console.log('\n=== ERRORS FOUND ===');
      errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err}`);
      });
      console.log('===================\n');
    }

    // Check if page loaded (has content)
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Take screenshot
    await page.screenshot({ path: 'tests/e2e/screenshots/homepage-check.png', fullPage: true });

    // Report errors but don't fail immediately - we want to see what they are
    expect(errors.length, `Found ${errors.length} errors:\n${errors.join('\n')}`).toBe(0);
  });

  test('check multiple pages for errors', async ({ page }) => {
    const allErrors: { page: string; errors: string[] }[] = [];

    const pagesToCheck = [
      { url: '/', name: 'Homepage' },
      { url: '/auth', name: 'Auth Page' },
      { url: '/courses', name: 'Courses Page' },
    ];

    for (const pageInfo of pagesToCheck) {
      const errors: string[] = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      page.on('pageerror', error => {
        errors.push(error.message);
      });

      try {
        await page.goto(
          `https://aiborg-ai-k7884eclh-hirendra-vikrams-projects.vercel.app${pageInfo.url}`,
          {
            waitUntil: 'networkidle',
            timeout: 30000,
          }
        );
        await page.waitForTimeout(2000);
      } catch (e) {
        errors.push(`Navigation failed: ${e}`);
      }

      if (errors.length > 0) {
        allErrors.push({ page: pageInfo.name, errors });
      }

      // Clear listeners for next page
      page.removeAllListeners('console');
      page.removeAllListeners('pageerror');
    }

    // Report all errors
    if (allErrors.length > 0) {
      console.log('\n=== ERRORS BY PAGE ===');
      allErrors.forEach(({ page: pageName, errors }) => {
        console.log(`\n${pageName}:`);
        errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
      });
      console.log('======================\n');
    }

    expect(allErrors.length, `Found errors on ${allErrors.length} pages`).toBe(0);
  });
});
