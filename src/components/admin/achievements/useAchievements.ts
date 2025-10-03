import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { useToast } from '@/components/ui/use-toast';
import { Achievement, UserWithAchievements, AchievementFormData } from './types';

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [users, setUsers] = useState<UserWithAchievements[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      logger.error('Error fetching achievements:', error);
      toast({
        title: 'Error',
        description: 'Failed to load achievements',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          email,
          display_name
        `);

      if (profileError) throw profileError;

      const { data: achievementData, error: achievementError } = await supabase
        .from('user_achievements')
        .select(`
          user_id,
          achievement_id,
          achievements!inner(name)
        `);

      if (achievementError) throw achievementError;

      const usersWithAchievements = profileData?.map(user => {
        const userAchievements = achievementData
          ?.filter(ua => ua.user_id === user.user_id)
          .map(ua => ua.achievements?.name || '') || [];

        return {
          ...user,
          achievements: userAchievements
        };
      }) || [];

      setUsers(usersWithAchievements);
    } catch (error) {
      logger.error('Error fetching users:', error);
    }
  };

  const createAchievement = async (formData: AchievementFormData) => {
    try {
      const criteria = formData.auto_allocate ? {
        type: formData.criteria_type,
        value: formData.criteria_value
      } : { type: 'manual' };

      const { error } = await supabase
        .from('achievements')
        .insert({
          name: formData.name,
          description: formData.description,
          icon_emoji: formData.icon_emoji,
          category: formData.category,
          rarity: formData.rarity,
          points: formData.points,
          auto_allocate: formData.auto_allocate,
          criteria,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Achievement created successfully'
      });

      await fetchAchievements();
      return true;
    } catch (error) {
      logger.error('Error creating achievement:', error);
      toast({
        title: 'Error',
        description: 'Failed to create achievement',
        variant: 'destructive'
      });
      return false;
    }
  };

  const updateAchievement = async (id: string, formData: AchievementFormData) => {
    try {
      const criteria = formData.auto_allocate ? {
        type: formData.criteria_type,
        value: formData.criteria_value
      } : { type: 'manual' };

      const { error } = await supabase
        .from('achievements')
        .update({
          name: formData.name,
          description: formData.description,
          icon_emoji: formData.icon_emoji,
          category: formData.category,
          rarity: formData.rarity,
          points: formData.points,
          auto_allocate: formData.auto_allocate,
          criteria
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Achievement updated successfully'
      });

      await fetchAchievements();
      return true;
    } catch (error) {
      logger.error('Error updating achievement:', error);
      toast({
        title: 'Error',
        description: 'Failed to update achievement',
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteAchievement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this achievement?')) return false;

    try {
      const { error } = await supabase
        .from('achievements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Achievement deleted successfully'
      });

      await fetchAchievements();
      return true;
    } catch (error) {
      logger.error('Error deleting achievement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete achievement',
        variant: 'destructive'
      });
      return false;
    }
  };

  const allocateAchievement = async (achievementId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievementId,
          awarded_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      const achievement = achievements.find(a => a.id === achievementId);
      if (achievement) {
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'achievement',
            title: 'Achievement Unlocked!',
            message: `You have been awarded: ${achievement.name}`,
            data: { achievement_id: achievementId }
          });
      }

      toast({
        title: 'Success',
        description: 'Achievement allocated successfully'
      });

      await fetchUsers();
      return true;
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: 'Info',
          description: 'User already has this achievement',
          variant: 'default'
        });
      } else {
        logger.error('Error allocating achievement:', error);
        toast({
          title: 'Error',
          description: 'Failed to allocate achievement',
          variant: 'destructive'
        });
      }
      return false;
    }
  };

  useEffect(() => {
    fetchAchievements();
    fetchUsers();
  }, []);

  return {
    achievements,
    users,
    loading,
    createAchievement,
    updateAchievement,
    deleteAchievement,
    allocateAchievement,
    refreshAchievements: fetchAchievements,
    refreshUsers: fetchUsers
  };
};
