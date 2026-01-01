/**
 * Team Management Service
 *
 * Handles all operations related to managing team members within organizations:
 * - Inviting members (single and bulk)
 * - Accepting invitations
 * - Managing member roles
 * - Removing members
 * - Fetching organization and member data
 *
 * @module services/team/TeamManagementService
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  Organization,
  OrganizationMember,
  TeamInvitation,
  TeamInvitationHistory,
  BulkInviteResult,
} from './types';

export class TeamManagementService {
  // ============================================================================
  // Organization Methods
  // ============================================================================

  /**
   * Get organization by ID
   */
  static async getOrganization(organizationId: string): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get organizations for current user
   */
  static async getUserOrganizations(): Promise<Organization[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('organization_members')
      .select(
        `
        organization_id,
        role,
        organizations (*)
      `
      )
      .eq('user_id', user.id);

    if (error) throw error;

    return data.map(row => ({
      ...row.organizations,
      user_role: row.role,
    })) as Organization[];
  }

  /**
   * Update organization details
   */
  static async updateOrganization(
    organizationId: string,
    updates: Partial<Organization>
  ): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .update({
        name: updates.name,
        description: updates.description,
        industry: updates.industry,
        size_range: updates.size_range,
        logo_url: updates.logo_url,
      })
      .eq('id', organizationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============================================================================
  // Member Methods
  // ============================================================================

  /**
   * Get all members of an organization
   */
  static async getMembers(organizationId: string): Promise<OrganizationMember[]> {
    const { data, error } = await supabase
      .from('organization_members')
      .select(
        `
        *,
        profiles:user_id (
          user_id,
          full_name,
          email,
          avatar_url,
          last_login
        )
      `
      )
      .eq('organization_id', organizationId)
      .order('joined_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Get member details with activity stats
   */
  static async getMemberDetails(
    organizationId: string,
    userId: string
  ): Promise<OrganizationMember> {
    const { data, error } = await supabase
      .from('member_activity_summary')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update member role or department
   */
  static async updateMember(
    organizationId: string,
    userId: string,
    updates: { role?: string; department?: string }
  ): Promise<OrganizationMember> {
    const { data, error } = await supabase
      .from('organization_members')
      .update(updates)
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Remove member from organization
   */
  static async removeMember(organizationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // ============================================================================
  // Invitation Methods
  // ============================================================================

  /**
   * Send single invitation to join organization
   */
  static async inviteMember(invitation: {
    organizationId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    department?: string;
    customMessage?: string;
  }): Promise<TeamInvitation> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('team_invitations')
      .insert({
        organization_id: invitation.organizationId,
        email: invitation.email.toLowerCase(),
        first_name: invitation.firstName,
        last_name: invitation.lastName,
        role: invitation.role || 'member',
        department: invitation.department,
        custom_message: invitation.customMessage,
        invited_by: user.id,
      })
      .select()
      .single();

    if (error) {
      // Handle duplicate invitation
      if (error.code === '23505') {
        throw new Error('An invitation has already been sent to this email');
      }
      throw error;
    }

    // Send invitation email via edge function
    await this.sendInvitationEmail(data, invitation.organizationId);

    return data;
  }

  /**
   * Send bulk invitations from CSV data
   */
  static async inviteMembersBulk(
    organizationId: string,
    invitations: Array<{
      email: string;
      firstName?: string;
      lastName?: string;
      role?: string;
      department?: string;
    }>
  ): Promise<BulkInviteResult> {
    const results: BulkInviteResult = {
      successful: [],
      failed: [],
      total: invitations.length,
    };

    for (const invitation of invitations) {
      try {
        const created = await this.inviteMember({
          organizationId,
          ...invitation,
        });
        results.successful.push({
          email: invitation.email,
          invitationId: created.id,
        });
      } catch (_error) {
        results.failed.push({
          email: invitation.email,
          _error: _error instanceof Error ? _error.message : 'Unknown _error',
        });
      }
    }

    return results;
  }

  /**
   * Get all invitations for an organization
   */
  static async getInvitations(
    organizationId: string,
    status?: 'pending' | 'accepted' | 'expired' | 'cancelled'
  ): Promise<TeamInvitation[]> {
    let query = supabase
      .from('team_invitations')
      .select(
        `
        *,
        inviter:invited_by (
          full_name,
          email
        )
      `
      )
      .eq('organization_id', organizationId);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  /**
   * Get invitation by token (for acceptance page)
   */
  static async getInvitationByToken(token: string): Promise<TeamInvitation | null> {
    const { data, error } = await supabase
      .from('team_invitations')
      .select(
        `
        *,
        organizations (
          id,
          name,
          logo_url
        )
      `
      )
      .eq('invite_token', token)
      .eq('status', 'pending')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
  }

  /**
   * Accept an invitation
   */
  static async acceptInvitation(token: string): Promise<{
    success: boolean;
    organizationId?: string;
    error?: string;
  }> {
    const { data, error } = await supabase.rpc('accept_team_invitation', {
      p_invite_token: token,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Resend invitation email
   */
  static async resendInvitation(invitationId: string): Promise<void> {
    // Update invitation to reset expiration
    const { data, error } = await supabase
      .from('team_invitations')
      .update({
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      })
      .eq('id', invitationId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) throw error;

    // Log resend action
    await supabase.from('team_invitation_history').insert({
      invitation_id: invitationId,
      action: 'resent',
      notes: 'Invitation resent and expiration extended',
    });

    // Send invitation email via edge function
    if (data) {
      await this.sendInvitationEmail(data, data.organization_id);
    }
  }

  /**
   * Cancel invitation
   */
  static async cancelInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from('team_invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId);

    if (error) throw error;
  }

  /**
   * Get invitation history
   */
  static async getInvitationHistory(invitationId: string): Promise<TeamInvitationHistory[]> {
    const { data, error } = await supabase
      .from('team_invitation_history')
      .select(
        `
        *,
        performer:performed_by (
          full_name,
          email
        )
      `
      )
      .eq('invitation_id', invitationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // ============================================================================
  // Email Notification Methods
  // ============================================================================

  /**
   * Send invitation email to new team member
   */
  private static async sendInvitationEmail(
    invitation: TeamInvitation,
    organizationId: string
  ): Promise<void> {
    try {
      // Get organization details
      const organization = await this.getOrganization(organizationId);

      // Get inviter details
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .single();

      const inviterName = inviterProfile
        ? `${inviterProfile.first_name} ${inviterProfile.last_name}`.trim()
        : user.email || 'A team member';

      // Build accept URL
      const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const acceptUrl = `${baseUrl}/team/accept-invitation?token=${invitation.token}`;

      // Call the Edge Function
      const { error } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          invitationId: invitation.id,
          inviteeEmail: invitation.email,
          inviteeFirstName: invitation.first_name,
          inviteeLastName: invitation.last_name,
          organizationName: organization.name,
          inviterName,
          role: invitation.role,
          department: invitation.department,
          expiresAt: invitation.expires_at,
          acceptUrl,
        },
      });

      if (error) {
        logger.error('Failed to send invitation email', error);
        // Don't throw - we don't want to fail the invitation creation if email fails
      }
    } catch (_error) {
      logger.error('Error in sendInvitationEmail', _error);
      // Don't throw - email failure shouldn't break invitation flow
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Check if user has permission to manage team
   */
  static async hasManagePermission(userId: string, organizationId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) return false;
    return ['admin', 'manager', 'owner'].includes(data.role);
  }

  /**
   * Get member count for organization
   */
  static async getMemberCount(organizationId: string): Promise<number> {
    const { count, error } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Search members by name or email
   */
  static async searchMembers(organizationId: string, query: string): Promise<OrganizationMember[]> {
    const { data, error } = await supabase
      .from('organization_members')
      .select(
        `
        *,
        profiles:user_id (
          user_id,
          full_name,
          email,
          avatar_url
        )
      `
      )
      .eq('organization_id', organizationId)
      .or(`profiles.full_name.ilike.%${query}%,profiles.email.ilike.%${query}%`);

    if (error) throw error;
    return data;
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Parse CSV file for bulk invitations
   */
  static parseCSV(csvContent: string): Array<{
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    department?: string;
  }> {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const emailIndex = headers.findIndex(h => ['email', 'email address', 'e-mail'].includes(h));

    if (emailIndex === -1) {
      throw new Error('CSV must have an "email" column');
    }

    const firstNameIndex = headers.findIndex(h =>
      ['firstname', 'first_name', 'first name'].includes(h)
    );
    const lastNameIndex = headers.findIndex(h =>
      ['lastname', 'last_name', 'last name'].includes(h)
    );
    const roleIndex = headers.findIndex(h => h === 'role');
    const departmentIndex = headers.findIndex(h => h === 'department');

    const results = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const email = values[emailIndex];

      if (!email || !this.validateEmail(email)) {
        continue; // Skip invalid emails
      }

      results.push({
        email,
        firstName: firstNameIndex >= 0 ? values[firstNameIndex] : undefined,
        lastName: lastNameIndex >= 0 ? values[lastNameIndex] : undefined,
        role: roleIndex >= 0 ? values[roleIndex] : 'member',
        department: departmentIndex >= 0 ? values[departmentIndex] : undefined,
      });
    }

    return results;
  }
}
