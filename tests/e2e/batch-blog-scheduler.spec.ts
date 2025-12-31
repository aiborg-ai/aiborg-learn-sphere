import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Batch Blog Scheduler
 *
 * Tests the complete workflow of the Batch Blog Scheduler feature:
 * - Navigation and access control
 * - Template management (CRUD)
 * - Campaign management
 * - Batch creation with scheduling
 * - Calendar view and management
 * - Job history tracking
 */

// Test configuration
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@test.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'testpassword123';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

test.describe('Batch Blog Scheduler - Complete E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto(BASE_URL);

    // Login as admin (adjust selectors based on your auth flow)
    await page.click('text=Sign In');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for navigation to complete
    await page.waitForURL('**/');

    // Navigate to admin panel
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to Batch Blog Scheduler from admin dashboard', async ({ page }) => {
    // Find and click the Batch Blog Scheduler button in header
    const schedulerButton = page.locator('a[href="/admin/batch-blog-scheduler"]').first();
    await expect(schedulerButton).toBeVisible();
    await schedulerButton.click();

    // Verify navigation
    await expect(page).toHaveURL(/.*\/admin\/batch-blog-scheduler/);

    // Verify page header
    await expect(page.locator('h1:has-text("Batch Blog Scheduler")')).toBeVisible();

    // Verify all tabs are present
    await expect(page.locator('text=Batch Creator')).toBeVisible();
    await expect(page.locator('text=Calendar')).toBeVisible();
    await expect(page.locator('text=Templates')).toBeVisible();
    await expect(page.locator('text=Campaigns')).toBeVisible();
    await expect(page.locator('text=History')).toBeVisible();
  });

  test('should create a new blog template', async ({ page }) => {
    // Navigate to Batch Blog Scheduler
    await page.goto(`${BASE_URL}/admin/batch-blog-scheduler`);

    // Click Templates tab
    await page.click('button:has-text("Templates")');
    await page.waitForTimeout(500);

    // Click New Template button
    await page.click('button:has-text("New Template")');

    // Fill template form
    await page.fill('input[name="name"]', 'E2E Test Template');
    await page.fill('textarea[name="description"]', 'Template created by E2E test');
    await page.fill('textarea[name="topic_template"]', 'Complete Guide to {topic}');

    // Select audience
    await page.click('[role="combobox"]:near(:text("Audience"))');
    await page.click('[role="option"]:has-text("Professional")');

    // Select tone
    await page.click('[role="combobox"]:near(:text("Tone"))');
    await page.click('[role="option"]:has-text("Technical")');

    // Select length
    await page.click('[role="combobox"]:near(:text("Length"))');
    await page.click('[role="option"]:has-text("Medium")');

    // Fill keywords
    await page.fill('input[name="keywords"]', 'test, e2e, automation');

    // Fill default tags
    await page.fill('input[name="default_tags"]', 'Test, E2E');

    // Submit form
    await page.click('button[type="submit"]:has-text("Create Template")');

    // Verify success toast
    await expect(page.locator('text=Template created')).toBeVisible({ timeout: 5000 });

    // Verify template appears in list
    await expect(page.locator('text=E2E Test Template')).toBeVisible();
  });

  test('should create a new campaign', async ({ page }) => {
    // Navigate to Batch Blog Scheduler
    await page.goto(`${BASE_URL}/admin/batch-blog-scheduler`);

    // Click Campaigns tab
    await page.click('button:has-text("Campaigns")');
    await page.waitForTimeout(500);

    // Click New Campaign button
    await page.click('button:has-text("New Campaign")');

    // Fill campaign form
    await page.fill('input[name="name"]', 'E2E Test Campaign');
    await page.fill('textarea[name="description"]', 'Campaign created by E2E test');

    // Set target post count
    await page.fill('input[name="target_post_count"]', '5');

    // Submit form
    await page.click('button[type="submit"]:has-text("Create Campaign")');

    // Verify success toast
    await expect(page.locator('text=Campaign created')).toBeVisible({ timeout: 5000 });

    // Verify campaign appears in grid
    await expect(page.locator('text=E2E Test Campaign')).toBeVisible();
  });

  test('should create batch with manual topics', async ({ page }) => {
    // Navigate to Batch Blog Scheduler
    await page.goto(`${BASE_URL}/admin/batch-blog-scheduler`);

    // Should be on Batch Creator tab by default
    await expect(page.locator('h2:has-text("Topic Input")')).toBeVisible();

    // Select Manual Entry method (should be default)
    await page.click('label:has-text("Manual Entry")');

    // Enter topics (one per line)
    const topics = 'Machine Learning\nArtificial Intelligence\nNeural Networks';
    await page.fill('textarea[placeholder*="one topic per line"]', topics);

    // Fill bulk parameters
    await page.click('[role="combobox"]:near(:text("Audience"))');
    await page.click('[role="option"]:has-text("Professional")');

    await page.click('[role="combobox"]:near(:text("Tone"))');
    await page.click('[role="option"]:has-text("Technical")');

    // Enable auto-scheduling
    await page.click('input[type="checkbox"]:near(:text("Auto-Schedule"))');

    // Set start date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('input[type="date"]', tomorrow.toISOString().split('T')[0]);

    // Set frequency
    await page.click('[role="combobox"]:near(:text("Frequency"))');
    await page.click('[role="option"]:has-text("Weekly")');

    // Set preferred time
    await page.fill('input[type="time"]', '09:00');

    // Verify preview shows 3 topics
    await expect(page.locator('text=3 posts will be created')).toBeVisible();

    // Click Generate Batch
    await page.click('button:has-text("Generate Batch")');

    // Verify progress modal appears
    await expect(page.locator('text=Batch Generation Progress')).toBeVisible({ timeout: 5000 });

    // Wait for completion (may take a while with Ollama)
    // Note: In a real test, you might want to mock the AI generation
    await expect(page.locator('text=Batch generation complete')).toBeVisible({ timeout: 120000 });

    // Verify success message
    await expect(page.locator('text=3 posts created successfully')).toBeVisible();
  });

  test('should view and filter posts in calendar', async ({ page }) => {
    // Navigate to Batch Blog Scheduler
    await page.goto(`${BASE_URL}/admin/batch-blog-scheduler`);

    // Click Calendar tab
    await page.click('button:has-text("Calendar")');
    await page.waitForTimeout(500);

    // Verify calendar header
    await expect(page.locator('h2:has-text("Publishing Calendar")')).toBeVisible();

    // Test status filter
    await page.click('[role="combobox"]:near(:text("Status"))');
    await page.click('[role="option"]:has-text("Scheduled")');

    // Verify filter is applied
    await expect(page.locator('text=Showing')).toBeVisible();

    // Reset filter
    await page.click('[role="combobox"]:near(:text("Status"))');
    await page.click('[role="option"]:has-text("All Statuses")');
  });

  test('should reschedule a post from calendar', async ({ page }) => {
    // Navigate to Batch Blog Scheduler
    await page.goto(`${BASE_URL}/admin/batch-blog-scheduler`);

    // Click Calendar tab
    await page.click('button:has-text("Calendar")');
    await page.waitForTimeout(500);

    // Find first post and click edit button
    const firstEditButton = page.locator('button:has-text("Edit")').first();
    if (await firstEditButton.isVisible()) {
      await firstEditButton.click();

      // Verify reschedule dialog opens
      await expect(page.locator('text=Reschedule Post')).toBeVisible();

      // Change date
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 7);

      // Click calendar button and select new date
      await page.click('button:has-text("Pick a date")');
      // Note: Calendar date selection would need more specific implementation

      // Change time
      await page.fill('input[type="time"]', '14:00');

      // Click Reschedule button
      await page.click('button:has-text("Reschedule")');

      // Verify success
      await expect(page.locator('text=rescheduled')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should view batch job history', async ({ page }) => {
    // Navigate to Batch Blog Scheduler
    await page.goto(`${BASE_URL}/admin/batch-blog-scheduler`);

    // Click History tab
    await page.click('button:has-text("History")');
    await page.waitForTimeout(500);

    // Verify history header
    await expect(page.locator('h2:has-text("Batch Job History")')).toBeVisible();

    // Verify statistics cards are visible
    await expect(page.locator('text=Total Jobs')).toBeVisible();
    await expect(page.locator('text=Posts Generated')).toBeVisible();
    await expect(page.locator('text=Success Rate')).toBeVisible();

    // Find and click on a job to view details
    const viewDetailsButton = page.locator('button:has-text("View Details")').first();
    if (await viewDetailsButton.isVisible()) {
      await viewDetailsButton.click();

      // Verify details modal
      await expect(page.locator('text=Batch Job Details')).toBeVisible();

      // Verify key information is displayed
      await expect(page.locator('text=Status')).toBeVisible();
      await expect(page.locator('text=Total Posts')).toBeVisible();

      // Close modal
      await page.click('button:has-text("Close")');
    }
  });

  test('should use template to create batch', async ({ page }) => {
    // Navigate to Batch Blog Scheduler
    await page.goto(`${BASE_URL}/admin/batch-blog-scheduler`);

    // Should be on Batch Creator tab
    await page.click('label:has-text("Use Template")');

    // Select a template from dropdown
    await page.click('[role="combobox"]:near(:text("Select Template"))');

    // Wait for templates to load
    await page.waitForTimeout(1000);

    // Select first available template
    const firstTemplate = page.locator('[role="option"]').first();
    if (await firstTemplate.isVisible()) {
      await firstTemplate.click();

      // Verify template parameters are loaded
      // The form should be pre-filled with template values
      await page.waitForTimeout(500);

      // Enter topics
      await page.fill('textarea[placeholder*="one topic per line"]', 'Topic 1\nTopic 2');

      // Generate batch
      await page.click('button:has-text("Generate Batch")');

      // Verify progress modal
      await expect(page.locator('text=Batch Generation Progress')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle template deletion', async ({ page }) => {
    // Navigate to Batch Blog Scheduler
    await page.goto(`${BASE_URL}/admin/batch-blog-scheduler`);

    // Click Templates tab
    await page.click('button:has-text("Templates")');
    await page.waitForTimeout(500);

    // Find E2E Test Template and delete it
    const testTemplateRow = page.locator('tr:has-text("E2E Test Template")');
    if (await testTemplateRow.isVisible()) {
      // Click more options menu
      await testTemplateRow.locator('button[role="button"]').last().click();

      // Click delete
      await page.click('text=Delete');

      // Confirm deletion in dialog
      page.on('dialog', dialog => dialog.accept());

      // Verify template is removed
      await expect(testTemplateRow).not.toBeVisible({ timeout: 5000 });

      // Verify success toast
      await expect(page.locator('text=deleted')).toBeVisible();
    }
  });

  test('should validate batch creation limits', async ({ page }) => {
    // Navigate to Batch Blog Scheduler
    await page.goto(`${BASE_URL}/admin/batch-blog-scheduler`);

    // Try to create more than 50 posts
    const tooManyTopics = Array(51).fill('Test Topic').join('\n');
    await page.fill('textarea[placeholder*="one topic per line"]', tooManyTopics);

    // Try to generate
    await page.click('button:has-text("Generate Batch")');

    // Verify error message
    await expect(page.locator('text=Maximum 50 posts per batch')).toBeVisible();
  });

  test('should display empty states correctly', async ({ page }) => {
    // Navigate to Batch Blog Scheduler
    await page.goto(`${BASE_URL}/admin/batch-blog-scheduler`);

    // Check Templates tab empty state
    await page.click('button:has-text("Templates")');
    // If no templates exist, should show empty state
    const templatesEmptyState = page.locator('text=No templates yet');
    if (await templatesEmptyState.isVisible()) {
      await expect(page.locator('text=Create your first template')).toBeVisible();
    }

    // Check Campaigns tab empty state
    await page.click('button:has-text("Campaigns")');
    const campaignsEmptyState = page.locator('text=No campaigns yet');
    if (await campaignsEmptyState.isVisible()) {
      await expect(page.locator('text=Create your first campaign')).toBeVisible();
    }

    // Check History tab empty state
    await page.click('button:has-text("History")');
    const historyEmptyState = page.locator('text=No batch jobs yet');
    if (await historyEmptyState.isVisible()) {
      await expect(page.locator('text=Create your first batch')).toBeVisible();
    }
  });
});

test.describe('Batch Blog Scheduler - Access Control', () => {
  test('should require admin access', async ({ page }) => {
    // Try to access without being admin
    await page.goto(`${BASE_URL}/admin/batch-blog-scheduler`);

    // Should redirect or show access denied
    // Adjust based on your access control implementation
    const isAccessDenied = await page
      .locator('text=Access Denied')
      .isVisible()
      .catch(() => false);
    const isRedirected = page.url() !== `${BASE_URL}/admin/batch-blog-scheduler`;

    expect(isAccessDenied || isRedirected).toBeTruthy();
  });
});

test.describe('Batch Blog Scheduler - Performance', () => {
  test('should load all tabs within acceptable time', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/batch-blog-scheduler`);

    const tabs = ['Batch Creator', 'Calendar', 'Templates', 'Campaigns', 'History'];

    for (const tab of tabs) {
      const startTime = Date.now();
      await page.click(`button:has-text("${tab}")`);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Each tab should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    }
  });
});
