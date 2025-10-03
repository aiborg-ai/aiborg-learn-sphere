import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/utils/logger';

export interface PaymentTransaction {
  id: string;
  enrollment_id: string | null;
  user_id: string;
  course_id: number | null;
  amount: number;
  currency: string;
  payment_method: string | null;
  payment_gateway: string | null;
  transaction_id: string | null;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  payment_date: string | null;
  metadata: Record<string, unknown> | null;
  invoice_number: string | null;
  invoice_url: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    display_name: string | null;
    email: string | null;
  };
  course?: {
    title: string;
  };
}

export interface RefundRequest {
  id: string;
  payment_transaction_id: string | null;
  enrollment_id: string | null;
  user_id: string;
  course_id: number | null;
  refund_amount: number;
  refund_reason: string | null;
  refund_status: 'pending' | 'approved' | 'rejected' | 'processed' | 'completed';
  requested_by: string;
  approved_by: string | null;
  processed_by: string | null;
  refund_transaction_id: string | null;
  refund_date: string | null;
  admin_notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  user?: {
    display_name: string | null;
    email: string | null;
  };
  payment_transaction?: PaymentTransaction;
}

interface UsePaymentTransactionsOptions {
  userId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

export const usePaymentTransactions = (options: UsePaymentTransactionsOptions = {}) => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('payment_transactions')
        .select(`
          *,
          user:profiles!user_id(display_name, email),
          course:courses(title)
        `)
        .order('payment_date', { ascending: false });

      // Apply filters
      if (options.userId) {
        query = query.eq('user_id', options.userId);
      } else if (profile?.role !== 'admin') {
        // Non-admins can only see their own transactions
        query = query.eq('user_id', user.id);
      }

      if (options.status) {
        query = query.eq('payment_status', options.status);
      }

      if (options.startDate) {
        query = query.gte('payment_date', options.startDate.toISOString());
      }

      if (options.endDate) {
        query = query.lte('payment_date', options.endDate.toISOString());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setTransactions(data || []);
    } catch (err) {
      logger.error('Error fetching payment transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch payment transactions');
    } finally {
      setLoading(false);
    }
  }, [user, profile, options.userId, options.status, options.startDate, options.endDate]);

  const createTransaction = useCallback(async (
    transactionData: Partial<PaymentTransaction>
  ) => {
    if (!user || profile?.role !== 'admin') {
      throw new Error('Only admins can create payment transactions');
    }

    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .insert(transactionData)
        .select()
        .single();

      if (error) throw error;

      setTransactions(prev => [data, ...prev]);
      return data;
    } catch (err) {
      logger.error('Error creating payment transaction:', err);
      throw err;
    }
  }, [user, profile]);

  const updateTransactionStatus = useCallback(async (
    transactionId: string,
    status: PaymentTransaction['payment_status'],
    metadata?: Record<string, unknown>
  ) => {
    if (!user || profile?.role !== 'admin') {
      throw new Error('Only admins can update payment transactions');
    }

    try {
      const updateData: Partial<PaymentTransaction> = {
        payment_status: status,
      };

      if (metadata) {
        updateData.metadata = metadata;
      }

      const { data, error } = await supabase
        .from('payment_transactions')
        .update(updateData)
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;

      setTransactions(prev =>
        prev.map(t => t.id === transactionId ? data : t)
      );

      return data;
    } catch (err) {
      logger.error('Error updating payment transaction:', err);
      throw err;
    }
  }, [user, profile]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
    createTransaction,
    updateTransactionStatus,
  };
};

export const useRefundRequests = (options: UsePaymentTransactionsOptions = {}) => {
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();

  const fetchRefundRequests = useCallback(async () => {
    if (!user) {
      setRefundRequests([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('refund_requests')
        .select(`
          *,
          user:profiles!user_id(display_name, email),
          payment_transaction:payment_transactions(*)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (options.userId) {
        query = query.eq('user_id', options.userId);
      } else if (profile?.role !== 'admin') {
        // Non-admins can only see their own refund requests
        query = query.eq('user_id', user.id);
      }

      if (options.status) {
        query = query.eq('refund_status', options.status);
      }

      if (options.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
      }

      if (options.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setRefundRequests(data || []);
    } catch (err) {
      logger.error('Error fetching refund requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch refund requests');
    } finally {
      setLoading(false);
    }
  }, [user, profile, options.userId, options.status, options.startDate, options.endDate]);

  const createRefundRequest = useCallback(async (
    refundData: {
      payment_transaction_id: string;
      enrollment_id: string | null;
      course_id: number | null;
      refund_amount: number;
      refund_reason: string;
    }
  ) => {
    if (!user) {
      throw new Error('User must be logged in to request refunds');
    }

    try {
      const { data, error } = await supabase
        .from('refund_requests')
        .insert({
          ...refundData,
          user_id: user.id,
          requested_by: user.id,
          refund_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      setRefundRequests(prev => [data, ...prev]);
      return data;
    } catch (err) {
      logger.error('Error creating refund request:', err);
      throw err;
    }
  }, [user]);

  const updateRefundStatus = useCallback(async (
    refundId: string,
    status: RefundRequest['refund_status'],
    adminNotes?: string
  ) => {
    if (!user || profile?.role !== 'admin') {
      throw new Error('Only admins can update refund requests');
    }

    try {
      const updateData: Partial<RefundRequest> = {
        refund_status: status,
      };

      if (status === 'approved') {
        updateData.approved_by = user.id;
      } else if (status === 'processed') {
        updateData.processed_by = user.id;
        updateData.refund_date = new Date().toISOString();
      }

      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }

      const { data, error } = await supabase
        .from('refund_requests')
        .update(updateData)
        .eq('id', refundId)
        .select()
        .single();

      if (error) throw error;

      setRefundRequests(prev =>
        prev.map(r => r.id === refundId ? data : r)
      );

      return data;
    } catch (err) {
      logger.error('Error updating refund request:', err);
      throw err;
    }
  }, [user, profile]);

  useEffect(() => {
    fetchRefundRequests();
  }, [fetchRefundRequests]);

  return {
    refundRequests,
    loading,
    error,
    refetch: fetchRefundRequests,
    createRefundRequest,
    updateRefundStatus,
  };
};
