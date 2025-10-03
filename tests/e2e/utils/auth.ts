import type { Page } from '@playwright/test';

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

export async function logout(page: Page) {
  // Click user menu
  await page.click('[data-testid="user-menu"]', { timeout: 5000 });

  // Click logout
  await page.click('text=Logout');

  // Wait for redirect to home or auth
  await page.waitForURL(/\/(auth|$)/, { timeout: 5000 });
}

// Helper to create a test user (mock data for testing)
export const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
};

export const TEST_INSTRUCTOR = {
  email: 'instructor@example.com',
  password: 'InstructorPass123!',
};
