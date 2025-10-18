/**
 * Family Members Service
 *
 * Handles family member operations including:
 * - Adding/removing family members
 * - Invitation management
 * - Family member statistics
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  FamilyMember,
  AddFamilyMemberParams,
  FamilyRelationship,
  FamilyMemberAccessLevel,
} from './types';

export class FamilyMembersService {
  // ============================================================================
  // FAMILY MEMBER MANAGEMENT
  // ============================================================================

  /**
   * Add family member to subscription
   */
  static async addFamilyMember(
    params: AddFamilyMemberParams
  ): Promise<FamilyMember> {
    const { data: memberId, error } = await supabase.rpc('add_family_member', {
      p_subscription_id: params.subscription_id,
      p_member_name: params.member_name,
      p_member_email: params.member_email,
      p_member_age: params.member_age,
      p_relationship: params.relationship,
      p_access_level: params.access_level || 'member',
    });

    if (error) throw error;

    // Fetch the created family member
    const { data: member, error: fetchError } = await supabase
      .from('family_members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (fetchError) throw fetchError;

    // Send invitation email
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: primaryUser } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const daysUntilExpiry = this.getDaysUntilInvitationExpires(member);
      const expiryDate = member.invitation_expires_at
        ? new Date(member.invitation_expires_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : '';

      const baseUrl = window.location.origin;
      const acceptInvitationUrl = `${baseUrl}/family-membership/accept-invitation?token=${member.invitation_token}`;

      await supabase.functions.invoke('send-email-notification', {
        body: {
          to: member.email,
          type: 'family_invitation',
          data: {
            inviteeName: member.name,
            inviteeEmail: member.email,
            primaryMemberName: primaryUser?.full_name || 'A family member',
            daysUntilExpiry: daysUntilExpiry || 7,
            expiryDate: expiryDate,
            acceptInvitationUrl: acceptInvitationUrl,
          },
        },
      });
    }

    return member;
  }

  /**
   * Remove family member from subscription
   */
  static async removeFamilyMember(memberId: string): Promise<void> {
    const { error } = await supabase.rpc('remove_family_member', {
      p_member_id: memberId,
    });

    if (error) throw error;
  }

  /**
   * Get family members for a subscription
   */
  static async getSubscriptionFamilyMembers(
    subscriptionId: string
  ): Promise<FamilyMember[]> {
    const { data, error } = await supabase.rpc(
      'get_subscription_family_members',
      {
        p_subscription_id: subscriptionId,
      }
    );

    if (error) throw error;

    return data || [];
  }

  /**
   * Update family member details
   */
  static async updateFamilyMember(
    memberId: string,
    updates: Partial<FamilyMember>
  ): Promise<FamilyMember> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('family_members')
      .update(updates)
      .eq('id', memberId)
      .eq('primary_user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Get family member by ID
   */
  static async getFamilyMember(memberId: string): Promise<FamilyMember | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('id', memberId)
      .eq('primary_user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
  }

  // ============================================================================
  // INVITATION MANAGEMENT
  // ============================================================================

  /**
   * Accept family invitation
   */
  static async acceptInvitation(invitationToken: string): Promise<string> {
    const { data: memberId, error } = await supabase.rpc(
      'accept_family_invitation',
      {
        p_invitation_token: invitationToken,
      }
    );

    if (error) throw error;

    return memberId;
  }

  /**
   * Resend invitation email
   */
  static async resendInvitation(memberId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    // Get family member and primary user details
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .select('*, subscription:membership_subscriptions(user_id)')
      .eq('id', memberId)
      .eq('primary_user_id', user.id)
      .single();

    if (memberError) throw memberError;

    const { data: primaryUser, error: userError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;

    // Increment reminders sent count
    const { error } = await supabase
      .from('family_members')
      .update({
        invitation_reminders_sent: supabase.raw('invitation_reminders_sent + 1'),
        invitation_sent_at: new Date().toISOString(),
      })
      .eq('id', memberId)
      .eq('primary_user_id', user.id);

    if (error) throw error;

    // Send invitation email
    const daysUntilExpiry = this.getDaysUntilInvitationExpires(member);
    const expiryDate = member.invitation_expires_at
      ? new Date(member.invitation_expires_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '';

    const baseUrl = window.location.origin;
    const acceptInvitationUrl = `${baseUrl}/family-membership/accept-invitation?token=${member.invitation_token}`;

    await supabase.functions.invoke('send-email-notification', {
      body: {
        to: member.email,
        type: 'family_invitation',
        data: {
          inviteeName: member.name,
          inviteeEmail: member.email,
          primaryMemberName: primaryUser?.full_name || 'A family member',
          daysUntilExpiry: daysUntilExpiry || 7,
          expiryDate: expiryDate,
          acceptInvitationUrl: acceptInvitationUrl,
        },
      },
    });
  }

  /**
   * Cancel pending invitation
   */
  static async cancelInvitation(memberId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('family_members')
      .update({
        status: 'removed',
        removed_at: new Date().toISOString(),
      })
      .eq('id', memberId)
      .eq('primary_user_id', user.id)
      .in('status', ['pending_invitation', 'invitation_sent']);

    if (error) throw error;
  }

  /**
   * Get invitation by token
   */
  static async getInvitationByToken(
    token: string
  ): Promise<FamilyMember | null> {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('invitation_token', token)
      .eq('status', 'invitation_sent')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    // Check if invitation has expired
    if (
      data.invitation_expires_at &&
      new Date(data.invitation_expires_at) < new Date()
    ) {
      return null;
    }

    return data;
  }

  // ============================================================================
  // STATISTICS & ACTIVITY
  // ============================================================================

  /**
   * Sync family member activity statistics
   */
  static async syncMemberStats(memberUserId: string): Promise<void> {
    const { error } = await supabase.rpc('sync_family_member_stats', {
      p_member_user_id: memberUserId,
    });

    if (error) throw error;
  }

  /**
   * Get family member statistics summary
   */
  static async getFamilyStatsSummary(subscriptionId: string) {
    const members = await this.getSubscriptionFamilyMembers(subscriptionId);

    const totalMembers = members.length;
    const activeMembers = members.filter((m) => m.status === 'active').length;
    const pendingInvitations = members.filter((m) =>
      ['pending_invitation', 'invitation_sent'].includes(m.status)
    ).length;

    const totalCoursesEnrolled = members.reduce(
      (sum, m) => sum + m.courses_enrolled_count,
      0
    );
    const totalCoursesCompleted = members.reduce(
      (sum, m) => sum + m.courses_completed_count,
      0
    );
    const totalVaultItemsViewed = members.reduce(
      (sum, m) => sum + m.vault_items_viewed,
      0
    );
    const totalEventsAttended = members.reduce(
      (sum, m) => sum + m.events_attended,
      0
    );

    return {
      totalMembers,
      activeMembers,
      pendingInvitations,
      totalCoursesEnrolled,
      totalCoursesCompleted,
      totalVaultItemsViewed,
      totalEventsAttended,
      averageCoursesPerMember:
        activeMembers > 0 ? totalCoursesEnrolled / activeMembers : 0,
      completionRate:
        totalCoursesEnrolled > 0
          ? (totalCoursesCompleted / totalCoursesEnrolled) * 100
          : 0,
    };
  }

  /**
   * Get most active family member
   */
  static async getMostActiveMember(
    subscriptionId: string
  ): Promise<FamilyMember | null> {
    const members = await this.getSubscriptionFamilyMembers(subscriptionId);

    if (members.length === 0) return null;

    // Calculate activity score: courses completed + vault items viewed + events attended
    const membersWithScore = members.map((member) => ({
      ...member,
      activityScore:
        member.courses_completed_count +
        member.vault_items_viewed +
        member.events_attended,
    }));

    // Sort by activity score
    membersWithScore.sort((a, b) => b.activityScore - a.activityScore);

    return membersWithScore[0];
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Get relationship display name
   */
  static getRelationshipDisplayName(relationship: FamilyRelationship): string {
    const names: Record<FamilyRelationship, string> = {
      self: 'Self',
      spouse: 'Spouse',
      partner: 'Partner',
      child: 'Child',
      parent: 'Parent',
      grandparent: 'Grandparent',
      grandchild: 'Grandchild',
      sibling: 'Sibling',
      other: 'Other',
    };

    return names[relationship];
  }

  /**
   * Get status display name
   */
  static getStatusDisplayName(status: string): string {
    const names: Record<string, string> = {
      pending_invitation: 'Pending',
      invitation_sent: 'Invitation Sent',
      active: 'Active',
      inactive: 'Inactive',
      removed: 'Removed',
    };

    return names[status] || status;
  }

  /**
   * Get status color
   */
  static getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending_invitation: 'yellow',
      invitation_sent: 'blue',
      active: 'green',
      inactive: 'gray',
      removed: 'red',
    };

    return colors[status] || 'gray';
  }

  /**
   * Get access level display name
   */
  static getAccessLevelDisplayName(level: FamilyMemberAccessLevel): string {
    const names: Record<FamilyMemberAccessLevel, string> = {
      admin: 'Admin',
      member: 'Member',
      restricted: 'Restricted',
    };

    return names[level];
  }

  /**
   * Check if invitation is expired
   */
  static isInvitationExpired(member: FamilyMember): boolean {
    if (!member.invitation_expires_at) return false;
    return new Date(member.invitation_expires_at) < new Date();
  }

  /**
   * Get days until invitation expires
   */
  static getDaysUntilInvitationExpires(member: FamilyMember): number | null {
    if (!member.invitation_expires_at) return null;

    const expiresAt = new Date(member.invitation_expires_at);
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate age
   */
  static isValidAge(age: number): boolean {
    return age >= 5 && age <= 120;
  }
}
