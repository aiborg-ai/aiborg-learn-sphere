/**
 * Authentication Utilities for E2E Tests
 * Provides login/logout helpers and role-based test fixtures
 */

import type { Page } from '@playwright/test';
import { TEST_USERS, type UserRole } from './test-data';

/**
 * Login with email and password
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/auth');

  // Fill in login form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Login as a specific user role
 */
export async function loginAsRole(page: Page, role: UserRole) {
  const user = TEST_USERS[role] || TEST_USERS.student;
  await login(page, user.email, user.password);
}

/**
 * Logout current user
 */
export async function logout(page: Page) {
  try {
    // Click user menu
    await page.click('[data-testid="user-menu"]', { timeout: 5000 });

    // Click logout
    await page.click('text=Logout');

    // Wait for redirect to home or auth
    await page.waitForURL(/\/(auth|$)/, { timeout: 5000 });
  } catch {
    // If logout fails, try alternative method
    await page.goto('/auth');
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    await page.goto('/dashboard');
    await page.waitForURL(/\/dashboard/, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Setup authenticated session for a role
 * Useful for test setup hooks
 */
export async function setupAuthenticatedSession(page: Page, role: UserRole = 'student') {
  const user = TEST_USERS[role] || TEST_USERS.student;
  await login(page, user.email, user.password);

  // Wait for session to be established
  await page.waitForTimeout(1000);
}

/**
 * Clear authentication state
 */
export async function clearAuthState(page: Page) {
  // Clear cookies
  await page.context().clearCookies();

  // Clear local storage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Get current user from session
 */
export async function getCurrentUser(page: Page): Promise<unknown | null> {
  try {
    return await page.evaluate(() => {
      const userString = localStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    });
  } catch {
    return null;
  }
}

/**
 * Set authentication token manually (for API testing)
 */
export async function setAuthToken(page: Page, token: string) {
  await page.evaluate(authToken => {
    localStorage.setItem('sb-access-token', authToken);
  }, token);
}

// Legacy exports for backward compatibility
export const TEST_USER = {
  email: 'test.student@example.com',
  password: 'TestStudent123!',
};

export const TEST_INSTRUCTOR = {
  email: 'test.instructor@example.com',
  password: 'TestInstructor123!',
};

export const TEST_ADMIN = {
  email: 'test.admin@example.com',
  password: 'TestAdmin123!',
};

export const TEST_COMPANY_ADMIN = {
  email: 'test.companyadmin@example.com',
  password: 'TestCompanyAdmin123!',
};

/**
 * Role-based test fixtures
 */
export const AUTH_FIXTURES = {
  student: TEST_USERS.student,
  instructor: TEST_USERS.instructor,
  admin: TEST_USERS.admin,
  superAdmin: TEST_USERS.superAdmin,
  companyAdmin: TEST_USERS.companyAdmin,
};
