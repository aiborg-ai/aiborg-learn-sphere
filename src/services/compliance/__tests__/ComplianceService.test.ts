import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComplianceService } from '../ComplianceService';
import type {
  ComplianceRequirement,
  UserComplianceStatus,
  ComplianceAuditLog,
  ComplianceSummary,
  ComplianceReport,
  UserComplianceItem,
} from '../ComplianceService';

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('ComplianceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRequirement: ComplianceRequirement = {
    id: 'req-1',
    title: 'GDPR Training',
    description: 'GDPR compliance training',
    category: 'training',
    course_id: 'course-1',
    frequency: 'annual',
    renewal_period_days: 365,
    grace_period_days: 14,
    target_roles: ['admin', 'manager'],
    target_departments: ['IT', 'HR'],
    is_mandatory: true,
    regulatory_body: 'EU',
    legal_reference: 'GDPR Article 5',
    compliance_code: 'GDPR-001',
    passing_score: 80,
    max_attempts: 3,
    is_active: true,
    effective_date: '2024-01-01',
    sunset_date: null,
  };

  // ===== Requirements Management =====

  describe('getRequirements', () => {
    it('should return all active requirements by default', async () => {
      const mockQuery = Promise.resolve({
        data: [mockRequirement],
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue(mockQuery);

      const mockOrder = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      const mockSelect = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await ComplianceService.getRequirements();

      expect(result).toEqual([mockRequirement]);
      expect(mockEq).toHaveBeenCalledWith('is_active', true);
    });

    it('should filter by category', async () => {
      const mockQuery = Promise.resolve({
        data: [mockRequirement],
        error: null,
      });

      const mockEqCategory = vi.fn().mockReturnValue(mockQuery);

      const mockEqActive = vi.fn().mockReturnValue({
        eq: mockEqCategory,
      });

      const mockOrder = vi.fn().mockReturnValue({
        eq: mockEqActive,
      });

      const mockSelect = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await ComplianceService.getRequirements({ category: 'training' });

      expect(result).toEqual([mockRequirement]);
    });

    it('should include inactive requirements when active_only is false', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [mockRequirement],
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await ComplianceService.getRequirements({ active_only: false });

      expect(result).toEqual([mockRequirement]);
    });

    it('should return empty array if no data', async () => {
      const mockQuery = Promise.resolve({
        data: null,
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue(mockQuery);

      const mockOrder = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      const mockSelect = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await ComplianceService.getRequirements();

      expect(result).toEqual([]);
    });

    it('should throw error if query fails', async () => {
      const mockError = new Error('Query failed');

      const mockQuery = Promise.resolve({
        data: null,
        error: mockError,
      });

      const mockEq = vi.fn().mockReturnValue(mockQuery);

      const mockOrder = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      const mockSelect = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      await expect(ComplianceService.getRequirements()).rejects.toThrow('Query failed');
    });
  });

  describe('getRequirement', () => {
    it('should return requirement by ID', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockRequirement,
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await ComplianceService.getRequirement('req-1');

      expect(result).toEqual(mockRequirement);
    });

    it('should throw error if query fails', async () => {
      const mockError = new Error('Not found');

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      await expect(ComplianceService.getRequirement('req-1')).rejects.toThrow('Not found');
    });
  });

  describe('createRequirement', () => {
    it('should create requirement with defaults', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockRequirement,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      const result = await ComplianceService.createRequirement({
        title: 'GDPR Training',
      });

      expect(result).toEqual(mockRequirement);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'GDPR Training',
          category: 'training',
          frequency: 'annual',
          renewal_period_days: 365,
          grace_period_days: 14,
          is_mandatory: true,
          passing_score: 80,
          max_attempts: 3,
        })
      );
    });

    it('should throw error if insert fails', async () => {
      const mockError = new Error('Insert failed');

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: mockInsert,
      });

      await expect(ComplianceService.createRequirement({ title: 'Test' })).rejects.toThrow(
        'Insert failed'
      );
    });
  });

  describe('updateRequirement', () => {
    it('should update requirement successfully', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        error: null,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      await expect(
        ComplianceService.updateRequirement('req-1', { title: 'Updated' })
      ).resolves.toBeUndefined();

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated',
          updated_at: expect.any(String),
        })
      );
    });

    it('should throw error if update fails', async () => {
      const mockError = new Error('Update failed');

      const mockEq = vi.fn().mockResolvedValue({
        error: mockError,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      await expect(
        ComplianceService.updateRequirement('req-1', { title: 'Updated' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('archiveRequirement', () => {
    it('should archive requirement successfully', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        error: null,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      await expect(ComplianceService.archiveRequirement('req-1')).resolves.toBeUndefined();

      expect(mockUpdate).toHaveBeenCalledWith({
        is_active: false,
        sunset_date: expect.any(String),
      });
    });

    it('should throw error if update fails', async () => {
      const mockError = new Error('Archive failed');

      const mockEq = vi.fn().mockResolvedValue({
        error: mockError,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      await expect(ComplianceService.archiveRequirement('req-1')).rejects.toThrow('Archive failed');
    });
  });

  // ===== User Compliance Status =====

  describe('getUserCompliance', () => {
    it('should return user compliance items', async () => {
      const mockItems: UserComplianceItem[] = [
        {
          status_id: 'status-1',
          requirement_id: 'req-1',
          title: 'GDPR Training',
          category: 'training',
          status: 'completed',
          due_date: '2024-12-31',
          expiry_date: '2025-12-31',
          score: 95,
          is_overdue: false,
          is_expiring_soon: false,
        },
      ];

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockItems,
        error: null,
      });

      const result = await ComplianceService.getUserCompliance('user-1');

      expect(result).toEqual(mockItems);
      expect(supabase.rpc).toHaveBeenCalledWith('get_user_compliance', {
        p_user_id: 'user-1',
      });
    });

    it('should return empty array if no data', async () => {
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await ComplianceService.getUserCompliance('user-1');

      expect(result).toEqual([]);
    });

    it('should throw error if RPC fails', async () => {
      const mockError = new Error('RPC failed');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(ComplianceService.getUserCompliance('user-1')).rejects.toThrow('RPC failed');
    });
  });

  describe('getRequirementStatuses', () => {
    it('should return requirement statuses', async () => {
      const mockStatuses: UserComplianceStatus[] = [
        {
          id: 'status-1',
          user_id: 'user-1',
          requirement_id: 'req-1',
          requirement: mockRequirement,
          status: 'completed',
          assigned_date: '2024-01-01',
          due_date: '2024-12-31',
          started_date: '2024-01-02',
          completed_date: '2024-06-01',
          expiry_date: '2025-06-01',
          score: 95,
          attempts: 1,
          certificate_id: 'cert-1',
          is_renewal: false,
          exemption_reason: null,
        },
      ];

      const mockOrder2 = vi.fn().mockResolvedValue({
        data: mockStatuses,
        error: null,
      });

      const mockOrder1 = vi.fn().mockReturnValue({
        order: mockOrder2,
      });

      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder1,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await ComplianceService.getRequirementStatuses('req-1');

      expect(result).toEqual(mockStatuses);
    });

    it('should throw error if query fails', async () => {
      const mockError = new Error('Query failed');

      const mockOrder2 = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockOrder1 = vi.fn().mockReturnValue({
        order: mockOrder2,
      });

      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder1,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      await expect(ComplianceService.getRequirementStatuses('req-1')).rejects.toThrow(
        'Query failed'
      );
    });
  });

  describe('assignToUser', () => {
    it('should assign requirement to user', async () => {
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: 'status-1',
        error: null,
      });

      const result = await ComplianceService.assignToUser('user-1', 'req-1');

      expect(result).toBe('status-1');
      expect(supabase.rpc).toHaveBeenCalledWith('assign_compliance_requirement', {
        p_user_id: 'user-1',
        p_requirement_id: 'req-1',
        p_due_date: null,
      });
    });

    it('should assign with due date', async () => {
      const dueDate = new Date('2024-12-31');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: 'status-1',
        error: null,
      });

      const result = await ComplianceService.assignToUser('user-1', 'req-1', dueDate);

      expect(result).toBe('status-1');
      expect(supabase.rpc).toHaveBeenCalledWith('assign_compliance_requirement', {
        p_user_id: 'user-1',
        p_requirement_id: 'req-1',
        p_due_date: dueDate.toISOString(),
      });
    });

    it('should throw error if RPC fails', async () => {
      const mockError = new Error('Assignment failed');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(ComplianceService.assignToUser('user-1', 'req-1')).rejects.toThrow(
        'Assignment failed'
      );
    });
  });

  describe('bulkAssign', () => {
    it('should assign to multiple users', async () => {
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: 'status-1',
        error: null,
      });

      const result = await ComplianceService.bulkAssign(['user-1', 'user-2', 'user-3'], 'req-1');

      expect(result).toBe(3);
      expect(supabase.rpc).toHaveBeenCalledTimes(3);
    });

    it('should throw error if assignment fails', async () => {
      (supabase.rpc as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          data: 'status-1',
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: new Error('Failed'),
        });

      await expect(ComplianceService.bulkAssign(['user-1', 'user-2'], 'req-1')).rejects.toThrow(
        'Failed'
      );
    });
  });

  describe('autoAssignByRole', () => {
    it('should auto-assign by role', async () => {
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: 5,
        error: null,
      });

      const result = await ComplianceService.autoAssignByRole('user-1', 'admin');

      expect(result).toBe(5);
      expect(supabase.rpc).toHaveBeenCalledWith('auto_assign_by_role', {
        p_user_id: 'user-1',
        p_role: 'admin',
      });
    });

    it('should return 0 if no data', async () => {
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await ComplianceService.autoAssignByRole('user-1', 'admin');

      expect(result).toBe(0);
    });

    it('should throw error if RPC fails', async () => {
      const mockError = new Error('Auto-assign failed');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(ComplianceService.autoAssignByRole('user-1', 'admin')).rejects.toThrow(
        'Auto-assign failed'
      );
    });
  });

  describe('updateStatus', () => {
    it('should update status to in_progress and set started_date', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        error: null,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      await expect(
        ComplianceService.updateStatus('status-1', { status: 'in_progress' })
      ).resolves.toBeUndefined();

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'in_progress',
          started_date: expect.any(String),
          updated_at: expect.any(String),
        })
      );
    });

    it('should update status to completed and set completed_date', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        error: null,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      await expect(
        ComplianceService.updateStatus('status-1', { status: 'completed', score: 95 })
      ).resolves.toBeUndefined();

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          score: 95,
          completed_date: expect.any(String),
          updated_at: expect.any(String),
        })
      );
    });

    it('should throw error if update fails', async () => {
      const mockError = new Error('Update failed');

      const mockEq = vi.fn().mockResolvedValue({
        error: mockError,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      await expect(
        ComplianceService.updateStatus('status-1', { status: 'completed' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('completeRequirement', () => {
    it('should complete requirement and calculate expiry', async () => {
      const mockStatus = {
        id: 'status-1',
        attempts: 0,
        requirement: {
          renewal_period_days: 365,
        },
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockStatus,
        error: null,
      });

      const mockEqFetch = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockSelectFetch = vi.fn().mockReturnValue({
        eq: mockEqFetch,
      });

      const mockEqUpdate = vi.fn().mockResolvedValue({
        error: null,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEqUpdate,
      });

      let callCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockSelectFetch };
        } else {
          return { update: mockUpdate };
        }
      });

      await expect(
        ComplianceService.completeRequirement('status-1', 95, 'cert-1')
      ).resolves.toBeUndefined();

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          score: 95,
          completed_date: expect.any(String),
          expiry_date: expect.any(String),
          certificate_id: 'cert-1',
          attempts: 1,
        })
      );
    });

    it('should throw error if fetch fails', async () => {
      const mockError = new Error('Fetch failed');

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      await expect(ComplianceService.completeRequirement('status-1', 95)).rejects.toThrow(
        'Fetch failed'
      );
    });
  });

  describe('grantExemption', () => {
    it('should grant exemption successfully', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        error: null,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      await expect(
        ComplianceService.grantExemption('status-1', 'Medical reason', 'admin-1')
      ).resolves.toBeUndefined();

      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'exempted',
        exemption_reason: 'Medical reason',
        exempted_by: 'admin-1',
        exemption_date: expect.any(String),
        updated_at: expect.any(String),
      });
    });

    it('should throw error if update fails', async () => {
      const mockError = new Error('Exemption failed');

      const mockEq = vi.fn().mockResolvedValue({
        error: mockError,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      await expect(
        ComplianceService.grantExemption('status-1', 'Reason', 'admin-1')
      ).rejects.toThrow('Exemption failed');
    });
  });

  // ===== Reminders & Automation =====

  describe('getReminders', () => {
    it('should return reminders with default days ahead', async () => {
      const mockReminders = [
        {
          status_id: 'status-1',
          user_id: 'user-1',
          requirement_id: 'req-1',
          requirement_title: 'GDPR Training',
          due_date: '2024-12-31',
          days_until_due: 15,
          reminder_type: '14_day',
        },
      ];

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockReminders,
        error: null,
      });

      const result = await ComplianceService.getReminders();

      expect(result).toEqual(mockReminders);
      expect(supabase.rpc).toHaveBeenCalledWith('get_compliance_reminders', {
        p_days_ahead: 30,
      });
    });

    it('should return reminders with custom days ahead', async () => {
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await ComplianceService.getReminders(60);

      expect(result).toEqual([]);
      expect(supabase.rpc).toHaveBeenCalledWith('get_compliance_reminders', {
        p_days_ahead: 60,
      });
    });

    it('should throw error if RPC fails', async () => {
      const mockError = new Error('RPC failed');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(ComplianceService.getReminders()).rejects.toThrow('RPC failed');
    });
  });

  describe('markReminderSent', () => {
    it('should mark 7-day reminder as sent', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        error: null,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      await expect(
        ComplianceService.markReminderSent('status-1', '7_day')
      ).resolves.toBeUndefined();

      expect(mockUpdate).toHaveBeenCalledWith({ reminder_7_day_sent: true });
    });

    it('should mark 14-day reminder as sent', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        error: null,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      await expect(
        ComplianceService.markReminderSent('status-1', '14_day')
      ).resolves.toBeUndefined();

      expect(mockUpdate).toHaveBeenCalledWith({ reminder_14_day_sent: true });
    });

    it('should throw error if update fails', async () => {
      const mockError = new Error('Update failed');

      const mockEq = vi.fn().mockResolvedValue({
        error: mockError,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      await expect(ComplianceService.markReminderSent('status-1', '7_day')).rejects.toThrow(
        'Update failed'
      );
    });
  });

  describe('processExpiries', () => {
    it('should process expiries and return counts', async () => {
      const mockResult = {
        expired_count: 10,
        renewals_created: 8,
        escalations_sent: 2,
      };

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [mockResult],
        error: null,
      });

      const result = await ComplianceService.processExpiries();

      expect(result).toEqual(mockResult);
      expect(supabase.rpc).toHaveBeenCalledWith('process_compliance_expiries');
    });

    it('should return default counts if no data', async () => {
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await ComplianceService.processExpiries();

      expect(result).toEqual({
        expired_count: 0,
        renewals_created: 0,
        escalations_sent: 0,
      });
    });

    it('should throw error if RPC fails', async () => {
      const mockError = new Error('Processing failed');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(ComplianceService.processExpiries()).rejects.toThrow('Processing failed');
    });
  });

  // ===== Reporting =====

  describe('getSummary', () => {
    it('should return compliance summary', async () => {
      const mockSummary: ComplianceSummary = {
        total_requirements: 10,
        total_users: 100,
        compliant_count: 85,
        non_compliant_count: 15,
        overdue_count: 5,
        expiring_soon_count: 10,
        compliance_rate: 85,
      };

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [mockSummary],
        error: null,
      });

      const result = await ComplianceService.getSummary();

      expect(result).toEqual(mockSummary);
      expect(supabase.rpc).toHaveBeenCalledWith('get_compliance_summary');
    });

    it('should return default summary if no data', async () => {
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await ComplianceService.getSummary();

      expect(result).toEqual({
        total_requirements: 0,
        total_users: 0,
        compliant_count: 0,
        non_compliant_count: 0,
        overdue_count: 0,
        expiring_soon_count: 0,
        compliance_rate: 0,
      });
    });

    it('should throw error if RPC fails', async () => {
      const mockError = new Error('Summary failed');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(ComplianceService.getSummary()).rejects.toThrow('Summary failed');
    });
  });

  describe('generateReport', () => {
    it('should generate report without dates', async () => {
      const mockReport: ComplianceReport[] = [
        {
          requirement_title: 'GDPR Training',
          total_assigned: 100,
          completed: 85,
          in_progress: 10,
          overdue: 5,
          completion_rate: 85,
          avg_score: 92.5,
          avg_completion_days: 30,
        },
      ];

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockReport,
        error: null,
      });

      const result = await ComplianceService.generateReport();

      expect(result).toEqual(mockReport);
      expect(supabase.rpc).toHaveBeenCalledWith('generate_compliance_report', {
        p_start_date: null,
        p_end_date: null,
      });
    });

    it('should generate report with date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await ComplianceService.generateReport(startDate, endDate);

      expect(result).toEqual([]);
      expect(supabase.rpc).toHaveBeenCalledWith('generate_compliance_report', {
        p_start_date: '2024-01-01',
        p_end_date: '2024-12-31',
      });
    });

    it('should throw error if RPC fails', async () => {
      const mockError = new Error('Report failed');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(ComplianceService.generateReport()).rejects.toThrow('Report failed');
    });
  });

  describe('getAuditLog', () => {
    const mockAuditLog: ComplianceAuditLog[] = [
      {
        id: 'log-1',
        user_id: 'user-1',
        requirement_id: 'req-1',
        status_id: 'status-1',
        action: 'completed',
        status_before: 'in_progress',
        status_after: 'completed',
        reason: null,
        actioned_by: 'user-1',
        metadata: {},
        created_at: '2024-06-01T00:00:00Z',
      },
    ];

    it('should return audit log without filters', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: mockAuditLog,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await ComplianceService.getAuditLog();

      expect(result).toEqual(mockAuditLog);
    });

    it('should filter audit log by user ID', async () => {
      const mockQuery = Promise.resolve({
        data: mockAuditLog,
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue(mockQuery);

      const mockOrder = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      const mockSelect = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await ComplianceService.getAuditLog({ userId: 'user-1' });

      expect(result).toEqual(mockAuditLog);
    });

    it('should apply limit to audit log', async () => {
      const mockLimit = vi.fn().mockResolvedValue({
        data: mockAuditLog,
        error: null,
      });

      const mockOrder = vi.fn().mockReturnValue({
        limit: mockLimit,
      });

      const mockSelect = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await ComplianceService.getAuditLog({ limit: 10 });

      expect(result).toEqual(mockAuditLog);
      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('should throw error if query fails', async () => {
      const mockError = new Error('Query failed');

      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockSelect = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      await expect(ComplianceService.getAuditLog()).rejects.toThrow('Query failed');
    });
  });

  describe('exportData', () => {
    beforeEach(() => {
      // Mock the methods called by exportData
      vi.spyOn(ComplianceService, 'getRequirements').mockResolvedValue([mockRequirement]);
      vi.spyOn(ComplianceService, 'generateReport').mockResolvedValue([
        {
          requirement_title: 'GDPR Training',
          total_assigned: 100,
          completed: 85,
          in_progress: 10,
          overdue: 5,
          completion_rate: 85,
          avg_score: 92.5,
          avg_completion_days: 30,
        },
      ]);
      vi.spyOn(ComplianceService, 'getSummary').mockResolvedValue({
        total_requirements: 10,
        total_users: 100,
        compliant_count: 85,
        non_compliant_count: 15,
        overdue_count: 5,
        expiring_soon_count: 10,
        compliance_rate: 85,
      });
    });

    it('should export data as JSON by default', async () => {
      const result = await ComplianceService.exportData();

      expect(typeof result).toBe('string');
      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty('generated_at');
      expect(parsed).toHaveProperty('summary');
      expect(parsed).toHaveProperty('requirements');
      expect(parsed).toHaveProperty('report');
    });

    it('should export data as CSV', async () => {
      const result = await ComplianceService.exportData('csv');

      expect(typeof result).toBe('string');
      expect(result).toContain('requirement_title');
      expect(result).toContain('GDPR Training');
    });

    it('should throw error if methods fail', async () => {
      vi.spyOn(ComplianceService, 'getRequirements').mockRejectedValue(new Error('Export failed'));

      await expect(ComplianceService.exportData()).rejects.toThrow('Export failed');
    });
  });

  describe('getDashboardData', () => {
    beforeEach(() => {
      // Mock all methods called by getDashboardData
      vi.spyOn(ComplianceService, 'getSummary').mockResolvedValue({
        total_requirements: 10,
        total_users: 100,
        compliant_count: 85,
        non_compliant_count: 15,
        overdue_count: 5,
        expiring_soon_count: 10,
        compliance_rate: 85,
      });

      vi.spyOn(ComplianceService, 'getRequirements').mockResolvedValue([mockRequirement]);

      vi.spyOn(ComplianceService, 'generateReport').mockResolvedValue([
        {
          requirement_title: 'GDPR Training',
          total_assigned: 100,
          completed: 85,
          in_progress: 10,
          overdue: 5,
          completion_rate: 85,
          avg_score: 92.5,
          avg_completion_days: 30,
        },
      ]);

      vi.spyOn(ComplianceService, 'getAuditLog').mockResolvedValue([
        {
          id: 'log-1',
          user_id: 'user-1',
          requirement_id: 'req-1',
          status_id: 'status-1',
          action: 'completed',
          status_before: 'in_progress',
          status_after: 'completed',
          reason: null,
          actioned_by: 'user-1',
          metadata: {},
          created_at: '2024-06-01T00:00:00Z',
        },
      ]);

      vi.spyOn(ComplianceService, 'getReminders').mockResolvedValue([
        {
          status_id: 'status-1',
          user_id: 'user-1',
          requirement_id: 'req-1',
          requirement_title: 'GDPR Training',
          due_date: '2024-12-31',
          days_until_due: 15,
          reminder_type: '14_day',
        },
      ]);
    });

    it('should return complete dashboard data', async () => {
      const result = await ComplianceService.getDashboardData();

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('requirements');
      expect(result).toHaveProperty('report');
      expect(result).toHaveProperty('recentAudit');
      expect(result).toHaveProperty('upcomingReminders');
      expect(result.upcomingReminders).toBe(1);
    });

    it('should throw error if any method fails', async () => {
      vi.spyOn(ComplianceService, 'getSummary').mockRejectedValue(
        new Error('Dashboard fetch failed')
      );

      await expect(ComplianceService.getDashboardData()).rejects.toThrow('Dashboard fetch failed');
    });
  });
});
