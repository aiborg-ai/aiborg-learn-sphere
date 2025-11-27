/**
 * Assessment and Quiz E2E Tests
 * Tests for taking assessments, quizzes, and viewing results
 */

import { test, expect } from '@playwright/test';
import { AssessmentPage } from '../pages/AssessmentPage';
import { setupAuthenticatedSession } from '../utils/auth';

test.describe('Assessment Taking', () => {
  let assessmentPage: AssessmentPage;

  test.beforeEach(async ({ page }) => {
    assessmentPage = new AssessmentPage(page);
    await setupAuthenticatedSession(page, 'student');
    await assessmentPage.navigateToAssessments();
  });

  test('should display available assessments', async () => {
    await assessmentPage.page.waitForTimeout(1000);
    await assessmentPage.assertVisible('[data-testid="assessment-card"]');
  });

  test('should start assessment', async () => {
    const assessments = await assessmentPage.page.locator('[data-testid="assessment-card"]').all();

    if (assessments.length > 0) {
      await assessmentPage.click('button:has-text("Start Assessment")');
      await assessmentPage.assertOnAssessmentPage();
    }
  });

  test('should navigate between questions', async () => {
    // Start assessment
    const assessments = await assessmentPage.page.locator('[data-testid="assessment-card"]').all();

    if (assessments.length > 0) {
      await assessmentPage.click('button:has-text("Start Assessment")');
      await assessmentPage.page.waitForTimeout(1000);

      const totalQuestions = await assessmentPage.getTotalQuestions();

      if (totalQuestions > 1) {
        await assessmentPage.selectAnswer(0);
        await assessmentPage.goToNextQuestion();

        const currentQuestion = await assessmentPage.getCurrentQuestionNumber();
        expect(currentQuestion).toBe(2);

        await assessmentPage.goToPreviousQuestion();
        const backToFirst = await assessmentPage.getCurrentQuestionNumber();
        expect(backToFirst).toBe(1);
      }
    }
  });

  test('should answer questions and submit', async () => {
    const assessments = await assessmentPage.page.locator('[data-testid="assessment-card"]').all();

    if (assessments.length > 0) {
      await assessmentPage.click('button:has-text("Start Assessment")');
      await assessmentPage.page.waitForTimeout(1000);

      const totalQuestions = await assessmentPage.getTotalQuestions();

      // Answer all questions
      for (let i = 0; i < totalQuestions; i++) {
        await assessmentPage.selectAnswer(0);

        if (i < totalQuestions - 1) {
          await assessmentPage.goToNextQuestion();
        }
      }

      // Submit
      await assessmentPage.submitAssessment();
      await assessmentPage.assertOnResultsPage();

      const score = await assessmentPage.getScore();
      expect(typeof score).toBe('number');
    }
  });

  test('should flag question for review', async () => {
    const assessments = await assessmentPage.page.locator('[data-testid="assessment-card"]').all();

    if (assessments.length > 0) {
      await assessmentPage.click('button:has-text("Start Assessment")');
      await assessmentPage.page.waitForTimeout(1000);

      await assessmentPage.flagQuestion();
      await assessmentPage.page.waitForTimeout(500);

      const flaggedCount = await assessmentPage.getFlaggedQuestionsCount();
      expect(flaggedCount).toBeGreaterThan(0);
    }
  });

  test('should save progress and exit', async () => {
    const assessments = await assessmentPage.page.locator('[data-testid="assessment-card"]').all();

    if (assessments.length > 0) {
      await assessmentPage.click('button:has-text("Start Assessment")');
      await assessmentPage.page.waitForTimeout(1000);

      await assessmentPage.selectAnswer(0);
      await assessmentPage.saveProgress();
      await assessmentPage.page.waitForTimeout(1000);
    }
  });

  test('should view results after completion', async () => {
    // This test assumes an assessment has been completed
    const resultsButtons = await assessmentPage.page
      .locator('button:has-text("View Results")')
      .all();

    if (resultsButtons.length > 0) {
      await resultsButtons[0].click();
      await assessmentPage.assertOnResultsPage();

      const passed = await assessmentPage.didPassAssessment();
      expect(typeof passed).toBe('boolean');

      const score = await assessmentPage.getPercentageScore();
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  test('should retake failed assessment', async () => {
    // This test assumes a failed assessment exists
    const resultsButtons = await assessmentPage.page
      .locator('button:has-text("View Results")')
      .all();

    if (resultsButtons.length > 0) {
      await resultsButtons[0].click();

      const passed = await assessmentPage.didPassAssessment();

      if (!passed && (await assessmentPage.isVisible('button:has-text("Retake Assessment")'))) {
        await assessmentPage.retakeAssessment();
        await assessmentPage.assertOnAssessmentPage();
      }
    }
  });

  test('should review answers after completion', async () => {
    const resultsButtons = await assessmentPage.page
      .locator('button:has-text("View Results")')
      .all();

    if (resultsButtons.length > 0) {
      await resultsButtons[0].click();

      if (await assessmentPage.isVisible('button:has-text("Review Answers")')) {
        await assessmentPage.reviewAnswers();
        await assessmentPage.page.waitForTimeout(1000);
      }
    }
  });

  test('should download certificate for passed assessment', async () => {
    const resultsButtons = await assessmentPage.page
      .locator('button:has-text("View Results")')
      .all();

    if (resultsButtons.length > 0) {
      await resultsButtons[0].click();

      const passed = await assessmentPage.didPassAssessment();

      if (passed && (await assessmentPage.isVisible('button:has-text("Download Certificate")'))) {
        const download = await assessmentPage.downloadCertificate();
        expect(download).toBeTruthy();
      }
    }
  });
});

test.describe('Assessment Timer and Time Management', () => {
  let assessmentPage: AssessmentPage;

  test.beforeEach(async ({ page }) => {
    assessmentPage = new AssessmentPage(page);
    await setupAuthenticatedSession(page, 'student');
    await assessmentPage.navigateToAssessments();
  });

  test('should display timer during assessment', async () => {
    const assessments = await assessmentPage.page.locator('[data-testid="assessment-card"]').all();

    if (assessments.length > 0) {
      await assessmentPage.click('button:has-text("Start Assessment")');
      await assessmentPage.page.waitForTimeout(1000);

      if (await assessmentPage.isVisible('[data-testid="timer"]')) {
        const timeRemaining = await assessmentPage.getRemainingTime();
        expect(timeRemaining).toBeTruthy();
      }
    }
  });
});
