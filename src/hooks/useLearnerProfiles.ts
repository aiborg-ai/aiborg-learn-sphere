import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/utils/logger';
import type { LearnerProfile } from '@/services/curriculum/CurriculumGenerationService';

/**
 * Custom hook for managing learner profiles
 */
export const useLearnerProfiles = () => {
  const [profiles, setProfiles] = useState<LearnerProfile[]>([]);
  const [primaryProfile, setPrimaryProfile] = useState<LearnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchProfiles = useCallback(async () => {
    if (!user) {
      setProfiles([]);
      setPrimaryProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('learner_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setProfiles((data || []) as LearnerProfile[]);

      // Set primary profile
      const primary = (data || []).find((p: any) => p.is_primary);
      setPrimaryProfile(primary || null);
    } catch (err) {
      logger.error('Error fetching learner profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profiles');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  /**
   * Create a new profile
   */
  const createProfile = async (profileData: Partial<LearnerProfile>): Promise<LearnerProfile> => {
    if (!user) throw new Error('User must be logged in');

    try {
      const { data, error: createError } = await supabase
        .from('learner_profiles')
        .insert({
          user_id: user.id,
          ...profileData,
          is_active: true,
          is_primary: profiles.length === 0, // First profile is primary
        })
        .select()
        .single();

      if (createError) throw createError;

      await fetchProfiles();
      return data as LearnerProfile;
    } catch (err) {
      logger.error('Error creating profile:', err);
      throw err;
    }
  };

  /**
   * Update a profile
   */
  const updateProfile = async (
    profileId: string,
    updates: Partial<LearnerProfile>
  ): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('learner_profiles')
        .update(updates)
        .eq('id', profileId);

      if (updateError) throw updateError;

      await fetchProfiles();
    } catch (err) {
      logger.error('Error updating profile:', err);
      throw err;
    }
  };

  /**
   * Delete a profile
   */
  const deleteProfile = async (profileId: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('learner_profiles')
        .delete()
        .eq('id', profileId);

      if (deleteError) throw deleteError;

      await fetchProfiles();
    } catch (err) {
      logger.error('Error deleting profile:', err);
      throw err;
    }
  };

  /**
   * Set a profile as primary
   */
  const setPrimary = async (profileId: string): Promise<void> => {
    try {
      // Update profile to be primary (trigger will unset others)
      const { error: updateError } = await supabase
        .from('learner_profiles')
        .update({ is_primary: true })
        .eq('id', profileId);

      if (updateError) throw updateError;

      await fetchProfiles();
    } catch (err) {
      logger.error('Error setting primary profile:', err);
      throw err;
    }
  };

  /**
   * Get profile by ID
   */
  const getProfile = useCallback(
    (profileId: string): LearnerProfile | undefined => {
      return profiles.find((p) => p.id === profileId);
    },
    [profiles]
  );

  return {
    profiles,
    primaryProfile,
    loading,
    error,
    createProfile,
    updateProfile,
    deleteProfile,
    setPrimary,
    getProfile,
    refetch: fetchProfiles,
  };
};
