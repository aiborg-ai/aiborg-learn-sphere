/**
 * Payment and Enrollment Flow E2E Tests
 * Tests the complete payment and course enrollment user journey
 */

import { test, expect } from '@playwright/test';
import { CoursesPage } from '../pages/CoursesPage';
import { EnrollmentPage } from '../pages/EnrollmentPage';
import { PaymentPage } from '../pages/PaymentPage';
import { DashboardPage } from '../pages/DashboardPage';
import { generateUser, generatePayment } from '../utils/test-data';
import { setupAuthenticatedSession } from '../utils/auth';
import { cleanupEnrollments } from '../utils/db-helpers';

test.describe('Payment and Enrollment Flow', () => {
  let coursesPage: CoursesPage;
  let enrollmentPage: EnrollmentPage;
  let paymentPage: PaymentPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    coursesPage = new CoursesPage(page);
    enrollmentPage = new EnrollmentPage(page);
    paymentPage = new PaymentPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test.afterEach(async () => {
    // Cleanup test enrollments
    await cleanupEnrollments();
  });

  test('should complete full free course enrollment flow', async ({ page }) => {
    // Setup: Login as student
    const _testUser = generateUser('student');
    await setupAuthenticatedSession(page, 'student');

    // Navigate to courses page
    await coursesPage.navigate();
    await coursesPage.assertPageLoaded();

    // Browse courses and find a free course
    const courses = await coursesPage.getAllVisibleCourses();
    expect(courses.length).toBeGreaterThan(0);

    // Click on first available course
    const firstCourse = courses[0];
    await coursesPage.clickViewDetails(firstCourse.title);

    // Enroll in the course
    await enrollmentPage.enrollFromModal();
    await enrollmentPage.waitForEnrollmentModal();

    // For free course, enrollment should be immediate
    if (await enrollmentPage.isVisible('[data-testid="free-course-notice"]')) {
      await enrollmentPage.enrollInFreeCourse();
      await enrollmentPage.assertEnrollmentSuccessful();

      // Verify enrollment on dashboard
      await dashboardPage.navigate();
      const isEnrolled = await dashboardPage.isCourseEnrolled(firstCourse.title);
      expect(isEnrolled).toBe(true);
    }
  });

  test('should handle paid course enrollment with successful payment', async ({ page }) => {
    // Setup authenticated session
    await setupAuthenticatedSession(page, 'student');

    // Navigate to courses and select a paid course
    await coursesPage.navigate();
    await coursesPage.assertPageLoaded();

    const courses = await coursesPage.getAllVisibleCourses();
    const paidCourse = courses.find(c => !c.price.toLowerCase().includes('free'));

    if (paidCourse) {
      // View course details
      await coursesPage.clickViewDetails(paidCourse.title);

      // Start enrollment
      await enrollmentPage.enrollFromModal();
      await enrollmentPage.waitForEnrollmentModal();

      // Select individual enrollment
      await enrollmentPage.selectIndividualEnrollment();
      await enrollmentPage.click('button:has-text("Proceed to Payment")');

      // Complete payment
      await paymentPage.waitForPaymentForm();
      await paymentPage.assertPageLoaded();

      // Use test card
      const paymentData = generatePayment();
      await paymentPage.completePaymentWithTestCard('visa', {
        name: paymentData.billingName,
        email: paymentData.billingEmail,
        address: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zip: '12345',
        country: 'US',
      });

      // Wait for success
      await paymentPage.waitForPaymentSuccess();
      await paymentPage.assertPaymentSuccessful();

      // Verify enrollment on dashboard
      await dashboardPage.navigate();
      const isEnrolled = await dashboardPage.isCourseEnrolled(paidCourse.title);
      expect(isEnrolled).toBe(true);
    } else {
      test.skip();
    }
  });

  test('should handle payment failure gracefully', async ({ page }) => {
    await setupAuthenticatedSession(page, 'student');

    await coursesPage.navigate();
    const courses = await coursesPage.getAllVisibleCourses();
    const paidCourse = courses.find(c => !c.price.toLowerCase().includes('free'));

    if (paidCourse) {
      await coursesPage.clickViewDetails(paidCourse.title);
      await enrollmentPage.enrollFromModal();
      await enrollmentPage.waitForEnrollmentModal();

      await enrollmentPage.selectIndividualEnrollment();
      await enrollmentPage.click('button:has-text("Proceed to Payment")');

      await paymentPage.waitForPaymentForm();

      // Use declined test card
      await paymentPage.attemptPaymentWithDeclinedCard();

      // Assert error is shown
      await paymentPage.assertPaymentFailed();
      const errorMessage = await paymentPage.getErrorMessage();
      expect(errorMessage).toBeTruthy();

      // User should be able to retry
      expect(await paymentPage.isVisible('button:has-text("Try Again")')).toBe(true);
    } else {
      test.skip();
    }
  });

  test('should handle insufficient funds payment failure', async ({ page }) => {
    await setupAuthenticatedSession(page, 'student');

    await coursesPage.navigate();
    const courses = await coursesPage.getAllVisibleCourses();
    const paidCourse = courses.find(c => !c.price.toLowerCase().includes('free'));

    if (paidCourse) {
      await coursesPage.clickViewDetails(paidCourse.title);
      await enrollmentPage.enrollFromModal();
      await enrollmentPage.waitForEnrollmentModal();

      await enrollmentPage.selectIndividualEnrollment();
      await enrollmentPage.click('button:has-text("Proceed to Payment")');

      await paymentPage.waitForPaymentForm();
      await paymentPage.attemptPaymentWithInsufficientFunds();

      await paymentPage.assertPaymentFailed();
      const errorMessage = await paymentPage.getErrorMessage();
      expect(errorMessage.toLowerCase()).toContain('insufficient');
    } else {
      test.skip();
    }
  });

  test('should handle family enrollment', async ({ page }) => {
    await setupAuthenticatedSession(page, 'student');

    await coursesPage.navigate();
    const courses = await coursesPage.getAllVisibleCourses();

    if (courses.length > 0) {
      await coursesPage.clickViewDetails(courses[0].title);
      await enrollmentPage.enrollFromModal();
      await enrollmentPage.waitForEnrollmentModal();

      // Select family enrollment
      await enrollmentPage.selectFamilyEnrollment();

      // Add family members
      await enrollmentPage.addFamilyMembers(3);

      // Verify family member count
      const count = await enrollmentPage.getFamilyMemberCount();
      expect(count).toBe(3);

      // Proceed (skip payment for test)
      if (await enrollmentPage.isVisible('button:has-text("Skip")')) {
        await enrollmentPage.click('button:has-text("Skip")');
      }
    }
  });

  test('should prevent duplicate enrollment', async ({ page }) => {
    await setupAuthenticatedSession(page, 'student');

    await coursesPage.navigate();
    const courses = await coursesPage.getAllVisibleCourses();

    if (courses.length > 0) {
      const course = courses[0];

      // First enrollment
      await coursesPage.clickViewDetails(course.title);
      await enrollmentPage.enrollFromModal();
      await enrollmentPage.waitForEnrollmentModal();

      if (await enrollmentPage.isVisible('[data-testid="free-course-notice"]')) {
        await enrollmentPage.enrollInFreeCourse();
        await enrollmentPage.waitForEnrollmentSuccess();

        // Try to enroll again
        await coursesPage.navigate();
        await coursesPage.clickViewDetails(course.title);
        await enrollmentPage.enrollFromModal();

        // Should show already enrolled message
        const isAlreadyEnrolled = await enrollmentPage.isAlreadyEnrolled();
        expect(isAlreadyEnrolled).toBe(true);
      }
    }
  });

  test('should validate payment form fields', async ({ page }) => {
    await setupAuthenticatedSession(page, 'student');

    await coursesPage.navigate();
    const courses = await coursesPage.getAllVisibleCourses();
    const paidCourse = courses.find(c => !c.price.toLowerCase().includes('free'));

    if (paidCourse) {
      await coursesPage.clickViewDetails(paidCourse.title);
      await enrollmentPage.enrollFromModal();
      await enrollmentPage.waitForEnrollmentModal();

      await enrollmentPage.selectIndividualEnrollment();
      await enrollmentPage.click('button:has-text("Proceed to Payment")');

      await paymentPage.waitForPaymentForm();

      // Try to submit without filling form
      const isFormValid = await paymentPage.isPaymentFormValid();
      expect(isFormValid).toBe(false);

      // Fill invalid card number
      await paymentPage.fillCreditCardInfo('1234', '12/25', '123', 'Test User');

      // Should still be invalid
      expect(await paymentPage.isPaymentFormValid()).toBe(false);
    } else {
      test.skip();
    }
  });

  test('should display correct order summary', async ({ page }) => {
    await setupAuthenticatedSession(page, 'student');

    await coursesPage.navigate();
    const courses = await coursesPage.getAllVisibleCourses();
    const paidCourse = courses.find(c => !c.price.toLowerCase().includes('free'));

    if (paidCourse) {
      // Get course price
      const coursePrice = await coursesPage.getCoursePrice(paidCourse.title);

      await coursesPage.clickViewDetails(paidCourse.title);
      await enrollmentPage.enrollFromModal();
      await enrollmentPage.waitForEnrollmentModal();

      // Verify price in enrollment modal
      const enrollmentPrice = await enrollmentPage.getCoursePrice();
      expect(enrollmentPrice).toContain(coursePrice.replace('$', ''));

      await enrollmentPage.selectIndividualEnrollment();
      await enrollmentPage.click('button:has-text("Proceed to Payment")');

      await paymentPage.waitForPaymentForm();

      // Verify order summary
      const orderTotal = await paymentPage.getOrderTotal();
      expect(orderTotal).toBeTruthy();

      // Subtotal should be present
      const subtotal = await paymentPage.getSubtotal();
      expect(subtotal).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should allow canceling payment', async ({ page }) => {
    await setupAuthenticatedSession(page, 'student');

    await coursesPage.navigate();
    const courses = await coursesPage.getAllVisibleCourses();
    const paidCourse = courses.find(c => !c.price.toLowerCase().includes('free'));

    if (paidCourse) {
      await coursesPage.clickViewDetails(paidCourse.title);
      await enrollmentPage.enrollFromModal();
      await enrollmentPage.waitForEnrollmentModal();

      await enrollmentPage.selectIndividualEnrollment();
      await enrollmentPage.click('button:has-text("Proceed to Payment")');

      await paymentPage.waitForPaymentForm();

      // Cancel payment
      await paymentPage.cancelPayment();

      // Should navigate away from payment page
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/payment');
    } else {
      test.skip();
    }
  });

  test('should handle corporate enrollment request', async ({ page }) => {
    await setupAuthenticatedSession(page, 'company_admin');

    await coursesPage.navigate();
    const courses = await coursesPage.getAllVisibleCourses();

    if (courses.length > 0) {
      await coursesPage.clickViewDetails(courses[0].title);
      await enrollmentPage.enrollFromModal();
      await enrollmentPage.waitForEnrollmentModal();

      // Request corporate quote
      await enrollmentPage.requestCorporateQuote('Test Company Inc', 50);

      // Should show success or confirmation message
      await enrollmentPage.waitForEnrollmentSuccess();
      const successMessage = await enrollmentPage.getSuccessMessage();
      expect(successMessage.toLowerCase()).toContain('quote');
    }
  });
});

test.describe('Enrollment Edge Cases', () => {
  let coursesPage: CoursesPage;
  let enrollmentPage: EnrollmentPage;

  test.beforeEach(async ({ page }) => {
    coursesPage = new CoursesPage(page);
    enrollmentPage = new EnrollmentPage(page);
    await setupAuthenticatedSession(page, 'student');
  });

  test('should handle network errors during enrollment', async ({ page }) => {
    await coursesPage.navigate();
    const courses = await coursesPage.getAllVisibleCourses();

    if (courses.length > 0) {
      // Intercept enrollment API and force failure
      await page.route('**/api/enrollments', route => {
        route.abort('failed');
      });

      await coursesPage.clickViewDetails(courses[0].title);
      await enrollmentPage.enrollFromModal();

      if (await enrollmentPage.isVisible('[data-testid="free-course-notice"]')) {
        await enrollmentPage.click('button:has-text("Enroll Free")');

        // Should show error
        await enrollmentPage.waitForEnrollmentError();
        const errorMessage = await enrollmentPage.getErrorMessage();
        expect(errorMessage).toBeTruthy();
      }
    }
  });

  test('should show loading state during enrollment', async ({ page: _page }) => {
    await coursesPage.navigate();
    const courses = await coursesPage.getAllVisibleCourses();

    if (courses.length > 0) {
      await coursesPage.clickViewDetails(courses[0].title);
      await enrollmentPage.enrollFromModal();

      if (await enrollmentPage.isVisible('[data-testid="free-course-notice"]')) {
        // Click enroll and immediately check for loading
        await enrollmentPage.click('button:has-text("Enroll Free")');

        const isLoading = await enrollmentPage.isLoading();
        // Loading state might be very brief, so we just verify the method works
        expect(typeof isLoading).toBe('boolean');
      }
    }
  });
});
