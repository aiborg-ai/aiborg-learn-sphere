import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StudyGroupService } from '../StudyGroupService';
import { supabase } from '@/integrations/supabase/client';

describe('StudyGroupService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a study group with valid data', async () => {
      const mockGroup = {
        id: '123',
        name: 'AI Study Group',
        description: 'Learn AI together',
        topics: ['machine-learning', 'nlp'],
        skill_level_range: [3, 5],
        max_members: 10,
        is_public: true,
      };

      // Mock Supabase response
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGroup, error: null }),
      } as any);

      const result = await StudyGroupService.create({
        name: 'AI Study Group',
        description: 'Learn AI together',
        topics: ['machine-learning', 'nlp'],
        skill_level_range: [3, 5],
        max_members: 10,
        is_public: true,
      });

      expect(result).toEqual(mockGroup);
      expect(supabase.from).toHaveBeenCalledWith('study_groups');
    });

    it('should throw error when creation fails', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error')
        }),
      } as any);

      await expect(
        StudyGroupService.create({
          name: 'Test Group',
          topics: ['test'],
          skill_level_range: [1, 5],
        })
      ).rejects.toThrow();
    });
  });

  describe('findCompatible', () => {
    it('should find compatible study groups', async () => {
      const mockGroups = [
        { id: '1', name: 'Group 1', compatibility_score: 0.9 },
        { id: '2', name: 'Group 2', compatibility_score: 0.8 },
      ];

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockGroups,
        error: null
      });

      const result = await StudyGroupService.findCompatible(3, ['ai', 'ml']);

      expect(result).toEqual(mockGroups);
      expect(supabase.rpc).toHaveBeenCalledWith('find_compatible_study_groups', {
        user_skill_level: 3,
        user_topics: ['ai', 'ml'],
      });
    });
  });

  describe('join', () => {
    it('should add user to study group', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      await expect(
        StudyGroupService.join('group-123', 'user-456')
      ).resolves.not.toThrow();

      expect(supabase.from).toHaveBeenCalledWith('study_group_members');
    });
  });

  describe('leave', () => {
    it('should remove user from study group', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis().mockResolvedValue({ error: null }),
      } as any);

      await expect(
        StudyGroupService.leave('group-123', 'user-456')
      ).resolves.not.toThrow();

      expect(supabase.from).toHaveBeenCalledWith('study_group_members');
    });
  });
});
