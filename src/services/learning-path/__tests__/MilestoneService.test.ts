/**
 * Tests for MilestoneService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MilestoneService } from '../MilestoneService';
import type { PathItem, LearningGoal } from '../types';

describe('MilestoneService', () => {
  let service: MilestoneService;

  beforeEach(() => {
    service = new MilestoneService();
  });

  const mockGoal: LearningGoal = {
    goal_title: 'Master React Development',
    target_augmentation_level: 'advanced',
    focus_category_ids: ['cat-1'],
    estimated_weeks: 8,
    hours_per_week: 10,
    learning_style: 'visual',
  };

  const createMockItem = (id: string): PathItem => ({
    item_type: 'course',
    item_id: id,
    item_title: `Item ${id}`,
    item_description: 'Description',
    difficulty_level: 'beginner',
    irt_difficulty: 0.5,
    estimated_hours: 5,
    is_required: true,
    reason_for_inclusion: 'Required',
    confidence_score: 0.9,
  });

  describe('createMilestones', () => {
    it('should create 4 milestones', () => {
      const items = [createMockItem('1'), createMockItem('2')];
      const milestones = service.createMilestones(items, mockGoal);

      expect(milestones).toHaveLength(4);
    });

    it('should set milestone order from 1 to 4', () => {
      const items = [createMockItem('1')];
      const milestones = service.createMilestones(items, mockGoal);

      expect(milestones[0].milestone_order).toBe(1);
      expect(milestones[1].milestone_order).toBe(2);
      expect(milestones[2].milestone_order).toBe(3);
      expect(milestones[3].milestone_order).toBe(4);
    });

    it('should set correct milestone titles', () => {
      const items = [createMockItem('1')];
      const milestones = service.createMilestones(items, mockGoal);

      expect(milestones[0].milestone_title).toBe('Journey Begins');
      expect(milestones[1].milestone_title).toBe('Halfway Hero');
      expect(milestones[2].milestone_title).toBe('Nearly There');
      expect(milestones[3].milestone_title).toBe('Goal Achieved!');
    });

    it('should set completion percentages at 25%, 50%, 75%, 100%', () => {
      const items = [createMockItem('1')];
      const milestones = service.createMilestones(items, mockGoal);

      expect(milestones[0].minimum_completion_percentage).toBe(25);
      expect(milestones[1].minimum_completion_percentage).toBe(50);
      expect(milestones[2].minimum_completion_percentage).toBe(75);
      expect(milestones[3].minimum_completion_percentage).toBe(100);
    });

    it('should assign badge levels correctly', () => {
      const items = [createMockItem('1')];
      const milestones = service.createMilestones(items, mockGoal);

      expect(milestones[0].reward_badge).toBe('beginner');
      expect(milestones[1].reward_badge).toBe('intermediate');
      expect(milestones[2].reward_badge).toBe('advanced');
      expect(milestones[3].reward_badge).toBe('expert');
    });

    it('should calculate reward points based on completion percentage', () => {
      const items = [createMockItem('1')];
      const milestones = service.createMilestones(items, mockGoal);

      expect(milestones[0].reward_points).toBe(25);
      expect(milestones[1].reward_points).toBe(50);
      expect(milestones[2].reward_points).toBe(75);
      expect(milestones[3].reward_points).toBe(100);
    });

    it('should set appropriate reward messages', () => {
      const items = [createMockItem('1')];
      const milestones = service.createMilestones(items, mockGoal);

      expect(milestones[0].reward_message).toBe('Great start! Keep the momentum going!');
      expect(milestones[1].reward_message).toBe("You're halfway there! Amazing progress!");
      expect(milestones[2].reward_message).toBe('Almost at your goal! One final push!');
      expect(milestones[3].reward_message).toBe(
        "Congratulations! You've achieved your learning goal!"
      );
    });

    it('should include goal title in milestone descriptions', () => {
      const items = [createMockItem('1')];
      const milestones = service.createMilestones(items, mockGoal);

      expect(milestones[0].milestone_description).toBe(
        'Complete 25% of your Master React Development learning path'
      );
      expect(milestones[1].milestone_description).toBe(
        'Complete 50% of your Master React Development learning path'
      );
      expect(milestones[2].milestone_description).toBe(
        'Complete 75% of your Master React Development learning path'
      );
      expect(milestones[3].milestone_description).toBe(
        'Complete 100% of your Master React Development learning path'
      );
    });

    it('should create milestones regardless of items count', () => {
      const noItems: PathItem[] = [];
      const milestones = service.createMilestones(noItems, mockGoal);

      expect(milestones).toHaveLength(4);
      expect(milestones[0].milestone_order).toBe(1);
    });

    it('should handle goal without title', () => {
      const goalNoTitle: LearningGoal = {
        ...mockGoal,
        goal_title: undefined,
      };
      const items = [createMockItem('1')];
      const milestones = service.createMilestones(items, goalNoTitle);

      expect(milestones[0].milestone_description).toBe(
        'Complete 25% of your undefined learning path'
      );
    });

    it('should create consistent milestones for different item counts', () => {
      const fewItems = [createMockItem('1')];
      const manyItems = [
        createMockItem('1'),
        createMockItem('2'),
        createMockItem('3'),
        createMockItem('4'),
        createMockItem('5'),
      ];

      const milestones1 = service.createMilestones(fewItems, mockGoal);
      const milestones2 = service.createMilestones(manyItems, mockGoal);

      // Milestones should be identical regardless of items count
      expect(milestones1).toHaveLength(4);
      expect(milestones2).toHaveLength(4);
      expect(milestones1[0].minimum_completion_percentage).toBe(
        milestones2[0].minimum_completion_percentage
      );
      expect(milestones1[0].reward_points).toBe(milestones2[0].reward_points);
    });
  });

  describe('milestone structure', () => {
    it('should have all required fields', () => {
      const items = [createMockItem('1')];
      const milestones = service.createMilestones(items, mockGoal);

      const milestone = milestones[0];
      expect(milestone).toHaveProperty('milestone_order');
      expect(milestone).toHaveProperty('milestone_title');
      expect(milestone).toHaveProperty('milestone_description');
      expect(milestone).toHaveProperty('minimum_completion_percentage');
      expect(milestone).toHaveProperty('reward_badge');
      expect(milestone).toHaveProperty('reward_points');
      expect(milestone).toHaveProperty('reward_message');
    });

    it('should have correct data types', () => {
      const items = [createMockItem('1')];
      const milestones = service.createMilestones(items, mockGoal);

      const milestone = milestones[0];
      expect(typeof milestone.milestone_order).toBe('number');
      expect(typeof milestone.milestone_title).toBe('string');
      expect(typeof milestone.milestone_description).toBe('string');
      expect(typeof milestone.minimum_completion_percentage).toBe('number');
      expect(typeof milestone.reward_badge).toBe('string');
      expect(typeof milestone.reward_points).toBe('number');
      expect(typeof milestone.reward_message).toBe('string');
    });

    it('should have non-empty strings for all text fields', () => {
      const items = [createMockItem('1')];
      const milestones = service.createMilestones(items, mockGoal);

      milestones.forEach(milestone => {
        expect(milestone.milestone_title.length).toBeGreaterThan(0);
        expect(milestone.milestone_description.length).toBeGreaterThan(0);
        expect(milestone.reward_badge.length).toBeGreaterThan(0);
        expect(milestone.reward_message.length).toBeGreaterThan(0);
      });
    });

    it('should have increasing completion percentages', () => {
      const items = [createMockItem('1')];
      const milestones = service.createMilestones(items, mockGoal);

      expect(milestones[0].minimum_completion_percentage).toBeLessThan(
        milestones[1].minimum_completion_percentage
      );
      expect(milestones[1].minimum_completion_percentage).toBeLessThan(
        milestones[2].minimum_completion_percentage
      );
      expect(milestones[2].minimum_completion_percentage).toBeLessThan(
        milestones[3].minimum_completion_percentage
      );
    });

    it('should have increasing reward points', () => {
      const items = [createMockItem('1')];
      const milestones = service.createMilestones(items, mockGoal);

      expect(milestones[0].reward_points).toBeLessThan(milestones[1].reward_points);
      expect(milestones[1].reward_points).toBeLessThan(milestones[2].reward_points);
      expect(milestones[2].reward_points).toBeLessThan(milestones[3].reward_points);
    });
  });

  describe('badge progression', () => {
    it('should follow badge hierarchy', () => {
      const items = [createMockItem('1')];
      const milestones = service.createMilestones(items, mockGoal);

      const badges = milestones.map(m => m.reward_badge);
      expect(badges).toEqual(['beginner', 'intermediate', 'advanced', 'expert']);
    });
  });
});
