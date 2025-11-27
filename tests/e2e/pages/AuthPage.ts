/**
 * Authentication Page Object
 * Represents the authentication flows (login, signup, password reset)
 */

import { BasePage } from './BasePage';
import type { Page } from '@playwright/test';

export class AuthPage extends BasePage {
  // Page URL
  private readonly pageUrl = '/auth';

  // Tab selectors
  private readonly loginTab = 'button:has-text("Login")';
  private readonly signupTab = 'button:has-text("Sign Up")';
  private readonly forgotPasswordLink = 'a:has-text("Forgot Password")';

  // Login form
  private readonly loginEmailInput = 'input[name="email"][type="email"]';
  private readonly loginPasswordInput = 'input[name="password"][type="password"]';
  private readonly loginButton = 'button[type="submit"]:has-text("Login")';
  private readonly rememberMeCheckbox = 'input[name="rememberMe"]';

  // Signup form
  private readonly signupFirstNameInput = 'input[name="firstName"]';
  private readonly signupLastNameInput = 'input[name="lastName"]';
  private readonly signupEmailInput = 'input[name="email"]';
  private readonly signupPasswordInput = 'input[name="password"]';
  private readonly signupConfirmPasswordInput = 'input[name="confirmPassword"]';
  private readonly signupButton = 'button[type="submit"]:has-text("Sign Up")';
  private readonly agreeTermsCheckbox = 'input[name="agreeTerms"]';

  // Password reset form
  private readonly resetEmailInput = 'input[name="resetEmail"]';
  private readonly sendResetLinkButton = 'button:has-text("Send Reset Link")';
  private readonly backToLoginLink = 'a:has-text("Back to Login")';

  // Password reset confirmation page
  private readonly newPasswordInput = 'input[name="newPassword"]';
  private readonly confirmNewPasswordInput = 'input[name="confirmNewPassword"]';
  private readonly resetPasswordButton = 'button:has-text("Reset Password")';

  // Social login buttons
  private readonly googleLoginButton = 'button:has-text("Continue with Google")';
  private readonly githubLoginButton = 'button:has-text("Continue with GitHub")';
  private readonly facebookLoginButton = 'button:has-text("Continue with Facebook")';

  // Success/Error messages
  private readonly successMessage = '[role="alert"]:has-text("success")';
  private readonly errorMessage = '[role="alert"]:has-text("error")';
  private readonly validationError = '[data-testid="validation-error"]';

  // Email verification
  private readonly emailVerificationBanner = '[data-testid="email-verification-banner"]';
  private readonly resendVerificationButton = 'button:has-text("Resend Verification")';
  private readonly verificationSentMessage = 'text=Verification email sent';

  // Loading states
  private readonly loadingSpinner = '[data-testid="loading-spinner"]';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to auth page
   */
  async navigate() {
    await this.goto(this.pageUrl);
    await this.waitForPageLoad();
  }

  /**
   * Switch to login tab
   */
  async switchToLogin() {
    await this.click(this.loginTab);
    await this.wait(300);
  }

  /**
   * Switch to signup tab
   */
  async switchToSignup() {
    await this.click(this.signupTab);
    await this.wait(300);
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword() {
    await this.click(this.forgotPasswordLink);
    await this.wait(500);
  }

  /**
   * Login with credentials
   */
  async login(email: string, password: string, rememberMe: boolean = false) {
    await this.switchToLogin();
    await this.fill(this.loginEmailInput, email);
    await this.fill(this.loginPasswordInput, password);

    if (rememberMe) {
      await this.check(this.rememberMeCheckbox);
    }

    await this.click(this.loginButton);
  }

  /**
   * Signup with user details
   */
  async signup(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) {
    await this.switchToSignup();
    await this.fill(this.signupFirstNameInput, userData.firstName);
    await this.fill(this.signupLastNameInput, userData.lastName);
    await this.fill(this.signupEmailInput, userData.email);
    await this.fill(this.signupPasswordInput, userData.password);
    await this.fill(this.signupConfirmPasswordInput, userData.confirmPassword);
    await this.check(this.agreeTermsCheckbox);
    await this.click(this.signupButton);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string) {
    await this.clickForgotPassword();
    await this.fill(this.resetEmailInput, email);
    await this.click(this.sendResetLinkButton);
  }

  /**
   * Reset password with new password
   */
  async resetPassword(newPassword: string, confirmPassword: string) {
    await this.fill(this.newPasswordInput, newPassword);
    await this.fill(this.confirmNewPasswordInput, confirmPassword);
    await this.click(this.resetPasswordButton);
  }

  /**
   * Login with Google
   */
  async loginWithGoogle() {
    await this.click(this.googleLoginButton);
    // Note: This will trigger OAuth flow in new window
    // Tests may need special handling for OAuth popup
  }

  /**
   * Login with GitHub
   */
  async loginWithGitHub() {
    await this.click(this.githubLoginButton);
  }

  /**
   * Login with Facebook
   */
  async loginWithFacebook() {
    await this.click(this.facebookLoginButton);
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail() {
    await this.click(this.resendVerificationButton);
    await this.waitForSelector(this.verificationSentMessage);
  }

  /**
   * Wait for successful login/signup
   */
  async waitForSuccess() {
    try {
      await this.waitForSelector(this.successMessage, 10000);
    } catch {
      // Success might redirect immediately without showing message
      await this.page.waitForURL(/\/(dashboard|$)/, { timeout: 10000 });
    }
  }

  /**
   * Wait for error message
   */
  async waitForError() {
    await this.waitForSelector(this.errorMessage, 5000);
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    return await this.getText(this.errorMessage);
  }

  /**
   * Get validation error
   */
  async getValidationError(): Promise<string> {
    return await this.getText(this.validationError);
  }

  /**
   * Check if email verification banner is shown
   */
  async isEmailVerificationBannerShown(): Promise<boolean> {
    return await this.isVisible(this.emailVerificationBanner);
  }

  /**
   * Check if loading
   */
  async isLoading(): Promise<boolean> {
    return await this.isVisible(this.loadingSpinner);
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoadingComplete() {
    if (await this.isLoading()) {
      await this.waitForSelectorHidden(this.loadingSpinner, 15000);
    }
  }

  /**
   * Check if login button is enabled
   */
  async isLoginButtonEnabled(): Promise<boolean> {
    return await this.isEnabled(this.loginButton);
  }

  /**
   * Check if signup button is enabled
   */
  async isSignupButtonEnabled(): Promise<boolean> {
    return await this.isEnabled(this.signupButton);
  }

  /**
   * Back to login from password reset
   */
  async backToLogin() {
    await this.click(this.backToLoginLink);
    await this.wait(500);
  }

  /**
   * Assert on auth page
   */
  async assertOnAuthPage() {
    await this.assertUrl('/auth');
  }

  /**
   * Assert login tab is active
   */
  async assertLoginTabActive() {
    await this.assertVisible(this.loginEmailInput);
  }

  /**
   * Assert signup tab is active
   */
  async assertSignupTabActive() {
    await this.assertVisible(this.signupFirstNameInput);
  }

  /**
   * Assert error is shown
   */
  async assertErrorShown(errorText?: string) {
    await this.assertVisible(this.errorMessage);
    if (errorText) {
      await this.assertText(this.errorMessage, errorText);
    }
  }

  /**
   * Assert success is shown
   */
  async assertSuccessShown() {
    await this.assertVisible(this.successMessage);
  }

  /**
   * Complete full signup flow
   */
  async completeSignupFlow(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) {
    await this.navigate();
    await this.signup({
      ...userData,
      confirmPassword: userData.password,
    });
    await this.waitForSuccess();
  }

  /**
   * Complete full login flow
   */
  async completeLoginFlow(email: string, password: string) {
    await this.navigate();
    await this.login(email, password);
    await this.waitForSuccess();
  }

  /**
   * Complete full password reset flow
   */
  async completePasswordResetFlow(email: string) {
    await this.navigate();
    await this.requestPasswordReset(email);
    await this.waitForSuccess();
  }
}
