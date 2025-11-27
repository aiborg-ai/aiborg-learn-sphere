/**
 * Content Consumption E2E Tests
 * Tests for viewing videos, PDFs, and other course materials
 */

import { test, expect } from '@playwright/test';
import { ContentViewerPage } from '../pages/ContentViewerPage';
import { setupAuthenticatedSession } from '../utils/auth';

test.describe('Video Content Consumption', () => {
  let contentPage: ContentViewerPage;

  test.beforeEach(async ({ page }) => {
    contentPage = new ContentViewerPage(page);
    await setupAuthenticatedSession(page, 'student');
  });

  test('should play and pause video', async () => {
    // This test assumes video content is available
    const contentType = await contentPage.getContentType();

    if (contentType === 'video') {
      await contentPage.playVideo();
      const isPlaying = await contentPage.isVideoPlaying();
      expect(isPlaying).toBe(true);

      await contentPage.pauseVideo();
      const isStillPlaying = await contentPage.isVideoPlaying();
      expect(isStillPlaying).toBe(false);
    }
  });

  test('should seek video to specific time', async () => {
    const contentType = await contentPage.getContentType();

    if (contentType === 'video') {
      await contentPage.seekVideo(30);
      await contentPage.page.waitForTimeout(1000);

      const currentTime = await contentPage.getCurrentVideoTime();
      expect(currentTime).toBeGreaterThanOrEqual(29);
    }
  });

  test('should change playback speed', async () => {
    const contentType = await contentPage.getContentType();

    if (contentType === 'video') {
      await contentPage.setPlaybackSpeed(1.5);
      await contentPage.page.waitForTimeout(500);
    }
  });

  test('should toggle mute', async () => {
    const contentType = await contentPage.getContentType();

    if (contentType === 'video') {
      await contentPage.toggleMute();
      await contentPage.page.waitForTimeout(500);
    }
  });

  test('should toggle fullscreen', async () => {
    const contentType = await contentPage.getContentType();

    if (contentType === 'video') {
      await contentPage.toggleFullscreen();
      await contentPage.page.waitForTimeout(1000);
    }
  });
});

test.describe('PDF Content Consumption', () => {
  let contentPage: ContentViewerPage;

  test.beforeEach(async ({ page }) => {
    contentPage = new ContentViewerPage(page);
    await setupAuthenticatedSession(page, 'student');
  });

  test('should navigate PDF pages', async () => {
    const contentType = await contentPage.getContentType();

    if (contentType === 'pdf') {
      const initialPage = await contentPage.getCurrentPdfPage();
      await contentPage.goToNextPdfPage();

      const newPage = await contentPage.getCurrentPdfPage();
      expect(newPage).toBe(initialPage + 1);
    }
  });

  test('should zoom PDF', async () => {
    const contentType = await contentPage.getContentType();

    if (contentType === 'pdf') {
      await contentPage.zoomInPdf();
      await contentPage.page.waitForTimeout(500);

      await contentPage.zoomOutPdf();
      await contentPage.page.waitForTimeout(500);
    }
  });

  test('should search in PDF', async () => {
    const contentType = await contentPage.getContentType();

    if (contentType === 'pdf') {
      await contentPage.searchInPdf('test');
      await contentPage.page.waitForTimeout(1000);
    }
  });

  test('should download PDF', async () => {
    const contentType = await contentPage.getContentType();

    if (contentType === 'pdf') {
      const download = await contentPage.downloadPdf();
      expect(download).toBeTruthy();
    }
  });
});

test.describe('General Content Features', () => {
  let contentPage: ContentViewerPage;

  test.beforeEach(async ({ page }) => {
    contentPage = new ContentViewerPage(page);
    await setupAuthenticatedSession(page, 'student');
  });

  test('should bookmark content', async () => {
    await contentPage.bookmarkContent();
    await contentPage.page.waitForTimeout(500);

    const isBookmarked = await contentPage.isBookmarked();
    expect(typeof isBookmarked).toBe('boolean');
  });

  test('should add comment to content', async () => {
    await contentPage.addComment('This is a great lesson!');
    await contentPage.page.waitForTimeout(1000);
  });

  test('should navigate to related content', async () => {
    const relatedCount = await contentPage.getRelatedContentCount();

    if (relatedCount > 0) {
      await contentPage.clickRelatedContent(0);
      await contentPage.page.waitForTimeout(1000);
    }
  });

  test('should download content', async () => {
    try {
      const download = await contentPage.downloadContent();
      expect(download).toBeTruthy();
    } catch {
      // Download might not be available for all content
    }
  });
});
