/**
 * Payment Page Object
 * Represents the payment processing flow
 */

import { BasePage } from './BasePage';
import type { Page } from '@playwright/test';

export class PaymentPage extends BasePage {
  // Page URL
  private readonly pageUrl = '/payment';

  // Payment form selectors
  private readonly paymentForm = '[data-testid="payment-form"]';
  private readonly pageTitle = 'h1:has-text("Payment")';

  // Order summary
  private readonly orderSummary = '[data-testid="order-summary"]';
  private readonly courseTitle = '[data-testid="payment-course-title"]';
  private readonly subtotal = '[data-testid="subtotal"]';
  private readonly tax = '[data-testid="tax"]';
  private readonly total = '[data-testid="total"]';

  // Payment method selection
  private readonly creditCardOption = 'input[value="credit_card"]';
  private readonly paypalOption = 'input[value="paypal"]';
  private readonly stripeOption = 'input[value="stripe"]';

  // Credit card form fields
  private readonly cardNumberInput = 'input[name="cardNumber"]';
  private readonly cardExpiryInput = 'input[name="cardExpiry"]';
  private readonly cardCvcInput = 'input[name="cardCvc"]';
  private readonly cardNameInput = 'input[name="cardName"]';

  // Billing information
  private readonly billingNameInput = 'input[name="billingName"]';
  private readonly billingEmailInput = 'input[name="billingEmail"]';
  private readonly billingAddressInput = 'input[name="billingAddress"]';
  private readonly billingCityInput = 'input[name="billingCity"]';
  private readonly billingStateInput = 'input[name="billingState"]';
  private readonly billingZipInput = 'input[name="billingZip"]';
  private readonly billingCountrySelect = 'select[name="billingCountry"]';

  // Terms and conditions
  private readonly termsCheckbox = 'input[name="acceptTerms"]';
  private readonly termsLink = 'a:has-text("Terms and Conditions")';

  // Payment buttons
  private readonly submitPaymentButton = 'button:has-text("Pay Now")';
  private readonly cancelButton = 'button:has-text("Cancel")';
  private readonly backButton = 'button:has-text("Back")';

  // Payment processing
  private readonly processingOverlay = '[data-testid="payment-processing"]';
  private readonly processingMessage = 'text=Processing payment';

  // Success/Error states
  private readonly successMessage = '[role="alert"]:has-text("success")';
  private readonly errorMessage = '[role="alert"]:has-text("error")';
  private readonly paymentSuccessPage = '[data-testid="payment-success"]';

  // Stripe iframe (if using Stripe Elements)
  private readonly stripeCardElement = 'iframe[name*="card"]';

  // Test card numbers
  private readonly testCards = {
    visa: '4242424242424242',
    mastercard: '5555555555554444',
    amex: '378282246310005',
    discover: '6011111111111117',
    declined: '4000000000000002',
    insufficientFunds: '4000000000009995',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to payment page
   */
  async navigate() {
    await this.goto(this.pageUrl);
    await this.waitForPageLoad();
  }

  /**
   * Wait for payment form to load
   */
  async waitForPaymentForm() {
    await this.waitForSelector(this.paymentForm, 10000);
  }

  /**
   * Get order total
   */
  async getOrderTotal(): Promise<string> {
    return await this.getText(this.total);
  }

  /**
   * Get course title from payment page
   */
  async getCourseTitle(): Promise<string> {
    return await this.getText(this.courseTitle);
  }

  /**
   * Select credit card payment method
   */
  async selectCreditCard() {
    await this.click(this.creditCardOption);
    await this.wait(500);
  }

  /**
   * Select PayPal payment method
   */
  async selectPayPal() {
    await this.click(this.paypalOption);
    await this.wait(500);
  }

  /**
   * Select Stripe payment method
   */
  async selectStripe() {
    await this.click(this.stripeOption);
    await this.wait(500);
  }

  /**
   * Fill credit card information
   */
  async fillCreditCardInfo(cardNumber: string, expiry: string, cvc: string, name: string) {
    await this.fill(this.cardNumberInput, cardNumber);
    await this.fill(this.cardExpiryInput, expiry);
    await this.fill(this.cardCvcInput, cvc);
    await this.fill(this.cardNameInput, name);
  }

  /**
   * Fill billing information
   */
  async fillBillingInfo(billing: {
    name: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  }) {
    await this.fill(this.billingNameInput, billing.name);
    await this.fill(this.billingEmailInput, billing.email);
    await this.fill(this.billingAddressInput, billing.address);
    await this.fill(this.billingCityInput, billing.city);
    await this.fill(this.billingStateInput, billing.state);
    await this.fill(this.billingZipInput, billing.zip);
    await this.selectOption(this.billingCountrySelect, billing.country);
  }

  /**
   * Accept terms and conditions
   */
  async acceptTerms() {
    await this.check(this.termsCheckbox);
  }

  /**
   * Submit payment
   */
  async submitPayment() {
    await this.click(this.submitPaymentButton);
  }

  /**
   * Cancel payment
   */
  async cancelPayment() {
    await this.click(this.cancelButton);
  }

  /**
   * Go back from payment page
   */
  async goBack() {
    await this.click(this.backButton);
    await this.waitForNavigation();
  }

  /**
   * Wait for payment processing
   */
  async waitForProcessing() {
    try {
      await this.waitForSelector(this.processingOverlay, 3000);
      await this.waitForSelectorHidden(this.processingOverlay, 30000);
    } catch {
      // Processing overlay might not appear for fast payments
    }
  }

  /**
   * Wait for payment success
   */
  async waitForPaymentSuccess() {
    await this.waitForSelector(this.paymentSuccessPage, 30000);
  }

  /**
   * Wait for payment error
   */
  async waitForPaymentError() {
    await this.waitForSelector(this.errorMessage, 10000);
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    return await this.getText(this.errorMessage);
  }

  /**
   * Complete full payment with test card
   */
  async completePaymentWithTestCard(
    cardType: keyof typeof this.testCards = 'visa',
    billingInfo?: {
      name: string;
      email: string;
      address: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    }
  ) {
    await this.waitForPaymentForm();
    await this.selectCreditCard();

    // Fill card info
    await this.fillCreditCardInfo(this.testCards[cardType], '12/25', '123', 'Test User');

    // Fill billing info if provided
    if (billingInfo) {
      await this.fillBillingInfo(billingInfo);
    } else {
      // Use default test billing info
      await this.fillBillingInfo({
        name: 'Test User',
        email: 'test@example.com',
        address: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zip: '12345',
        country: 'US',
      });
    }

    // Accept terms and submit
    await this.acceptTerms();
    await this.submitPayment();

    // Wait for processing
    await this.waitForProcessing();
  }

  /**
   * Complete payment with successful card
   */
  async completeSuccessfulPayment() {
    await this.completePaymentWithTestCard('visa');
    await this.waitForPaymentSuccess();
  }

  /**
   * Attempt payment with declined card
   */
  async attemptPaymentWithDeclinedCard() {
    await this.completePaymentWithTestCard('declined');
    await this.waitForPaymentError();
  }

  /**
   * Attempt payment with insufficient funds card
   */
  async attemptPaymentWithInsufficientFunds() {
    await this.completePaymentWithTestCard('insufficientFunds');
    await this.waitForPaymentError();
  }

  /**
   * Check if payment form is valid
   */
  async isPaymentFormValid(): Promise<boolean> {
    const submitButton = this.page.locator(this.submitPaymentButton);
    return await submitButton.isEnabled();
  }

  /**
   * Check if processing
   */
  async isProcessing(): Promise<boolean> {
    return await this.isVisible(this.processingOverlay);
  }

  /**
   * Check if on payment success page
   */
  async isOnSuccessPage(): Promise<boolean> {
    return await this.isVisible(this.paymentSuccessPage);
  }

  /**
   * Assert payment page loaded
   */
  async assertPageLoaded() {
    await this.assertVisible(this.pageTitle);
    await this.assertVisible(this.paymentForm);
  }

  /**
   * Assert payment successful
   */
  async assertPaymentSuccessful() {
    await this.assertVisible(this.paymentSuccessPage);
  }

  /**
   * Assert payment failed
   */
  async assertPaymentFailed() {
    await this.assertVisible(this.errorMessage);
  }

  /**
   * Assert order total matches
   */
  async assertOrderTotal(expectedTotal: string) {
    await this.assertText(this.total, expectedTotal);
  }

  /**
   * Get subtotal amount
   */
  async getSubtotal(): Promise<string> {
    return await this.getText(this.subtotal);
  }

  /**
   * Get tax amount
   */
  async getTax(): Promise<string> {
    return await this.getText(this.tax);
  }

  /**
   * Fill Stripe card element (if using Stripe Elements)
   */
  async fillStripeCardElement(cardNumber: string, expiry: string, cvc: string) {
    // Switch to Stripe iframe
    const stripeFrame = this.page.frameLocator(this.stripeCardElement);

    // Fill card details in iframe
    await stripeFrame.locator('input[name="cardnumber"]').fill(cardNumber);
    await stripeFrame.locator('input[name="exp-date"]').fill(expiry);
    await stripeFrame.locator('input[name="cvc"]').fill(cvc);
  }
}
