/**
 * Content Viewer Page Object
 * Represents content viewing for videos, PDFs, documents, and other materials
 */

import { BasePage } from './BasePage';
import type { Page } from '@playwright/test';

export class ContentViewerPage extends BasePage {
  // Video viewer
  private readonly videoContainer = '[data-testid="video-container"]';
  private readonly videoElement = 'video';
  private readonly playButton = '[aria-label="Play"]';
  private readonly pauseButton = '[aria-label="Pause"]';
  private readonly muteButton = '[aria-label="Mute"]';
  private readonly unmuteButton = '[aria-label="Unmute"]';
  private readonly fullscreenButton = '[aria-label="Fullscreen"]';
  private readonly volumeSlider = '[data-testid="volume-slider"]';
  private readonly progressBar = '[data-testid="progress-bar"]';
  private readonly currentTime = '[data-testid="current-time"]';
  private readonly duration = '[data-testid="duration"]';
  private readonly playbackSpeedButton = '[data-testid="playback-speed"]';
  private readonly qualityButton = '[data-testid="quality"]';
  private readonly subtitlesButton = '[data-testid="subtitles"]';

  // PDF viewer
  private readonly pdfContainer = '[data-testid="pdf-container"]';
  private readonly pdfCanvas = 'canvas[data-page-number]';
  private readonly pdfNextPage = 'button:has-text("Next Page")';
  private readonly pdfPrevPage = 'button:has-text("Previous Page")';
  private readonly pdfPageInput = 'input[type="number"][aria-label*="Page"]';
  private readonly pdfZoomIn = 'button[aria-label="Zoom in"]';
  private readonly pdfZoomOut = 'button[aria-label="Zoom out"]';
  private readonly pdfDownload = 'button:has-text("Download")';
  private readonly pdfPrint = 'button:has-text("Print")';
  private readonly pdfSearch = 'input[placeholder*="Search"]';
  private readonly pdfThumbnails = '[data-testid="pdf-thumbnails"]';

  // Document viewer
  private readonly documentContainer = '[data-testid="document-container"]';
  private readonly documentContent = '[data-testid="document-content"]';
  private readonly documentDownload = 'button:has-text("Download")';

  // Image viewer
  private readonly imageContainer = '[data-testid="image-container"]';
  private readonly imageElement = 'img[data-testid="content-image"]';
  private readonly imageZoomIn = 'button[aria-label="Zoom in"]';
  private readonly imageZoomOut = 'button[aria-label="Zoom out"]';
  private readonly imageFit = 'button:has-text("Fit to screen")';

  // Content metadata
  private readonly contentTitle = '[data-testid="content-title"]';
  private readonly contentDescription = '[data-testid="content-description"]';
  private readonly contentAuthor = '[data-testid="content-author"]';
  private readonly contentDate = '[data-testid="content-date"]';
  private readonly contentSize = '[data-testid="content-size"]';

  // Navigation
  private readonly nextContentButton = 'button:has-text("Next")';
  private readonly prevContentButton = 'button:has-text("Previous")';
  private readonly backToListButton = 'button:has-text("Back to List")';

  // Download and sharing
  private readonly downloadButton = '[data-testid="download-button"]';
  private readonly shareButton = '[data-testid="share-button"]';
  private readonly bookmarkButton = '[data-testid="bookmark-button"]';

  // Comments/Notes
  private readonly commentsSection = '[data-testid="comments-section"]';
  private readonly addCommentButton = 'button:has-text("Add Comment")';
  private readonly commentInput = 'textarea[placeholder*="comment"]';
  private readonly submitCommentButton = 'button:has-text("Submit")';

  // Related content
  private readonly relatedContent = '[data-testid="related-content"]';
  private readonly relatedContentItem = '[data-testid="related-content-item"]';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Wait for content viewer to load
   */
  async waitForContentLoad() {
    await this.wait(2000); // Wait for content to initialize
  }

  /**
   * Check content type
   */
  async getContentType(): Promise<'video' | 'pdf' | 'document' | 'image' | 'unknown'> {
    if (await this.isVisible(this.videoContainer)) return 'video';
    if (await this.isVisible(this.pdfContainer)) return 'pdf';
    if (await this.isVisible(this.documentContainer)) return 'document';
    if (await this.isVisible(this.imageContainer)) return 'image';
    return 'unknown';
  }

  // ==================== Video Controls ====================

  /**
   * Play video
   */
  async playVideo() {
    if (await this.isVisible(this.playButton)) {
      await this.click(this.playButton);
      await this.wait(500);
    }
  }

  /**
   * Pause video
   */
  async pauseVideo() {
    if (await this.isVisible(this.pauseButton)) {
      await this.click(this.pauseButton);
      await this.wait(500);
    }
  }

  /**
   * Check if video is playing
   */
  async isVideoPlaying(): Promise<boolean> {
    return await this.page.evaluate(() => {
      const video = document.querySelector('video');
      return video ? !video.paused : false;
    });
  }

  /**
   * Get current video time
   */
  async getCurrentVideoTime(): Promise<number> {
    return await this.page.evaluate(() => {
      const video = document.querySelector('video');
      return video ? video.currentTime : 0;
    });
  }

  /**
   * Get video duration
   */
  async getVideoDuration(): Promise<number> {
    return await this.page.evaluate(() => {
      const video = document.querySelector('video');
      return video ? video.duration : 0;
    });
  }

  /**
   * Seek video to specific time
   */
  async seekVideo(seconds: number) {
    await this.page.evaluate(time => {
      const video = document.querySelector('video');
      if (video) video.currentTime = time;
    }, seconds);
    await this.wait(500);
  }

  /**
   * Toggle mute
   */
  async toggleMute() {
    const isMuted = await this.isVisible(this.unmuteButton);
    if (isMuted) {
      await this.click(this.unmuteButton);
    } else {
      await this.click(this.muteButton);
    }
  }

  /**
   * Set volume
   */
  async setVolume(volume: number) {
    await this.page.evaluate(vol => {
      const video = document.querySelector('video');
      if (video) video.volume = vol / 100;
    }, volume);
  }

  /**
   * Toggle fullscreen
   */
  async toggleFullscreen() {
    await this.click(this.fullscreenButton);
    await this.wait(500);
  }

  /**
   * Change playback speed
   */
  async setPlaybackSpeed(speed: 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2) {
    await this.click(this.playbackSpeedButton);
    await this.wait(300);
    await this.click(`text=${speed}x`);
  }

  /**
   * Enable subtitles
   */
  async enableSubtitles() {
    await this.click(this.subtitlesButton);
    await this.wait(300);
  }

  // ==================== PDF Controls ====================

  /**
   * Get current PDF page
   */
  async getCurrentPdfPage(): Promise<number> {
    const pageInput = await this.page.inputValue(this.pdfPageInput);
    return parseInt(pageInput) || 1;
  }

  /**
   * Go to PDF page
   */
  async goToPdfPage(pageNumber: number) {
    await this.fill(this.pdfPageInput, pageNumber.toString());
    await this.pressKey('Enter');
    await this.wait(1000);
  }

  /**
   * Go to next PDF page
   */
  async goToNextPdfPage() {
    await this.click(this.pdfNextPage);
    await this.wait(1000);
  }

  /**
   * Go to previous PDF page
   */
  async goToPrevPdfPage() {
    await this.click(this.pdfPrevPage);
    await this.wait(1000);
  }

  /**
   * Zoom in PDF
   */
  async zoomInPdf() {
    await this.click(this.pdfZoomIn);
    await this.wait(500);
  }

  /**
   * Zoom out PDF
   */
  async zoomOutPdf() {
    await this.click(this.pdfZoomOut);
    await this.wait(500);
  }

  /**
   * Download PDF
   */
  async downloadPdf() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.click(this.pdfDownload);
    return await downloadPromise;
  }

  /**
   * Search in PDF
   */
  async searchInPdf(query: string) {
    await this.fill(this.pdfSearch, query);
    await this.pressKey('Enter');
    await this.wait(1000);
  }

  /**
   * Open PDF thumbnails
   */
  async openPdfThumbnails() {
    if (!(await this.isVisible(this.pdfThumbnails))) {
      await this.click('button[aria-label="Thumbnails"]');
      await this.waitForSelector(this.pdfThumbnails);
    }
  }

  // ==================== Document/Image Controls ====================

  /**
   * Download content
   */
  async downloadContent() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.click(this.downloadButton);
    return await downloadPromise;
  }

  /**
   * Zoom image
   */
  async zoomImage(direction: 'in' | 'out') {
    if (direction === 'in') {
      await this.click(this.imageZoomIn);
    } else {
      await this.click(this.imageZoomOut);
    }
    await this.wait(500);
  }

  /**
   * Fit image to screen
   */
  async fitImageToScreen() {
    await this.click(this.imageFit);
    await this.wait(500);
  }

  // ==================== Common Actions ====================

  /**
   * Get content title
   */
  async getContentTitle(): Promise<string> {
    return await this.getText(this.contentTitle);
  }

  /**
   * Get content description
   */
  async getContentDescription(): Promise<string> {
    return await this.getText(this.contentDescription);
  }

  /**
   * Bookmark content
   */
  async bookmarkContent() {
    await this.click(this.bookmarkButton);
    await this.wait(500);
  }

  /**
   * Share content
   */
  async shareContent() {
    await this.click(this.shareButton);
    await this.wait(500);
  }

  /**
   * Add comment
   */
  async addComment(commentText: string) {
    await this.click(this.addCommentButton);
    await this.fill(this.commentInput, commentText);
    await this.click(this.submitCommentButton);
    await this.wait(500);
  }

  /**
   * Navigate to next content
   */
  async goToNextContent() {
    await this.click(this.nextContentButton);
    await this.waitForContentLoad();
  }

  /**
   * Navigate to previous content
   */
  async goToPrevContent() {
    await this.click(this.prevContentButton);
    await this.waitForContentLoad();
  }

  /**
   * Back to content list
   */
  async backToList() {
    await this.click(this.backToListButton);
    await this.waitForNavigation();
  }

  /**
   * Click related content item
   */
  async clickRelatedContent(index: number) {
    const items = await this.page.locator(this.relatedContentItem).all();
    if (items[index]) {
      await items[index].click();
      await this.waitForContentLoad();
    }
  }

  /**
   * Get related content count
   */
  async getRelatedContentCount(): Promise<number> {
    return await this.count(this.relatedContentItem);
  }

  // ==================== Assertions ====================

  /**
   * Assert video loaded
   */
  async assertVideoLoaded() {
    await this.assertVisible(this.videoContainer);
    await this.assertVisible(this.videoElement);
  }

  /**
   * Assert PDF loaded
   */
  async assertPdfLoaded() {
    await this.assertVisible(this.pdfContainer);
    await this.assertVisible(this.pdfCanvas);
  }

  /**
   * Assert content title
   */
  async assertContentTitle(expectedTitle: string) {
    await this.assertText(this.contentTitle, expectedTitle);
  }

  /**
   * Check if content is bookmarked
   */
  async isBookmarked(): Promise<boolean> {
    const buttonText = await this.getText(this.bookmarkButton);
    return buttonText.toLowerCase().includes('bookmarked');
  }
}
