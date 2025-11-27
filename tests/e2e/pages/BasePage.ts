/**
 * Base Page Object
 * Provides common functionality for all page objects
 */

import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class BasePage {
  protected readonly page: Page;
  protected readonly baseUrl: string;

  constructor(page: Page) {
    this.page = page;
    this.baseUrl = process.env.VITE_APP_URL || 'http://localhost:8080';
  }

  /**
   * Navigate to a specific path
   */
  async goto(path: string = '') {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    await this.page.goto(url);
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(timeout: number = 30000) {
    await this.page.waitForLoadState('domcontentloaded', { timeout });
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(timeout: number = 10000) {
    await this.page.waitForURL('**/*', { timeout });
  }

  /**
   * Click an element by selector
   */
  async click(selector: string, options?: { timeout?: number; force?: boolean }) {
    await this.page.click(selector, options);
  }

  /**
   * Fill an input field
   */
  async fill(selector: string, value: string, options?: { timeout?: number }) {
    await this.page.fill(selector, value, options);
  }

  /**
   * Type into an input field (with delay between keystrokes)
   */
  async type(selector: string, value: string, delay: number = 50) {
    await this.page.type(selector, value, { delay });
  }

  /**
   * Select an option from a dropdown
   */
  async selectOption(selector: string, value: string | { label: string } | { value: string }) {
    await this.page.selectOption(selector, value);
  }

  /**
   * Check a checkbox
   */
  async check(selector: string) {
    await this.page.check(selector);
  }

  /**
   * Uncheck a checkbox
   */
  async uncheck(selector: string) {
    await this.page.uncheck(selector);
  }

  /**
   * Get text content of an element
   */
  async getText(selector: string): Promise<string> {
    const element = await this.page.locator(selector);
    return (await element.textContent()) || '';
  }

  /**
   * Get all text contents of elements matching selector
   */
  async getAllTexts(selector: string): Promise<string[]> {
    const elements = await this.page.locator(selector).all();
    return Promise.all(elements.map(async el => (await el.textContent()) || ''));
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    try {
      return await this.page.locator(selector).isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Check if element is enabled
   */
  async isEnabled(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isEnabled();
  }

  /**
   * Wait for selector to be visible
   */
  async waitForSelector(selector: string, timeout: number = 10000) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * Wait for selector to be hidden
   */
  async waitForSelectorHidden(selector: string, timeout: number = 10000) {
    await this.page.waitForSelector(selector, { state: 'hidden', timeout });
  }

  /**
   * Wait for text to be visible
   */
  async waitForText(text: string, timeout: number = 10000) {
    await this.page.waitForSelector(`text=${text}`, { timeout });
  }

  /**
   * Scroll to element
   */
  async scrollToElement(selector: string) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Take a screenshot
   */
  async screenshot(path?: string) {
    return await this.page.screenshot({ path, fullPage: true });
  }

  /**
   * Get locator for element
   */
  getLocator(selector: string): Locator {
    return this.page.locator(selector);
  }

  /**
   * Wait for API response
   */
  async waitForResponse(urlPattern: string | RegExp, timeout: number = 10000) {
    return await this.page.waitForResponse(urlPattern, { timeout });
  }

  /**
   * Wait for API request
   */
  async waitForRequest(urlPattern: string | RegExp, timeout: number = 10000) {
    return await this.page.waitForRequest(urlPattern, { timeout });
  }

  /**
   * Reload page
   */
  async reload() {
    await this.page.reload();
  }

  /**
   * Go back in browser history
   */
  async goBack() {
    await this.page.goBack();
  }

  /**
   * Go forward in browser history
   */
  async goForward() {
    await this.page.goForward();
  }

  /**
   * Press a key
   */
  async pressKey(key: string) {
    await this.page.keyboard.press(key);
  }

  /**
   * Hover over element
   */
  async hover(selector: string) {
    await this.page.hover(selector);
  }

  /**
   * Double click element
   */
  async doubleClick(selector: string) {
    await this.page.dblclick(selector);
  }

  /**
   * Right click element
   */
  async rightClick(selector: string) {
    await this.page.click(selector, { button: 'right' });
  }

  /**
   * Get attribute value
   */
  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    return await this.page.locator(selector).getAttribute(attribute);
  }

  /**
   * Count elements matching selector
   */
  async count(selector: string): Promise<number> {
    return await this.page.locator(selector).count();
  }

  /**
   * Wait for timeout
   */
  async wait(milliseconds: number) {
    await this.page.waitForTimeout(milliseconds);
  }

  /**
   * Assert page title contains text
   */
  async assertTitle(expected: string) {
    await expect(this.page).toHaveTitle(new RegExp(expected, 'i'));
  }

  /**
   * Assert URL contains path
   */
  async assertUrl(expectedPath: string) {
    await expect(this.page).toHaveURL(new RegExp(expectedPath));
  }

  /**
   * Assert element is visible
   */
  async assertVisible(selector: string) {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  /**
   * Assert element is hidden
   */
  async assertHidden(selector: string) {
    await expect(this.page.locator(selector)).toBeHidden();
  }

  /**
   * Assert element contains text
   */
  async assertText(selector: string, expectedText: string) {
    await expect(this.page.locator(selector)).toContainText(expectedText);
  }

  /**
   * Assert element has exact text
   */
  async assertExactText(selector: string, expectedText: string) {
    await expect(this.page.locator(selector)).toHaveText(expectedText);
  }

  /**
   * Assert element count
   */
  async assertCount(selector: string, expectedCount: number) {
    await expect(this.page.locator(selector)).toHaveCount(expectedCount);
  }

  /**
   * Assert element is enabled
   */
  async assertEnabled(selector: string) {
    await expect(this.page.locator(selector)).toBeEnabled();
  }

  /**
   * Assert element is disabled
   */
  async assertDisabled(selector: string) {
    await expect(this.page.locator(selector)).toBeDisabled();
  }

  /**
   * Assert input has value
   */
  async assertValue(selector: string, expectedValue: string) {
    await expect(this.page.locator(selector)).toHaveValue(expectedValue);
  }
}
