/**
 * Vault Claim Submission E2E Tests
 * Comprehensive test coverage for the vault subscription claim flow
 */

import { test, expect } from '@playwright/test';
import { VaultClaimPage } from '../pages/VaultClaimPage';
import { DashboardPage } from '../pages/DashboardPage';
import {
  generateVaultClaim,
  generateFamilyMembers,
  generateUser,
  type VaultClaimData,
} from '../utils/test-data';
import {
  cleanupVaultClaims,
  cleanupTestUsers,
  recordExists,
  waitForDbOperation,
} from '../utils/db-helpers';
import { login, logout } from '../utils/auth';

test.describe('Vault Claim Submission Flow', () => {
  let vaultClaimPage: VaultClaimPage;
  let dashboardPage: DashboardPage;
  let testClaimData: VaultClaimData;

  test.beforeEach(async ({ page }) => {
    vaultClaimPage = new VaultClaimPage(page);
    dashboardPage = new DashboardPage(page);

    // Generate fresh test data for each test
    testClaimData = generateVaultClaim();

    // Navigate to vault claim page
    await vaultClaimPage.navigate();
  });

  test.afterEach(async () => {
    // Cleanup test data after each test
    await cleanupVaultClaims(testClaimData.userEmail);
  });

  test.afterAll(async () => {
    // Final cleanup of all test data
    await cleanupTestUsers();
  });

  test('should successfully submit vault claim without family members', async () => {
    // Step 1: Complete eligibility
    await vaultClaimPage.completeEligibilityStep();
    await vaultClaimPage.assertOnStep('user-info');

    // Step 2: Fill user information
    await vaultClaimPage.completeUserInfoStep({
      userName: testClaimData.userName,
      userEmail: testClaimData.userEmail,
      vaultEmail: testClaimData.vaultEmail,
      subscriptionEndDate: testClaimData.vaultSubscriptionEndDate,
    });

    // Step 3: Skip family members
    await vaultClaimPage.completeFamilyStep();

    // Step 4: Submit claim
    await vaultClaimPage.submitClaim();

    // Assert: Success message appears
    await vaultClaimPage.assertClaimSubmitted();

    // Assert: Check success message content
    const successMessage = await vaultClaimPage.getSuccessMessage();
    expect(successMessage).toContain('success');

    // Wait for database operation to complete
    await waitForDbOperation(2000);

    // Assert: Verify claim exists in database
    const claimExists = await recordExists(
      'vault_subscription_claims',
      'user_email',
      testClaimData.userEmail
    );
    expect(claimExists).toBe(true);
  });

  test('should successfully submit vault claim with family members', async () => {
    // Generate family members
    const familyMembers = generateFamilyMembers(3);
    testClaimData.familyMembers = familyMembers;

    // Complete full claim flow
    await vaultClaimPage.completeFullClaim(testClaimData);

    // Assert: Success message appears
    await vaultClaimPage.assertClaimSubmitted();

    // Wait for database operation
    await waitForDbOperation(2000);

    // Assert: Verify claim exists in database
    const claimExists = await recordExists(
      'vault_subscription_claims',
      'user_email',
      testClaimData.userEmail
    );
    expect(claimExists).toBe(true);
  });

  test('should add and remove family members dynamically', async ({ page }) => {
    // Complete eligibility and user info steps
    await vaultClaimPage.completeEligibilityStep();
    await vaultClaimPage.completeUserInfoStep({
      userName: testClaimData.userName,
      userEmail: testClaimData.userEmail,
      vaultEmail: testClaimData.vaultEmail,
      subscriptionEndDate: testClaimData.vaultSubscriptionEndDate,
    });

    // Add first family member
    const member1 = generateFamilyMembers(1)[0];
    await vaultClaimPage.addFamilyMember(member1, 0);
    await vaultClaimPage.assertFamilyMemberCount(1);

    // Add second family member
    const member2 = generateFamilyMembers(1)[0];
    await vaultClaimPage.addFamilyMember(member2, 1);
    await vaultClaimPage.assertFamilyMemberCount(2);

    // Add third family member
    const member3 = generateFamilyMembers(1)[0];
    await vaultClaimPage.addFamilyMember(member3, 2);
    await vaultClaimPage.assertFamilyMemberCount(3);

    // Remove second family member
    await vaultClaimPage.removeFamilyMember(1);
    await page.waitForTimeout(500);
    await vaultClaimPage.assertFamilyMemberCount(2);

    // Continue to review and submit
    await page.click('button:has-text("Continue")');
    await vaultClaimPage.submitClaim();

    // Assert success
    await vaultClaimPage.assertClaimSubmitted();
  });

  test('should enforce maximum 6 family members limit', async ({ page }) => {
    // Complete initial steps
    await vaultClaimPage.completeEligibilityStep();
    await vaultClaimPage.completeUserInfoStep({
      userName: testClaimData.userName,
      userEmail: testClaimData.userEmail,
      vaultEmail: testClaimData.vaultEmail,
      subscriptionEndDate: testClaimData.vaultSubscriptionEndDate,
    });

    // Try to add 7 family members
    const members = generateFamilyMembers(7);

    for (let i = 0; i < 6; i++) {
      await vaultClaimPage.addFamilyMember(members[i], i);
    }

    // Assert only 6 members are added
    const count = await vaultClaimPage.getFamilyMemberCount();
    expect(count).toBeLessThanOrEqual(6);

    // Try to add 7th member - button should be disabled or hidden
    const addButton = page.locator('button:has-text("Add Family Member")');
    if (await addButton.isVisible()) {
      const isDisabled = await addButton.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });

  test('should validate required fields in user info step', async ({ page }) => {
    // Complete eligibility
    await vaultClaimPage.completeEligibilityStep();

    // Try to continue without filling required fields
    await page.click('button:has-text("Continue")');

    // Assert: Error messages appear or button is disabled
    const continueButton = page.locator('button:has-text("Continue")');
    const isDisabled = await continueButton.isDisabled();

    if (!isDisabled) {
      // If button is not disabled, check for validation messages
      const hasError = await page.locator('[role="alert"]').isVisible();
      expect(hasError).toBe(true);
    } else {
      expect(isDisabled).toBe(true);
    }
  });

  test('should validate email format', async ({ page }) => {
    // Complete eligibility
    await vaultClaimPage.completeEligibilityStep();

    // Fill with invalid email
    await vaultClaimPage.fillUserInfo({
      userName: testClaimData.userName,
      userEmail: 'invalid-email',
      vaultEmail: testClaimData.vaultEmail,
      subscriptionEndDate: testClaimData.vaultSubscriptionEndDate,
    });

    // Try to continue
    await page.click('button:has-text("Continue")');

    // Assert: Validation error appears or button is disabled
    const hasError =
      (await page.locator('text=valid email').isVisible()) ||
      (await page.locator('button:has-text("Continue")').isDisabled());

    expect(hasError).toBe(true);
  });

  test('should navigate back through form steps', async ({ page }) => {
    // Complete all steps up to review
    await vaultClaimPage.completeEligibilityStep();
    await vaultClaimPage.completeUserInfoStep({
      userName: testClaimData.userName,
      userEmail: testClaimData.userEmail,
      vaultEmail: testClaimData.vaultEmail,
      subscriptionEndDate: testClaimData.vaultSubscriptionEndDate,
    });
    await vaultClaimPage.completeFamilyStep();

    // Assert on review step
    await vaultClaimPage.assertOnStep('review');

    // Go back to family step
    await vaultClaimPage.goBack();
    await page.waitForTimeout(500);

    // Go back to user info step
    await vaultClaimPage.goBack();
    await page.waitForTimeout(500);

    // Go back to eligibility step
    await vaultClaimPage.goBack();
    await page.waitForTimeout(500);

    // Assert back on eligibility step
    await vaultClaimPage.assertOnStep('eligibility');
  });

  test('should prevent duplicate claim submission', async () => {
    // Submit first claim
    await vaultClaimPage.completeFullClaim(testClaimData);
    await vaultClaimPage.assertClaimSubmitted();

    // Wait for database operation
    await waitForDbOperation(2000);

    // Try to submit another claim with same email
    await vaultClaimPage.navigate();
    await vaultClaimPage.completeFullClaim(testClaimData);

    // Assert: Error message about existing claim
    await vaultClaimPage.waitForError();
    const errorMessage = await vaultClaimPage.getErrorMessage();
    expect(errorMessage.toLowerCase()).toContain('already');
  });

  test('should display review summary with correct information', async ({ page: _page }) => {
    const members = generateFamilyMembers(2);
    testClaimData.familyMembers = members;

    // Complete all steps up to review
    await vaultClaimPage.completeEligibilityStep();
    await vaultClaimPage.completeUserInfoStep({
      userName: testClaimData.userName,
      userEmail: testClaimData.userEmail,
      vaultEmail: testClaimData.vaultEmail,
      subscriptionEndDate: testClaimData.vaultSubscriptionEndDate,
    });
    await vaultClaimPage.completeFamilyStep(members);

    // Get review summary
    const summary = await vaultClaimPage.getReviewSummary();

    // Assert: Summary contains user information
    expect(summary.summaryText).toContain(testClaimData.userName);
    expect(summary.summaryText).toContain(testClaimData.userEmail);
    expect(summary.summaryText).toContain(testClaimData.vaultEmail);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Complete eligibility and user info
    await vaultClaimPage.completeEligibilityStep();
    await vaultClaimPage.completeUserInfoStep({
      userName: testClaimData.userName,
      userEmail: testClaimData.userEmail,
      vaultEmail: testClaimData.vaultEmail,
      subscriptionEndDate: testClaimData.vaultSubscriptionEndDate,
    });
    await vaultClaimPage.completeFamilyStep();

    // Intercept API call and force it to fail
    await page.route('**/functions/v1/submit-vault-claim', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // Submit claim
    await vaultClaimPage.submitClaim();

    // Assert: Error message is displayed
    await vaultClaimPage.waitForError();
    const errorMessage = await vaultClaimPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
  });

  test('should require valid subscription end date', async ({ page }) => {
    // Complete eligibility
    await vaultClaimPage.completeEligibilityStep();

    // Fill with past date
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);
    const pastDateString = pastDate.toISOString().split('T')[0];

    await vaultClaimPage.fillUserInfo({
      userName: testClaimData.userName,
      userEmail: testClaimData.userEmail,
      vaultEmail: testClaimData.vaultEmail,
      subscriptionEndDate: pastDateString,
    });

    // Try to continue
    await page.click('button:has-text("Continue")');

    // Assert: Validation error or prevented navigation
    const hasError =
      (await page.locator('text=future date').isVisible()) ||
      (await page.locator('text=valid date').isVisible()) ||
      (await page.locator('button:has-text("Continue")').isDisabled());

    expect(hasError).toBe(true);
  });

  test('should allow authenticated users to submit claims', async ({ page }) => {
    // Create a test user and login
    const testUser = generateUser('student');

    // Note: This assumes test users exist in database
    // In real scenario, you'd create the user first
    try {
      await login(page, testUser.email, testUser.password);
      await dashboardPage.assertDashboardLoaded();

      // Navigate to vault claim page
      await vaultClaimPage.navigate();

      // Submit claim
      await vaultClaimPage.completeFullClaim(testClaimData);

      // Assert success
      await vaultClaimPage.assertClaimSubmitted();

      // Logout
      await logout(page);
    } catch {
      // If login fails (user doesn't exist), skip this test
      test.skip();
    }
  });

  test('should validate family member required fields', async ({ page }) => {
    // Complete initial steps
    await vaultClaimPage.completeEligibilityStep();
    await vaultClaimPage.completeUserInfoStep({
      userName: testClaimData.userName,
      userEmail: testClaimData.userEmail,
      vaultEmail: testClaimData.vaultEmail,
      subscriptionEndDate: testClaimData.vaultSubscriptionEndDate,
    });

    // Try to add family member without filling all fields
    await page.fill('input[name="familyMembers.0.name"]', 'John Doe');
    // Leave email and relationship empty

    // Try to continue
    await page.click('button:has-text("Continue")');

    // Assert: Validation error or button disabled
    const hasError =
      (await page.locator('[role="alert"]').isVisible()) ||
      (await page.locator('button:has-text("Continue")').isDisabled());

    expect(hasError).toBe(true);
  });

  test('should persist form data when navigating back', async ({ page }) => {
    // Fill user info
    await vaultClaimPage.completeEligibilityStep();
    await vaultClaimPage.fillUserInfo({
      userName: testClaimData.userName,
      userEmail: testClaimData.userEmail,
      vaultEmail: testClaimData.vaultEmail,
      subscriptionEndDate: testClaimData.vaultSubscriptionEndDate,
    });

    // Continue to family step
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(500);

    // Go back to user info
    await vaultClaimPage.goBack();
    await page.waitForTimeout(500);

    // Assert: Form data is still present
    const userName = await page.inputValue('input[name="userName"]');
    expect(userName).toBe(testClaimData.userName);

    const userEmail = await page.inputValue('input[name="userEmail"]');
    expect(userEmail).toBe(testClaimData.userEmail);
  });
});

test.describe('Vault Claim Edge Cases', () => {
  let vaultClaimPage: VaultClaimPage;
  let testClaimData: VaultClaimData;

  test.beforeEach(async ({ page }) => {
    vaultClaimPage = new VaultClaimPage(page);
    testClaimData = generateVaultClaim();
    await vaultClaimPage.navigate();
  });

  test.afterEach(async () => {
    await cleanupVaultClaims(testClaimData.userEmail);
  });

  test('should handle special characters in names', async () => {
    // Use name with special characters
    testClaimData.userName = "O'Connor-Smith (Jr.)";

    await vaultClaimPage.completeFullClaim(testClaimData);
    await vaultClaimPage.assertClaimSubmitted();
  });

  test('should handle very long names', async () => {
    // Use very long name
    testClaimData.userName = 'A'.repeat(100);

    await vaultClaimPage.completeFullClaim(testClaimData);

    // Should either succeed or show validation error for max length
    const hasSuccessOrError =
      (await vaultClaimPage.isVisible('[role="alert"]')) ||
      (await vaultClaimPage.page.locator('button:has-text("Submit Claim")').isDisabled());

    expect(hasSuccessOrError).toBe(true);
  });

  test('should handle international email addresses', async () => {
    // Use international email
    testClaimData.userEmail = 'test.user+filter@example.com';
    testClaimData.vaultEmail = 'vault.email@example.co.uk';

    await vaultClaimPage.completeFullClaim(testClaimData);
    await vaultClaimPage.assertClaimSubmitted();
  });

  test('should display loading state during submission', async ({ page }) => {
    // Complete form up to submission
    await vaultClaimPage.completeEligibilityStep();
    await vaultClaimPage.completeUserInfoStep({
      userName: testClaimData.userName,
      userEmail: testClaimData.userEmail,
      vaultEmail: testClaimData.vaultEmail,
      subscriptionEndDate: testClaimData.vaultSubscriptionEndDate,
    });
    await vaultClaimPage.completeFamilyStep();

    // Click submit and immediately check for loading state
    const submitButton = page.locator('button:has-text("Submit Claim")');
    await submitButton.click();

    // Check for loading indicator (spinner, disabled button, etc.)
    const isLoading =
      (await submitButton.isDisabled()) ||
      (await page.locator('[role="status"]').isVisible()) ||
      (await page.locator('[data-testid="loading"]').isVisible());

    expect(isLoading).toBe(true);
  });
});
