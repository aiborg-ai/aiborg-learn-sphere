/**
 * Vault Page Object
 * Represents the vault content library and access control
 */

import { BasePage } from './BasePage';
import type { Page } from '@playwright/test';

export class VaultPage extends BasePage {
  // Page URL
  private readonly vaultUrl = '/vault';

  // Header and navigation
  private readonly pageTitle = 'h1:has-text("Vault")';
  private readonly searchInput = 'input[placeholder*="Search vault"]';
  private readonly searchButton = 'button[aria-label="Search"]';

  // Access status
  private readonly accessGrantedBanner = '[data-testid="access-granted"]';
  private readonly accessDeniedBanner = '[data-testid="access-denied"]';
  private readonly accessExpiryDate = '[data-testid="access-expiry"]';
  private readonly upgradePrompt = '[data-testid="upgrade-prompt"]';
  private readonly claimAccessButton = 'button:has-text("Claim Free Access")';

  // Content categories/filters
  private readonly categoryTabs = '[data-testid="category-tabs"]';
  private readonly allTab = 'button:has-text("All")';
  private readonly videosTab = 'button:has-text("Videos")';
  private readonly documentsTab = 'button:has-text("Documents")';
  private readonly resourcesTab = 'button:has-text("Resources")';
  private readonly templatesTab = 'button:has-text("Templates")';

  // Content grid/list
  private readonly contentGrid = '[data-testid="content-grid"]';
  private readonly contentCard = '[data-testid="content-card"]';
  private readonly contentTitle = '[data-testid="content-title"]';
  private readonly contentType = '[data-testid="content-type"]';
  private readonly contentDuration = '[data-testid="content-duration"]';
  private readonly contentSize = '[data-testid="content-size"]';
  private readonly premiumBadge = '[data-testid="premium-badge"]';

  // Content actions
  private readonly viewButton = 'button:has-text("View")';
  private readonly downloadButton = 'button:has-text("Download")';
  private readonly bookmarkButton = '[data-testid="bookmark-button"]';
  private readonly shareButton = '[data-testid="share-button"]';

  // Sorting and filtering
  private readonly sortDropdown = '[data-testid="sort-dropdown"]';
  private readonly filterButton = 'button:has-text("Filters")';
  private readonly filterPanel = '[data-testid="filter-panel"]';
  private readonly applyFiltersButton = 'button:has-text("Apply")';
  private readonly clearFiltersButton = 'button:has-text("Clear")';

  // Filter options
  private readonly typeFilter = '[data-testid="type-filter"]';
  private readonly dateFilter = '[data-testid="date-filter"]';
  private readonly difficultyFilter = '[data-testid="difficulty-filter"]';

  // Collections/Playlists
  private readonly collectionsSection = '[data-testid="collections"]';
  private readonly collectionCard = '[data-testid="collection-card"]';
  private readonly createCollectionButton = 'button:has-text("Create Collection")';
  private readonly addToCollectionButton = 'button:has-text("Add to Collection")';

  // Featured/Recommended
  private readonly featuredSection = '[data-testid="featured"]';
  private readonly recommendedSection = '[data-testid="recommended"]';
  private readonly recentlyAddedSection = '[data-testid="recently-added"]';

  // Pagination
  private readonly pagination = '[data-testid="pagination"]';
  private readonly nextPageButton = 'button:has-text("Next")';
  private readonly prevPageButton = 'button:has-text("Previous")';

  // Empty states
  private readonly emptyState = '[data-testid="empty-state"]';
  private readonly noAccessMessage = 'text=You do not have access';
  private readonly noResultsMessage = 'text=No content found';

  // Content details modal
  private readonly contentModal = '[data-testid="content-modal"]';
  private readonly modalTitle = `${this.contentModal} h2`;
  private readonly modalDescription = `${this.contentModal} [data-testid="description"]`;
  private readonly modalDuration = `${this.contentModal} [data-testid="duration"]`;
  private readonly modalViewButton = `${this.contentModal} button:has-text("View")`;
  private readonly modalCloseButton = `${this.contentModal} button[aria-label="Close"]`;

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to vault page
   */
  async navigate() {
    await this.goto(this.vaultUrl);
    await this.waitForPageLoad();
  }

  /**
   * Check if user has vault access
   */
  async hasVaultAccess(): Promise<boolean> {
    return await this.isVisible(this.accessGrantedBanner);
  }

  /**
   * Check if access is denied
   */
  async isAccessDenied(): Promise<boolean> {
    return await this.isVisible(this.accessDeniedBanner);
  }

  /**
   * Get access expiry date
   */
  async getAccessExpiryDate(): Promise<string> {
    return await this.getText(this.accessExpiryDate);
  }

  /**
   * Click claim access button
   */
  async claimAccess() {
    await this.click(this.claimAccessButton);
    await this.waitForNavigation();
  }

  /**
   * Search vault content
   */
  async searchContent(query: string) {
    await this.fill(this.searchInput, query);
    await this.click(this.searchButton);
    await this.wait(1000);
  }

  /**
   * Switch to category tab
   */
  async switchToTab(tab: 'all' | 'videos' | 'documents' | 'resources' | 'templates') {
    const tabMap = {
      all: this.allTab,
      videos: this.videosTab,
      documents: this.documentsTab,
      resources: this.resourcesTab,
      templates: this.templatesTab,
    };

    await this.click(tabMap[tab]);
    await this.wait(1000);
  }

  /**
   * Get all content titles
   */
  async getAllContentTitles(): Promise<string[]> {
    return await this.getAllTexts(this.contentTitle);
  }

  /**
   * Get content count
   */
  async getContentCount(): Promise<number> {
    return await this.count(this.contentCard);
  }

  /**
   * Click on content by title
   */
  async clickContent(title: string) {
    const card = this.page.locator(this.contentCard).filter({ hasText: title });
    await card.click();
    await this.waitForSelector(this.contentModal);
  }

  /**
   * View content
   */
  async viewContent(title: string) {
    const card = this.page.locator(this.contentCard).filter({ hasText: title });
    await card.locator(this.viewButton).click();
    await this.waitForNavigation();
  }

  /**
   * Download content
   */
  async downloadContent(title: string) {
    const card = this.page.locator(this.contentCard).filter({ hasText: title });
    const downloadPromise = this.page.waitForEvent('download');
    await card.locator(this.downloadButton).click();
    return await downloadPromise;
  }

  /**
   * Bookmark content
   */
  async bookmarkContent(title: string) {
    const card = this.page.locator(this.contentCard).filter({ hasText: title });
    await card.locator(this.bookmarkButton).click();
    await this.wait(500);
  }

  /**
   * Check if content is premium
   */
  async isPremiumContent(title: string): Promise<boolean> {
    const card = this.page.locator(this.contentCard).filter({ hasText: title });
    return await card.locator(this.premiumBadge).isVisible();
  }

  /**
   * Sort content
   */
  async sortBy(option: 'newest' | 'oldest' | 'popular' | 'title') {
    await this.click(this.sortDropdown);
    await this.wait(300);
    await this.click(`text=${option}`);
    await this.wait(1000);
  }

  /**
   * Open filters panel
   */
  async openFilters() {
    await this.click(this.filterButton);
    await this.waitForSelector(this.filterPanel);
  }

  /**
   * Apply filters
   */
  async applyFilters(filters: { type?: string; date?: string; difficulty?: string }) {
    await this.openFilters();

    if (filters.type) {
      await this.click(`${this.typeFilter} input[value="${filters.type}"]`);
    }

    if (filters.date) {
      await this.selectOption(this.dateFilter, filters.date);
    }

    if (filters.difficulty) {
      await this.selectOption(this.difficultyFilter, filters.difficulty);
    }

    await this.click(this.applyFiltersButton);
    await this.wait(1000);
  }

  /**
   * Clear all filters
   */
  async clearFilters() {
    await this.openFilters();
    await this.click(this.clearFiltersButton);
    await this.wait(1000);
  }

  /**
   * Create collection
   */
  async createCollection(collectionName: string) {
    await this.click(this.createCollectionButton);
    await this.wait(500);
    await this.fill('input[placeholder*="Collection name"]', collectionName);
    await this.click('button:has-text("Create")');
    await this.wait(1000);
  }

  /**
   * Add content to collection
   */
  async addToCollection(contentTitle: string, collectionName: string) {
    const card = this.page.locator(this.contentCard).filter({ hasText: contentTitle });
    await card.locator(this.addToCollectionButton).click();
    await this.wait(500);
    await this.click(`text=${collectionName}`);
    await this.wait(500);
  }

  /**
   * Open content modal
   */
  async openContentModal(title: string) {
    await this.clickContent(title);
  }

  /**
   * Close content modal
   */
  async closeContentModal() {
    await this.click(this.modalCloseButton);
    await this.waitForSelectorHidden(this.contentModal);
  }

  /**
   * Get modal content details
   */
  async getModalDetails(): Promise<{
    title: string;
    description: string;
    duration: string;
  }> {
    return {
      title: await this.getText(this.modalTitle),
      description: await this.getText(this.modalDescription),
      duration: await this.getText(this.modalDuration),
    };
  }

  /**
   * View from modal
   */
  async viewFromModal() {
    await this.click(this.modalViewButton);
    await this.waitForNavigation();
  }

  /**
   * Go to next page
   */
  async goToNextPage() {
    await this.click(this.nextPageButton);
    await this.wait(1000);
  }

  /**
   * Go to previous page
   */
  async goToPreviousPage() {
    await this.click(this.prevPageButton);
    await this.wait(1000);
  }

  /**
   * Check if content exists
   */
  async contentExists(title: string): Promise<boolean> {
    return await this.isVisible(`${this.contentCard}:has-text("${title}")`);
  }

  /**
   * Get featured content
   */
  async getFeaturedContent(): Promise<string[]> {
    return await this.getAllTexts(`${this.featuredSection} ${this.contentTitle}`);
  }

  /**
   * Get recommended content
   */
  async getRecommendedContent(): Promise<string[]> {
    return await this.getAllTexts(`${this.recommendedSection} ${this.contentTitle}`);
  }

  /**
   * Assert on vault page
   */
  async assertOnVaultPage() {
    await this.assertVisible(this.pageTitle);
    await this.assertUrl('/vault');
  }

  /**
   * Assert has access
   */
  async assertHasAccess() {
    await this.assertVisible(this.accessGrantedBanner);
  }

  /**
   * Assert no access
   */
  async assertNoAccess() {
    await this.assertVisible(this.accessDeniedBanner);
  }

  /**
   * Assert content displayed
   */
  async assertContentDisplayed(title: string) {
    await this.assertVisible(`${this.contentCard}:has-text("${title}")`);
  }

  /**
   * Assert empty state
   */
  async assertEmptyState() {
    await this.assertVisible(this.emptyState);
  }

  /**
   * Assert no results
   */
  async assertNoResults() {
    await this.assertVisible(this.noResultsMessage);
  }
}
