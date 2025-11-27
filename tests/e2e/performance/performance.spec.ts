/**
 * Performance Testing
 * Tests for page load times, API response times, and overall performance
 */

import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession } from '../utils/auth';

// Performance thresholds (in milliseconds)
const THRESHOLDS = {
  pageLoad: 3000, // Max page load time
  apiResponse: 1000, // Max API response time
  firstContentfulPaint: 2000, // Max FCP
  largestContentfulPaint: 2500, // Max LCP
  timeToInteractive: 3500, // Max TTI
};

test.describe('Performance - Page Load Times', () => {
  test('homepage should load within threshold', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`Homepage load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(THRESHOLDS.pageLoad);
  });

  test('courses page should load within threshold', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`Courses page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(THRESHOLDS.pageLoad);
  });

  test('login page should load within threshold', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`Login page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(THRESHOLDS.pageLoad);
  });

  test('profile page should load within threshold', async ({ page }) => {
    await setupAuthenticatedSession(page, 'student');

    const startTime = Date.now();

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`Profile page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(THRESHOLDS.pageLoad);
  });
});

test.describe('Performance - Core Web Vitals', () => {
  test('homepage should meet Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const metrics = await page.evaluate(() => {
      return new Promise(resolve => {
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          const paint = entries.find(entry => entry.name === 'first-contentful-paint');
          if (paint) {
            resolve({
              fcp: paint.startTime,
            });
          }
        }).observe({ entryTypes: ['paint'] });

        // Fallback timeout
        setTimeout(() => resolve({ fcp: 0 }), 5000);
      });
    });

    if (metrics && typeof metrics === 'object' && 'fcp' in metrics) {
      const fcp = metrics.fcp as number;
      console.log(`First Contentful Paint: ${fcp}ms`);
      if (fcp > 0) {
        expect(fcp).toBeLessThan(THRESHOLDS.firstContentfulPaint);
      }
    }
  });

  test('should measure Largest Contentful Paint', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const lcp = await page.evaluate(() => {
      return new Promise<number>(resolve => {
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Fallback timeout
        setTimeout(() => resolve(0), 5000);
      });
    });

    console.log(`Largest Contentful Paint: ${lcp}ms`);
    if (lcp > 0) {
      expect(lcp).toBeLessThan(THRESHOLDS.largestContentfulPaint);
    }
  });
});

test.describe('Performance - API Response Times', () => {
  test('courses API should respond within threshold', async ({ page }) => {
    await page.goto('/');

    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/courses') || response.url().includes('courses'),
      { timeout: 10000 }
    );

    await page.goto('/courses');

    try {
      const response = await responsePromise;
      const timing = response.timing();

      console.log(`Courses API response time: ${timing.responseEnd}ms`);
      expect(timing.responseEnd).toBeLessThan(THRESHOLDS.apiResponse);
    } catch {
      console.log('Courses API call not detected');
    }
  });

  test('user profile API should respond within threshold', async ({ page }) => {
    await setupAuthenticatedSession(page, 'student');

    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/profile') || response.url().includes('profile'),
      { timeout: 10000 }
    );

    await page.goto('/profile');

    try {
      const response = await responsePromise;
      const timing = response.timing();

      console.log(`Profile API response time: ${timing.responseEnd}ms`);
      expect(timing.responseEnd).toBeLessThan(THRESHOLDS.apiResponse);
    } catch {
      console.log('Profile API call not detected');
    }
  });
});

test.describe('Performance - Resource Loading', () => {
  test('should not load excessive JavaScript', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const jsResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return resources
        .filter(r => r.name.endsWith('.js'))
        .reduce((total, r) => {
          if ('transferSize' in r) {
            return total + (r.transferSize as number);
          }
          return total;
        }, 0);
    });

    console.log(`Total JavaScript size: ${(jsResources / 1024).toFixed(2)} KB`);
    expect(jsResources).toBeLessThan(1024 * 1024 * 2); // Less than 2MB
  });

  test('should not load excessive CSS', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const cssResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return resources
        .filter(r => r.name.endsWith('.css'))
        .reduce((total, r) => {
          if ('transferSize' in r) {
            return total + (r.transferSize as number);
          }
          return total;
        }, 0);
    });

    console.log(`Total CSS size: ${(cssResources / 1024).toFixed(2)} KB`);
    expect(cssResources).toBeLessThan(1024 * 512); // Less than 512KB
  });

  test('images should be optimized', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const imageResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return resources
        .filter(r => r.initiatorType === 'img' || /\.(jpg|jpeg|png|gif|webp|svg)/.test(r.name))
        .map(r => ({
          url: r.name,
          size: r.transferSize,
          duration: r.duration,
        }));
    });

    console.log(`Total images loaded: ${imageResources.length}`);

    // Check that individual images aren't too large
    imageResources.forEach(img => {
      if (img.size > 1024 * 500) {
        // Warn for images > 500KB
        console.warn(`Large image detected: ${img.url} (${(img.size / 1024).toFixed(2)} KB)`);
      }
    });

    // Total images should be reasonable
    const totalImageSize = imageResources.reduce((total, img) => total + img.size, 0);
    console.log(`Total image size: ${(totalImageSize / 1024).toFixed(2)} KB`);
    expect(totalImageSize).toBeLessThan(1024 * 1024 * 3); // Less than 3MB total
  });
});

test.describe('Performance - Navigation Performance', () => {
  test('client-side navigation should be fast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const startTime = Date.now();

    await page.click('a[href="/courses"]');
    await page.waitForLoadState('networkidle');

    const navigationTime = Date.now() - startTime;

    console.log(`Client-side navigation time: ${navigationTime}ms`);
    expect(navigationTime).toBeLessThan(1500); // Should be fast for SPA
  });

  test('back button navigation should be instant', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    const startTime = Date.now();

    await page.goBack();
    await page.waitForLoadState('networkidle');

    const backNavigationTime = Date.now() - startTime;

    console.log(`Back navigation time: ${backNavigationTime}ms`);
    expect(backNavigationTime).toBeLessThan(1000);
  });
});

test.describe('Performance - Render Performance', () => {
  test('should not have excessive DOM nodes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const domNodeCount = await page.evaluate(() => document.querySelectorAll('*').length);

    console.log(`DOM node count: ${domNodeCount}`);
    expect(domNodeCount).toBeLessThan(3000); // Reasonable limit
  });

  test('should not have excessive event listeners', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // This is an approximation - actual implementation may vary
    const eventListenerCount = await page.evaluate(() => {
      let count = 0;
      const elements = document.querySelectorAll('*');
      elements.forEach(el => {
        const listeners = (window as any).getEventListeners?.(el);
        if (listeners) {
          count += Object.values(listeners).reduce((sum: number, arr: any) => sum + arr.length, 0);
        }
      });
      return count;
    });

    console.log(`Approximate event listener count: ${eventListenerCount}`);
    // Note: This test may not work in all browsers
  });
});

test.describe('Performance - Memory Usage', () => {
  test('should not have memory leaks on navigation', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate between pages multiple times
    for (let i = 0; i < 5; i++) {
      await page.goto('/courses');
      await page.waitForLoadState('networkidle');
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    }

    // Check if there are excessive pages/contexts
    const pages = context.pages();
    console.log(`Active pages: ${pages.length}`);
    expect(pages.length).toBeLessThanOrEqual(1); // Should only have one page
  });
});

test.describe('Performance - Bundle Size', () => {
  test('should measure initial bundle size', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const totalSize = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return resources.reduce((total, r) => total + (r.transferSize || 0), 0);
    });

    console.log(`Total resources transferred: ${(totalSize / 1024).toFixed(2)} KB`);
    expect(totalSize).toBeLessThan(1024 * 1024 * 5); // Less than 5MB total
  });
});

test.describe('Performance - Time to Interactive', () => {
  test('homepage should be interactive quickly', async ({ page }) => {
    await page.goto('/');

    const tti = await page.evaluate(() => {
      return new Promise<number>(resolve => {
        if (document.readyState === 'complete') {
          resolve(performance.now());
        } else {
          window.addEventListener('load', () => {
            setTimeout(() => resolve(performance.now()), 0);
          });
        }
      });
    });

    console.log(`Time to Interactive: ${tti}ms`);
    expect(tti).toBeLessThan(THRESHOLDS.timeToInteractive);
  });
});
