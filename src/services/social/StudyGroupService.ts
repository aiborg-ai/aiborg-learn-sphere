/**
 * Study Group Service
 * Manages study groups, members, and group activities
 */

import { supabase } from '@/integrations/supabase/client';
import type { StudyGroup } from './types';

export class StudyGroupService {
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
}
