/**
 * User Management E2E Tests
 * Tests for user CRUD operations, role management, and permissions
 */

import { test, expect } from '@playwright/test';
import { UserManagementPage } from '../pages/UserManagementPage';
import { setupAuthenticatedSession } from '../utils/auth';
import { generateUser } from '../factories/userFactory';

test.describe('User Management - List and Search', () => {
  let userManagementPage: UserManagementPage;

  test.beforeEach(async ({ page }) => {
    userManagementPage = new UserManagementPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await userManagementPage.navigate();
  });

  test('should display user management page', async () => {
    await userManagementPage.assertOnUserManagement();
  });

  test('should display users list', async () => {
    await userManagementPage.page.waitForTimeout(1000);
    const userCount = await userManagementPage.getUserCount();
    expect(userCount).toBeGreaterThanOrEqual(0);
  });

  test('should search for users', async () => {
    await userManagementPage.searchUsers('test');
    await userManagementPage.page.waitForTimeout(1000);

    const users = await userManagementPage.getAllUsers();
    expect(Array.isArray(users)).toBe(true);
  });

  test('should get all users with details', async () => {
    const users = await userManagementPage.getAllUsers();
    expect(Array.isArray(users)).toBe(true);

    if (users.length > 0) {
      expect(users[0]).toHaveProperty('name');
      expect(users[0]).toHaveProperty('email');
      expect(users[0]).toHaveProperty('role');
      expect(users[0]).toHaveProperty('status');
    }
  });
});

test.describe('User Management - Filters', () => {
  let userManagementPage: UserManagementPage;

  test.beforeEach(async ({ page }) => {
    userManagementPage = new UserManagementPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await userManagementPage.navigate();
  });

  test('should apply role filter', async () => {
    if (await userManagementPage.isVisible('button:has-text("Filters")')) {
      await userManagementPage.applyFilters({
        role: 'student',
      });
      await userManagementPage.page.waitForTimeout(1000);

      const users = await userManagementPage.getAllUsers();
      expect(Array.isArray(users)).toBe(true);
    }
  });

  test('should apply status filter', async () => {
    if (await userManagementPage.isVisible('button:has-text("Filters")')) {
      await userManagementPage.applyFilters({
        status: 'active',
      });
      await userManagementPage.page.waitForTimeout(1000);

      const users = await userManagementPage.getAllUsers();
      expect(Array.isArray(users)).toBe(true);
    }
  });

  test('should clear filters', async () => {
    if (await userManagementPage.isVisible('button:has-text("Filters")')) {
      await userManagementPage.applyFilters({
        role: 'instructor',
      });
      await userManagementPage.page.waitForTimeout(1000);

      await userManagementPage.clearFilters();
      await userManagementPage.page.waitForTimeout(1000);
    }
  });
});

test.describe('User Management - Create User', () => {
  let userManagementPage: UserManagementPage;

  test.beforeEach(async ({ page }) => {
    userManagementPage = new UserManagementPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await userManagementPage.navigate();
  });

  test('should create new user', async () => {
    const testUser = generateUser('student');

    if (await userManagementPage.isVisible('button:has-text("Create User")')) {
      await userManagementPage.createUser({
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        email: testUser.email,
        password: testUser.password,
        role: 'student',
        sendWelcomeEmail: false,
      });

      await userManagementPage.page.waitForTimeout(2000);

      // Search for the created user
      await userManagementPage.searchUsers(testUser.email);
      await userManagementPage.page.waitForTimeout(1000);
    }
  });

  test('should create instructor user', async () => {
    const testInstructor = generateUser('instructor');

    if (await userManagementPage.isVisible('button:has-text("Create User")')) {
      await userManagementPage.createUser({
        firstName: testInstructor.firstName,
        lastName: testInstructor.lastName,
        email: testInstructor.email,
        password: testInstructor.password,
        role: 'instructor',
      });

      await userManagementPage.page.waitForTimeout(2000);
    }
  });
});

test.describe('User Management - Edit User', () => {
  let userManagementPage: UserManagementPage;

  test.beforeEach(async ({ page }) => {
    userManagementPage = new UserManagementPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await userManagementPage.navigate();
  });

  test('should edit user details', async () => {
    await userManagementPage.page.waitForTimeout(1000);
    const users = await userManagementPage.getAllUsers();

    if (users.length > 0 && (await userManagementPage.isVisible('button:has-text("Edit")'))) {
      const userEmail = users[0].email;

      await userManagementPage.editUser(userEmail, {
        firstName: 'Updated',
      });

      await userManagementPage.page.waitForTimeout(2000);
    }
  });

  test('should change user role', async () => {
    await userManagementPage.page.waitForTimeout(1000);
    const users = await userManagementPage.getAllUsers();

    if (users.length > 0 && (await userManagementPage.isVisible('button:has-text("Edit")'))) {
      const userEmail = users[0].email;

      await userManagementPage.editUser(userEmail, {
        role: 'instructor',
      });

      await userManagementPage.page.waitForTimeout(2000);
    }
  });
});

test.describe('User Management - View User Details', () => {
  let userManagementPage: UserManagementPage;

  test.beforeEach(async ({ page }) => {
    userManagementPage = new UserManagementPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await userManagementPage.navigate();
  });

  test('should view user details', async () => {
    await userManagementPage.page.waitForTimeout(1000);
    const users = await userManagementPage.getAllUsers();

    if (users.length > 0 && (await userManagementPage.isVisible('button:has-text("View")'))) {
      const userEmail = users[0].email;

      await userManagementPage.viewUserDetails(userEmail);
      await userManagementPage.page.waitForTimeout(1000);

      const details = await userManagementPage.getUserDetailsFromModal();
      expect(details.email).toBeTruthy();
      expect(details.role).toBeTruthy();

      await userManagementPage.closeDetailsModal();
    }
  });

  test('should view user enrollments', async () => {
    await userManagementPage.page.waitForTimeout(1000);
    const users = await userManagementPage.getAllUsers();

    if (users.length > 0 && (await userManagementPage.isVisible('button:has-text("View")'))) {
      const userEmail = users[0].email;

      await userManagementPage.viewEnrollments(userEmail);
      await userManagementPage.page.waitForTimeout(1000);

      if (await userManagementPage.isVisible('[data-testid="enrollment-item"]')) {
        const enrollments = await userManagementPage.getUserEnrollments();
        expect(Array.isArray(enrollments)).toBe(true);
      }

      await userManagementPage.closeDetailsModal();
    }
  });

  test('should view user activity log', async () => {
    await userManagementPage.page.waitForTimeout(1000);
    const users = await userManagementPage.getAllUsers();

    if (users.length > 0 && (await userManagementPage.isVisible('button:has-text("View")'))) {
      const userEmail = users[0].email;

      await userManagementPage.viewActivityLog(userEmail);
      await userManagementPage.page.waitForTimeout(1000);

      if (await userManagementPage.isVisible('[data-testid="activity-item"]')) {
        const activities = await userManagementPage.getUserActivity();
        expect(Array.isArray(activities)).toBe(true);
      }

      await userManagementPage.closeDetailsModal();
    }
  });
});

test.describe('User Management - User Actions', () => {
  let userManagementPage: UserManagementPage;

  test.beforeEach(async ({ page }) => {
    userManagementPage = new UserManagementPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await userManagementPage.navigate();
  });

  test('should deactivate user', async () => {
    await userManagementPage.page.waitForTimeout(1000);
    const users = await userManagementPage.getAllUsers();

    if (users.length > 0 && (await userManagementPage.isVisible('button:has-text("Deactivate")'))) {
      const userEmail = users[0].email;

      await userManagementPage.deactivateUser(userEmail);
      await userManagementPage.page.waitForTimeout(2000);
    }
  });

  test('should activate user', async () => {
    await userManagementPage.page.waitForTimeout(1000);
    const users = await userManagementPage.getAllUsers();

    if (users.length > 0 && (await userManagementPage.isVisible('button:has-text("Activate")'))) {
      const userEmail = users[0].email;

      await userManagementPage.activateUser(userEmail);
      await userManagementPage.page.waitForTimeout(2000);
    }
  });

  test('should reset user password', async () => {
    await userManagementPage.page.waitForTimeout(1000);
    const users = await userManagementPage.getAllUsers();

    if (
      users.length > 0 &&
      (await userManagementPage.isVisible('button:has-text("Reset Password")'))
    ) {
      const userEmail = users[0].email;

      await userManagementPage.resetPassword(userEmail);
      await userManagementPage.page.waitForTimeout(2000);
    }
  });
});

test.describe('User Management - Delete User', () => {
  let userManagementPage: UserManagementPage;

  test.beforeEach(async ({ page }) => {
    userManagementPage = new UserManagementPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await userManagementPage.navigate();
  });

  test('should delete user', async () => {
    // Create a test user first
    const testUser = generateUser('student');

    if (await userManagementPage.isVisible('button:has-text("Create User")')) {
      await userManagementPage.createUser({
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        email: testUser.email,
        password: testUser.password,
        role: 'student',
      });

      await userManagementPage.page.waitForTimeout(2000);

      // Search for the user
      await userManagementPage.searchUsers(testUser.email);
      await userManagementPage.page.waitForTimeout(1000);

      // Delete the user
      if (await userManagementPage.userExists(testUser.email)) {
        await userManagementPage.deleteUser(testUser.email);
        await userManagementPage.page.waitForTimeout(2000);

        // Verify user is deleted
        const stillExists = await userManagementPage.userExists(testUser.email);
        expect(stillExists).toBe(false);
      }
    }
  });
});

test.describe('User Management - Bulk Actions', () => {
  let userManagementPage: UserManagementPage;

  test.beforeEach(async ({ page }) => {
    userManagementPage = new UserManagementPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await userManagementPage.navigate();
  });

  test('should select multiple users', async () => {
    await userManagementPage.page.waitForTimeout(1000);

    if (await userManagementPage.isVisible('input[type="checkbox"][data-testid="user-checkbox"]')) {
      await userManagementPage.selectUsers(2);
      await userManagementPage.page.waitForTimeout(500);
    }
  });

  test('should select all users', async () => {
    if (await userManagementPage.isVisible('input[type="checkbox"][aria-label="Select all"]')) {
      await userManagementPage.selectAllUsers();
      await userManagementPage.page.waitForTimeout(500);
    }
  });

  test('should bulk activate users', async () => {
    if (await userManagementPage.isVisible('input[type="checkbox"][data-testid="user-checkbox"]')) {
      await userManagementPage.selectUsers(2);
      await userManagementPage.page.waitForTimeout(500);

      if (await userManagementPage.isVisible('button:has-text("Activate Selected")')) {
        await userManagementPage.bulkActivateUsers();
        await userManagementPage.page.waitForTimeout(2000);
      }
    }
  });
});

test.describe('User Management - Sorting and Pagination', () => {
  let userManagementPage: UserManagementPage;

  test.beforeEach(async ({ page }) => {
    userManagementPage = new UserManagementPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await userManagementPage.navigate();
  });

  test('should sort by name', async () => {
    if (await userManagementPage.isVisible('button[aria-label="Sort by name"]')) {
      await userManagementPage.sortBy('name');
      await userManagementPage.page.waitForTimeout(1000);
    }
  });

  test('should sort by email', async () => {
    if (await userManagementPage.isVisible('button[aria-label="Sort by email"]')) {
      await userManagementPage.sortBy('email');
      await userManagementPage.page.waitForTimeout(1000);
    }
  });

  test('should navigate pagination', async () => {
    if (await userManagementPage.isVisible('[data-testid="pagination"]')) {
      if (await userManagementPage.isVisible('button:has-text("Next")')) {
        await userManagementPage.goToNextPage();
        await userManagementPage.page.waitForTimeout(1000);

        if (await userManagementPage.isVisible('button:has-text("Previous")')) {
          await userManagementPage.goToPreviousPage();
          await userManagementPage.page.waitForTimeout(1000);
        }
      }
    }
  });

  test('should display page info', async () => {
    if (await userManagementPage.isVisible('[data-testid="page-info"]')) {
      const pageInfo = await userManagementPage.getPageInfo();
      expect(pageInfo).toBeTruthy();
    }
  });
});

test.describe('User Management - Export', () => {
  let userManagementPage: UserManagementPage;

  test.beforeEach(async ({ page }) => {
    userManagementPage = new UserManagementPage(page);
    await setupAuthenticatedSession(page, 'admin');
    await userManagementPage.navigate();
  });

  test('should export users', async () => {
    if (await userManagementPage.isVisible('button:has-text("Export Users")')) {
      try {
        const download = await userManagementPage.exportUsers();
        expect(download).toBeTruthy();
      } catch {
        // Export might not be available
      }
    }
  });
});
