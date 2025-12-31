import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FamilyMembersService } from '../FamilyMembersService';
import type { FamilyMember, AddFamilyMemberParams } from '../types';

// Mock Supabase
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
    raw: vi.fn((sql: string) => sql),
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('FamilyMembersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // FAMILY MEMBER MANAGEMENT
  // ============================================================================

  describe('addFamilyMember', () => {
    const mockParams: AddFamilyMemberParams = {
      subscription_id: 'sub-123',
      member_name: 'John Doe',
      member_email: 'john@example.com',
      member_age: 30,
      relationship: 'spouse',
      access_level: 'member',
    };

    const mockMember: FamilyMember = {
      id: 'member-123',
      subscription_id: 'sub-123',
      primary_user_id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      relationship: 'spouse',
      access_level: 'member',
      status: 'pending_invitation',
      invitation_token: 'token-123',
      invitation_sent_at: '2024-01-01T00:00:00Z',
      invitation_expires_at: '2024-01-08T00:00:00Z',
      invitation_reminders_sent: 0,
      courses_enrolled_count: 0,
      courses_completed_count: 0,
      vault_items_viewed: 0,
      events_attended: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      activated_at: null,
      removed_at: null,
    };

    it('should add family member and send invitation email', async () => {
      const mockUser = { id: 'user-123' };
      const mockProfile = { id: 'user-123', full_name: 'Primary User' };

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: 'member-123',
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockMember,
            error: null,
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockProfileSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      });

      let callCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockSelect };
        } else {
          return { select: mockProfileSelect };
        }
      });

      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {},
        error: null,
      });

      // Mock window.location.origin
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: { origin: 'https://example.com' },
        writable: true,
      });

      const result = await FamilyMembersService.addFamilyMember(mockParams);

      expect(result).toEqual(mockMember);
      expect(supabase.rpc).toHaveBeenCalledWith('add_family_member', {
        p_subscription_id: mockParams.subscription_id,
        p_member_name: mockParams.member_name,
        p_member_email: mockParams.member_email,
        p_member_age: mockParams.member_age,
        p_relationship: mockParams.relationship,
        p_access_level: mockParams.access_level,
      });

      expect(supabase.functions.invoke).toHaveBeenCalledWith('send-email-notification', {
        body: {
          to: mockMember.email,
          type: 'family_invitation',
          data: {
            inviteeName: mockMember.name,
            inviteeEmail: mockMember.email,
            primaryMemberName: mockProfile.full_name,
            daysUntilExpiry: expect.any(Number),
            expiryDate: expect.any(String),
            acceptInvitationUrl: expect.stringContaining('token-123'),
          },
        },
      });

      // Restore window.location
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      });
    });

    it('should throw error if RPC fails', async () => {
      const mockError = new Error('RPC failed');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(FamilyMembersService.addFamilyMember(mockParams)).rejects.toThrow('RPC failed');
    });

    it('should throw error if fetching member fails', async () => {
      const mockError = new Error('Fetch failed');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: 'member-123',
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      await expect(FamilyMembersService.addFamilyMember(mockParams)).rejects.toThrow(
        'Fetch failed'
      );
    });
  });

  describe('removeFamilyMember', () => {
    it('should remove family member successfully', async () => {
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(FamilyMembersService.removeFamilyMember('member-123')).resolves.toBeUndefined();

      expect(supabase.rpc).toHaveBeenCalledWith('remove_family_member', {
        p_member_id: 'member-123',
      });
    });

    it('should throw error if removal fails', async () => {
      const mockError = new Error('Removal failed');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(FamilyMembersService.removeFamilyMember('member-123')).rejects.toThrow(
        'Removal failed'
      );
    });
  });

  describe('getSubscriptionFamilyMembers', () => {
    it('should return family members for subscription', async () => {
      const mockMembers: FamilyMember[] = [
        {
          id: 'member-1',
          subscription_id: 'sub-123',
          primary_user_id: 'user-123',
          name: 'Member 1',
          email: 'member1@example.com',
          age: 25,
          relationship: 'child',
          access_level: 'member',
          status: 'active',
          invitation_token: 'token-1',
          invitation_sent_at: '2024-01-01T00:00:00Z',
          invitation_expires_at: null,
          invitation_reminders_sent: 0,
          courses_enrolled_count: 5,
          courses_completed_count: 3,
          vault_items_viewed: 10,
          events_attended: 2,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          activated_at: '2024-01-02T00:00:00Z',
          removed_at: null,
        },
      ];

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockMembers,
        error: null,
      });

      const result = await FamilyMembersService.getSubscriptionFamilyMembers('sub-123');

      expect(result).toEqual(mockMembers);
      expect(supabase.rpc).toHaveBeenCalledWith('get_subscription_family_members', {
        p_subscription_id: 'sub-123',
      });
    });

    it('should return empty array if no data', async () => {
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await FamilyMembersService.getSubscriptionFamilyMembers('sub-123');

      expect(result).toEqual([]);
    });

    it('should throw error if RPC fails', async () => {
      const mockError = new Error('RPC failed');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(FamilyMembersService.getSubscriptionFamilyMembers('sub-123')).rejects.toThrow(
        'RPC failed'
      );
    });
  });

  describe('updateFamilyMember', () => {
    it('should update family member successfully', async () => {
      const mockUser = { id: 'user-123' };
      const mockUpdated: FamilyMember = {
        id: 'member-123',
        subscription_id: 'sub-123',
        primary_user_id: 'user-123',
        name: 'Updated Name',
        email: 'updated@example.com',
        age: 30,
        relationship: 'spouse',
        access_level: 'admin',
        status: 'active',
        invitation_token: 'token-123',
        invitation_sent_at: '2024-01-01T00:00:00Z',
        invitation_expires_at: null,
        invitation_reminders_sent: 0,
        courses_enrolled_count: 0,
        courses_completed_count: 0,
        vault_items_viewed: 0,
        events_attended: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        activated_at: '2024-01-02T00:00:00Z',
        removed_at: null,
      };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockUpdated,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      const result = await FamilyMembersService.updateFamilyMember('member-123', {
        name: 'Updated Name',
        access_level: 'admin',
      });

      expect(result).toEqual(mockUpdated);
      expect(mockUpdate).toHaveBeenCalledWith({
        name: 'Updated Name',
        access_level: 'admin',
      });
    });

    it('should throw error if not authenticated', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(
        FamilyMembersService.updateFamilyMember('member-123', { name: 'Updated' })
      ).rejects.toThrow('Not authenticated');
    });

    it('should throw error if update fails', async () => {
      const mockUser = { id: 'user-123' };
      const mockError = new Error('Update failed');

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      await expect(
        FamilyMembersService.updateFamilyMember('member-123', { name: 'Updated' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('getFamilyMember', () => {
    it('should return family member by ID', async () => {
      const mockUser = { id: 'user-123' };
      const mockMember: FamilyMember = {
        id: 'member-123',
        subscription_id: 'sub-123',
        primary_user_id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        relationship: 'spouse',
        access_level: 'member',
        status: 'active',
        invitation_token: 'token-123',
        invitation_sent_at: '2024-01-01T00:00:00Z',
        invitation_expires_at: null,
        invitation_reminders_sent: 0,
        courses_enrolled_count: 0,
        courses_completed_count: 0,
        vault_items_viewed: 0,
        events_attended: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        activated_at: '2024-01-02T00:00:00Z',
        removed_at: null,
      };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockMember,
        error: null,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await FamilyMembersService.getFamilyMember('member-123');

      expect(result).toEqual(mockMember);
    });

    it('should return null if not authenticated', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await FamilyMembersService.getFamilyMember('member-123');

      expect(result).toBeNull();
    });

    it('should return null if member not found (PGRST116)', async () => {
      const mockUser = { id: 'user-123' };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await FamilyMembersService.getFamilyMember('member-123');

      expect(result).toBeNull();
    });

    it('should throw error for other errors', async () => {
      const mockUser = { id: 'user-123' };
      const mockError = new Error('Database error');

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      await expect(FamilyMembersService.getFamilyMember('member-123')).rejects.toThrow(
        'Database error'
      );
    });
  });

  // ============================================================================
  // INVITATION MANAGEMENT
  // ============================================================================

  describe('acceptInvitation', () => {
    it('should accept invitation and return member ID', async () => {
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: 'member-123',
        error: null,
      });

      const result = await FamilyMembersService.acceptInvitation('token-123');

      expect(result).toBe('member-123');
      expect(supabase.rpc).toHaveBeenCalledWith('accept_family_invitation', {
        p_invitation_token: 'token-123',
      });
    });

    it('should throw error if RPC fails', async () => {
      const mockError = new Error('Invalid token');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(FamilyMembersService.acceptInvitation('invalid-token')).rejects.toThrow(
        'Invalid token'
      );
    });
  });

  describe('resendInvitation', () => {
    it('should resend invitation email successfully', async () => {
      const mockUser = { id: 'user-123' };
      const mockMember = {
        id: 'member-123',
        name: 'John Doe',
        email: 'john@example.com',
        invitation_token: 'token-123',
        invitation_expires_at: '2024-01-08T00:00:00Z',
        invitation_reminders_sent: 0,
      };
      const mockProfile = { id: 'user-123', full_name: 'Primary User' };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockMemberSingle = vi.fn().mockResolvedValue({
        data: mockMember,
        error: null,
      });

      const mockProfileSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      let selectCallCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          // First call - get member
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: mockMemberSingle,
                }),
              }),
            }),
          };
        } else if (selectCallCount === 2) {
          // Second call - get profile
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockProfileSingle,
              }),
            }),
          };
        } else {
          // Third call - update member
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {},
        error: null,
      });

      // Mock window.location.origin
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: { origin: 'https://example.com' },
        writable: true,
      });

      await expect(FamilyMembersService.resendInvitation('member-123')).resolves.toBeUndefined();

      expect(supabase.functions.invoke).toHaveBeenCalledWith('send-email-notification', {
        body: {
          to: mockMember.email,
          type: 'family_invitation',
          data: expect.objectContaining({
            inviteeName: mockMember.name,
            inviteeEmail: mockMember.email,
            primaryMemberName: mockProfile.full_name,
          }),
        },
      });

      // Restore window.location
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      });
    });

    it('should throw error if not authenticated', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(FamilyMembersService.resendInvitation('member-123')).rejects.toThrow(
        'Not authenticated'
      );
    });
  });

  describe('cancelInvitation', () => {
    it('should cancel pending invitation successfully', async () => {
      const mockUser = { id: 'user-123' };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockIn = vi.fn().mockResolvedValue({
        error: null,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        in: mockIn,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      await expect(FamilyMembersService.cancelInvitation('member-123')).resolves.toBeUndefined();

      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'removed',
        removed_at: expect.any(String),
      });
    });

    it('should throw error if not authenticated', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(FamilyMembersService.cancelInvitation('member-123')).rejects.toThrow(
        'Not authenticated'
      );
    });

    it('should throw error if update fails', async () => {
      const mockUser = { id: 'user-123' };
      const mockError = new Error('Update failed');

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockIn = vi.fn().mockResolvedValue({
        error: mockError,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        in: mockIn,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      await expect(FamilyMembersService.cancelInvitation('member-123')).rejects.toThrow(
        'Update failed'
      );
    });
  });

  describe('getInvitationByToken', () => {
    it('should return invitation if valid and not expired', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockInvitation: FamilyMember = {
        id: 'member-123',
        subscription_id: 'sub-123',
        primary_user_id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        relationship: 'spouse',
        access_level: 'member',
        status: 'invitation_sent',
        invitation_token: 'token-123',
        invitation_sent_at: '2024-01-01T00:00:00Z',
        invitation_expires_at: futureDate.toISOString(),
        invitation_reminders_sent: 0,
        courses_enrolled_count: 0,
        courses_completed_count: 0,
        vault_items_viewed: 0,
        events_attended: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        activated_at: null,
        removed_at: null,
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockInvitation,
        error: null,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await FamilyMembersService.getInvitationByToken('token-123');

      expect(result).toEqual(mockInvitation);
    });

    it('should return null if invitation is expired', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const mockInvitation: FamilyMember = {
        id: 'member-123',
        subscription_id: 'sub-123',
        primary_user_id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        relationship: 'spouse',
        access_level: 'member',
        status: 'invitation_sent',
        invitation_token: 'token-123',
        invitation_sent_at: '2024-01-01T00:00:00Z',
        invitation_expires_at: pastDate.toISOString(),
        invitation_reminders_sent: 0,
        courses_enrolled_count: 0,
        courses_completed_count: 0,
        vault_items_viewed: 0,
        events_attended: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        activated_at: null,
        removed_at: null,
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockInvitation,
        error: null,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await FamilyMembersService.getInvitationByToken('token-123');

      expect(result).toBeNull();
    });

    it('should return null if invitation not found (PGRST116)', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      const result = await FamilyMembersService.getInvitationByToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should throw error for other errors', async () => {
      const mockError = new Error('Database error');

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        select: mockSelect,
      });

      await expect(FamilyMembersService.getInvitationByToken('token-123')).rejects.toThrow(
        'Database error'
      );
    });
  });

  // ============================================================================
  // STATISTICS & ACTIVITY
  // ============================================================================

  describe('syncMemberStats', () => {
    it('should sync member stats successfully', async () => {
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(FamilyMembersService.syncMemberStats('user-123')).resolves.toBeUndefined();

      expect(supabase.rpc).toHaveBeenCalledWith('sync_family_member_stats', {
        p_member_user_id: 'user-123',
      });
    });

    it('should throw error if RPC fails', async () => {
      const mockError = new Error('Sync failed');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(FamilyMembersService.syncMemberStats('user-123')).rejects.toThrow('Sync failed');
    });
  });

  describe('getFamilyStatsSummary', () => {
    it('should calculate family statistics correctly', async () => {
      const mockMembers: FamilyMember[] = [
        {
          id: 'member-1',
          subscription_id: 'sub-123',
          primary_user_id: 'user-123',
          name: 'Member 1',
          email: 'member1@example.com',
          age: 25,
          relationship: 'child',
          access_level: 'member',
          status: 'active',
          invitation_token: 'token-1',
          invitation_sent_at: '2024-01-01T00:00:00Z',
          invitation_expires_at: null,
          invitation_reminders_sent: 0,
          courses_enrolled_count: 10,
          courses_completed_count: 6,
          vault_items_viewed: 15,
          events_attended: 3,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          activated_at: '2024-01-02T00:00:00Z',
          removed_at: null,
        },
        {
          id: 'member-2',
          subscription_id: 'sub-123',
          primary_user_id: 'user-123',
          name: 'Member 2',
          email: 'member2@example.com',
          age: 30,
          relationship: 'spouse',
          access_level: 'admin',
          status: 'active',
          invitation_token: 'token-2',
          invitation_sent_at: '2024-01-01T00:00:00Z',
          invitation_expires_at: null,
          invitation_reminders_sent: 0,
          courses_enrolled_count: 5,
          courses_completed_count: 4,
          vault_items_viewed: 8,
          events_attended: 2,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          activated_at: '2024-01-02T00:00:00Z',
          removed_at: null,
        },
        {
          id: 'member-3',
          subscription_id: 'sub-123',
          primary_user_id: 'user-123',
          name: 'Member 3',
          email: 'member3@example.com',
          age: 20,
          relationship: 'child',
          access_level: 'member',
          status: 'pending_invitation',
          invitation_token: 'token-3',
          invitation_sent_at: '2024-01-01T00:00:00Z',
          invitation_expires_at: '2024-01-08T00:00:00Z',
          invitation_reminders_sent: 0,
          courses_enrolled_count: 0,
          courses_completed_count: 0,
          vault_items_viewed: 0,
          events_attended: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          activated_at: null,
          removed_at: null,
        },
      ];

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockMembers,
        error: null,
      });

      const result = await FamilyMembersService.getFamilyStatsSummary('sub-123');

      expect(result).toEqual({
        totalMembers: 3,
        activeMembers: 2,
        pendingInvitations: 1,
        totalCoursesEnrolled: 15,
        totalCoursesCompleted: 10,
        totalVaultItemsViewed: 23,
        totalEventsAttended: 5,
        averageCoursesPerMember: 7.5, // 15 / 2 active members
        completionRate: (10 / 15) * 100, // 66.67%
      });
    });

    it('should handle empty members list', async () => {
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await FamilyMembersService.getFamilyStatsSummary('sub-123');

      expect(result).toEqual({
        totalMembers: 0,
        activeMembers: 0,
        pendingInvitations: 0,
        totalCoursesEnrolled: 0,
        totalCoursesCompleted: 0,
        totalVaultItemsViewed: 0,
        totalEventsAttended: 0,
        averageCoursesPerMember: 0,
        completionRate: 0,
      });
    });
  });

  describe('getMostActiveMember', () => {
    it('should return member with highest activity score', async () => {
      const mockMembers: FamilyMember[] = [
        {
          id: 'member-1',
          subscription_id: 'sub-123',
          primary_user_id: 'user-123',
          name: 'Member 1',
          email: 'member1@example.com',
          age: 25,
          relationship: 'child',
          access_level: 'member',
          status: 'active',
          invitation_token: 'token-1',
          invitation_sent_at: '2024-01-01T00:00:00Z',
          invitation_expires_at: null,
          invitation_reminders_sent: 0,
          courses_enrolled_count: 10,
          courses_completed_count: 6, // Activity score: 6 + 15 + 3 = 24
          vault_items_viewed: 15,
          events_attended: 3,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          activated_at: '2024-01-02T00:00:00Z',
          removed_at: null,
        },
        {
          id: 'member-2',
          subscription_id: 'sub-123',
          primary_user_id: 'user-123',
          name: 'Member 2',
          email: 'member2@example.com',
          age: 30,
          relationship: 'spouse',
          access_level: 'admin',
          status: 'active',
          invitation_token: 'token-2',
          invitation_sent_at: '2024-01-01T00:00:00Z',
          invitation_expires_at: null,
          invitation_reminders_sent: 0,
          courses_enrolled_count: 5,
          courses_completed_count: 10, // Activity score: 10 + 20 + 5 = 35 (HIGHEST)
          vault_items_viewed: 20,
          events_attended: 5,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          activated_at: '2024-01-02T00:00:00Z',
          removed_at: null,
        },
      ];

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockMembers,
        error: null,
      });

      const result = await FamilyMembersService.getMostActiveMember('sub-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('member-2');
    });

    it('should return null for empty members list', async () => {
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await FamilyMembersService.getMostActiveMember('sub-123');

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // UTILITIES
  // ============================================================================

  describe('getRelationshipDisplayName', () => {
    it('should return correct display names for all relationships', () => {
      expect(FamilyMembersService.getRelationshipDisplayName('self')).toBe('Self');
      expect(FamilyMembersService.getRelationshipDisplayName('spouse')).toBe('Spouse');
      expect(FamilyMembersService.getRelationshipDisplayName('partner')).toBe('Partner');
      expect(FamilyMembersService.getRelationshipDisplayName('child')).toBe('Child');
      expect(FamilyMembersService.getRelationshipDisplayName('parent')).toBe('Parent');
      expect(FamilyMembersService.getRelationshipDisplayName('grandparent')).toBe('Grandparent');
      expect(FamilyMembersService.getRelationshipDisplayName('grandchild')).toBe('Grandchild');
      expect(FamilyMembersService.getRelationshipDisplayName('sibling')).toBe('Sibling');
      expect(FamilyMembersService.getRelationshipDisplayName('other')).toBe('Other');
    });
  });

  describe('getStatusDisplayName', () => {
    it('should return correct display names for all statuses', () => {
      expect(FamilyMembersService.getStatusDisplayName('pending_invitation')).toBe('Pending');
      expect(FamilyMembersService.getStatusDisplayName('invitation_sent')).toBe('Invitation Sent');
      expect(FamilyMembersService.getStatusDisplayName('active')).toBe('Active');
      expect(FamilyMembersService.getStatusDisplayName('inactive')).toBe('Inactive');
      expect(FamilyMembersService.getStatusDisplayName('removed')).toBe('Removed');
      expect(FamilyMembersService.getStatusDisplayName('unknown')).toBe('unknown');
    });
  });

  describe('getStatusColor', () => {
    it('should return correct colors for all statuses', () => {
      expect(FamilyMembersService.getStatusColor('pending_invitation')).toBe('yellow');
      expect(FamilyMembersService.getStatusColor('invitation_sent')).toBe('blue');
      expect(FamilyMembersService.getStatusColor('active')).toBe('green');
      expect(FamilyMembersService.getStatusColor('inactive')).toBe('gray');
      expect(FamilyMembersService.getStatusColor('removed')).toBe('red');
      expect(FamilyMembersService.getStatusColor('unknown')).toBe('gray');
    });
  });

  describe('getAccessLevelDisplayName', () => {
    it('should return correct display names for all access levels', () => {
      expect(FamilyMembersService.getAccessLevelDisplayName('admin')).toBe('Admin');
      expect(FamilyMembersService.getAccessLevelDisplayName('member')).toBe('Member');
      expect(FamilyMembersService.getAccessLevelDisplayName('restricted')).toBe('Restricted');
    });
  });

  describe('isInvitationExpired', () => {
    it('should return true for expired invitations', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const member: FamilyMember = {
        id: 'member-123',
        subscription_id: 'sub-123',
        primary_user_id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        relationship: 'spouse',
        access_level: 'member',
        status: 'invitation_sent',
        invitation_token: 'token-123',
        invitation_sent_at: '2024-01-01T00:00:00Z',
        invitation_expires_at: pastDate.toISOString(),
        invitation_reminders_sent: 0,
        courses_enrolled_count: 0,
        courses_completed_count: 0,
        vault_items_viewed: 0,
        events_attended: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        activated_at: null,
        removed_at: null,
      };

      expect(FamilyMembersService.isInvitationExpired(member)).toBe(true);
    });

    it('should return false for valid invitations', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const member: FamilyMember = {
        id: 'member-123',
        subscription_id: 'sub-123',
        primary_user_id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        relationship: 'spouse',
        access_level: 'member',
        status: 'invitation_sent',
        invitation_token: 'token-123',
        invitation_sent_at: '2024-01-01T00:00:00Z',
        invitation_expires_at: futureDate.toISOString(),
        invitation_reminders_sent: 0,
        courses_enrolled_count: 0,
        courses_completed_count: 0,
        vault_items_viewed: 0,
        events_attended: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        activated_at: null,
        removed_at: null,
      };

      expect(FamilyMembersService.isInvitationExpired(member)).toBe(false);
    });

    it('should return false if no expiry date', () => {
      const member: FamilyMember = {
        id: 'member-123',
        subscription_id: 'sub-123',
        primary_user_id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        relationship: 'spouse',
        access_level: 'member',
        status: 'active',
        invitation_token: 'token-123',
        invitation_sent_at: '2024-01-01T00:00:00Z',
        invitation_expires_at: null,
        invitation_reminders_sent: 0,
        courses_enrolled_count: 0,
        courses_completed_count: 0,
        vault_items_viewed: 0,
        events_attended: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        activated_at: '2024-01-02T00:00:00Z',
        removed_at: null,
      };

      expect(FamilyMembersService.isInvitationExpired(member)).toBe(false);
    });
  });

  describe('getDaysUntilInvitationExpires', () => {
    it('should return correct days for future expiry', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const member: FamilyMember = {
        id: 'member-123',
        subscription_id: 'sub-123',
        primary_user_id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        relationship: 'spouse',
        access_level: 'member',
        status: 'invitation_sent',
        invitation_token: 'token-123',
        invitation_sent_at: '2024-01-01T00:00:00Z',
        invitation_expires_at: futureDate.toISOString(),
        invitation_reminders_sent: 0,
        courses_enrolled_count: 0,
        courses_completed_count: 0,
        vault_items_viewed: 0,
        events_attended: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        activated_at: null,
        removed_at: null,
      };

      const result = FamilyMembersService.getDaysUntilInvitationExpires(member);

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(8);
    });

    it('should return 0 for expired invitations', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const member: FamilyMember = {
        id: 'member-123',
        subscription_id: 'sub-123',
        primary_user_id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        relationship: 'spouse',
        access_level: 'member',
        status: 'invitation_sent',
        invitation_token: 'token-123',
        invitation_sent_at: '2024-01-01T00:00:00Z',
        invitation_expires_at: pastDate.toISOString(),
        invitation_reminders_sent: 0,
        courses_enrolled_count: 0,
        courses_completed_count: 0,
        vault_items_viewed: 0,
        events_attended: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        activated_at: null,
        removed_at: null,
      };

      expect(FamilyMembersService.getDaysUntilInvitationExpires(member)).toBe(0);
    });

    it('should return null if no expiry date', () => {
      const member: FamilyMember = {
        id: 'member-123',
        subscription_id: 'sub-123',
        primary_user_id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        relationship: 'spouse',
        access_level: 'member',
        status: 'active',
        invitation_token: 'token-123',
        invitation_sent_at: '2024-01-01T00:00:00Z',
        invitation_expires_at: null,
        invitation_reminders_sent: 0,
        courses_enrolled_count: 0,
        courses_completed_count: 0,
        vault_items_viewed: 0,
        events_attended: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        activated_at: '2024-01-02T00:00:00Z',
        removed_at: null,
      };

      expect(FamilyMembersService.getDaysUntilInvitationExpires(member)).toBeNull();
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(FamilyMembersService.isValidEmail('test@example.com')).toBe(true);
      expect(FamilyMembersService.isValidEmail('user+tag@domain.co.uk')).toBe(true);
      expect(FamilyMembersService.isValidEmail('first.last@company.io')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(FamilyMembersService.isValidEmail('invalid')).toBe(false);
      expect(FamilyMembersService.isValidEmail('missing@domain')).toBe(false);
      expect(FamilyMembersService.isValidEmail('@nodomain.com')).toBe(false);
      expect(FamilyMembersService.isValidEmail('spaces in@email.com')).toBe(false);
    });
  });

  describe('isValidAge', () => {
    it('should validate ages within range (5-120)', () => {
      expect(FamilyMembersService.isValidAge(5)).toBe(true);
      expect(FamilyMembersService.isValidAge(18)).toBe(true);
      expect(FamilyMembersService.isValidAge(65)).toBe(true);
      expect(FamilyMembersService.isValidAge(120)).toBe(true);
    });

    it('should reject ages outside range', () => {
      expect(FamilyMembersService.isValidAge(4)).toBe(false);
      expect(FamilyMembersService.isValidAge(121)).toBe(false);
      expect(FamilyMembersService.isValidAge(0)).toBe(false);
      expect(FamilyMembersService.isValidAge(-1)).toBe(false);
    });
  });
});
