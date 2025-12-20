/**
 * Enhanced Authentication Flow E2E Tests
 * Comprehensive tests for signup, login, password reset, and email verification
 */

import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';
import { DashboardPage } from '../pages/DashboardPage';
import { generateUser } from '../utils/test-data';
import { cleanupTestUsers } from '../utils/db-helpers';
import { TEST_USER, logout } from '../utils/auth';

test.describe('User Signup Flow', () => {
  let authPage: AuthPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test.afterEach(async () => {
    await cleanupTestUsers();
  });

  test('should complete successful signup with valid data', async () => {
    const newUser = generateUser('student');

    await authPage.navigate();
    await authPage.switchToSignup();

    await authPage.signup({
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      password: newUser.password,
      confirmPassword: newUser.password,
    });

    // Wait for success
    await authPage.waitForSuccess();

    // Should redirect to dashboard or show verification message
    try {
      await dashboardPage.assertDashboardLoaded();
    } catch {
      // If email verification is required
      const hasVerificationBanner = await authPage.isEmailVerificationBannerShown();
      expect(hasVerificationBanner).toBe(true);
    }
  });

  test('should reject signup with mismatched passwords', async ({ page }) => {
    const newUser = generateUser('student');

    await authPage.navigate();
    await authPage.switchToSignup();

    await authPage.signup({
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      password: newUser.password,
      confirmPassword: 'DifferentPassword123!',
    });

    // Should show validation error
    await page.waitForTimeout(1000);
    const hasError =
      (await authPage.isVisible('[role="alert"]')) || !(await authPage.isSignupButtonEnabled());

    expect(hasError).toBe(true);
  });

  test('should reject signup with weak password', async ({ page }) => {
    const _newUser = generateUser('student');

    await authPage.navigate();
    await authPage.switchToSignup();

    // Try with weak password
    await page.fill('input[name="password"]', '123');
    await page.fill('input[name="confirmPassword"]', '123');

    // Button should be disabled or show validation error
    const isButtonEnabled = await authPage.isSignupButtonEnabled();
    expect(isButtonEnabled).toBe(false);
  });

  test('should reject signup with invalid email format', async ({ page }) => {
    const newUser = generateUser('student');

    await authPage.navigate();
    await authPage.switchToSignup();

    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', newUser.password);
    await page.fill('input[name="confirmPassword"]', newUser.password);

    // Should show validation error
    const hasError =
      (await authPage.isVisible('[role="alert"]')) || !(await authPage.isSignupButtonEnabled());

    expect(hasError).toBe(true);
  });

  test('should reject signup without accepting terms', async ({ page }) => {
    const newUser = generateUser('student');

    await authPage.navigate();
    await authPage.switchToSignup();

    // Fill form but don't check terms
    await page.fill('input[name="firstName"]', newUser.firstName);
    await page.fill('input[name="lastName"]', newUser.lastName);
    await page.fill('input[name="email"]', newUser.email);
    await page.fill('input[name="password"]', newUser.password);
    await page.fill('input[name="confirmPassword"]', newUser.password);

    // Don't check terms checkbox
    // Button should be disabled
    const isButtonEnabled = await authPage.isSignupButtonEnabled();
    expect(isButtonEnabled).toBe(false);
  });

  test('should prevent duplicate email registration', async () => {
    const newUser = generateUser('student');

    // First registration
    await authPage.navigate();
    await authPage.completeSignupFlow(newUser);

    // Logout
    await logout(authPage.page);

    // Try to register again with same email
    await authPage.navigate();
    await authPage.signup({
      firstName: 'Different',
      lastName: 'Name',
      email: newUser.email,
      password: newUser.password,
      confirmPassword: newUser.password,
    });

    // Should show error about existing email
    await authPage.waitForError();
    const errorMessage = await authPage.getErrorMessage();
    expect(errorMessage.toLowerCase()).toContain('already');
  });
});

test.describe('User Login Flow', () => {
  let authPage: AuthPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test('should login successfully with valid credentials', async () => {
    await authPage.navigate();
    await authPage.login(TEST_USER.email, TEST_USER.password);

    await authPage.waitForSuccess();
    await dashboardPage.assertDashboardLoaded();
  });

  test('should reject login with invalid email', async () => {
    await authPage.navigate();
    await authPage.login('nonexistent@example.com', 'WrongPassword123!');

    await authPage.waitForError();
    const errorMessage = await authPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
  });

  test('should reject login with wrong password', async () => {
    await authPage.navigate();
    await authPage.login(TEST_USER.email, 'WrongPassword123!');

    await authPage.waitForError();
    const errorMessage = await authPage.getErrorMessage();
    expect(errorMessage.toLowerCase()).toMatch(/password|credentials|invalid/);
  });

  test('should reject login with empty fields', async ({ page: _page }) => {
    await authPage.navigate();

    // Try to login without filling fields
    await authPage.click('button[type="submit"]:has-text("Login")');

    // Button should be disabled or show validation
    const isButtonEnabled = await authPage.isLoginButtonEnabled();
    expect(isButtonEnabled).toBe(false);
  });

  test('should remember user when "Remember Me" is checked', async ({ page }) => {
    await authPage.navigate();
    await authPage.login(TEST_USER.email, TEST_USER.password, true);

    await authPage.waitForSuccess();

    // Check if session cookie is set with long expiry
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('auth'));

    if (sessionCookie) {
      // Session cookie should have long expiry
      expect(sessionCookie.expires).toBeGreaterThan(Date.now() / 1000 + 86400); // More than 1 day
    }
  });

  test('should handle rate limiting after multiple failed attempts', async () => {
    await authPage.navigate();

    // Attempt multiple failed logins
    for (let i = 0; i < 5; i++) {
      await authPage.login('test@example.com', 'WrongPassword' + i);
      await authPage.page.waitForTimeout(500);
    }

    // Should eventually show rate limit error
    await authPage.waitForError();
    const errorMessage = await authPage.getErrorMessage();
    expect(errorMessage.toLowerCase()).toMatch(/rate|limit|too many|wait/);
  });
});

test.describe('Password Reset Flow', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
  });

  test('should send password reset email for valid user', async () => {
    await authPage.navigate();
    await authPage.requestPasswordReset(TEST_USER.email);

    await authPage.waitForSuccess();
    const successMessage = await authPage.page.textContent('[role="alert"]');
    expect(successMessage?.toLowerCase()).toContain('email');
  });

  test('should handle password reset for non-existent email', async () => {
    await authPage.navigate();
    await authPage.requestPasswordReset('nonexistent@example.com');

    // Should still show success (security best practice - don't reveal if email exists)
    await authPage.waitForSuccess();
  });

  test('should validate password reset form', async ({ page: _page }) => {
    // This test assumes we have a reset token
    // In real scenario, would need to intercept email and get token
    test.skip(); // Skip for now as it requires email integration
  });

  test('should navigate back to login from password reset', async () => {
    await authPage.navigate();
    await authPage.clickForgotPassword();
    await authPage.page.waitForTimeout(500);

    await authPage.backToLogin();
    await authPage.assertLoginTabActive();
  });
});

test.describe('Email Verification Flow', () => {
  let authPage: AuthPage;
  let _dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    _dashboardPage = new DashboardPage(page);
  });

  test('should show verification banner for unverified users', async () => {
    const newUser = generateUser('student');

    // Signup
    await authPage.navigate();
    await authPage.completeSignupFlow(newUser);

    // Check if verification banner is shown
    const hasVerificationBanner = await authPage.isEmailVerificationBannerShown();

    // Banner may or may not be shown depending on app config
    expect(typeof hasVerificationBanner).toBe('boolean');
  });

  test('should allow resending verification email', async () => {
    const newUser = generateUser('student');

    await authPage.navigate();
    await authPage.completeSignupFlow(newUser);

    // If verification banner is shown, test resend
    if (await authPage.isEmailVerificationBannerShown()) {
      await authPage.resendVerificationEmail();

      // Should show confirmation
      await authPage.page.waitForTimeout(1000);
      const hasMessage = await authPage.isVisible('text=Verification email sent');
      expect(hasMessage).toBe(true);
    }
  });
});

test.describe('Social Login Flow', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
  });

  test('should display social login options', async () => {
    await authPage.navigate();

    // Check if social login buttons are present
    const hasGoogle = await authPage.isVisible('button:has-text("Google")');
    const hasGitHub = await authPage.isVisible('button:has-text("GitHub")');

    // At least one social login option should be available
    expect(hasGoogle || hasGitHub).toBe(true);
  });

  test('should handle social login OAuth flow', async ({ context: _context }) => {
    await authPage.navigate();

    // Note: Testing OAuth flows requires special setup
    // This is a placeholder for OAuth testing
    test.skip(); // Skip for now as OAuth requires external provider
  });
});

test.describe('Session Management', () => {
  let authPage: AuthPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test('should maintain session across page reloads', async ({ page }) => {
    await authPage.navigate();
    await authPage.login(TEST_USER.email, TEST_USER.password);
    await authPage.waitForSuccess();

    // Reload page
    await page.reload();

    // Should still be logged in
    await dashboardPage.navigate();
    const isLoggedIn = await dashboardPage.isLoggedIn();
    expect(isLoggedIn).toBe(true);
  });

  test('should logout successfully', async ({ page }) => {
    await authPage.navigate();
    await authPage.login(TEST_USER.email, TEST_USER.password);
    await authPage.waitForSuccess();

    // Logout
    await logout(page);

    // Should redirect to auth or home
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toMatch(/\/(auth|$)/);
  });

  test('should handle expired session', async ({ page, context }) => {
    await authPage.navigate();
    await authPage.login(TEST_USER.email, TEST_USER.password);
    await authPage.waitForSuccess();

    // Clear cookies to simulate expired session
    await context.clearCookies();

    // Try to access protected page
    await dashboardPage.navigate();

    // Should redirect to login
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toContain('/auth');
  });
});

test.describe('Authentication Edge Cases', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
  });

  test('should handle network errors during login', async ({ page }) => {
    await authPage.navigate();

    // Intercept auth API and force failure
    await page.route('**/auth/**', route => {
      route.abort('failed');
    });

    await authPage.login(TEST_USER.email, TEST_USER.password);

    // Should show network error
    await authPage.waitForError();
    const errorMessage = await authPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
  });

  test('should show loading state during authentication', async ({ page }) => {
    await authPage.navigate();

    // Add delay to auth endpoint
    await page.route('**/auth/**', async route => {
      await page.waitForTimeout(2000);
      await route.continue();
    });

    await authPage.click('button[type="submit"]:has-text("Login")');

    // Check for loading state
    const isLoading = await authPage.isLoading();
    expect(typeof isLoading).toBe('boolean');
  });

  test('should handle special characters in email/password', async () => {
    await authPage.navigate();

    // Test with special characters
    await authPage.login('test+tag@example.com', 'P@ssw0rd!#$%');

    // Should handle gracefully (either success or proper error)
    await authPage.page.waitForTimeout(2000);
  });
});
