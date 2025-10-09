import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePaymentTransactions, useRefundRequests } from '../usePaymentTransactions';
import { supabase } from '@/integrations/supabase/client';
import * as authHook from '../useAuth';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock useAuth hook
vi.mock('../useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('usePaymentTransactions', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockAdminProfile = {
    id: 'profile-123',
    user_id: 'user-123',
    role: 'admin',
    display_name: 'Admin User',
    email: 'admin@example.com',
  };

  const mockUserProfile = {
    id: 'profile-456',
    user_id: 'user-456',
    role: 'user',
    display_name: 'Regular User',
    email: 'user@example.com',
  };

  const mockTransaction = {
    id: 'txn-123',
    enrollment_id: 'enroll-123',
    user_id: 'user-123',
    course_id: 1,
    amount: 99.99,
    currency: 'USD',
    payment_method: 'credit_card',
    payment_gateway: 'stripe',
    transaction_id: 'stripe_txn_123',
    payment_status: 'completed' as const,
    payment_date: '2024-01-15T10:00:00Z',
    metadata: { source: 'web' },
    invoice_number: 'INV-001',
    invoice_url: 'https://example.com/invoice/INV-001',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    user: {
      display_name: 'Test User',
      email: 'test@example.com',
    },
    course: {
      title: 'AI Fundamentals',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with loading state', () => {
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        profileError: null,
      } as ReturnType<typeof authHook.useAuth>);

      const { result } = renderHook(() => usePaymentTransactions());

      expect(result.current.loading).toBe(true);
      expect(result.current.transactions).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should not fetch transactions when user is not logged in', async () => {
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        profileError: null,
      } as ReturnType<typeof authHook.useAuth>);

      const { result } = renderHook(() => usePaymentTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.transactions).toEqual([]);
    });
  });

  describe('fetching transactions', () => {
    it('should fetch transactions for logged in user', async () => {
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: mockUser,
        profile: mockUserProfile,
        loading: false,
        profileError: null,
      } as ReturnType<typeof authHook.useAuth>);

      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: [mockTransaction],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        order: mockOrder,
        eq: mockEq,
      } as any);

      mockSelect.mockReturnValue({
        order: mockOrder,
      });
      mockOrder.mockReturnValue({
        eq: mockEq,
      });

      const { result } = renderHook(() => usePaymentTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.transactions).toHaveLength(1);
      expect(result.current.transactions[0]).toEqual(mockTransaction);
      expect(result.current.error).toBeNull();
    });

    it('should fetch all transactions for admin users', async () => {
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: mockUser,
        profile: mockAdminProfile,
        loading: false,
        profileError: null,
      } as ReturnType<typeof authHook.useAuth>);

      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: [mockTransaction],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        order: mockOrder,
      } as any);

      mockSelect.mockReturnValue({
        order: mockOrder,
      });

      const { result } = renderHook(() => usePaymentTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.transactions).toHaveLength(1);
      // Should not filter by user_id for admins
    });

    it('should handle fetch errors gracefully', async () => {
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: mockUser,
        profile: mockUserProfile,
        loading: false,
        profileError: null,
      } as ReturnType<typeof authHook.useAuth>);

      const mockError = new Error('Database error');
      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        order: mockOrder,
        eq: mockEq,
      } as any);

      mockSelect.mockReturnValue({
        order: mockOrder,
      });
      mockOrder.mockReturnValue({
        eq: mockEq,
      });

      const { result } = renderHook(() => usePaymentTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Database error');
      expect(result.current.transactions).toEqual([]);
    });

    it('should apply status filter', async () => {
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: mockUser,
        profile: mockUserProfile,
        loading: false,
        profileError: null,
      } as ReturnType<typeof authHook.useAuth>);

      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: [mockTransaction],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        order: mockOrder,
        eq: mockEq,
      } as any);

      mockSelect.mockReturnValue({
        order: mockOrder,
      });
      mockOrder.mockReturnValue({
        eq: mockEq,
      });

      renderHook(() => usePaymentTransactions({ status: 'completed' }));

      await waitFor(() => {
        expect(mockEq).toHaveBeenCalledWith('payment_status', 'completed');
      });
    });
  });

  describe('createTransaction', () => {
    it('should allow admins to create transactions', async () => {
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: mockUser,
        profile: mockAdminProfile,
        loading: false,
        profileError: null,
      } as ReturnType<typeof authHook.useAuth>);

      const newTransaction = {
        user_id: 'user-456',
        course_id: 2,
        amount: 149.99,
        currency: 'USD',
        payment_status: 'completed' as const,
      };

      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { ...mockTransaction, ...newTransaction },
        error: null,
      });
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: mockInsert,
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const { result } = renderHook(() => usePaymentTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdTransaction;
      await act(async () => {
        createdTransaction = await result.current.createTransaction(newTransaction);
      });

      expect(createdTransaction).toBeDefined();
      expect(mockInsert).toHaveBeenCalledWith(newTransaction);
    });

    it('should prevent non-admins from creating transactions', async () => {
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: mockUser,
        profile: mockUserProfile,
        loading: false,
        profileError: null,
      } as ReturnType<typeof authHook.useAuth>);

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const { result } = renderHook(() => usePaymentTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await result.current.createTransaction({
          user_id: 'user-456',
          amount: 99.99,
        });
      }).rejects.toThrow('Only admins can create payment transactions');
    });
  });

  describe('updateTransactionStatus', () => {
    it('should allow admins to update transaction status', async () => {
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: mockUser,
        profile: mockAdminProfile,
        loading: false,
        profileError: null,
      } as ReturnType<typeof authHook.useAuth>);

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { ...mockTransaction, payment_status: 'refunded' },
        error: null,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockTransaction], error: null }),
        update: mockUpdate,
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const { result } = renderHook(() => usePaymentTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updatedTransaction;
      await act(async () => {
        updatedTransaction = await result.current.updateTransactionStatus(
          'txn-123',
          'refunded'
        );
      });

      expect(updatedTransaction).toBeDefined();
      expect(updatedTransaction?.payment_status).toBe('refunded');
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should prevent non-admins from updating transactions', async () => {
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: mockUser,
        profile: mockUserProfile,
        loading: false,
        profileError: null,
      } as ReturnType<typeof authHook.useAuth>);

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const { result } = renderHook(() => usePaymentTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await result.current.updateTransactionStatus('txn-123', 'refunded');
      }).rejects.toThrow('Only admins can update payment transactions');
    });
  });
});

describe('useRefundRequests', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockAdminProfile = {
    id: 'profile-123',
    user_id: 'user-123',
    role: 'admin',
    display_name: 'Admin User',
    email: 'admin@example.com',
  };

  const mockRefundRequest = {
    id: 'refund-123',
    payment_transaction_id: 'txn-123',
    enrollment_id: 'enroll-123',
    user_id: 'user-123',
    course_id: 1,
    refund_amount: 99.99,
    refund_reason: 'Course did not meet expectations',
    refund_status: 'pending' as const,
    requested_by: 'user-123',
    approved_by: null,
    processed_by: null,
    refund_transaction_id: null,
    refund_date: null,
    admin_notes: null,
    metadata: null,
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
    user: {
      display_name: 'Test User',
      email: 'test@example.com',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createRefundRequest', () => {
    it('should allow users to create refund requests', async () => {
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: mockUser,
        profile: { role: 'user' } as any,
        loading: false,
        profileError: null,
      } as ReturnType<typeof authHook.useAuth>);

      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockRefundRequest,
        error: null,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: mockInsert,
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const { result } = renderHook(() => useRefundRequests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const refundData = {
        payment_transaction_id: 'txn-123',
        enrollment_id: 'enroll-123',
        course_id: 1,
        refund_amount: 99.99,
        refund_reason: 'Course did not meet expectations',
      };

      let createdRefund;
      await act(async () => {
        createdRefund = await result.current.createRefundRequest(refundData);
      });

      expect(createdRefund).toBeDefined();
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should require user to be logged in', async () => {
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        profileError: null,
      } as ReturnType<typeof authHook.useAuth>);

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const { result } = renderHook(() => useRefundRequests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await result.current.createRefundRequest({
          payment_transaction_id: 'txn-123',
          enrollment_id: null,
          course_id: 1,
          refund_amount: 99.99,
          refund_reason: 'Test',
        });
      }).rejects.toThrow('User must be logged in to request refunds');
    });
  });

  describe('updateRefundStatus', () => {
    it('should allow admins to update refund status', async () => {
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: mockUser,
        profile: mockAdminProfile,
        loading: false,
        profileError: null,
      } as ReturnType<typeof authHook.useAuth>);

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { ...mockRefundRequest, refund_status: 'approved' },
        error: null,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockRefundRequest], error: null }),
        update: mockUpdate,
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const { result } = renderHook(() => useRefundRequests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updatedRefund;
      await act(async () => {
        updatedRefund = await result.current.updateRefundStatus(
          'refund-123',
          'approved',
          'Approved by admin'
        );
      });

      expect(updatedRefund).toBeDefined();
      expect(updatedRefund?.refund_status).toBe('approved');
    });

    it('should prevent non-admins from updating refund status', async () => {
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: mockUser,
        profile: { role: 'user' } as any,
        loading: false,
        profileError: null,
      } as ReturnType<typeof authHook.useAuth>);

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const { result } = renderHook(() => useRefundRequests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await result.current.updateRefundStatus('refund-123', 'approved');
      }).rejects.toThrow('Only admins can update refund requests');
    });
  });
});
