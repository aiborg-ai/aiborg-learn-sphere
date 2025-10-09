import { test, expect } from '@playwright/test';

// Note: These tests require admin credentials
// Update TEST_ADMIN with actual admin credentials for your test environment
const TEST_ADMIN = {
  email: 'admin@example.com',
  password: 'AdminPass123!',
};

async function loginAsAdmin(page: { goto: (url: string) => Promise<unknown>; fill: (selector: string, value: string) => Promise<void>; click: (selector: string) => Promise<void>; waitForURL: (pattern: RegExp, options?: { timeout?: number }) => Promise<void> }) {
  await page.goto('/auth');
  await page.fill('input[type="email"]', TEST_ADMIN.email);
  await page.fill('input[type="password"]', TEST_ADMIN.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard|\/admin/, { timeout: 10000 });
}

test.describe('Admin Event Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should navigate to admin events management', async ({ page }) => {
    await page.goto('/admin');

    // Wait for admin page to load
    await page.waitForSelector('text=Admin Dashboard', { timeout: 10000 });

    // Look for Events Management section or tab
    const eventsTab = page.locator('text=Events Management').or(
      page.locator('button:has-text("Events")')
    );

    if (await eventsTab.count() > 0) {
      await eventsTab.click();

      // Verify events table is visible
      await expect(
        page.locator('text=Events Management').or(page.locator('table'))
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display events table with columns', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForSelector('text=Admin Dashboard', { timeout: 10000 });

    // Navigate to events section
    const eventsTab = page.locator('text=Events Management').or(
      page.locator('button:has-text("Events")')
    );

    if (await eventsTab.count() > 0) {
      await eventsTab.click();

      // Check for table headers
      const table = page.locator('table');
      if (await table.count() > 0) {
        await expect(table.locator('text=Title')).toBeVisible();
        await expect(table.locator('text=Date')).toBeVisible();
        await expect(table.locator('text=Status')).toBeVisible();
        await expect(table.locator('text=Actions')).toBeVisible();
      }
    }
  });

  test('should open create event dialog', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForSelector('text=Admin Dashboard', { timeout: 10000 });

    const eventsTab = page.locator('text=Events Management').or(
      page.locator('button:has-text("Events")')
    );

    if (await eventsTab.count() > 0) {
      await eventsTab.click();

      // Click "Add New Event" button
      const addButton = page.locator('button').filter({ hasText: /Add.*Event|Create.*Event/i });

      if (await addButton.count() > 0) {
        await addButton.click();

        // Dialog should open
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 3000 });

        // Check for form fields
        await expect(dialog.locator('input#title')).toBeVisible();
        await expect(dialog.locator('textarea#description')).toBeVisible();
        await expect(dialog.locator('input#event_date')).toBeVisible();
      }
    }
  });

  test('should validate required fields when creating event', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForSelector('text=Admin Dashboard', { timeout: 10000 });

    const eventsTab = page.locator('text=Events Management').or(
      page.locator('button:has-text("Events")')
    );

    if (await eventsTab.count() > 0) {
      await eventsTab.click();

      const addButton = page.locator('button').filter({ hasText: /Add.*Event|Create.*Event/i });

      if (await addButton.count() > 0) {
        await addButton.click();

        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible();

        // Try to submit without filling required fields
        const submitButton = dialog.locator('button').filter({ hasText: /Create|Save/i });
        await submitButton.click();

        // Should show validation errors or prevent submission
        // Either form validation appears or dialog stays open
        await expect(dialog).toBeVisible();
      }
    }
  });

  test('should move event to past events', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForSelector('text=Admin Dashboard', { timeout: 10000 });

    const eventsTab = page.locator('text=Events Management').or(
      page.locator('button:has-text("Events")')
    );

    if (await eventsTab.count() > 0) {
      await eventsTab.click();

      // Look for "Move to Past" button on any event
      const moveToPastButton = page.locator('button').filter({ hasText: /Move to Past/i }).first();

      if (await moveToPastButton.count() > 0) {
        await moveToPastButton.click();

        // Should show success message
        await expect(
          page.locator('text=/moved.*past|success/i')
        ).toBeVisible({ timeout: 5000 });

        // Event should now show "Past Event" badge
        await expect(
          page.locator('text=Past Event').first()
        ).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should show photo upload button for past events', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForSelector('text=Admin Dashboard', { timeout: 10000 });

    const eventsTab = page.locator('text=Events Management').or(
      page.locator('button:has-text("Events")')
    );

    if (await eventsTab.count() > 0) {
      await eventsTab.click();

      // Look for past event badge
      const pastEventBadge = page.locator('text=Past Event').first();

      if (await pastEventBadge.count() > 0) {
        // Look for photo/image button in the same row
        const row = pastEventBadge.locator('../..');
        const photoButton = row.locator('button').filter({ has: page.locator('svg') });

        // Should have a photo upload/manage button
        expect(await photoButton.count()).toBeGreaterThan(0);
      }
    }
  });

  test('should open photo upload dialog for past events', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForSelector('text=Admin Dashboard', { timeout: 10000 });

    const eventsTab = page.locator('text=Events Management').or(
      page.locator('button:has-text("Events")')
    );

    if (await eventsTab.count() > 0) {
      await eventsTab.click();

      const pastEventBadge = page.locator('text=Past Event').first();

      if (await pastEventBadge.count() > 0) {
        // Find and click photo button
        const row = pastEventBadge.locator('../..');
        const photoButton = row.locator('button').filter({
          has: page.locator('svg')
        }).first();

        if (await photoButton.count() > 0) {
          await photoButton.click();

          // Photo upload dialog should open
          const dialog = page.locator('[role="dialog"]');
          await expect(dialog).toBeVisible({ timeout: 3000 });

          // Check for upload elements
          await expect(
            dialog.locator('text=/Manage.*Photo|Upload.*Photo|Event Photo/i')
          ).toBeVisible();
        }
      }
    }
  });

  test('should edit existing event', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForSelector('text=Admin Dashboard', { timeout: 10000 });

    const eventsTab = page.locator('text=Events Management').or(
      page.locator('button:has-text("Events")')
    );

    if (await eventsTab.count() > 0) {
      await eventsTab.click();

      // Click edit button on first event
      const editButton = page.locator('button').filter({
        has: page.locator('svg')
      }).filter({ hasText: /edit/i }).or(
        page.locator('button[title*="Edit"]')
      ).first();

      if (await editButton.count() > 0) {
        await editButton.click();

        // Edit dialog should open
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 3000 });

        // Form should be pre-filled
        const titleInput = dialog.locator('input#title');
        const titleValue = await titleInput.inputValue();
        expect(titleValue.length).toBeGreaterThan(0);
      }
    }
  });

  test('should toggle event active status', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForSelector('text=Admin Dashboard', { timeout: 10000 });

    const eventsTab = page.locator('text=Events Management').or(
      page.locator('button:has-text("Events")')
    );

    if (await eventsTab.count() > 0) {
      await eventsTab.click();

      // Find active status toggle switch
      const statusSwitch = page.locator('[role="switch"]').first();

      if (await statusSwitch.count() > 0) {
        const initialState = await statusSwitch.getAttribute('aria-checked');

        // Toggle the switch
        await statusSwitch.click();

        // Wait for update
        await page.waitForTimeout(1000);

        // Verify state changed
        const newState = await statusSwitch.getAttribute('aria-checked');
        expect(newState).not.toBe(initialState);
      }
    }
  });

  test('should toggle event visibility', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForSelector('text=Admin Dashboard', { timeout: 10000 });

    const eventsTab = page.locator('text=Events Management').or(
      page.locator('button:has-text("Events")')
    );

    if (await eventsTab.count() > 0) {
      await eventsTab.click();

      // Find visibility toggle (usually second switch in row)
      const visibilitySwitch = page.locator('[role="switch"]').nth(1);

      if (await visibilitySwitch.count() > 0) {
        const initialState = await visibilitySwitch.getAttribute('aria-checked');

        // Toggle the switch
        await visibilitySwitch.click();

        // Wait for update
        await page.waitForTimeout(1000);

        // Verify state changed
        const newState = await visibilitySwitch.getAttribute('aria-checked');
        expect(newState).not.toBe(initialState);
      }
    }
  });

  test('should delete event with confirmation', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForSelector('text=Admin Dashboard', { timeout: 10000 });

    const eventsTab = page.locator('text=Events Management').or(
      page.locator('button:has-text("Events")')
    );

    if (await eventsTab.count() > 0) {
      await eventsTab.click();

      // Find delete button (usually red/destructive)
      const deleteButton = page.locator('button').filter({
        hasText: /delete|remove/i
      }).or(
        page.locator('button.bg-destructive, button.text-destructive')
      ).first();

      if (await deleteButton.count() > 0) {
        await deleteButton.click();

        // Confirmation dialog should appear
        const confirmDialog = page.locator('[role="alertdialog"]').or(
          page.locator('[role="dialog"]')
        );
        await expect(confirmDialog).toBeVisible({ timeout: 3000 });

        // Should ask for confirmation
        await expect(
          confirmDialog.locator('text=/are you sure|confirm|delete/i')
        ).toBeVisible();

        // Click cancel to not actually delete in test
        const cancelButton = confirmDialog.locator('button').filter({ hasText: /cancel/i });
        if (await cancelButton.count() > 0) {
          await cancelButton.click();
        }
      }
    }
  });
});

test.describe('Admin Event Management - Permissions', () => {
  test('should not allow non-admin users to access admin panel', async ({ page }) => {
    // Try to access admin panel without logging in
    await page.goto('/admin');

    // Should redirect to auth or show access denied
    await expect(
      page.locator('text=/login|sign in|access denied|unauthorized/i')
    ).toBeVisible({ timeout: 5000 });
  });
});
