/**
 * UserMetricsTracker Tests
 * Tests user behavior and interaction metrics tracking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocking to get fresh instance
const loadUserMetricsTracker = async () => {
  // Clear module cache to get fresh instance
  vi.resetModules();
  const module = await import('../UserMetricsTracker');
  return module.UserMetricsTracker;
};

describe('UserMetricsTracker', () => {
  let originalPushState: typeof history.pushState;
  let originalReplaceState: typeof history.replaceState;
  let tracker: Awaited<ReturnType<typeof loadUserMetricsTracker>>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Save original history methods
    originalPushState = history.pushState;
    originalReplaceState = history.replaceState;

    // Mock supabase.from().insert()
    const mockInsert = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    const mockFrom = vi.fn().mockReturnValue({
      insert: mockInsert,
    });

    (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

    // Set up document properties
    Object.defineProperty(document, 'title', {
      value: 'Test Page',
      writable: true,
      configurable: true,
    });

    Object.defineProperty(document, 'referrer', {
      value: 'https://example.com',
      writable: true,
      configurable: true,
    });

    // Load fresh tracker instance
    tracker = await loadUserMetricsTracker();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();

    // Restore history methods
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
  });

  // ========================================
  // Initialization Tests
  // ========================================

  describe('initialize', () => {
    it('should initialize with user ID', () => {
      tracker.initialize('user-123');

      const metrics = tracker.getSessionMetrics();
      expect(metrics.userId).toBe('user-123');
      expect(metrics.sessionId).toBeDefined();
    });

    it('should initialize without user ID', () => {
      tracker.initialize();

      const metrics = tracker.getSessionMetrics();
      expect(metrics.userId).toBeUndefined();
      expect(metrics.sessionId).toBeDefined();
    });

    it('should generate unique session ID', async () => {
      tracker.initialize();
      const sessionId1 = tracker.getSessionMetrics().sessionId;

      // Get new tracker instance
      const tracker2 = await loadUserMetricsTracker();
      tracker2.initialize();
      const sessionId2 = tracker2.getSessionMetrics().sessionId;

      expect(sessionId1).not.toBe(sessionId2);
    });
  });

  // ========================================
  // Page View Tracking Tests
  // ========================================

  describe('trackPageView', () => {
    it('should track page view with metric data', () => {
      tracker.initialize('user-123');

      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      tracker.trackPageView('/dashboard');

      expect(supabase.from).toHaveBeenCalledWith('page_views');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          pageUrl: '/dashboard',
          pageTitle: 'Test Page',
          referrer: 'https://example.com',
          timestamp: expect.any(String),
        })
      );
    });

    it('should update session metrics on page view', () => {
      tracker.initialize();
      tracker.trackPageView('/profile');

      const metrics = tracker.getSessionMetrics();
      expect(metrics.currentPage).toBe('/profile');
    });

    it('should reset interaction count on new page', () => {
      tracker.initialize();
      tracker.trackPageView('/page1');

      const metricsAfter = tracker.getSessionMetrics();
      expect(metricsAfter.totalInteractions).toBe(0);
    });
  });

  // ========================================
  // Event Tracking Tests
  // ========================================

  describe('trackEvent', () => {
    it('should track event with all parameters', () => {
      tracker.initialize('user-123');

      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      tracker.trackEvent('button_click', 'ui_interactions', {
        buttonId: 'submit-button',
        location: '/checkout',
      });

      expect(supabase.from).toHaveBeenCalledWith('user_events');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          eventName: 'button_click',
          eventCategory: 'ui_interactions',
          eventData: {
            buttonId: 'submit-button',
            location: '/checkout',
          },
          timestamp: expect.any(String),
        })
      );
    });

    it('should track event with default category', () => {
      tracker.initialize();

      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      tracker.trackEvent('feature_used');

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'feature_used',
          eventCategory: 'general',
        })
      );
    });

    it('should track event without event data', () => {
      tracker.initialize('user-456');

      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      tracker.trackEvent('page_scroll', 'engagement');

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'page_scroll',
          eventCategory: 'engagement',
          eventData: undefined,
        })
      );
    });
  });

  // ========================================
  // Conversion Tracking Tests
  // ========================================

  describe('trackConversion', () => {
    it('should track conversion with all parameters', () => {
      tracker.initialize('user-123');

      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      tracker.trackConversion(
        'purchase_complete',
        {
          productId: 'product-456',
          quantity: 2,
        },
        99.99
      );

      expect(supabase.from).toHaveBeenCalledWith('conversions');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          conversionType: 'purchase_complete',
          conversionValue: 99.99,
          metadata: {
            productId: 'product-456',
            quantity: 2,
          },
          timestamp: expect.any(String),
        })
      );
    });

    it('should track conversion without value', () => {
      tracker.initialize();

      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      tracker.trackConversion('signup_complete', {
        source: 'homepage',
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          conversionType: 'signup_complete',
          conversionValue: undefined,
          metadata: {
            source: 'homepage',
          },
        })
      );
    });

    it('should track conversion without metadata', () => {
      tracker.initialize('user-789');

      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      tracker.trackConversion('trial_started', undefined, 0);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          conversionType: 'trial_started',
          conversionValue: 0,
          metadata: undefined,
        })
      );
    });
  });

  // ========================================
  // User ID Management Tests
  // ========================================

  describe('setUserId and clearUserId', () => {
    it('should set user ID', () => {
      tracker.initialize();
      tracker.setUserId('new-user-123');

      const metrics = tracker.getSessionMetrics();
      expect(metrics.userId).toBe('new-user-123');
    });

    it('should clear user ID', () => {
      tracker.initialize('user-123');
      tracker.clearUserId();

      const metrics = tracker.getSessionMetrics();
      expect(metrics.userId).toBeUndefined();
    });

    it('should update user ID', () => {
      tracker.initialize('user-old');
      tracker.setUserId('user-new');

      const metrics = tracker.getSessionMetrics();
      expect(metrics.userId).toBe('user-new');
    });
  });

  // ========================================
  // Session Metrics Tests
  // ========================================

  describe('getSessionMetrics', () => {
    it('should return current session metrics', () => {
      tracker.initialize('user-123');
      tracker.trackPageView('/dashboard');

      const metrics = tracker.getSessionMetrics();

      expect(metrics).toEqual({
        sessionId: expect.any(String),
        userId: 'user-123',
        currentPage: '/dashboard',
        timeOnCurrentPage: expect.any(Number),
        totalInteractions: 0,
        maxScrollDepth: 0,
      });
    });

    it('should calculate time on current page', async () => {
      vi.useFakeTimers();

      tracker.initialize();
      tracker.trackPageView('/test');

      // Advance time by 5 seconds
      vi.advanceTimersByTime(5000);

      const metrics = tracker.getSessionMetrics();
      expect(metrics.timeOnCurrentPage).toBeGreaterThanOrEqual(5000);

      vi.useRealTimers();
    });

    it('should track interaction count', () => {
      tracker.initialize();
      tracker.trackPageView('/page');

      // Simulate clicks (would need to trigger events in real scenario)
      const metrics1 = tracker.getSessionMetrics();
      expect(metrics1.totalInteractions).toBe(0);
    });
  });

  // ========================================
  // Error Handling Tests
  // ========================================

  describe('sendMetric error handling', () => {
    it('should handle database insert error gracefully', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      tracker.initialize('user-123');

      // Should not throw
      expect(() => tracker.trackEvent('test_event')).not.toThrow();

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should handle database exception gracefully', async () => {
      const mockInsert = vi.fn().mockRejectedValue(new Error('Network error'));

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      tracker.initialize('user-123');

      // Should not throw
      expect(() => tracker.trackConversion('test_conversion')).not.toThrow();

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  // ========================================
  // Destroy Method Tests
  // ========================================

  describe('destroy', () => {
    it('should send page metrics before destroying', () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      tracker.initialize('user-123');
      tracker.trackPageView('/test-page');

      // Clear previous calls
      mockInsert.mockClear();

      tracker.destroy();

      // Should send engagement metrics
      expect(supabase.from).toHaveBeenCalledWith('engagement_metrics');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          pageUrl: '/test-page',
          interactions: expect.any(Number),
          scrollDepth: expect.any(Number),
        })
      );
    });

    it('should handle destroy when page was already sent', () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      tracker.initialize();

      // Note: initialize() automatically tracks initial page view (window.location.pathname)
      // So currentPageUrl will be set and metrics will be sent on destroy

      // Clear initialization calls
      const callCountBefore = mockInsert.mock.calls.length;
      mockInsert.mockClear();

      tracker.destroy();

      // Metrics should be sent for the initialized page
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  // ========================================
  // Integration Tests
  // ========================================

  describe('integration scenarios', () => {
    it('should track complete user journey', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      // User lands on homepage
      tracker.initialize();
      tracker.trackPageView('/');

      // User clicks button
      tracker.trackEvent('cta_click', 'engagement', { button: 'Get Started' });

      // User navigates to signup
      tracker.trackPageView('/signup');

      // User completes signup
      tracker.setUserId('user-new-123');
      tracker.trackConversion('signup_complete', { plan: 'free' });

      // Verify metrics were sent (initial page view + event + second page view + conversion)
      expect(mockInsert).toHaveBeenCalled();
      expect(mockInsert.mock.calls.length).toBeGreaterThanOrEqual(4);

      // Verify final state
      const metrics = tracker.getSessionMetrics();
      expect(metrics.userId).toBe('user-new-123');
      expect(metrics.currentPage).toBe('/signup');
    });

    it('should handle user logout flow', () => {
      tracker.initialize('user-123');
      tracker.trackPageView('/dashboard');

      const metrics1 = tracker.getSessionMetrics();
      expect(metrics1.userId).toBe('user-123');

      // User logs out
      tracker.clearUserId();
      tracker.trackPageView('/');

      const metrics2 = tracker.getSessionMetrics();
      expect(metrics2.userId).toBeUndefined();
      expect(metrics2.currentPage).toBe('/');
    });
  });

  // ========================================
  // Edge Cases
  // ========================================

  describe('edge cases', () => {
    it('should handle empty page URL', () => {
      tracker.initialize();

      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      tracker.trackPageView('');

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          pageUrl: '',
        })
      );
    });

    it('should handle very long session ID generation', () => {
      tracker.initialize();
      const metrics = tracker.getSessionMetrics();

      expect(metrics.sessionId).toBeTruthy();
      expect(metrics.sessionId.length).toBeGreaterThan(10);
      expect(metrics.sessionId).toMatch(/^\d+-[a-z0-9]+$/);
    });

    it('should handle rapid page view changes', () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      tracker.initialize();

      tracker.trackPageView('/page1');
      tracker.trackPageView('/page2');
      tracker.trackPageView('/page3');

      const metrics = tracker.getSessionMetrics();
      expect(metrics.currentPage).toBe('/page3');
    });

    it('should handle special characters in event data', () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      tracker.initialize();
      tracker.trackEvent('test', 'category', {
        message: 'Hello "World" & <Company>',
        emoji: '🚀',
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          eventData: {
            message: 'Hello "World" & <Company>',
            emoji: '🚀',
          },
        })
      );
    });
  });
});
