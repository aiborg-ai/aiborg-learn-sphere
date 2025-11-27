/**
 * User Management Page Object
 * Represents user CRUD operations, role management, and permissions
 */

import { BasePage } from './BasePage';
import type { Page } from '@playwright/test';

export class UserManagementPage extends BasePage {
  // Page URL
  private readonly usersUrl = '/admin/users';

  // Header and navigation
  private readonly pageTitle = 'h1:has-text("User Management")';
  private readonly createUserButton = 'button:has-text("Create User")';
  private readonly importUsersButton = 'button:has-text("Import Users")';
  private readonly exportUsersButton = 'button:has-text("Export Users")';

  // Search and filters
  private readonly searchInput = 'input[placeholder*="Search users"]';
  private readonly searchButton = 'button[aria-label="Search"]';
  private readonly filterButton = 'button:has-text("Filters")';
  private readonly filterPanel = '[data-testid="filter-panel"]';
  private readonly roleFilter = '[data-testid="role-filter"]';
  private readonly statusFilter = '[data-testid="status-filter"]';
  private readonly dateFilter = '[data-testid="date-filter"]';
  private readonly applyFiltersButton = 'button:has-text("Apply Filters")';
  private readonly clearFiltersButton = 'button:has-text("Clear Filters")';

  // User list/table
  private readonly usersTable = '[data-testid="users-table"]';
  private readonly userRow = '[data-testid="user-row"]';
  private readonly userEmail = '[data-testid="user-email"]';
  private readonly userName = '[data-testid="user-name"]';
  private readonly userRole = '[data-testid="user-role"]';
  private readonly userStatus = '[data-testid="user-status"]';
  private readonly userActions = '[data-testid="user-actions"]';

  // Bulk actions
  private readonly selectAllCheckbox = 'input[type="checkbox"][aria-label="Select all"]';
  private readonly userCheckbox = 'input[type="checkbox"][data-testid="user-checkbox"]';
  private readonly bulkActionsDropdown = '[data-testid="bulk-actions"]';
  private readonly bulkDeleteButton = 'button:has-text("Delete Selected")';
  private readonly bulkActivateButton = 'button:has-text("Activate Selected")';
  private readonly bulkDeactivateButton = 'button:has-text("Deactivate Selected")';
  private readonly bulkExportButton = 'button:has-text("Export Selected")';

  // User actions menu
  private readonly viewUserButton = 'button:has-text("View")';
  private readonly editUserButton = 'button:has-text("Edit")';
  private readonly deleteUserButton = 'button:has-text("Delete")';
  private readonly deactivateUserButton = 'button:has-text("Deactivate")';
  private readonly activateUserButton = 'button:has-text("Activate")';
  private readonly resetPasswordButton = 'button:has-text("Reset Password")';
  private readonly impersonateButton = 'button:has-text("Impersonate")';

  // Create/Edit user form
  private readonly userForm = '[data-testid="user-form"]';
  private readonly firstNameInput = 'input[name="firstName"]';
  private readonly lastNameInput = 'input[name="lastName"]';
  private readonly emailInput = 'input[name="email"]';
  private readonly passwordInput = 'input[name="password"]';
  private readonly confirmPasswordInput = 'input[name="confirmPassword"]';
  private readonly roleSelect = 'select[name="role"]';
  private readonly statusSelect = 'select[name="status"]';
  private readonly phoneInput = 'input[name="phone"]';
  private readonly companyInput = 'input[name="company"]';
  private readonly notesTextarea = 'textarea[name="notes"]';
  private readonly sendWelcomeEmailCheckbox = 'input[type="checkbox"][name="sendWelcomeEmail"]';
  private readonly requirePasswordChangeCheckbox =
    'input[type="checkbox"][name="requirePasswordChange"]';
  private readonly saveUserButton = 'button:has-text("Save User")';
  private readonly cancelButton = 'button:has-text("Cancel")';

  // Role management
  private readonly manageRolesButton = 'button:has-text("Manage Roles")';
  private readonly rolesModal = '[data-testid="roles-modal"]';
  private readonly roleItem = '[data-testid="role-item"]';
  private readonly roleCheckbox = '[data-testid="role-checkbox"]';
  private readonly assignRoleButton = 'button:has-text("Assign Role")';
  private readonly removeRoleButton = 'button:has-text("Remove Role")';

  // Permissions
  private readonly permissionsSection = '[data-testid="permissions-section"]';
  private readonly permissionItem = '[data-testid="permission-item"]';
  private readonly permissionCheckbox = '[data-testid="permission-checkbox"]';
  private readonly savePermissionsButton = 'button:has-text("Save Permissions")';

  // User details modal
  private readonly userDetailsModal = '[data-testid="user-details-modal"]';
  private readonly userDetailName = '[data-testid="detail-name"]';
  private readonly userDetailEmail = '[data-testid="detail-email"]';
  private readonly userDetailRole = '[data-testid="detail-role"]';
  private readonly userDetailStatus = '[data-testid="detail-status"]';
  private readonly userDetailCreated = '[data-testid="detail-created"]';
  private readonly userDetailLastLogin = '[data-testid="detail-last-login"]';
  private readonly closeModalButton = 'button[aria-label="Close"]';

  // Enrollment history
  private readonly enrollmentHistoryTab = 'button:has-text("Enrollments")';
  private readonly enrollmentItem = '[data-testid="enrollment-item"]';
  private readonly enrollmentCourse = '[data-testid="enrollment-course"]';
  private readonly enrollmentDate = '[data-testid="enrollment-date"]';
  private readonly enrollmentStatus = '[data-testid="enrollment-status"]';

  // Activity log
  private readonly activityLogTab = 'button:has-text("Activity")';
  private readonly activityItem = '[data-testid="activity-item"]';
  private readonly activityType = '[data-testid="activity-type"]';
  private readonly activityTimestamp = '[data-testid="activity-timestamp"]';

  // Pagination
  private readonly pagination = '[data-testid="pagination"]';
  private readonly nextPageButton = 'button:has-text("Next")';
  private readonly prevPageButton = 'button:has-text("Previous")';
  private readonly pageInfo = '[data-testid="page-info"]';

  // Sorting
  private readonly sortByName = 'button[aria-label="Sort by name"]';
  private readonly sortByEmail = 'button[aria-label="Sort by email"]';
  private readonly sortByRole = 'button[aria-label="Sort by role"]';
  private readonly sortByCreated = 'button[aria-label="Sort by created date"]';

  // Confirmation dialogs
  private readonly confirmDialog = '[data-testid="confirm-dialog"]';
  private readonly confirmButton = 'button:has-text("Confirm")';
  private readonly confirmDeleteButton = 'button:has-text("Yes, Delete")';
  private readonly cancelConfirmButton = 'button:has-text("Cancel")';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to user management page
   */
  async navigate() {
    await this.goto(this.usersUrl);
    await this.waitForPageLoad();
  }

  /**
   * Search for users
   */
  async searchUsers(query: string) {
    await this.fill(this.searchInput, query);
    await this.click(this.searchButton);
    await this.wait(1000);
  }

  /**
   * Apply filters
   */
  async applyFilters(filters: { role?: string; status?: string; dateRange?: string }) {
    await this.click(this.filterButton);
    await this.waitForSelector(this.filterPanel);

    if (filters.role) {
      await this.selectOption(this.roleFilter, filters.role);
    }

    if (filters.status) {
      await this.selectOption(this.statusFilter, filters.status);
    }

    if (filters.dateRange) {
      await this.selectOption(this.dateFilter, filters.dateRange);
    }

    await this.click(this.applyFiltersButton);
    await this.wait(1000);
  }

  /**
   * Clear filters
   */
  async clearFilters() {
    await this.click(this.filterButton);
    await this.waitForSelector(this.filterPanel);
    await this.click(this.clearFiltersButton);
    await this.wait(1000);
  }

  /**
   * Get all visible users
   */
  async getAllUsers(): Promise<
    Array<{
      name: string;
      email: string;
      role: string;
      status: string;
    }>
  > {
    const rows = await this.page.locator(this.userRow).all();
    const users = [];

    for (const row of rows) {
      users.push({
        name: (await row.locator(this.userName).textContent()) || '',
        email: (await row.locator(this.userEmail).textContent()) || '',
        role: (await row.locator(this.userRole).textContent()) || '',
        status: (await row.locator(this.userStatus).textContent()) || '',
      });
    }

    return users;
  }

  /**
   * Get user count
   */
  async getUserCount(): Promise<number> {
    return await this.count(this.userRow);
  }

  /**
   * Create new user
   */
  async createUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
    sendWelcomeEmail?: boolean;
  }) {
    await this.click(this.createUserButton);
    await this.waitForSelector(this.userForm);

    await this.fill(this.firstNameInput, userData.firstName);
    await this.fill(this.lastNameInput, userData.lastName);
    await this.fill(this.emailInput, userData.email);
    await this.fill(this.passwordInput, userData.password);
    await this.fill(this.confirmPasswordInput, userData.password);
    await this.selectOption(this.roleSelect, userData.role);

    if (userData.sendWelcomeEmail) {
      await this.click(this.sendWelcomeEmailCheckbox);
    }

    await this.click(this.saveUserButton);
    await this.wait(1000);
  }

  /**
   * Edit user by email
   */
  async editUser(
    email: string,
    updates: {
      firstName?: string;
      lastName?: string;
      role?: string;
      status?: string;
    }
  ) {
    const row = this.page.locator(this.userRow).filter({ hasText: email });
    await row.locator(this.editUserButton).click();
    await this.waitForSelector(this.userForm);

    if (updates.firstName) {
      await this.fill(this.firstNameInput, updates.firstName);
    }

    if (updates.lastName) {
      await this.fill(this.lastNameInput, updates.lastName);
    }

    if (updates.role) {
      await this.selectOption(this.roleSelect, updates.role);
    }

    if (updates.status) {
      await this.selectOption(this.statusSelect, updates.status);
    }

    await this.click(this.saveUserButton);
    await this.wait(1000);
  }

  /**
   * Delete user by email
   */
  async deleteUser(email: string) {
    const row = this.page.locator(this.userRow).filter({ hasText: email });
    await row.locator(this.deleteUserButton).click();
    await this.waitForSelector(this.confirmDialog);
    await this.click(this.confirmDeleteButton);
    await this.wait(1000);
  }

  /**
   * View user details
   */
  async viewUserDetails(email: string) {
    const row = this.page.locator(this.userRow).filter({ hasText: email });
    await row.locator(this.viewUserButton).click();
    await this.waitForSelector(this.userDetailsModal);
  }

  /**
   * Get user details from modal
   */
  async getUserDetailsFromModal(): Promise<{
    name: string;
    email: string;
    role: string;
    status: string;
    created: string;
    lastLogin: string;
  }> {
    return {
      name: await this.getText(this.userDetailName),
      email: await this.getText(this.userDetailEmail),
      role: await this.getText(this.userDetailRole),
      status: await this.getText(this.userDetailStatus),
      created: await this.getText(this.userDetailCreated),
      lastLogin: await this.getText(this.userDetailLastLogin),
    };
  }

  /**
   * Close user details modal
   */
  async closeDetailsModal() {
    await this.click(this.closeModalButton);
    await this.waitForSelectorHidden(this.userDetailsModal);
  }

  /**
   * Deactivate user
   */
  async deactivateUser(email: string) {
    const row = this.page.locator(this.userRow).filter({ hasText: email });
    await row.locator(this.deactivateUserButton).click();
    await this.waitForSelector(this.confirmDialog);
    await this.click(this.confirmButton);
    await this.wait(1000);
  }

  /**
   * Activate user
   */
  async activateUser(email: string) {
    const row = this.page.locator(this.userRow).filter({ hasText: email });
    await row.locator(this.activateUserButton).click();
    await this.wait(1000);
  }

  /**
   * Reset user password
   */
  async resetPassword(email: string) {
    const row = this.page.locator(this.userRow).filter({ hasText: email });
    await row.locator(this.resetPasswordButton).click();
    await this.waitForSelector(this.confirmDialog);
    await this.click(this.confirmButton);
    await this.wait(1000);
  }

  /**
   * Select multiple users
   */
  async selectUsers(count: number) {
    const checkboxes = await this.page.locator(this.userCheckbox).all();
    for (let i = 0; i < Math.min(count, checkboxes.length); i++) {
      await checkboxes[i].click();
      await this.wait(200);
    }
  }

  /**
   * Select all users
   */
  async selectAllUsers() {
    await this.click(this.selectAllCheckbox);
    await this.wait(500);
  }

  /**
   * Bulk delete selected users
   */
  async bulkDeleteUsers() {
    await this.click(this.bulkDeleteButton);
    await this.waitForSelector(this.confirmDialog);
    await this.click(this.confirmDeleteButton);
    await this.wait(1000);
  }

  /**
   * Bulk activate users
   */
  async bulkActivateUsers() {
    await this.click(this.bulkActivateButton);
    await this.wait(1000);
  }

  /**
   * Bulk deactivate users
   */
  async bulkDeactivateUsers() {
    await this.click(this.bulkDeactivateButton);
    await this.waitForSelector(this.confirmDialog);
    await this.click(this.confirmButton);
    await this.wait(1000);
  }

  /**
   * Export users
   */
  async exportUsers() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.click(this.exportUsersButton);
    return await downloadPromise;
  }

  /**
   * Sort users by column
   */
  async sortBy(column: 'name' | 'email' | 'role' | 'created') {
    const sortMap = {
      name: this.sortByName,
      email: this.sortByEmail,
      role: this.sortByRole,
      created: this.sortByCreated,
    };

    await this.click(sortMap[column]);
    await this.wait(1000);
  }

  /**
   * Navigate to next page
   */
  async goToNextPage() {
    await this.click(this.nextPageButton);
    await this.wait(1000);
  }

  /**
   * Navigate to previous page
   */
  async goToPreviousPage() {
    await this.click(this.prevPageButton);
    await this.wait(1000);
  }

  /**
   * Get page info
   */
  async getPageInfo(): Promise<string> {
    return await this.getText(this.pageInfo);
  }

  /**
   * View user enrollments
   */
  async viewEnrollments(email: string) {
    await this.viewUserDetails(email);
    await this.click(this.enrollmentHistoryTab);
    await this.wait(500);
  }

  /**
   * Get user enrollments
   */
  async getUserEnrollments(): Promise<
    Array<{
      course: string;
      date: string;
      status: string;
    }>
  > {
    const items = await this.page.locator(this.enrollmentItem).all();
    const enrollments = [];

    for (const item of items) {
      enrollments.push({
        course: (await item.locator(this.enrollmentCourse).textContent()) || '',
        date: (await item.locator(this.enrollmentDate).textContent()) || '',
        status: (await item.locator(this.enrollmentStatus).textContent()) || '',
      });
    }

    return enrollments;
  }

  /**
   * View user activity log
   */
  async viewActivityLog(email: string) {
    await this.viewUserDetails(email);
    await this.click(this.activityLogTab);
    await this.wait(500);
  }

  /**
   * Get user activity
   */
  async getUserActivity(): Promise<
    Array<{
      type: string;
      timestamp: string;
    }>
  > {
    const items = await this.page.locator(this.activityItem).all();
    const activities = [];

    for (const item of items) {
      activities.push({
        type: (await item.locator(this.activityType).textContent()) || '',
        timestamp: (await item.locator(this.activityTimestamp).textContent()) || '',
      });
    }

    return activities;
  }

  /**
   * Check if user exists
   */
  async userExists(email: string): Promise<boolean> {
    return await this.isVisible(`${this.userRow}:has-text("${email}")`);
  }

  /**
   * Assert on user management page
   */
  async assertOnUserManagement() {
    await this.assertVisible(this.pageTitle);
    await this.assertUrl('/admin/users');
  }

  /**
   * Assert user in list
   */
  async assertUserInList(email: string) {
    await this.assertVisible(`${this.userRow}:has-text("${email}")`);
  }

  /**
   * Assert user not in list
   */
  async assertUserNotInList(email: string) {
    const exists = await this.userExists(email);
    if (exists) {
      throw new Error(`User ${email} should not be in list`);
    }
  }
}
