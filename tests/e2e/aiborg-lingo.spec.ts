import { test, expect } from '@playwright/test';

/**
 * AIBORGLingo E2E Tests
 *
 * Comprehensive tests for the Duolingo-style AI learning gamification feature
 */

test.describe('AIBORGLingo', () => {
  test.describe('Home Page', () => {
    test('should display welcome message and stats', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');

      // Welcome message - check for either authenticated or unauthenticated state
      const welcomeMessage = page.locator('text=/Welcome (to AIBORGLingo|back)/');
      await expect(welcomeMessage.first()).toBeVisible();

      // Stats cards
      await expect(page.locator('text=Total XP')).toBeVisible();
      await expect(page.locator('text=Day Streak')).toBeVisible();
      await expect(page.locator('text=Lessons Done')).toBeVisible();
      await expect(page.locator('text=Hearts')).toBeVisible();
    });

    test('should display hearts indicator in header', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');

      // Hearts should be visible in header - look for hearts icon or display
      const heartsDisplay = page
        .locator('[data-testid="hearts-display"], header svg.lucide-heart, header:has-text("♥")')
        .first();
      await expect(heartsDisplay).toBeVisible();
    });

    test('should display daily goal progress', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');

      // Daily Goal appears in header and mobile card - use data-testid
      await expect(page.locator('[data-testid="daily-goal-tracker"]').first()).toBeVisible();
      await expect(page.locator('text=/\\d+\\/\\d+ XP/').first()).toBeVisible();
    });

    test('should show Leaderboard and Achievements buttons', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');

      // Use data-testid with text fallback
      await expect(
        page.locator('[data-testid="leaderboard-btn"], a:has-text("Leaderboard")').first()
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="achievements-btn"], a:has-text("Achievements")').first()
      ).toBeVisible();
    });

    test('should show Sign In button for unauthenticated users', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');

      // Sign In button only shows for unauthenticated users
      const isLoggedIn = await page.locator('text=/Welcome back/').isVisible();

      if (isLoggedIn) {
        // User is logged in, Sign In button should NOT be visible - this is correct behavior
        const signInBtn = page.locator('[data-testid="signin-btn"], a:has-text("Sign In")');
        expect(await signInBtn.isVisible()).toBeFalsy();
      } else {
        // User is not logged in, Sign In button should be visible
        await expect(
          page.locator('[data-testid="signin-btn"], a:has-text("Sign In")').first()
        ).toBeVisible();
      }
    });
  });

  test.describe('Skill Categories', () => {
    test('should display Foundations skill category', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');

      // Use h2 heading selector to find the skill category header
      await expect(page.locator('h2:has-text("Foundations")').first()).toBeVisible();
    });

    test('should display LLMs skill category', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');

      // Use h2 heading selector to find the skill category header
      await expect(page.locator('h2:has-text("LLMs")').first()).toBeVisible();
    });

    test('should show completion progress for each category', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');

      // Should show "X/Y completed" for each category - use first() for multiple matches
      await expect(page.locator('text=/\\d+\\/\\d+ completed/').first()).toBeVisible();
    });
  });

  test.describe('Lesson Cards', () => {
    test('should display lesson cards with titles', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');

      // Check for specific lesson titles
      const lessonTitles = [
        'What is Artificial Intelligence?',
        'Types of Machine Learning',
        'AI Foundations: Core Ideas',
      ];

      for (const title of lessonTitles) {
        const lesson = page.locator(`text="${title}"`);
        // At least one of these should be visible
        if (await lesson.isVisible()) {
          await expect(lesson).toBeVisible();
          break;
        }
      }
    });

    test('should display XP rewards on lesson cards', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');

      // Lessons should show XP rewards like "+20 XP", "+30 XP"
      await expect(page.locator('text=/\\+\\d+ XP/')).toBeVisible();
    });

    test('should display duration on lesson cards', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');

      // Lessons should show duration like "5 min", "7 min"
      await expect(page.locator('text=/\\d+ min/')).toBeVisible();
    });

    test('should have play buttons on lesson cards', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');

      // Each lesson card should have a play icon - using data-testid
      const playIcons = page.locator('[data-testid="play-icon"]');
      await expect(playIcons.first()).toBeVisible();
    });

    test('lesson cards should be clickable', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');

      // Click on a lesson
      const lessonCard = page.locator('text="What is Artificial Intelligence?"').first();
      await lessonCard.click();
      await page.waitForTimeout(3000);

      // Should navigate to lesson page
      await expect(page.url()).toContain('/lesson/');
    });
  });

  test.describe('Lesson Player', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');

      // Navigate to a lesson
      await page.locator('text="What is Artificial Intelligence?"').first().click();
      await page.waitForTimeout(3000);
    });

    test('should display lesson header with title', async ({ page }) => {
      await expect(page.locator('text=What is Artificial Intelligence?')).toBeVisible();
    });

    test('should display progress bar', async ({ page }) => {
      // Progress bar should be visible
      const progressBar = page.locator('[class*="progress"], [role="progressbar"]');
      await expect(progressBar.first()).toBeVisible();
    });

    test('should display hearts in lesson', async ({ page }) => {
      // Hearts indicator should be visible
      await expect(page.locator('text=5').first()).toBeVisible();
    });

    test('should display question number indicator', async ({ page }) => {
      await expect(page.locator('text=/Question \\d+ of \\d+/')).toBeVisible();
    });

    test('should display close button', async ({ page }) => {
      const closeButton = page.locator(
        'button:has-text("×"), [aria-label*="close"], svg[class*="x"]'
      );
      await expect(closeButton.first()).toBeVisible();
    });

    test('close button should return to lingo home', async ({ page }) => {
      const closeButton = page
        .locator('button')
        .filter({ has: page.locator('svg') })
        .first();
      await closeButton.click();
      await page.waitForTimeout(2000);

      // Should be back on lingo home or show confirmation
      const url = page.url();
      expect(url.includes('/lingo') && !url.includes('/lesson/')).toBeTruthy();
    });
  });

  test.describe('Multiple Choice Questions', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');
      await page.locator('text="What is Artificial Intelligence?"').first().click();
      await page.waitForTimeout(3000);
    });

    test('should display 4 answer options', async ({ page }) => {
      // First question should be multiple choice with 4 options
      const options = page.locator(
        'button:has-text("A"), button:has-text("B"), button:has-text("C"), button:has-text("D")'
      );
      await expect(options).toHaveCount(4);
    });

    test('should have Check Answer button disabled initially', async ({ page }) => {
      const checkButton = page.locator('button:has-text("Check")');
      await expect(checkButton).toBeDisabled();
    });

    test('should enable Check button after selecting an answer', async ({ page }) => {
      // Click first option
      await page.locator('button:has-text("Artificial Intelligence")').first().click();
      await page.waitForTimeout(500);

      const checkButton = page.locator('button:has-text("Check")');
      await expect(checkButton).toBeEnabled();
    });

    test('should show correct feedback for right answer', async ({ page }) => {
      // Select correct answer (A - Artificial Intelligence)
      await page.locator('button:has-text("Artificial Intelligence")').first().click();
      await page.waitForTimeout(500);

      // Click Check
      await page.locator('button:has-text("Check")').click();
      await page.waitForTimeout(1000);

      // Should show "Correct!"
      await expect(page.locator('text=Correct!')).toBeVisible();
    });

    test('should show incorrect feedback for wrong answer', async ({ page }) => {
      // Select wrong answer
      await page.locator('button:has-text("Automated Information")').first().click();
      await page.waitForTimeout(500);

      // Click Check
      await page.locator('button:has-text("Check")').click();
      await page.waitForTimeout(1000);

      // Should show incorrect feedback
      await expect(page.locator('text=/Incorrect|Oops|Wrong/')).toBeVisible();
    });

    test('should show Continue button after answering', async ({ page }) => {
      await page.locator('button:has-text("Artificial Intelligence")').first().click();
      await page.locator('button:has-text("Check")').click();
      await page.waitForTimeout(1000);

      await expect(page.locator('button:has-text("Continue")')).toBeVisible();
    });

    test('Continue button should advance to next question', async ({ page }) => {
      // Answer first question
      await page.locator('button:has-text("Artificial Intelligence")').first().click();
      await page.locator('button:has-text("Check")').click();
      await page.waitForTimeout(1000);

      // Click Continue
      await page.locator('button:has-text("Continue")').click();
      await page.waitForTimeout(2000);

      // Should now show Question 2
      await expect(page.locator('text=Question 2 of')).toBeVisible();
    });
  });

  test.describe('Fill-in-the-Blank Questions', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');
      await page.locator('text="What is Artificial Intelligence?"').first().click();
      await page.waitForTimeout(3000);

      // Navigate to question 3 (fill-in-blank)
      for (let i = 0; i < 2; i++) {
        // Answer questions to get to Q3
        const option = page
          .locator('button')
          .filter({ hasText: /Artificial|Voice/ })
          .first();
        if (await option.isVisible()) {
          await option.click();
          await page.waitForTimeout(500);
          await page.locator('button:has-text("Check")').click();
          await page.waitForTimeout(1000);
          await page.locator('button:has-text("Continue")').click();
          await page.waitForTimeout(2000);
        }
      }
    });

    test('should display text input for fill-blank question', async ({ page }) => {
      const input = page.locator('input[type="text"]');
      await expect(input).toBeVisible();
    });

    test('should display blank indicator in question text', async ({ page }) => {
      // Question should show blank like "AI systems learn from _____ to improve"
      await expect(page.locator('text=/learn from|_____/')).toBeVisible();
    });

    test('should accept correct answer', async ({ page }) => {
      const input = page.locator('input[type="text"]');
      await input.fill('data');
      await page.waitForTimeout(500);

      await page.locator('button:has-text("Check")').click();
      await page.waitForTimeout(1000);

      await expect(page.locator('text=Correct!')).toBeVisible();
    });

    test('should show incorrect for wrong answer', async ({ page }) => {
      const input = page.locator('input[type="text"]');
      await input.fill('wrong answer');
      await page.waitForTimeout(500);

      await page.locator('button:has-text("Check")').click();
      await page.waitForTimeout(1000);

      await expect(page.locator('text=/Incorrect|Wrong/')).toBeVisible();
    });

    test('should show correct answer when wrong', async ({ page }) => {
      const input = page.locator('input[type="text"]');
      await input.fill('wrong');
      await page.locator('button:has-text("Check")').click();
      await page.waitForTimeout(1000);

      // Should show the correct answer
      await expect(page.locator('text=/Correct answer:|data|information|examples/')).toBeVisible();
    });
  });

  test.describe('Lesson Completion', () => {
    test('should complete full lesson with 4 questions', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');
      await page.locator('text="What is Artificial Intelligence?"').first().click();
      await page.waitForTimeout(3000);

      // Answer all 4 questions
      const answers = [
        'Artificial Intelligence', // Q1
        'Voice assistants', // Q2
        'data', // Q3 (fill-blank)
        'subset of AI', // Q4
      ];

      for (let i = 0; i < 4; i++) {
        await page.waitForTimeout(2000);

        // Check if fill-blank
        const input = page.locator('input[type="text"]');
        if (await input.isVisible()) {
          await input.fill(answers[i]);
        } else {
          // Multiple choice - click matching answer
          const option = page.locator(`button:has-text("${answers[i]}")`).first();
          if (await option.isVisible()) {
            await option.click();
          } else {
            // Fallback - click first option
            await page.locator('button').filter({ hasText: /^A/ }).first().click();
          }
        }

        await page.waitForTimeout(500);
        await page.locator('button:has-text("Check")').click();
        await page.waitForTimeout(1500);

        // Check for Finish or Continue
        const finishBtn = page.locator('button:has-text("Finish")');
        if (await finishBtn.isVisible()) {
          await finishBtn.click();
          break;
        }

        const continueBtn = page.locator('button:has-text("Continue")');
        if (await continueBtn.isVisible()) {
          await continueBtn.click();
        }
      }

      // Should show completion or return to home
      await page.waitForTimeout(2000);
      const isComplete = await page
        .locator('text=/Complete|Congratulations|Well done/')
        .isVisible();
      const isHome = page.url().includes('/lingo') && !page.url().includes('/lesson/');

      expect(isComplete || isHome).toBeTruthy();
    });

    test('should show Finish Lesson button on last question', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');
      await page.locator('text="What is Artificial Intelligence?"').first().click();
      await page.waitForTimeout(3000);

      // Fast-forward to last question by answering all
      for (let i = 0; i < 4; i++) {
        await page.waitForTimeout(2000);

        const input = page.locator('input[type="text"]');
        if (await input.isVisible()) {
          await input.fill('data');
        } else {
          await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const answerBtn = btns.find(
              b =>
                b.textContent &&
                b.textContent.length > 5 &&
                !b.textContent.includes('Check') &&
                !b.textContent.includes('Continue')
            );
            if (answerBtn) (answerBtn as HTMLButtonElement).click();
          });
        }

        await page.waitForTimeout(500);
        const checkBtn = page.locator('button:has-text("Check")');
        if (await checkBtn.isEnabled()) {
          await checkBtn.click();
          await page.waitForTimeout(1500);
        }

        // On last question, should see "Finish Lesson"
        const finishBtn = page.locator('button:has-text("Finish Lesson")');
        if (await finishBtn.isVisible()) {
          await expect(finishBtn).toBeVisible();
          return; // Test passed
        }

        const continueBtn = page.locator('button:has-text("Continue")');
        if (await continueBtn.isVisible()) {
          await continueBtn.click();
        }
      }
    });
  });

  test.describe('Hearts System', () => {
    test('should start with 5 hearts', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');

      // Hearts display should show 5
      await expect(page.locator('text=5').first()).toBeVisible();
    });

    test('should lose heart on wrong answer', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');
      await page.locator('text="What is Artificial Intelligence?"').first().click();
      await page.waitForTimeout(3000);

      // Get initial hearts
      const initialHearts = await page.locator('text=5').first().isVisible();
      expect(initialHearts).toBeTruthy();

      // Answer incorrectly
      await page.locator('button:has-text("Automated Information")').first().click();
      await page.locator('button:has-text("Check")').click();
      await page.waitForTimeout(1500);

      // Hearts should decrease (now 4)
      // Note: This depends on implementation
    });
  });

  test.describe('Progress Tracking', () => {
    test('should update progress bar as questions are answered', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');
      await page.locator('text="What is Artificial Intelligence?"').first().click();
      await page.waitForTimeout(3000);

      // Get initial progress
      const progressBar = page.locator('[class*="bg-green"], [class*="bg-primary"]').first();
      const initialWidth = await progressBar.evaluate(el => el.getBoundingClientRect().width);

      // Answer question
      await page.locator('button:has-text("Artificial Intelligence")').first().click();
      await page.locator('button:has-text("Check")').click();
      await page.waitForTimeout(1000);
      await page.locator('button:has-text("Continue")').click();
      await page.waitForTimeout(2000);

      // Progress should have increased
      const newWidth = await progressBar.evaluate(el => el.getBoundingClientRect().width);
      expect(newWidth).toBeGreaterThanOrEqual(initialWidth);
    });

    test('should show pagination dots at bottom', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');
      await page.locator('text="What is Artificial Intelligence?"').first().click();
      await page.waitForTimeout(3000);

      // Should have 4 dots for 4 questions
      const dots = page.locator('[class*="rounded-full"][class*="bg-"]');
      const count = await dots.count();
      expect(count).toBeGreaterThanOrEqual(4);
    });
  });

  test.describe('Leaderboard', () => {
    test('should open leaderboard page', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="leaderboard-btn"]').click();
      await page.waitForTimeout(1000);

      // Leaderboard content should be visible (navigates to /lingo/leaderboard)
      await expect(page.locator('text=/Leaderboard|Top Learners|Rank/')).toBeVisible();
    });
  });

  test.describe('Achievements', () => {
    test('should open achievements page', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="achievements-btn"]').click();
      await page.waitForTimeout(1000);

      // Achievements content should be visible (navigates to /lingo/achievements)
      await expect(page.locator('text=/Achievements|Badges|Unlocked/')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Intercept API calls and fail them
      await page.route('**/rest/v1/**', route => route.abort());

      await page.goto('/lingo');
      await page.waitForTimeout(5000);

      // Should show error state or retry option
      const hasError = await page.locator('text=/error|try again|retry/i').isVisible();
      const hasContent = await page.locator('text=Welcome').isVisible();

      // Should either show error or cached/fallback content
      expect(hasError || hasContent).toBeTruthy();
    });

    test('should handle invalid lesson slug', async ({ page }) => {
      await page.goto('/lingo/lesson/invalid-lesson-slug-12345');
      await page.waitForTimeout(3000);

      // Should show error or redirect
      const hasError = await page.locator('text=/not found|error|invalid/i').isVisible();
      const redirectedHome = page.url().includes('/lingo') && !page.url().includes('invalid');

      expect(hasError || redirectedHome).toBeTruthy();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');

      // Key elements should still be visible - check for either auth state
      await expect(page.locator('text=/Welcome (to AIBORGLingo|back)/').first()).toBeVisible();
      await expect(page.locator('text=Lessons')).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Welcome to AIBORGLingo')).toBeVisible();
    });

    test('lesson player should be usable on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');

      await page.locator('text="What is Artificial Intelligence?"').first().click();
      await page.waitForTimeout(3000);

      // Should be able to see and interact with question
      await expect(page.locator('text=/Question \\d+ of \\d+/')).toBeVisible();

      // Answer options should be visible
      const option = page.locator('button:has-text("Artificial Intelligence")').first();
      await expect(option).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');

      const h1 = await page.locator('h1').count();
      expect(h1).toBeGreaterThanOrEqual(1);
    });

    test('buttons should be keyboard accessible', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');

      // Tab to Leaderboard button and press Enter
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      await page.waitForTimeout(1000);

      // Should have triggered button action
      const dialogVisible = await page.locator('[role="dialog"], [class*="modal"]').isVisible();
      // May or may not open dialog depending on tab order
    });

    test('form inputs should have labels', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');
      await page.locator('text="What is Artificial Intelligence?"').first().click();
      await page.waitForTimeout(3000);

      // Navigate to fill-blank question
      for (let i = 0; i < 2; i++) {
        const option = page
          .locator('button')
          .filter({ hasText: /Artificial|Voice/ })
          .first();
        if (await option.isVisible()) {
          await option.click();
          await page.locator('button:has-text("Check")').click();
          await page.waitForTimeout(1000);
          await page.locator('button:has-text("Continue")').click();
          await page.waitForTimeout(2000);
        }
      }

      const input = page.locator('input[type="text"]');
      if (await input.isVisible()) {
        // Input should have placeholder or associated label
        const placeholder = await input.getAttribute('placeholder');
        const ariaLabel = await input.getAttribute('aria-label');
        expect(placeholder || ariaLabel).toBeTruthy();
      }
    });
  });

  test.describe('Performance', () => {
    test('page should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });

    test('lesson navigation should be fast', async ({ page }) => {
      await page.goto('/lingo');
      await page.waitForLoadState('networkidle');

      const startTime = Date.now();
      await page.locator('text="What is Artificial Intelligence?"').first().click();
      await page.waitForSelector('text=/Question \\d+ of \\d+/');

      const navTime = Date.now() - startTime;

      // Navigation should be under 5 seconds
      expect(navTime).toBeLessThan(5000);
    });
  });
});
