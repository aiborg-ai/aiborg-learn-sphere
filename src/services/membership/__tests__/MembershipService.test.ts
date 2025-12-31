/**
 * MembershipService Tests
 * Tests membership plans, subscriptions, and Stripe integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MembershipService } from '../MembershipService';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
    rpc: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Mock dynamic imports
vi.mock('../FamilyMembersService', () => ({
  FamilyMembersService: {
    getSubscriptionFamilyMembers: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../VaultContentService', () => ({
  VaultContentService: {
    getUserVaultStats: vi.fn().mockResolvedValue({
      total_views: 0,
      total_downloads: 0,
      total_bookmarks: 0,
      unique_content_viewed: 0,
      hours_watched: 0,
    }),
    getRecentVaultContent: vi.fn().mockResolvedValue([]),
  },
}));

describe('MembershipService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================
  // PLANS Tests
  // ========================================

  describe('getActivePlans', () => {
    it('should get all active plans', async () => {
      const mockPlans = [
        { id: '1', name: 'Basic', slug: 'basic', is_active: true, display_order: 1 },
        { id: '2', name: 'Premium', slug: 'premium', is_active: true, display_order: 2 },
      ];

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockPlans,
              error: null,
            }),
          }),
        }),
      });

      const result = await MembershipService.getActivePlans();

      expect(result).toEqual(mockPlans);
      expect(supabase.from).toHaveBeenCalledWith('membership_plans');
    });

    it('should throw error on database failure', async () => {
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      await expect(MembershipService.getActivePlans()).rejects.toThrow();
    });
  });

  describe('getPlanBySlug', () => {
    it('should get plan by slug', async () => {
      const mockPlan = { id: '1', name: 'Premium', slug: 'premium' };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockPlan,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await MembershipService.getPlanBySlug('premium');

      expect(result).toEqual(mockPlan);
    });

    it('should return null for PGRST116 error (not found)', async () => {
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        }),
      });

      const result = await MembershipService.getPlanBySlug('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getFeaturedPlans', () => {
    it('should get featured plans', async () => {
      const mockPlans = [{ id: '1', name: 'Family Pass', is_featured: true }];

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockPlans,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await MembershipService.getFeaturedPlans();

      expect(result).toEqual(mockPlans);
    });
  });

  // ========================================
  // SUBSCRIPTIONS Tests
  // ========================================

  describe('getActiveSubscription', () => {
    it('should get active subscription with plan', async () => {
      const mockUser = { id: 'user-123' };
      const mockSubscription = {
        id: 'sub-1',
        user_id: 'user-123',
        status: 'active',
        plan: { id: '1', name: 'Premium' },
      };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockSubscription,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      const result = await MembershipService.getActiveSubscription();

      expect(result).toEqual(mockSubscription);
    });

    it('should return null if user not authenticated', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await MembershipService.getActiveSubscription();

      expect(result).toBeNull();
    });

    it('should return null if no active subscription (PGRST116)', async () => {
      const mockUser = { id: 'user-123' };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      const result = await MembershipService.getActiveSubscription();

      expect(result).toBeNull();
    });
  });

  describe('getUserSubscriptions', () => {
    it('should get all user subscriptions', async () => {
      const mockUser = { id: 'user-123' };
      const mockSubscriptions = [
        { id: 'sub-1', status: 'active' },
        { id: 'sub-2', status: 'canceled' },
      ];

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockSubscriptions,
              error: null,
            }),
          }),
        }),
      });

      const result = await MembershipService.getUserSubscriptions();

      expect(result).toEqual(mockSubscriptions);
    });

    it('should return empty array if user not authenticated', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await MembershipService.getUserSubscriptions();

      expect(result).toEqual([]);
    });
  });

  describe('hasActiveMembership', () => {
    it('should return true if Stripe subscription is active', async () => {
      const mockUser = { id: 'user-123' };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: true, // Stripe check
        error: null,
      });

      const result = await MembershipService.hasActiveMembership();

      expect(result).toBe(true);
    });

    it('should return true if admin Family Pass is granted', async () => {
      const mockUser = { id: 'user-123' };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      (supabase.rpc as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          data: false, // Stripe check - no Stripe subscription
          error: null,
        })
        .mockResolvedValueOnce({
          data: true, // Admin Family Pass check
          error: null,
        });

      const result = await MembershipService.hasActiveMembership();

      expect(result).toBe(true);
    });

    it('should return false if no membership', async () => {
      const mockUser = { id: 'user-123' };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      (supabase.rpc as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          data: false,
          error: null,
        })
        .mockResolvedValueOnce({
          data: false,
          error: null,
        });

      const result = await MembershipService.hasActiveMembership();

      expect(result).toBe(false);
    });

    it('should return false if user not authenticated', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await MembershipService.hasActiveMembership();

      expect(result).toBe(false);
    });
  });

  describe('calculateSavings', () => {
    it('should calculate family savings', async () => {
      const mockSavings = {
        individual_cost: 1200,
        family_cost: 500,
        total_savings: 700,
      };

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [mockSavings],
        error: null,
      });

      const result = await MembershipService.calculateSavings(4, 1, 12);

      expect(result).toEqual(mockSavings);
      expect(supabase.rpc).toHaveBeenCalledWith('calculate_family_savings', {
        p_num_members: 4,
        p_courses_per_member: 1,
        p_months: 12,
      });
    });
  });

  // ========================================
  // STRIPE INTEGRATION Tests
  // ========================================

  describe('createSubscription', () => {
    it('should create subscription checkout session', async () => {
      const mockResponse = {
        sessionId: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      };

      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await MembershipService.createSubscription({
        planId: 'plan-1',
        priceId: 'price_123',
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription at period end', async () => {
      const mockResult = {
        success: true,
        message: 'Subscription will cancel at period end',
      };

      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const result = await MembershipService.cancelSubscription('sub-123', 'Too expensive');

      expect(result).toEqual(mockResult);
    });
  });

  describe('cancelSubscriptionImmediately', () => {
    it('should cancel subscription immediately', async () => {
      const mockResult = {
        success: true,
        message: 'Subscription canceled',
      };

      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const result = await MembershipService.cancelSubscriptionImmediately('sub-123');

      expect(result).toEqual(mockResult);
    });
  });

  describe('pauseSubscription', () => {
    it('should pause subscription', async () => {
      const mockResult = {
        success: true,
        message: 'Subscription paused',
      };

      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const result = await MembershipService.pauseSubscription('sub-123', 2);

      expect(result).toEqual(mockResult);
    });
  });

  describe('resumeSubscription', () => {
    it('should resume subscription', async () => {
      const mockResult = {
        success: true,
        message: 'Subscription resumed',
      };

      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const result = await MembershipService.resumeSubscription('sub-123');

      expect(result).toEqual(mockResult);
    });
  });

  describe('getCustomerPortalUrl', () => {
    it('should get Stripe Customer Portal URL', async () => {
      const mockResult = {
        success: true,
        portalUrl: 'https://billing.stripe.com/session/123',
      };

      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const result = await MembershipService.getCustomerPortalUrl('sub-123', '/dashboard');

      expect(result).toBe('https://billing.stripe.com/session/123');
    });

    it('should return empty string if no portal URL', async () => {
      const mockResult = {
        success: true,
      };

      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const result = await MembershipService.getCustomerPortalUrl('sub-123');

      expect(result).toBe('');
    });
  });

  // ========================================
  // UTILITY FUNCTIONS Tests
  // ========================================

  describe('isTrialing', () => {
    it('should return true for active trial', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const subscription = {
        status: 'trialing',
        trial_end: futureDate.toISOString(),
      } as any;

      const result = MembershipService.isTrialing(subscription);

      expect(result).toBe(true);
    });

    it('should return false for expired trial', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      const subscription = {
        status: 'trialing',
        trial_end: pastDate.toISOString(),
      } as any;

      const result = MembershipService.isTrialing(subscription);

      expect(result).toBe(false);
    });

    it('should return false if not trialing status', () => {
      const subscription = {
        status: 'active',
        trial_end: null,
      } as any;

      const result = MembershipService.isTrialing(subscription);

      expect(result).toBe(false);
    });
  });

  describe('willCancelAtPeriodEnd', () => {
    it('should return true if cancel_at_period_end is true', () => {
      const subscription = {
        cancel_at_period_end: true,
      } as any;

      const result = MembershipService.willCancelAtPeriodEnd(subscription);

      expect(result).toBe(true);
    });

    it('should return false if cancel_at_period_end is false', () => {
      const subscription = {
        cancel_at_period_end: false,
      } as any;

      const result = MembershipService.willCancelAtPeriodEnd(subscription);

      expect(result).toBe(false);
    });
  });

  describe('getDaysUntilPeriodEnd', () => {
    it('should calculate days until period end', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);

      const subscription = {
        current_period_end: futureDate.toISOString(),
      } as any;

      const result = MembershipService.getDaysUntilPeriodEnd(subscription);

      expect(result).toBeGreaterThanOrEqual(14);
      expect(result).toBeLessThanOrEqual(16);
    });

    it('should return null if no current_period_end', () => {
      const subscription = {
        current_period_end: null,
      } as any;

      const result = MembershipService.getDaysUntilPeriodEnd(subscription);

      expect(result).toBeNull();
    });
  });

  describe('formatPrice', () => {
    it('should format price with currency and interval', () => {
      const plan = {
        price: 49.99,
        currency: 'GBP',
        billing_interval: 'month',
      } as any;

      const result = MembershipService.formatPrice(plan);

      expect(result).toBe('£49.99/month');
    });

    it('should format price for annual billing', () => {
      const plan = {
        price: 499,
        currency: 'GBP',
        billing_interval: 'year',
      } as any;

      const result = MembershipService.formatPrice(plan);

      expect(result).toBe('£499.00/year');
    });
  });
});
