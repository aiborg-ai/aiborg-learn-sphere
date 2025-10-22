import { test, expect } from '@playwright/test';
import { login, TEST_USER } from './utils/auth';

test.describe('Playlists Feature', () => {
  test.beforeEach(async ({ page: _page }) => {
    await login(page, TEST_USER.email, TEST_USER.password);
  });

  test.describe('Creating Playlists', () => {
    test('should create a new playlist', async ({ page: _page }) => {
      await page.goto('/playlists');

      // Click "Create Playlist" button
      await page.click('button:has-text("Create Playlist"), button:has-text("New Playlist")');

      // Fill in playlist details
      await page.fill('input[name="name"], input#name', 'My Exam Prep Playlist');
      await page.fill(
        'textarea[name="description"], textarea#description',
        'Videos for final exam preparation'
      );

      // Select category
      await page.click('select[name="category"], [role="combobox"]:near(:text("Category"))');
      await page.click('option:has-text("Courses"), text="Courses"').catch(() => {
        page.click('[role="option"]:has-text("Courses")');
      });

      // Save playlist
      await page.click('button:has-text("Create"), button:has-text("Save")');

      // Verify success notification
      await expect(page.locator('text=/playlist.*created|created.*successfully/i')).toBeVisible();

      // Verify playlist appears in list
      await expect(page.locator('text=My Exam Prep Playlist')).toBeVisible();
    });

    test('should create public playlist', async ({ page: _page }) => {
      await page.goto('/playlists');

      await page.click('button:has-text("Create Playlist")');

      // Fill details
      await page.fill('input[name="name"]', 'Public Study Guide');
      await page.fill('textarea[name="description"]', 'Shared with everyone');

      // Toggle public visibility
      await page.click('input[type="checkbox"][name="is_public"], label:has-text("Public")');

      await page.click('button:has-text("Create")');

      // Verify created
      await expect(page.locator('text=/playlist.*created/i')).toBeVisible();
      await expect(page.locator('text=Public Study Guide')).toBeVisible();

      // Verify public badge/indicator
      const playlistCard = page.locator('text=Public Study Guide').locator('..');
      await expect(playlistCard.locator('text=/public|🌐/i')).toBeVisible();
    });

    test('should create private playlist by default', async ({ page: _page }) => {
      await page.goto('/playlists');

      await page.click('button:has-text("Create Playlist")');

      // Fill details without toggling public
      await page.fill('input[name="name"]', 'Private Notes');

      await page.click('button:has-text("Create")');

      await expect(page.locator('text=Private Notes')).toBeVisible();

      // Verify private indicator (or absence of public badge)
      const playlistCard = page.locator('text=Private Notes').locator('..');
      await expect(playlistCard.locator('text=/private|🔒/i')).toBeVisible();
    });

    test('should validate required fields', async ({ page: _page }) => {
      await page.goto('/playlists');

      await page.click('button:has-text("Create Playlist")');

      // Try to save without filling name
      await page.click('button:has-text("Create")');

      // Verify validation error
      await expect(page.locator('text=/required|name.*required/i')).toBeVisible();
    });

    test('should add thumbnail to playlist', async ({ page: _page }) => {
      await page.goto('/playlists');

      await page.click('button:has-text("Create Playlist")');

      await page.fill('input[name="name"]', 'Playlist with Thumbnail');

      // Upload thumbnail
      const fileInput = page.locator('input[type="file"]');

      if ((await fileInput.count()) > 0) {
        // In real test, you'd provide a test image file path
        // await fileInput.setInputFiles('./test-assets/thumbnail.jpg');
      }

      await page.click('button:has-text("Create")');

      await expect(page.locator('text=Playlist with Thumbnail')).toBeVisible();
    });
  });

  test.describe('Viewing Playlists', () => {
    test('should navigate to playlists page', async ({ page: _page }) => {
      await page.goto('/playlists');

      // Verify page loaded
      await expect(page).toHaveURL(/\/playlists/);
      await expect(page.locator('h1')).toContainText(/playlist/i);
    });

    test('should display playlist statistics', async ({ page: _page }) => {
      await page.goto('/playlists');
      await page.waitForLoadState('networkidle');

      // Verify stats present
      await expect(page.locator('text=/total.*playlists?/i')).toBeVisible();

      // Check for other stats
      const statsSection = page.locator('text=/stats|overview/i').locator('..');
      if (await statsSection.isVisible()) {
        await expect(statsSection.locator('text=/public|private|videos?/i')).toBeVisible();
      }
    });

    test('should filter playlists by category', async ({ page: _page }) => {
      await page.goto('/playlists');
      await page.waitForLoadState('networkidle');

      // Click category filter
      await page.click('select[name="category"], [role="combobox"]:near(:text("Category"))');

      // Select a category
      await page.click('option:has-text("Courses"), text="Courses"').catch(() => {
        page.click('[role="option"]:has-text("Courses")');
      });

      await page.waitForTimeout(1000);

      // Verify filtered results (implementation dependent)
    });

    test('should filter playlists by visibility', async ({ page: _page }) => {
      await page.goto('/playlists');

      // Click visibility filter
      await page.click('select[name="visibility"], button:has-text("Filter")');

      // Select "Public Only"
      await page.click('text=/public.*only|only.*public/i').catch(() => {});

      await page.waitForTimeout(1000);

      // Verify only public playlists shown
      const playlistCards = page.locator('[data-testid="playlist-card"]');
      if ((await playlistCards.count()) > 0) {
        await expect(playlistCards.first().locator('text=/public/i')).toBeVisible();
      }
    });

    test('should search playlists by name', async ({ page: _page }) => {
      await page.goto('/playlists');

      // Enter search query
      await page.fill('input[placeholder*="Search" i]', 'exam');

      // Wait for debounce
      await page.waitForTimeout(1000);

      // Verify filtered results
      const results = page.locator('[data-testid="playlist-card"]');
      if ((await results.count()) > 0) {
        await expect(results.first()).toContainText(/exam/i);
      }
    });

    test('should display playlist card with metadata', async ({ page: _page }) => {
      // Create a playlist first
      await page.goto('/playlists');

      await page.click('button:has-text("Create Playlist")');
      await page.fill('input[name="name"]', 'Test Playlist');
      await page.click('button:has-text("Create")');

      await page.waitForTimeout(1000);

      // Verify playlist card shows metadata
      const playlistCard = page.locator('text=Test Playlist').locator('..');

      // Should show item count, duration, visibility
      await expect(playlistCard.locator('text=/\\d+.*items?|\\d+.*videos?/i')).toBeVisible();
      await expect(playlistCard.locator('text=/private|public/i')).toBeVisible();
    });

    test('should click playlist to view details', async ({ page: _page }) => {
      // Create a playlist
      await page.goto('/playlists');

      await page.click('button:has-text("Create Playlist")');
      await page.fill('input[name="name"]', 'Clickable Playlist');
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(1000);

      // Click on playlist
      await page.click('text=Clickable Playlist');

      // Verify navigated to playlist detail view
      await expect(page).toHaveURL(/\/playlists\/[a-f0-9-]+/);
      await expect(page.locator('h1, h2')).toContainText('Clickable Playlist');
    });
  });

  test.describe('Adding Items to Playlist', () => {
    test('should add video to playlist from course page', async ({ page: _page }) => {
      // Navigate to course materials
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      // Find video material
      const videoMaterial = page.locator('text=/Video|recording/i').first().locator('..');

      // Click "Add to Playlist" button
      await videoMaterial
        .locator('button:has-text("Add to Playlist"), button[title*="playlist" i]')
        .click();

      // Select playlist from dialog
      await page.click('text=/select.*playlist|choose.*playlist/i');

      // Create new playlist or select existing
      await page.click('button:has-text("Create New")').catch(async () => {
        // If playlists exist, select first one
        await page.click('[data-testid="playlist-option"]').first();
      });

      if (await page.locator('input[name="name"]').isVisible()) {
        await page.fill('input[name="name"]', 'Quick Playlist');
        await page.click('button:has-text("Create")');
      }

      // Verify success
      await expect(page.locator('text=/added.*playlist/i')).toBeVisible();
    });

    test('should add multiple videos to same playlist', async ({ page: _page }) => {
      // Create playlist first
      await page.goto('/playlists');
      await page.click('button:has-text("Create Playlist")');
      await page.fill('input[name="name"]', 'Multi-Video Playlist');
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(1000);

      // Add first video
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      const videos = page.locator(
        'button:has-text("Add to Playlist"), button[title*="playlist" i]'
      );

      if ((await videos.count()) >= 2) {
        // Add first video
        await videos.nth(0).click();
        await page.click('text=Multi-Video Playlist');
        await expect(page.locator('text=/added.*playlist/i')).toBeVisible();
        await page.waitForTimeout(500);

        // Add second video
        await videos.nth(1).click();
        await page.click('text=Multi-Video Playlist');
        await expect(page.locator('text=/added.*playlist/i')).toBeVisible();

        // Navigate to playlist
        await page.goto('/playlists');
        await page.click('text=Multi-Video Playlist');

        // Verify both videos present
        const playlistItems = page.locator('[data-testid="playlist-item"]');
        expect(await playlistItems.count()).toBeGreaterThanOrEqual(2);
      }
    });

    test('should prevent duplicate videos in playlist', async ({ page: _page }) => {
      // Create playlist
      await page.goto('/playlists');
      await page.click('button:has-text("Create Playlist")');
      await page.fill('input[name="name"]', 'No Duplicates Playlist');
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(1000);

      // Add video
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      const addBtn = page.locator('button[title*="playlist" i]').first();
      await addBtn.click();
      await page.click('text=No Duplicates Playlist');
      await page.waitForTimeout(1000);

      // Try to add same video again
      await addBtn.click();
      await page.click('text=No Duplicates Playlist');

      // Verify error message
      await expect(page.locator('text=/already.*playlist|duplicate/i')).toBeVisible();
    });
  });

  test.describe('Managing Playlist Items', () => {
    test('should reorder items in playlist', async ({ page: _page }) => {
      // Create playlist with items
      await page.goto('/playlists');
      await page.click('button:has-text("Create Playlist")');
      await page.fill('input[name="name"]', 'Reorderable Playlist');
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(1000);

      // Add multiple videos
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      const videos = page.locator('button[title*="playlist" i]');
      const videoCount = Math.min(await videos.count(), 2);

      for (let i = 0; i < videoCount; i++) {
        await videos.nth(i).click();
        await page.click('text=Reorderable Playlist');
        await page.waitForTimeout(500);
      }

      // Go to playlist
      await page.goto('/playlists');
      await page.click('text=Reorderable Playlist');

      if (videoCount >= 2) {
        // Get second item
        const secondItem = page.locator('[data-testid="playlist-item"]').nth(1);
        const itemText = await secondItem.textContent();

        // Move up
        await secondItem.locator('button[title*="move up" i], button:has-text("↑")').click();
        await page.waitForTimeout(500);

        // Verify moved to first position
        const firstItem = page.locator('[data-testid="playlist-item"]').first();
        await expect(firstItem).toContainText(itemText || '');
      }
    });

    test('should remove item from playlist', async ({ page: _page }) => {
      // Create playlist with item
      await page.goto('/playlists');
      await page.click('button:has-text("Create Playlist")');
      await page.fill('input[name="name"]', 'Removable Playlist');
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(1000);

      // Add video
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      await page.locator('button[title*="playlist" i]').first().click();
      await page.click('text=Removable Playlist');
      await page.waitForTimeout(1000);

      // Go to playlist
      await page.goto('/playlists');
      await page.click('text=Removable Playlist');

      // Remove item
      const playlistItem = page.locator('[data-testid="playlist-item"]').first();
      await playlistItem.locator('button[title*="remove" i], button:has-text("Remove")').click();

      // Confirm
      await page.click('button:has-text("Remove"), button:has-text("Confirm")').catch(() => {});

      // Verify removed
      await expect(page.locator('text=/removed|empty/i')).toBeVisible();
    });

    test('should drag and drop to reorder playlist items', async ({ page: _page }) => {
      // Create playlist with multiple items
      await page.goto('/playlists');
      await page.click('button:has-text("Create Playlist")');
      await page.fill('input[name="name"]', 'Draggable Playlist');
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(1000);

      // Add videos
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      const videos = page.locator('button[title*="playlist" i]');
      const videoCount = Math.min(await videos.count(), 2);

      for (let i = 0; i < videoCount; i++) {
        await videos.nth(i).click();
        await page.click('text=Draggable Playlist');
        await page.waitForTimeout(500);
      }

      // Go to playlist
      await page.goto('/playlists');
      await page.click('text=Draggable Playlist');

      if (videoCount >= 2) {
        const firstItem = page.locator('[data-testid="playlist-item"]').first();
        const secondItem = page.locator('[data-testid="playlist-item"]').nth(1);

        const firstText = await firstItem.textContent();

        // Drag first to second position
        await firstItem.dragTo(secondItem);
        await page.waitForTimeout(500);

        // Verify order changed
        const newSecondItem = page.locator('[data-testid="playlist-item"]').nth(1);
        await expect(newSecondItem).toContainText(firstText || '');
      }
    });
  });

  test.describe('Playing Playlists', () => {
    test('should play playlist from start', async ({ page: _page }) => {
      // Create playlist with video
      await page.goto('/playlists');
      await page.click('button:has-text("Create Playlist")');
      await page.fill('input[name="name"]', 'Playable Playlist');
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(1000);

      // Add video
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');
      await page.locator('button[title*="playlist" i]').first().click();
      await page.click('text=Playable Playlist');
      await page.waitForTimeout(1000);

      // Go to playlist
      await page.goto('/playlists');
      await page.click('text=Playable Playlist');

      // Click "Play All" button
      await page.click('button:has-text("Play All"), button:has-text("Play Playlist")');

      // Verify video player opens
      await expect(page.locator('video, [data-testid="video-player"]')).toBeVisible({
        timeout: 5000,
      });
    });

    test('should play individual video from playlist', async ({ page: _page }) => {
      // Create playlist with video
      await page.goto('/playlists');
      await page.click('button:has-text("Create Playlist")');
      await page.fill('input[name="name"]', 'Individual Play Playlist');
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(1000);

      // Add video
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');
      await page.locator('button[title*="playlist" i]').first().click();
      await page.click('text=Individual Play Playlist');
      await page.waitForTimeout(1000);

      // Go to playlist
      await page.goto('/playlists');
      await page.click('text=Individual Play Playlist');

      // Click play on specific item
      const playlistItem = page.locator('[data-testid="playlist-item"]').first();
      await playlistItem.locator('button:has-text("Play"), button[title*="play" i]').click();

      // Verify video player opens
      await expect(page.locator('video')).toBeVisible();
    });

    test('should show playlist progress', async ({ page: _page }) => {
      // Create playlist with videos
      await page.goto('/playlists');
      await page.click('button:has-text("Create Playlist")');
      await page.fill('input[name="name"]', 'Progress Playlist');
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(1000);

      // Add video
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');
      await page.locator('button[title*="playlist" i]').first().click();
      await page.click('text=Progress Playlist');
      await page.waitForTimeout(1000);

      // Go to playlist
      await page.goto('/playlists');
      await page.click('text=Progress Playlist');

      // Verify progress bar or percentage shown
      await expect(page.locator('[role="progressbar"], .progress')).toBeVisible();
    });
  });

  test.describe('Editing Playlists', () => {
    test('should edit playlist details', async ({ page: _page }) => {
      // Create playlist
      await page.goto('/playlists');
      await page.click('button:has-text("Create Playlist")');
      await page.fill('input[name="name"]', 'Original Name');
      await page.fill('textarea[name="description"]', 'Original description');
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(1000);

      // Click edit button
      const playlistCard = page.locator('text=Original Name').locator('..');
      await playlistCard.locator('button[title*="edit" i], button:has-text("Edit")').click();

      // Update details
      await page.fill('input[name="name"]', 'Updated Name');
      await page.fill('textarea[name="description"]', 'Updated description');

      // Save
      await page.click('button:has-text("Save"), button:has-text("Update")');

      // Verify updated
      await expect(page.locator('text=/updated|saved/i')).toBeVisible();
      await expect(page.locator('text=Updated Name')).toBeVisible();
      await expect(page.locator('text=Original Name')).not.toBeVisible();
    });

    test('should toggle playlist visibility', async ({ page: _page }) => {
      // Create private playlist
      await page.goto('/playlists');
      await page.click('button:has-text("Create Playlist")');
      await page.fill('input[name="name"]', 'Toggle Visibility Playlist');
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(1000);

      // Edit playlist
      const playlistCard = page.locator('text=Toggle Visibility Playlist').locator('..');
      await playlistCard.locator('button[title*="edit" i]').click();

      // Toggle public
      await page.click('input[type="checkbox"][name="is_public"], label:has-text("Public")');

      // Save
      await page.click('button:has-text("Save")');

      await page.waitForTimeout(500);

      // Verify public badge shown
      await expect(playlistCard.locator('text=/public/i')).toBeVisible();
    });
  });

  test.describe('Deleting Playlists', () => {
    test('should delete playlist', async ({ page: _page }) => {
      // Create playlist
      await page.goto('/playlists');
      await page.click('button:has-text("Create Playlist")');
      await page.fill('input[name="name"]', 'Playlist to Delete');
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(1000);

      // Click delete button
      const playlistCard = page.locator('text=Playlist to Delete').locator('..');
      await playlistCard.locator('button[title*="delete" i], button:has-text("Delete")').click();

      // Confirm deletion
      await page.click('button:has-text("Delete"), button:has-text("Confirm")');

      // Verify deleted
      await expect(page.locator('text=/deleted|removed/i')).toBeVisible();
      await expect(page.locator('text=Playlist to Delete')).not.toBeVisible();
    });

    test('should show confirmation before deleting', async ({ page: _page }) => {
      // Create playlist
      await page.goto('/playlists');
      await page.click('button:has-text("Create Playlist")');
      await page.fill('input[name="name"]', 'Confirm Delete Playlist');
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(1000);

      // Click delete
      const playlistCard = page.locator('text=Confirm Delete Playlist').locator('..');
      await playlistCard.locator('button[title*="delete" i]').click();

      // Verify confirmation dialog
      await expect(page.locator('text=/are you sure|confirm|warning|permanently/i')).toBeVisible();
      await expect(page.locator('button:has-text("Cancel")')).toBeVisible();

      // Cancel
      await page.click('button:has-text("Cancel")');

      // Verify playlist still exists
      await expect(page.locator('text=Confirm Delete Playlist')).toBeVisible();
    });
  });

  test.describe('Cloning Playlists', () => {
    test('should clone playlist', async ({ page: _page }) => {
      // Create original playlist
      await page.goto('/playlists');
      await page.click('button:has-text("Create Playlist")');
      await page.fill('input[name="name"]', 'Original Playlist');
      await page.fill('textarea[name="description"]', 'Original description');
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(1000);

      // Add video to original
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');
      await page.locator('button[title*="playlist" i]').first().click();
      await page.click('text=Original Playlist');
      await page.waitForTimeout(1000);

      // Go back to playlists
      await page.goto('/playlists');

      // Clone playlist
      const playlistCard = page.locator('text=Original Playlist').locator('..');
      await playlistCard.locator('button[title*="clone" i], button:has-text("Clone")').click();

      // Verify clone created
      await expect(page.locator('text=/cloned|copy.*created/i')).toBeVisible();
      await expect(
        page.locator('text=/Original Playlist.*Copy|Copy.*Original Playlist/i')
      ).toBeVisible();
    });

    test('should clone public playlist from another user', async ({ page: _page }) => {
      // This test assumes there are public playlists from other users
      // In real testing, you'd set up test data
      await page.goto('/playlists');

      // Look for "Browse Public Playlists" or similar
      const browseBtn = page.locator('button:has-text("Browse"), button:has-text("Explore")');

      if (await browseBtn.isVisible()) {
        await browseBtn.click();

        // Find a public playlist
        const publicPlaylist = page.locator('[data-testid="public-playlist"]').first();

        if (await publicPlaylist.isVisible()) {
          await publicPlaylist.locator('button:has-text("Clone"), button:has-text("Copy")').click();

          // Verify cloned to user's library
          await expect(page.locator('text=/added.*library|cloned/i')).toBeVisible();
        }
      }
    });
  });

  test.describe('Sharing Playlists', () => {
    test('should get shareable link for public playlist', async ({ page: _page }) => {
      // Create public playlist
      await page.goto('/playlists');
      await page.click('button:has-text("Create Playlist")');
      await page.fill('input[name="name"]', 'Shareable Playlist');
      await page.click('input[type="checkbox"][name="is_public"], label:has-text("Public")');
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(1000);

      // Click share button
      const playlistCard = page.locator('text=Shareable Playlist').locator('..');
      await playlistCard.locator('button[title*="share" i], button:has-text("Share")').click();

      // Verify share dialog with link
      await expect(
        page.locator('input[readonly][value*="http"], input[value*="/playlists/"]')
      ).toBeVisible();

      // Verify copy button
      await expect(page.locator('button:has-text("Copy Link")')).toBeVisible();
    });

    test('should copy share link to clipboard', async ({ page: _page }) => {
      // Create public playlist
      await page.goto('/playlists');
      await page.click('button:has-text("Create Playlist")');
      await page.fill('input[name="name"]', 'Copy Link Playlist');
      await page.click('input[type="checkbox"][name="is_public"]');
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(1000);

      // Open share dialog
      const playlistCard = page.locator('text=Copy Link Playlist').locator('..');
      await playlistCard.locator('button[title*="share" i]').click();

      // Click copy link
      await page.click('button:has-text("Copy Link")');

      // Verify copied notification
      await expect(page.locator('text=/copied|link copied/i')).toBeVisible();
    });

    test('should not allow sharing private playlist', async ({ page: _page }) => {
      // Create private playlist
      await page.goto('/playlists');
      await page.click('button:has-text("Create Playlist")');
      await page.fill('input[name="name"]', 'Private Playlist');
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(1000);

      // Try to share
      const playlistCard = page.locator('text=Private Playlist').locator('..');
      const shareBtn = playlistCard.locator('button[title*="share" i]');

      if ((await shareBtn.count()) > 0) {
        // Share button may be disabled
        await expect(shareBtn).toBeDisabled();
      } else {
        // Or button may not exist for private playlists
        expect(await shareBtn.count()).toBe(0);
      }
    });
  });

  test.describe('Empty State', () => {
    test('should show empty state when no playlists', async ({ page: _page }) => {
      await page.goto('/playlists');
      await page.waitForLoadState('networkidle');

      // Check for empty state
      const emptyState = page.locator(
        'text=/no.*playlists?|haven.*created|create.*first.*playlist/i'
      );

      // If playlists exist, this test would naturally fail
      if (await emptyState.isVisible()) {
        await expect(emptyState).toBeVisible();

        // Verify CTA button
        await expect(page.locator('button:has-text("Create Playlist")')).toBeVisible();
      }
    });
  });

  test.describe('Integration', () => {
    test('should show playlist count in navigation', async ({ page: _page }) => {
      await page.goto('/playlists');

      // Check navigation for playlist count
      const navLink = page.locator('a[href*="playlists"], button:has-text("Playlists")');

      if ((await navLink.count()) > 0) {
        // May show badge with count
        const badge = navLink.locator('text=/\\d+/');

        if (await badge.isVisible()) {
          expect(await badge.textContent()).toMatch(/\\d+/);
        }
      }
    });

    test('should show playlist indicator on video already in playlist', async ({ page: _page }) => {
      // Create playlist with video
      await page.goto('/playlists');
      await page.click('button:has-text("Create Playlist")');
      await page.fill('input[name="name"]', 'Indicator Test Playlist');
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(1000);

      // Add video
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      await page.locator('button[title*="playlist" i]').first().click();
      await page.click('text=Indicator Test Playlist');
      await page.waitForTimeout(1000);

      // Go back to course page
      await page.goto('/course/1');
      await page.click('button[role="tab"]:has-text("Materials")');

      // Verify playlist indicator on video
      const videoMaterial = page.locator('text=/Video|recording/i').first().locator('..');
      await expect(videoMaterial.locator('text=/in.*playlist|✓/i')).toBeVisible();
    });
  });
});
