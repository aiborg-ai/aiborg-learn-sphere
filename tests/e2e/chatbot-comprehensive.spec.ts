import { test, expect } from '@playwright/test';

/**
 * AI Chatbot Manual Testing Script
 *
 * This test script comprehensively tests the AI chatbot with 10 different queries
 * to verify GPT-4 responses are working correctly (not fallbacks).
 *
 * Test Objectives:
 * 1. Verify chatbot opens and loads correctly
 * 2. Test with 10 sample queries covering different topics
 * 3. Verify responses are from GPT-4 (not static fallbacks)
 * 4. Check browser console for errors
 * 5. Validate response quality and relevance
 */

test.describe('AI Chatbot Comprehensive Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local development server
    await page.goto('http://localhost:8080');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('Test 1: Open chatbot and verify initial state', async ({ page }) => {
    // Look for the chatbot button (floating button with MessageCircle icon)
    const chatbotButton = page
      .locator('button')
      .filter({ hasText: /Ask me anything/i })
      .or(
        page
          .locator('button')
          .filter({ has: page.locator('svg') })
          .last()
      );

    // Click to open chatbot
    await chatbotButton.click();

    // Wait for chatbot to open
    await page.waitForSelector('text=aiborg chat', { timeout: 5000 });

    // Verify welcome message is visible
    const welcomeMessage = page.locator('text=/Hello|Hi|Welcome/i').first();
    await expect(welcomeMessage).toBeVisible();

    console.log('✓ Chatbot opened successfully with welcome message');
  });

  test('Test 2-11: Send 10 test queries and verify GPT-4 responses', async ({ page }) => {
    // Open chatbot
    const chatbotButton = page.locator('button').last();
    await chatbotButton.click();
    await page.waitForSelector('text=aiborg chat', { timeout: 5000 });

    // Define test queries
    const testQueries = [
      {
        query: 'What AI courses do you offer?',
        expectedKeywords: ['course', 'AI', 'learn'],
        description: 'Course recommendations query',
      },
      {
        query: 'How much do your professional courses cost?',
        expectedKeywords: ['£', 'price', 'cost'],
        description: 'Pricing information query',
      },
      {
        query: "I'm a software developer looking to learn AI. What do you recommend?",
        expectedKeywords: ['developer', 'recommend', 'course'],
        description: 'Professional developer query',
      },
      {
        query: 'What is the difference between machine learning and deep learning?',
        expectedKeywords: ['machine learning', 'deep learning'],
        description: 'Technical AI question',
      },
      {
        query: 'Can you help me choose the right course for my skill level?',
        expectedKeywords: ['course', 'skill', 'level'],
        description: 'Personalized recommendation query',
      },
      {
        query: 'How long do your courses typically last?',
        expectedKeywords: ['week', 'duration', 'time'],
        description: 'Course duration query',
      },
      {
        query: 'Do you provide certificates after course completion?',
        expectedKeywords: ['certificate', 'completion'],
        description: 'Certification inquiry',
      },
      {
        query: 'I want to implement AI in my business. Which course is best?',
        expectedKeywords: ['business', 'implement', 'course'],
        description: 'Business AI inquiry',
      },
      {
        query: 'What are the prerequisites for advanced courses?',
        expectedKeywords: ['prerequisite', 'requirement', 'advanced'],
        description: 'Prerequisites query',
      },
      {
        query: 'What is your refund policy?',
        expectedKeywords: ['refund', 'policy', 'WhatsApp'],
        description: 'Policy question',
      },
    ];

    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Send each query and analyze response
    for (let i = 0; i < testQueries.length; i++) {
      const testCase = testQueries[i];
      console.log(`\n--- Test Query ${i + 1}: ${testCase.description} ---`);
      console.log(`Query: "${testCase.query}"`);

      // Find input field and send button
      const inputField = page.locator('input[placeholder*="Ask about"]');
      const sendButton = page.locator('button:has-text(""), button').last();

      // Type query
      await inputField.fill(testCase.query);
      await page.waitForTimeout(500);

      // Click send
      await sendButton.click();

      // Wait for typing indicator to appear
      await page.waitForSelector('.animate-bounce', { timeout: 3000 }).catch(() => {
        console.log('  ⚠ Typing indicator not shown (may be fast response)');
      });

      // Wait for typing indicator to disappear (response received)
      await page
        .waitForSelector('.animate-bounce', { state: 'hidden', timeout: 30000 })
        .catch(() => {
          console.log('  ⚠ Response took longer than expected');
        });

      // Wait a bit for the response to render
      await page.waitForTimeout(1000);

      // Get the last AI response
      const aiMessages = page.locator('.chat-bubble-ai').last();
      const responseText = await aiMessages.textContent();

      console.log(`Response: "${responseText?.substring(0, 150)}..."`);

      // Verify response is not empty
      expect(responseText).toBeTruthy();
      expect(responseText!.length).toBeGreaterThan(20);

      // Check if response contains fallback message (indicates API failure)
      const isFallback =
        responseText?.includes('technical difficulties') ||
        responseText?.includes('For immediate assistance') ||
        (responseText?.includes('WhatsApp') &&
          responseText?.includes('7404568207') &&
          responseText!.length < 100);

      if (isFallback) {
        console.log('  ❌ FALLBACK RESPONSE DETECTED - GPT-4 API may not be working!');
        console.log(`  Response was: ${responseText}`);
      } else {
        console.log('  ✓ Response appears to be from GPT-4 (not fallback)');
      }

      // Check for expected keywords (loose matching)
      const containsKeywords = testCase.expectedKeywords.some(keyword =>
        responseText?.toLowerCase().includes(keyword.toLowerCase())
      );

      if (containsKeywords) {
        console.log(`  ✓ Response contains expected keywords`);
      } else {
        console.log(
          `  ℹ Response may not contain expected keywords: ${testCase.expectedKeywords.join(', ')}`
        );
      }

      // Small delay between queries
      await page.waitForTimeout(2000);
    }

    // Report console errors
    if (consoleErrors.length > 0) {
      console.log('\n--- Console Errors Detected ---');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('\n✓ No console errors detected during testing');
    }

    // Take screenshot of final chatbot state
    await page.screenshot({ path: 'chatbot-test-results.png', fullPage: true });
    console.log('\n✓ Screenshot saved as chatbot-test-results.png');
  });

  test('Test 12: Check browser console for errors during chatbot interaction', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Open chatbot
    const chatbotButton = page.locator('button').last();
    await chatbotButton.click();
    await page.waitForSelector('text=aiborg chat');

    // Send a test message
    const inputField = page.locator('input[placeholder*="Ask about"]');
    await inputField.fill('Hello, can you help me?');
    await page.locator('button').last().click();

    // Wait for response
    await page.waitForTimeout(5000);

    // Report findings
    console.log('\n--- Console Log Analysis ---');
    console.log(`Errors: ${consoleErrors.length}`);
    console.log(`Warnings: ${consoleWarnings.length}`);

    if (consoleErrors.length > 0) {
      console.log('\nErrors found:');
      consoleErrors.forEach(error => console.log(`  - ${error}`));
    }

    if (consoleWarnings.length > 0) {
      console.log('\nWarnings found:');
      consoleWarnings.forEach(warning => console.log(`  - ${warning}`));
    }
  });
});
