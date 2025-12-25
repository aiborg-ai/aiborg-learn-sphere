/**
 * Study Group Service
 * Manages study groups, members, and group activities
 */

import { supabase } from '@/integrations/supabase/client';
import type { StudyGroup } from './types';

export class StudyGroupService {
  /**
   * Get all public study groups with pagination
   */
  static async getAll(params?: {
    limit?: number;
    offset?: number;
    isPublic?: boolean;
    topics?: string[];
  }): Promise<{ groups: StudyGroup[]; total: number }> {
    let query = supabase.from('study_groups').select('*', { count: 'exact' });

    // Filter by public/private
    if (params?.isPublic !== undefined) {
      query = query.eq('is_public', params.isPublic);
    }

    // Filter by topics
    if (params?.topics && params.topics.length > 0) {
      query = query.contains('topics', params.topics);
    }

    // Pagination
    const limit = params?.limit || 20;
    const offset = params?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    // Sort by created date (newest first)
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      groups: data || [],
      total: count || 0,
    };
  }

  /**
   * Get a single study group by ID with member count
   */
  static async getById(groupId: string): Promise<StudyGroup | null> {
    const { data, error } = await supabase
      .from('study_groups')
      .select(
        `
        *,
        member_count:study_group_members(count)
      `
      )
      .eq('id', groupId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
  }

  /**
   * Find study groups compatible with user's skill level and interests
   */
  static async findCompatible(skillLevel: number, topics: string[]): Promise<StudyGroup[]> {
    const { data, error } = await supabase.rpc('find_compatible_study_groups', {
      user_skill_level: skillLevel,
      user_topics: topics,
    });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new study group
   */
  static async create(group: Partial<StudyGroup>): Promise<StudyGroup> {
    const { data, error } = await supabase
      .from('study_groups')
      .insert({
        name: group.name,
        description: group.description,
        skill_level_range: `[${group.skill_level_range?.[0]},${group.skill_level_range?.[1]}]`,
        topics: group.topics,
        max_members: group.max_members || 10,
        is_public: group.is_public ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Join a study group
   */
  static async join(groupId: string, userId: string): Promise<void> {
    const { error } = await supabase.from('study_group_members').insert({
      group_id: groupId,
      user_id: userId,
      role: 'member',
    });

    if (error) throw error;
  }

  /**
   * Leave a study group
   */
  static async leave(groupId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('study_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Get study group members
   */
  static async getMembers(groupId: string): Promise<unknown[]> {
    const { data, error } = await supabase
      .from('study_group_members')
      .select(
        `
        *,
        user:user_id (id, email, user_profiles(username, avatar_url))
      `
      )
      .eq('group_id', groupId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Post activity to study group
   */
  static async postActivity(
    groupId: string,
    userId: string,
    activityType: string,
    content: unknown
  ): Promise<void> {
    const { error } = await supabase.from('study_group_activities').insert({
      group_id: groupId,
      user_id: userId,
      activity_type: activityType,
      content,
    });

    if (error) throw error;
  }

  // ========================================
  // INVITATION METHODS
  // ========================================

  /**
   * Send invitation to join study group
   */
  static async sendInvitation(
    groupId: string,
    invitedEmail: string,
    invitedBy: string
  ): Promise<void> {
    const { error } = await supabase.from('study_group_invitations').insert({
      group_id: groupId,
      invited_by: invitedBy,
      invited_email: invitedEmail.toLowerCase().trim(),
    });

    if (error) throw error;
  }

  /**
   * Get all invitations for a study group
   */
  static async getInvitations(groupId: string): Promise<unknown[]> {
    const { data, error } = await supabase
      .from('study_group_invitations')
      .select(
        `
        *,
        inviter:invited_by (email)
      `
      )
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Cancel a pending invitation
   */
  static async cancelInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from('study_group_invitations')
      .update({ status: 'expired' })
      .eq('id', invitationId);

    if (error) throw error;
  }

  /**
   * Accept an invitation to join a study group
   */
  static async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    // Get the invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('study_group_invitations')
      .select('group_id, status')
      .eq('id', invitationId)
      .single();

    if (fetchError) throw fetchError;

    if (invitation.status !== 'pending') {
      throw new Error('Invitation is no longer valid');
    }

    // Join the group
    await this.join(invitation.group_id, userId);

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('study_group_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitationId);

    if (updateError) throw updateError;
  }

  /**
   * Decline an invitation
   */
  static async declineInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from('study_group_invitations')
      .update({ status: 'declined' })
      .eq('id', invitationId);

    if (error) throw error;
  }

  // ========================================
  // SETTINGS METHODS
  // ========================================

  /**
   * Get study group settings
   */
  static async getSettings(groupId: string): Promise<unknown> {
    const { data, error } = await supabase
      .from('study_group_settings')
      .select('*')
      .eq('group_id', groupId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update study group settings
   */
  static async updateSettings(
    groupId: string,
    settings: Partial<{
      allow_member_invites: boolean;
      require_approval_to_join: boolean;
      allow_resource_sharing: boolean;
      allow_event_creation: boolean;
      notification_preferences: Record<string, boolean>;
    }>
  ): Promise<void> {
    const { error } = await supabase
      .from('study_group_settings')
      .update(settings)
      .eq('group_id', groupId);

    if (error) throw error;
  }

  /**
   * Update basic group information
   */
  static async updateGroup(
    groupId: string,
    updates: Partial<{
      name: string;
      description: string;
      max_members: number;
      is_public: boolean;
      topics: string[];
    }>
  ): Promise<void> {
    const { error } = await supabase.from('study_groups').update(updates).eq('id', groupId);

    if (error) throw error;
  }

  // ========================================
  // MEMBER ROLE MANAGEMENT
  // ========================================

  /**
   * Update member role in study group
   */
  static async updateMemberRole(
    groupId: string,
    userId: string,
    newRole: 'admin' | 'moderator' | 'member'
  ): Promise<void> {
    const { error } = await supabase
      .from('study_group_members')
      .update({ role: newRole })
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Remove member from study group (admin action)
   */
  static async removeMember(groupId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('study_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Get member's role in a study group
   */
  static async getMemberRole(groupId: string, userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('study_group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not a member
      throw error;
    }

    return data?.role || null;
  }
}
