/**
 * Tests for ContentSequencingService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentSequencingService } from '../ContentSequencingService';
import type {
  LearningResources,
  GapAnalysis,
  LearningGoal,
  AssessmentData,
  PathItem,
} from '../types';

// Mock ContentSelectionService
vi.mock('../ContentSelectionService', () => ({
  contentSelectionService: {
    selectFoundationalContent: vi.fn(),
    selectCoreContent: vi.fn(),
    selectPracticalContent: vi.fn(),
  },
}));

import { contentSelectionService } from '../ContentSelectionService';

describe('ContentSequencingService', () => {
  let service: ContentSequencingService;

  beforeEach(() => {
    service = new ContentSequencingService();
    vi.clearAllMocks();
  });

  const mockResources: LearningResources = {
    courses: [],
    tutorials: [],
    workshops: [{ id: 'workshop-1', title: 'Workshop', estimated_hours: 3 }],
    books: [],
    articles: [],
  };

  const mockGapAnalysis: GapAnalysis = {
    currentAbility: 0.2,
    targetAbility: 0.8,
    abilityGap: 0.6,
    weakCategories: [],
    priorityCategories: [],
    focusAreas: [],
  };

  const mockGoal: LearningGoal = {
    target_augmentation_level: 'intermediate',
    focus_category_ids: ['cat-1'],
    estimated_weeks: 8,
    hours_per_week: 10,
    learning_style: 'visual',
    include_workshops: true,
  };

  const mockAssessment: AssessmentData = {
    id: 'assessment-1',
    user_id: 'user-1',
    augmentation_level: 'beginner',
    current_ability_estimate: 0.2,
    category_scores: {},
    completed_at: new Date().toISOString(),
  };

  const createMockItem = (id: string, hours: number): PathItem => ({
    item_type: 'course',
    item_id: id,
    item_title: `Item ${id}`,
    item_description: 'Description',
    difficulty_level: 'beginner',
    irt_difficulty: 0.5,
    estimated_hours: hours,
    is_required: true,
    reason_for_inclusion: 'Required',
    confidence_score: 0.9,
  });

  describe('selectAndSequenceContent', () => {
    it('should sequence all 4 phases: Foundation, Core, Application, Reassessment', () => {
      const foundational = [createMockItem('f1', 5)];
      const core = [createMockItem('c1', 8)];
      const practical = [createMockItem('p1', 6)];

      (
        contentSelectionService.selectFoundationalContent as ReturnType<typeof vi.fn>
      ).mockReturnValue(foundational);
      (contentSelectionService.selectCoreContent as ReturnType<typeof vi.fn>).mockReturnValue(core);
      (contentSelectionService.selectPracticalContent as ReturnType<typeof vi.fn>).mockReturnValue(
        practical
      );

      const result = service.selectAndSequenceContent(
        mockResources,
        mockGapAnalysis,
        mockGoal,
        mockAssessment
      );

      // Should have foundation + core + practical + reassessment = 4 items
      expect(result).toHaveLength(4);
      expect(result[0].item_id).toBe('f1');
      expect(result[1].item_id).toBe('c1');
      expect(result[2].item_id).toBe('p1');
      expect(result[3].item_id).toBe('reassessment');
    });

    it('should call selection services with correct parameters', () => {
      (
        contentSelectionService.selectFoundationalContent as ReturnType<typeof vi.fn>
      ).mockReturnValue([]);
      (contentSelectionService.selectCoreContent as ReturnType<typeof vi.fn>).mockReturnValue([]);
      (contentSelectionService.selectPracticalContent as ReturnType<typeof vi.fn>).mockReturnValue(
        []
      );

      service.selectAndSequenceContent(mockResources, mockGapAnalysis, mockGoal, mockAssessment);

      expect(contentSelectionService.selectFoundationalContent).toHaveBeenCalledWith(
        mockResources,
        mockGapAnalysis,
        mockAssessment
      );
      expect(contentSelectionService.selectCoreContent).toHaveBeenCalledWith(
        mockResources,
        mockGapAnalysis,
        mockGoal,
        mockAssessment
      );
      expect(contentSelectionService.selectPracticalContent).toHaveBeenCalledWith(
        mockResources,
        mockGapAnalysis,
        mockGoal
      );
    });

    it('should skip practical phase when include_workshops is false', () => {
      const goalNoWorkshops: LearningGoal = { ...mockGoal, include_workshops: false };

      (
        contentSelectionService.selectFoundationalContent as ReturnType<typeof vi.fn>
      ).mockReturnValue([]);
      (contentSelectionService.selectCoreContent as ReturnType<typeof vi.fn>).mockReturnValue([]);
      (contentSelectionService.selectPracticalContent as ReturnType<typeof vi.fn>).mockReturnValue(
        []
      );

      const result = service.selectAndSequenceContent(
        mockResources,
        mockGapAnalysis,
        goalNoWorkshops,
        mockAssessment
      );

      expect(contentSelectionService.selectPracticalContent).not.toHaveBeenCalled();
      // Should have only reassessment (no foundation/core in this mock)
      expect(result.some(item => item.item_type === 'assessment')).toBe(true);
    });

    it('should skip practical phase when no workshops available', () => {
      const noWorkshopResources: LearningResources = { ...mockResources, workshops: [] };

      (
        contentSelectionService.selectFoundationalContent as ReturnType<typeof vi.fn>
      ).mockReturnValue([]);
      (contentSelectionService.selectCoreContent as ReturnType<typeof vi.fn>).mockReturnValue([]);

      service.selectAndSequenceContent(
        noWorkshopResources,
        mockGapAnalysis,
        mockGoal,
        mockAssessment
      );

      expect(contentSelectionService.selectPracticalContent).not.toHaveBeenCalled();
    });

    it('should set week numbers based on hour limits', () => {
      const items = [
        createMockItem('item1', 5), // Week 1 (5 hours)
        createMockItem('item2', 4), // Week 1 (9 hours total)
        createMockItem('item3', 3), // Week 2 (exceeds 10)
        createMockItem('item4', 7), // Week 2 (10 hours total)
        createMockItem('item5', 2), // Week 3 (exceeds 10)
      ];

      (
        contentSelectionService.selectFoundationalContent as ReturnType<typeof vi.fn>
      ).mockReturnValue(items);
      (contentSelectionService.selectCoreContent as ReturnType<typeof vi.fn>).mockReturnValue([]);
      (contentSelectionService.selectPracticalContent as ReturnType<typeof vi.fn>).mockReturnValue(
        []
      );

      const result = service.selectAndSequenceContent(
        mockResources,
        mockGapAnalysis,
        mockGoal,
        mockAssessment
      );

      expect(result[0].week_number).toBe(1); // item1
      expect(result[1].week_number).toBe(1); // item2
      expect(result[2].week_number).toBe(2); // item3 (5+4+3 > 10)
      expect(result[3].week_number).toBe(2); // item4
      expect(result[4].week_number).toBe(3); // item5 (7+2 > 10)
    });

    it('should increment week between phases', () => {
      const foundational = [createMockItem('f1', 3)];
      const core = [createMockItem('c1', 4)];

      (
        contentSelectionService.selectFoundationalContent as ReturnType<typeof vi.fn>
      ).mockReturnValue(foundational);
      (contentSelectionService.selectCoreContent as ReturnType<typeof vi.fn>).mockReturnValue(core);
      (contentSelectionService.selectPracticalContent as ReturnType<typeof vi.fn>).mockReturnValue(
        []
      );

      const result = service.selectAndSequenceContent(
        mockResources,
        mockGapAnalysis,
        mockGoal,
        mockAssessment
      );

      // Foundation in week 1, Core starts in week 2
      expect(result[0].week_number).toBe(1); // f1
      expect(result[1].week_number).toBe(2); // c1 (new phase)
    });

    it('should set prerequisites to previous item', () => {
      const items = [
        createMockItem('item1', 5),
        createMockItem('item2', 4),
        createMockItem('item3', 3),
      ];

      (
        contentSelectionService.selectFoundationalContent as ReturnType<typeof vi.fn>
      ).mockReturnValue(items);
      (contentSelectionService.selectCoreContent as ReturnType<typeof vi.fn>).mockReturnValue([]);
      (contentSelectionService.selectPracticalContent as ReturnType<typeof vi.fn>).mockReturnValue(
        []
      );

      const result = service.selectAndSequenceContent(
        mockResources,
        mockGapAnalysis,
        mockGoal,
        mockAssessment
      );

      expect(result[0].prerequisites).toEqual([]);
      expect(result[1].prerequisites).toEqual(['item1']);
      expect(result[2].prerequisites).toEqual(['item2']);
      expect(result[3].prerequisites).toEqual(['item3']); // reassessment depends on last item
    });

    it('should create reassessment item at the end', () => {
      (
        contentSelectionService.selectFoundationalContent as ReturnType<typeof vi.fn>
      ).mockReturnValue([]);
      (contentSelectionService.selectCoreContent as ReturnType<typeof vi.fn>).mockReturnValue([]);
      (contentSelectionService.selectPracticalContent as ReturnType<typeof vi.fn>).mockReturnValue(
        []
      );

      const result = service.selectAndSequenceContent(
        mockResources,
        mockGapAnalysis,
        mockGoal,
        mockAssessment
      );

      const reassessment = result[result.length - 1];
      expect(reassessment.item_type).toBe('assessment');
      expect(reassessment.item_id).toBe('reassessment');
      expect(reassessment.item_title).toBe('Progress Assessment');
      expect(reassessment.estimated_hours).toBe(0.5);
      expect(reassessment.is_required).toBe(true);
      expect(reassessment.confidence_score).toBe(1.0);
    });

    it('should place reassessment in week after last content', () => {
      const items = [createMockItem('item1', 9)]; // Week 1

      (
        contentSelectionService.selectFoundationalContent as ReturnType<typeof vi.fn>
      ).mockReturnValue(items);
      (contentSelectionService.selectCoreContent as ReturnType<typeof vi.fn>).mockReturnValue([]);
      (contentSelectionService.selectPracticalContent as ReturnType<typeof vi.fn>).mockReturnValue(
        []
      );

      const result = service.selectAndSequenceContent(
        mockResources,
        mockGapAnalysis,
        mockGoal,
        mockAssessment
      );

      // Foundation week 1, Core starts week 2 (empty), Practical starts week 3 (empty), reassessment week 4
      const reassessment = result[result.length - 1];
      expect(reassessment.week_number).toBe(4);
    });
  });

  describe('edge cases', () => {
    it('should handle empty content from all phases', () => {
      (
        contentSelectionService.selectFoundationalContent as ReturnType<typeof vi.fn>
      ).mockReturnValue([]);
      (contentSelectionService.selectCoreContent as ReturnType<typeof vi.fn>).mockReturnValue([]);
      (contentSelectionService.selectPracticalContent as ReturnType<typeof vi.fn>).mockReturnValue(
        []
      );

      const result = service.selectAndSequenceContent(
        mockResources,
        mockGapAnalysis,
        mockGoal,
        mockAssessment
      );

      // Should still have reassessment
      expect(result).toHaveLength(1);
      expect(result[0].item_type).toBe('assessment');
    });

    it('should handle items that exactly fill weekly hours', () => {
      const items = [
        createMockItem('item1', 10), // Exactly 10 hours
        createMockItem('item2', 5), // Week 2
      ];

      (
        contentSelectionService.selectFoundationalContent as ReturnType<typeof vi.fn>
      ).mockReturnValue(items);
      (contentSelectionService.selectCoreContent as ReturnType<typeof vi.fn>).mockReturnValue([]);
      (contentSelectionService.selectPracticalContent as ReturnType<typeof vi.fn>).mockReturnValue(
        []
      );

      const result = service.selectAndSequenceContent(
        mockResources,
        mockGapAnalysis,
        mockGoal,
        mockAssessment
      );

      expect(result[0].week_number).toBe(1);
      expect(result[1].week_number).toBe(2); // Next item starts new week
    });

    it('should handle items larger than weekly hour limit', () => {
      const items = [createMockItem('item1', 15)]; // Exceeds 10 hour limit

      (
        contentSelectionService.selectFoundationalContent as ReturnType<typeof vi.fn>
      ).mockReturnValue(items);
      (contentSelectionService.selectCoreContent as ReturnType<typeof vi.fn>).mockReturnValue([]);
      (contentSelectionService.selectPracticalContent as ReturnType<typeof vi.fn>).mockReturnValue(
        []
      );

      const result = service.selectAndSequenceContent(
        mockResources,
        mockGapAnalysis,
        mockGoal,
        mockAssessment
      );

      // Should still be placed in week 1
      expect(result[0].week_number).toBe(1);
    });

    it('should handle zero hours per week goal', () => {
      const zeroHoursGoal: LearningGoal = { ...mockGoal, hours_per_week: 0 };
      const items = [createMockItem('item1', 5)];

      (
        contentSelectionService.selectFoundationalContent as ReturnType<typeof vi.fn>
      ).mockReturnValue(items);
      (contentSelectionService.selectCoreContent as ReturnType<typeof vi.fn>).mockReturnValue([]);
      (contentSelectionService.selectPracticalContent as ReturnType<typeof vi.fn>).mockReturnValue(
        []
      );

      const result = service.selectAndSequenceContent(
        mockResources,
        mockGapAnalysis,
        zeroHoursGoal,
        mockAssessment
      );

      // Each item should get its own week when max hours is 0
      expect(result[0].week_number).toBeDefined();
    });

    it('should use assessment data in reassessment item', () => {
      const customAssessment: AssessmentData = {
        ...mockAssessment,
        augmentation_level: 'advanced',
        current_ability_estimate: 1.5,
      };

      (
        contentSelectionService.selectFoundationalContent as ReturnType<typeof vi.fn>
      ).mockReturnValue([]);
      (contentSelectionService.selectCoreContent as ReturnType<typeof vi.fn>).mockReturnValue([]);
      (contentSelectionService.selectPracticalContent as ReturnType<typeof vi.fn>).mockReturnValue(
        []
      );

      const result = service.selectAndSequenceContent(
        mockResources,
        mockGapAnalysis,
        mockGoal,
        customAssessment
      );

      const reassessment = result[result.length - 1];
      expect(reassessment.difficulty_level).toBe('advanced');
      expect(reassessment.irt_difficulty).toBe(1.5);
    });

    it('should handle multiple items per phase', () => {
      const foundational = [
        createMockItem('f1', 3),
        createMockItem('f2', 4),
        createMockItem('f3', 5),
      ];
      const core = [createMockItem('c1', 6), createMockItem('c2', 7)];
      const practical = [createMockItem('p1', 8)];

      (
        contentSelectionService.selectFoundationalContent as ReturnType<typeof vi.fn>
      ).mockReturnValue(foundational);
      (contentSelectionService.selectCoreContent as ReturnType<typeof vi.fn>).mockReturnValue(core);
      (contentSelectionService.selectPracticalContent as ReturnType<typeof vi.fn>).mockReturnValue(
        practical
      );

      const result = service.selectAndSequenceContent(
        mockResources,
        mockGapAnalysis,
        mockGoal,
        mockAssessment
      );

      // Should have 3 foundational + 2 core + 1 practical + 1 reassessment = 7
      expect(result).toHaveLength(7);
      expect(result.filter(i => i.item_id.startsWith('f'))).toHaveLength(3);
      expect(result.filter(i => i.item_id.startsWith('c'))).toHaveLength(2);
      expect(result.filter(i => i.item_id.startsWith('p'))).toHaveLength(1);
    });
  });
});
