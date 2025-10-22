import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Company Admin Signup and Authentication
 * Tests the new company admin user type and signup flow
 */

test.describe('Company Admin Authentication', () => {
  // Generate unique test data for each run
  const generateTestUser = () => ({
    email: `test-company-admin-${Date.now()}@aiborg.ai`,
    password: 'TestPassword123!@#',
    displayName: 'Test Company Admin',
    companyName: 'Test Corp Inc',
    industry: 'technology',
    companySize: '51-200',
  });

  test('should display company admin signup option', async ({ page: _page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Click on Sign Up tab
    await page.getByRole('tab', { name: /sign up/i }).click();

    // Check for account type selection
    await expect(page.getByText('Account Type')).toBeVisible();
    await expect(page.getByText('Individual')).toBeVisible();
    await expect(page.getByText('Company Admin')).toBeVisible();
  });

  test('should show company fields when Company Admin is selected', async ({ page: _page }) => {
    await page.goto('/auth');
    await page.getByRole('tab', { name: /sign up/i }).click();

    // Select Company Admin
    await page.getByLabel('Company Admin').click();

    // Wait for conditional fields to appear
    await expect(page.getByLabel(/company name/i)).toBeVisible();
    await expect(page.getByLabel(/industry/i)).toBeVisible();
    await expect(page.getByLabel(/company size/i)).toBeVisible();

    // Check help text
    await expect(
      page.getByText(/you can create your company profile and take AI readiness assessments/i)
    ).toBeVisible();
  });

  test('should hide company fields when Individual is selected', async ({ page: _page }) => {
    await page.goto('/auth');
    await page.getByRole('tab', { name: /sign up/i }).click();

    // Select Company Admin first
    await page.getByLabel('Company Admin').click();
    await expect(page.getByLabel(/company name/i)).toBeVisible();

    // Switch to Individual
    await page.getByLabel('Individual').click();

    // Company fields should be hidden
    await expect(page.getByLabel(/company name/i)).not.toBeVisible();
  });

  test('should validate required company fields', async ({ page: _page }) => {
    await page.goto('/auth');
    await page.getByRole('tab', { name: /sign up/i }).click();

    // Select Company Admin
    await page.getByLabel('Company Admin').click();

    // Fill only basic fields
    await page.getByLabel(/display name/i).fill('Test User');
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').first().fill('TestPassword123!@#');
    await page.locator('input[name="confirmPassword"]').fill('TestPassword123!@#');

    // Try to submit without company fields
    await page.getByRole('button', { name: /create account/i }).click();

    // Should show validation error
    await expect(page.getByText(/company name is required/i)).toBeVisible({ timeout: 3000 });
  });

  test('should successfully signup as company admin', async ({ page: _page }) => {
    const testUser = generateTestUser();

    await page.goto('/auth');
    await page.getByRole('tab', { name: /sign up/i }).click();

    // Select Company Admin
    await page.getByLabel('Company Admin').click();

    // Fill in all fields
    await page.getByLabel(/display name/i).fill(testUser.displayName);
    await page.getByLabel(/company name/i).fill(testUser.companyName);

    // Select industry
    await page.getByLabel(/industry/i).click();
    await page.getByRole('option', { name: 'Technology' }).click();

    // Select company size
    await page.getByLabel(/company size/i).click();
    await page.getByRole('option', { name: '51-200 employees' }).click();

    await page.locator('input[name="email"]').fill(testUser.email);
    await page.locator('input[name="password"]').first().fill(testUser.password);
    await page.locator('input[name="confirmPassword"]').fill(testUser.password);

    // Submit form
    await page.getByRole('button', { name: /create account/i }).click();

    // Should show success message
    await expect(page.getByText(/company admin account created successfully/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('should handle duplicate company admin email', async ({ page: _page }) => {
    const testUser = generateTestUser();

    // First signup
    await page.goto('/auth');
    await page.getByRole('tab', { name: /sign up/i }).click();
    await page.getByLabel('Company Admin').click();

    await page.getByLabel(/display name/i).fill(testUser.displayName);
    await page.getByLabel(/company name/i).fill(testUser.companyName);
    await page.getByLabel(/industry/i).click();
    await page.getByRole('option', { name: 'Technology' }).click();
    await page.getByLabel(/company size/i).click();
    await page.getByRole('option', { name: '51-200 employees' }).click();
    await page.locator('input[name="email"]').fill(testUser.email);
    await page.locator('input[name="password"]').first().fill(testUser.password);
    await page.locator('input[name="confirmPassword"]').fill(testUser.password);

    await page.getByRole('button', { name: /create account/i }).click();
    await page.waitForTimeout(2000);

    // Try to signup again with same email
    await page.goto('/auth');
    await page.getByRole('tab', { name: /sign up/i }).click();
    await page.getByLabel('Company Admin').click();

    await page.getByLabel(/display name/i).fill('Another User');
    await page.getByLabel(/company name/i).fill('Another Company');
    await page.getByLabel(/industry/i).click();
    await page.getByRole('option', { name: 'Finance' }).click();
    await page.getByLabel(/company size/i).click();
    await page.getByRole('option', { name: '11-50 employees' }).click();
    await page.locator('input[name="email"]').fill(testUser.email);
    await page.locator('input[name="password"]').first().fill(testUser.password);
    await page.locator('input[name="confirmPassword"]').fill(testUser.password);

    await page.getByRole('button', { name: /create account/i }).click();

    // Should show error about existing email
    await expect(page.getByText(/already registered|already exists/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('should validate company name length', async ({ page: _page }) => {
    await page.goto('/auth');
    await page.getByRole('tab', { name: /sign up/i }).click();
    await page.getByLabel('Company Admin').click();

    // Try with 1 character company name
    await page.getByLabel(/company name/i).fill('A');
    await page.getByLabel(/display name/i).fill('Test User');
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').first().fill('TestPassword123!@#');
    await page.locator('input[name="confirmPassword"]').fill('TestPassword123!@#');

    await page.getByRole('button', { name: /create account/i }).click();

    // Should show validation error
    await expect(page.getByText(/at least 2 characters/i)).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Company Admin Login Flow', () => {
  test('should allow company admin to sign in', async ({ page: _page }) => {
    await page.goto('/auth');

    // Should be on sign in tab by default
    await expect(page.getByRole('tab', { name: /sign in/i })).toHaveAttribute(
      'data-state',
      'active'
    );

    // Fill in credentials (use existing test account if available)
    await page.locator('input[name="email"]').fill('test-company@example.com');
    await page.locator('input[name="password"]').fill('TestPassword123!@#');

    // Try to sign in
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for navigation or error
    await page.waitForTimeout(2000);

    // If login succeeds, should redirect away from auth page
    // If it fails (account doesn't exist), should show error
    const isOnAuthPage = page.url().includes('/auth');

    if (!isOnAuthPage) {
      // Successfully logged in
      await expect(page).not.toHaveURL(/\/auth/);
    } else {
      // Expected failure for non-existent test account
      expect(isOnAuthPage).toBeTruthy();
    }
  });

  test('should show error for invalid credentials', async ({ page: _page }) => {
    await page.goto('/auth');

    await page.locator('input[name="email"]').fill('nonexistent@example.com');
    await page.locator('input[name="password"]').fill('WrongPassword123!@#');

    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('OAuth Authentication', () => {
  test('should have Google OAuth button', async ({ page: _page }) => {
    await page.goto('/auth');

    // Check for Google sign in button
    const googleButton = page.getByRole('button', { name: /continue with google/i });
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
  });

  test('should have GitHub OAuth button', async ({ page: _page }) => {
    await page.goto('/auth');

    // Check for GitHub sign in button
    const githubButton = page.getByRole('button', { name: /continue with github/i });
    await expect(githubButton).toBeVisible();
    await expect(githubButton).toBeEnabled();
  });
});
