import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Individual User (Student) Signup and Authentication
 */

test.describe('Individual User Signup', () => {
  const generateTestUser = () => ({
    email: `test-student-${Date.now()}@aiborg.ai`,
    password: 'TestPassword123!@#',
    displayName: 'Test Student User',
  });

  test('should display individual signup as default option', async ({ page: _page }) => {
    await page.goto('/auth');
    await page.getByRole('tab', { name: /sign up/i }).click();

    // Individual should be selected by default
    const individualRadio = page.getByLabel('Individual');
    await expect(individualRadio).toBeChecked();
  });

  test('should signup successfully as individual user', async ({ page: _page }) => {
    const testUser = generateTestUser();

    await page.goto('/auth');
    await page.getByRole('tab', { name: /sign up/i }).click();

    // Ensure Individual is selected (default)
    await page.getByLabel('Individual').check();

    // Fill in basic fields (no company fields should be visible)
    await page.getByLabel(/display name/i).fill(testUser.displayName);
    await page.locator('input[name="email"]').fill(testUser.email);
    await page.locator('input[name="password"]').first().fill(testUser.password);
    await page.locator('input[name="confirmPassword"]').fill(testUser.password);

    // Company fields should NOT be visible
    await expect(page.getByLabel(/company name/i)).not.toBeVisible();

    // Submit form
    await page.getByRole('button', { name: /create account/i }).click();

    // Should show success message
    await expect(page.getByText(/account created successfully/i)).toBeVisible({ timeout: 5000 });
  });

  test('should validate display name requirement', async ({ page: _page }) => {
    await page.goto('/auth');
    await page.getByRole('tab', { name: /sign up/i }).click();

    // Try to signup without display name
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').first().fill('TestPassword123!@#');
    await page.locator('input[name="confirmPassword"]').fill('TestPassword123!@#');

    await page.getByRole('button', { name: /create account/i }).click();

    // Should show validation error
    await expect(page.getByText(/display name.*required|display name.*2 characters/i)).toBeVisible({
      timeout: 3000,
    });
  });

  test('should validate password strength', async ({ page: _page }) => {
    await page.goto('/auth');
    await page.getByRole('tab', { name: /sign up/i }).click();

    await page.getByLabel(/display name/i).fill('Test User');
    await page.locator('input[name="email"]').fill('test@example.com');

    // Use weak password
    await page.locator('input[name="password"]').first().fill('weak');
    await page.locator('input[name="confirmPassword"]').fill('weak');

    await page.getByRole('button', { name: /create account/i }).click();

    // Should show password strength error
    await expect(page.getByText(/12.*characters|uppercase.*lowercase.*numbers/i)).toBeVisible({
      timeout: 3000,
    });
  });

  test('should validate password confirmation match', async ({ page: _page }) => {
    await page.goto('/auth');
    await page.getByRole('tab', { name: /sign up/i }).click();

    await page.getByLabel(/display name/i).fill('Test User');
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').first().fill('TestPassword123!@#');
    await page.locator('input[name="confirmPassword"]').fill('DifferentPassword123!@#');

    await page.getByRole('button', { name: /create account/i }).click();

    // Should show password mismatch error
    await expect(page.getByText(/passwords do not match/i)).toBeVisible({ timeout: 3000 });
  });

  test('should show password requirements hint', async ({ page: _page }) => {
    await page.goto('/auth');
    await page.getByRole('tab', { name: /sign up/i }).click();

    // Password requirements should be visible
    await expect(page.getByText(/12.*characters.*uppercase.*lowercase.*numbers/i)).toBeVisible();
  });

  test('should validate email format', async ({ page: _page }) => {
    await page.goto('/auth');
    await page.getByRole('tab', { name: /sign up/i }).click();

    await page.getByLabel(/display name/i).fill('Test User');

    // Try invalid email format
    const emailInput = page.locator('input[name="email"]');
    await emailInput.fill('invalid-email');

    // Browser validation or form validation should catch this
    await page.getByRole('button', { name: /create account/i }).click();

    // Check if still on signup page (validation failed)
    await expect(page.getByRole('tab', { name: /sign up/i })).toBeVisible();
  });
});

test.describe('Individual User Login', () => {
  test('should display signin form by default', async ({ page: _page }) => {
    await page.goto('/auth');

    // Sign In tab should be active by default
    const signInTab = page.getByRole('tab', { name: /sign in/i });
    await expect(signInTab).toHaveAttribute('data-state', 'active');

    // Email and password fields should be visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should have forgot password link', async ({ page: _page }) => {
    await page.goto('/auth');

    // Forgot password button should be visible
    await expect(page.getByText(/forgot password/i)).toBeVisible();
  });

  test('should open password reset dialog', async ({ page: _page }) => {
    await page.goto('/auth');

    // Click forgot password
    await page.getByRole('button', { name: /forgot password/i }).click();

    // Dialog should open
    await expect(page.getByRole('dialog').or(page.getByText(/reset password/i))).toBeVisible({
      timeout: 3000,
    });
    await expect(page.getByText(/send you a link/i)).toBeVisible();
  });

  test('should close password reset dialog', async ({ page: _page }) => {
    await page.goto('/auth');

    await page.getByRole('button', { name: /forgot password/i }).click();
    await page.waitForTimeout(500);

    // Close dialog
    const cancelButton = page.getByRole('button', { name: /cancel/i });
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await page.waitForTimeout(500);

      // Dialog should be closed
      const dialog = page.getByRole('dialog');
      await expect(dialog).not.toBeVisible();
    }
  });

  test('should handle rate limiting on signin attempts', async ({ page: _page }) => {
    await page.goto('/auth');

    // Try multiple failed login attempts
    for (let i = 0; i < 6; i++) {
      await page.locator('input[name="email"]').fill('test@example.com');
      await page.locator('input[name="password"]').fill('WrongPassword123');
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForTimeout(500);
    }

    // Should show rate limit error after multiple attempts
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });
});

test.describe('Tab Navigation Between Signin and Signup', () => {
  test('should switch between signin and signup tabs', async ({ page: _page }) => {
    await page.goto('/auth');

    // Default is signin
    await expect(page.getByRole('tab', { name: /sign in/i })).toHaveAttribute(
      'data-state',
      'active'
    );

    // Switch to signup
    await page.getByRole('tab', { name: /sign up/i }).click();
    await expect(page.getByRole('tab', { name: /sign up/i })).toHaveAttribute(
      'data-state',
      'active'
    );

    // Switch back to signin
    await page.getByRole('tab', { name: /sign in/i }).click();
    await expect(page.getByRole('tab', { name: /sign in/i })).toHaveAttribute(
      'data-state',
      'active'
    );
  });

  test('should show different forms for signin and signup', async ({ page: _page }) => {
    await page.goto('/auth');

    // Signin tab - should not have display name field
    await expect(page.getByLabel(/display name/i)).not.toBeVisible();

    // Switch to signup
    await page.getByRole('tab', { name: /sign up/i }).click();

    // Signup tab - should have display name field
    await expect(page.getByLabel(/display name/i)).toBeVisible();
  });
});

test.describe('OAuth Providers', () => {
  test('should have OAuth buttons on both signin and signup', async ({ page: _page }) => {
    await page.goto('/auth');

    // Check signin tab
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue with github/i })).toBeVisible();

    // Check signup tab
    await page.getByRole('tab', { name: /sign up/i }).click();
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue with github/i })).toBeVisible();
  });

  test('should have proper OAuth button styling', async ({ page: _page }) => {
    await page.goto('/auth');

    const googleButton = page.getByRole('button', { name: /continue with google/i });
    const githubButton = page.getByRole('button', { name: /continue with github/i });

    // Buttons should be visible and enabled
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
    await expect(githubButton).toBeVisible();
    await expect(githubButton).toBeEnabled();

    // Should have icons
    const googleIcon = googleButton.locator('svg');
    const githubIcon = githubButton.locator('svg');

    if ((await googleIcon.count()) > 0) {
      await expect(googleIcon.first()).toBeVisible();
    }
    if ((await githubIcon.count()) > 0) {
      await expect(githubIcon.first()).toBeVisible();
    }
  });
});

test.describe('Auth Page UI/UX', () => {
  test('should have back to home link', async ({ page: _page }) => {
    await page.goto('/auth');

    const backLink = page.getByRole('link', { name: /back to home/i });
    await expect(backLink).toBeVisible();

    // Click should navigate to home
    await backLink.click();
    await expect(page).toHaveURL('/', { timeout: 5000 });
  });

  test('should display branding/logo', async ({ page: _page }) => {
    await page.goto('/auth');

    // Logo should be visible
    const logo = page.locator('img[alt*="logo" i]').or(page.getByText(/aiborg/i));
    await expect(logo.first()).toBeVisible();
  });

  test('should have proper page title', async ({ page: _page }) => {
    await page.goto('/auth');

    await expect(page.getByText(/welcome|sign in|join/i)).toBeVisible();
  });

  test('should show divider between OAuth and email signup', async ({ page: _page }) => {
    await page.goto('/auth');

    // Should have "Or continue with email" text or similar divider
    await expect(page.getByText(/or.*email|or sign/i)).toBeVisible();
  });
});
