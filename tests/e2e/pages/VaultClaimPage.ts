/**
 * Vault Claim Page Object
 * Represents the multi-step vault subscription claim form
 */

import { BasePage } from './BasePage';
import type { Page } from '@playwright/test';
import type { VaultClaimData, FamilyMember } from '../utils/test-data';

export class VaultClaimPage extends BasePage {
  // Page URL
  private readonly pageUrl = '/claim-free-pass';

  // Step indicators
  private readonly eligibilityStep = '[data-step="eligibility"]';
  private readonly userInfoStep = '[data-step="user-info"]';
  private readonly familyStep = '[data-step="family"]';
  private readonly reviewStep = '[data-step="review"]';

  // Eligibility form selectors
  private readonly vaultSubscriptionCheckbox = 'input[name="hasVaultSubscription"]';
  private readonly eligibilityNextButton = 'button:has-text("Continue")';

  // User info form selectors
  private readonly userNameInput = 'input[name="userName"]';
  private readonly userEmailInput = 'input[name="userEmail"]';
  private readonly vaultEmailInput = 'input[name="vaultEmail"]';
  private readonly subscriptionEndDateInput = 'input[name="vaultSubscriptionEndDate"]';
  private readonly userInfoNextButton = 'button:has-text("Continue")';
  private readonly userInfoBackButton = 'button:has-text("Back")';

  // Family members form selectors
  private readonly addFamilyMemberButton = 'button:has-text("Add Family Member")';
  private readonly familyMemberCard = '[data-testid="family-member-card"]';
  private readonly removeFamilyMemberButton = 'button[aria-label*="Remove"]';
  private readonly familyNextButton = 'button:has-text("Continue")';
  private readonly familySkipButton = 'button:has-text("Skip")';
  private readonly familyBackButton = 'button:has-text("Back")';

  // Review form selectors
  private readonly reviewSubmitButton = 'button:has-text("Submit Claim")';
  private readonly reviewBackButton = 'button:has-text("Back")';
  private readonly reviewSummary = '[data-testid="review-summary"]';

  // Success/Error message selectors
  private readonly successMessage = '[role="alert"]:has-text("success")';
  private readonly errorMessage = '[role="alert"]:has-text("error")';
  private readonly confirmationMessage = '[data-testid="confirmation-message"]';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to vault claim page
   */
  async navigate() {
    await this.goto(this.pageUrl);
    await this.waitForPageLoad();
  }

  /**
   * Complete eligibility step
   */
  async completeEligibilityStep() {
    await this.waitForSelector(this.vaultSubscriptionCheckbox);
    await this.check(this.vaultSubscriptionCheckbox);
    await this.click(this.eligibilityNextButton);
    await this.waitForSelector(this.userNameInput);
  }

  /**
   * Fill user information
   */
  async fillUserInfo(data: {
    userName: string;
    userEmail: string;
    vaultEmail: string;
    subscriptionEndDate: string;
  }) {
    await this.waitForSelector(this.userNameInput);

    await this.fill(this.userNameInput, data.userName);
    await this.fill(this.userEmailInput, data.userEmail);
    await this.fill(this.vaultEmailInput, data.vaultEmail);
    await this.fill(this.subscriptionEndDateInput, data.subscriptionEndDate);
  }

  /**
   * Complete user info step
   */
  async completeUserInfoStep(data: {
    userName: string;
    userEmail: string;
    vaultEmail: string;
    subscriptionEndDate: string;
  }) {
    await this.fillUserInfo(data);
    await this.click(this.userInfoNextButton);
    await this.wait(500); // Wait for step transition
  }

  /**
   * Add a family member
   */
  async addFamilyMember(member: FamilyMember, index: number = 0) {
    // Click add button if it's not the first member
    if (index > 0) {
      await this.click(this.addFamilyMemberButton);
      await this.wait(300);
    }

    // Fill family member details
    const nameInput = `input[name="familyMembers.${index}.name"]`;
    const emailInput = `input[name="familyMembers.${index}.email"]`;
    const relationshipInput = `input[name="familyMembers.${index}.relationship"]`;

    await this.fill(nameInput, member.name);
    await this.fill(emailInput, member.email);
    await this.fill(relationshipInput, member.relationship);
  }

  /**
   * Remove a family member
   */
  async removeFamilyMember(index: number) {
    const cards = await this.page.locator(this.familyMemberCard).all();
    if (cards[index]) {
      const removeButton = cards[index].locator(this.removeFamilyMemberButton);
      await removeButton.click();
    }
  }

  /**
   * Complete family members step
   */
  async completeFamilyStep(members?: FamilyMember[]) {
    if (!members || members.length === 0) {
      await this.click(this.familySkipButton);
    } else {
      for (let i = 0; i < members.length; i++) {
        await this.addFamilyMember(members[i], i);
      }
      await this.click(this.familyNextButton);
    }
    await this.wait(500); // Wait for step transition
  }

  /**
   * Get review summary data
   */
  async getReviewSummary(): Promise<Record<string, string>> {
    await this.waitForSelector(this.reviewSummary);

    const summary: Record<string, string> = {};

    // Extract review data (adjust selectors based on actual implementation)
    const summaryText = await this.getText(this.reviewSummary);
    return { summaryText };
  }

  /**
   * Submit the claim
   */
  async submitClaim() {
    await this.waitForSelector(this.reviewSubmitButton);
    await this.click(this.reviewSubmitButton);
  }

  /**
   * Complete entire vault claim flow
   */
  async completeFullClaim(data: VaultClaimData) {
    // Step 1: Eligibility
    await this.completeEligibilityStep();

    // Step 2: User Info
    await this.completeUserInfoStep({
      userName: data.userName,
      userEmail: data.userEmail,
      vaultEmail: data.vaultEmail,
      subscriptionEndDate: data.vaultSubscriptionEndDate,
    });

    // Step 3: Family Members
    await this.completeFamilyStep(data.familyMembers);

    // Step 4: Review and Submit
    await this.submitClaim();
  }

  /**
   * Wait for success message
   */
  async waitForSuccess(timeout: number = 10000) {
    await this.waitForSelector(this.successMessage, timeout);
  }

  /**
   * Wait for error message
   */
  async waitForError(timeout: number = 10000) {
    await this.waitForSelector(this.errorMessage, timeout);
  }

  /**
   * Get success message text
   */
  async getSuccessMessage(): Promise<string> {
    return await this.getText(this.successMessage);
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    return await this.getText(this.errorMessage);
  }

  /**
   * Assert on current step
   */
  async assertOnStep(step: 'eligibility' | 'user-info' | 'family' | 'review') {
    const stepMap = {
      eligibility: this.eligibilityStep,
      'user-info': this.userInfoStep,
      family: this.familyStep,
      review: this.reviewStep,
    };

    await this.assertVisible(stepMap[step]);
  }

  /**
   * Assert family member count
   */
  async assertFamilyMemberCount(expectedCount: number) {
    await this.assertCount(this.familyMemberCard, expectedCount);
  }

  /**
   * Navigate back in form
   */
  async goBack() {
    // Try to find and click any back button visible on current step
    const backButtons = [this.reviewBackButton, this.familyBackButton, this.userInfoBackButton];

    for (const button of backButtons) {
      try {
        if (await this.isVisible(button)) {
          await this.click(button);
          await this.wait(500);
          return;
        }
      } catch {
        // Continue to next button
      }
    }

    throw new Error('No back button found on current step');
  }

  /**
   * Assert claim submission success
   */
  async assertClaimSubmitted() {
    await this.waitForSuccess();
    await this.assertVisible(this.successMessage);
  }

  /**
   * Assert claim submission failed
   */
  async assertClaimFailed() {
    await this.waitForError();
    await this.assertVisible(this.errorMessage);
  }

  /**
   * Get family member count on form
   */
  async getFamilyMemberCount(): Promise<number> {
    return await this.count(this.familyMemberCard);
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitButtonDisabled(): Promise<boolean> {
    try {
      return !(await this.isEnabled(this.reviewSubmitButton));
    } catch {
      return true;
    }
  }
}
