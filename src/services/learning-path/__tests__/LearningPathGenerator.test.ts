/**
 * Tests for LearningPathGenerator
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LearningPathGenerator } from '../LearningPathGenerator';
import type { AssessmentData, CategoryInsight, LearningGoal } from '../types';

vi.mock('@/utils/logger');

// Mock all dependent services
vi.mock('../GapAnalysisService', () => ({
  gapAnalysisService: {
    analyzeSkillGaps: vi.fn(),
  },
}));

vi.mock('../ResourceFetchService', () => ({
  resourceFetchService: {
    fetchAvailableResources: vi.fn(),
  },
}));

vi.mock('../ContentSequencingService', () => ({
  contentSequencingService: {
    selectAndSequenceContent: vi.fn(),
  },
}));

vi.mock('../MilestoneService', () => ({
  milestoneService: {
    createMilestones: vi.fn(),
  },
}));

vi.mock('../PathMetadataService', () => ({
  pathMetadataService: {
    generatePathTitle: vi.fn(),
    generatePathDescription: vi.fn(),
    mapLevelToDifficulty: vi.fn(),
  },
}));

import { gapAnalysisService } from '../GapAnalysisService';
import { resourceFetchService } from '../ResourceFetchService';
import { contentSequencingService } from '../ContentSequencingService';
import { milestoneService } from '../MilestoneService';
import { pathMetadataService } from '../PathMetadataService';

describe('LearningPathGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAssessmentData: AssessmentData = {
    id: 'assessment-1',
    user_id: 'user-1',
    augmentation_level: 'beginner',
    category_scores: {
      'category-1': 0.4,
      'category-2': 0.6,
    },
    completed_at: new Date().toISOString(),
  };

  const mockCategoryInsights: CategoryInsight[] = [
    {
      category_id: 'category-1',
      category_name: 'JavaScript Basics',
      proficiency: 0.4,
      confidence: 0.8,
      questions_answered: 10,
      strength_level: 'needs_work',
    },
    {
      category_id: 'category-2',
      category_name: 'React Fundamentals',
      proficiency: 0.6,
      confidence: 0.7,
      questions_answered: 8,
      strength_level: 'moderate',
    },
  ];

  const mockGoal: LearningGoal = {
    target_augmentation_level: 'intermediate',
    focus_categories: ['category-1'],
    estimated_weeks: 8,
    hours_per_week: 10,
    learning_style: 'visual',
  };

  const mockGapAnalysis = {
    skill_gaps: [
      {
        category_id: 'category-1',
        category_name: 'JavaScript Basics',
        current_proficiency: 0.4,
        target_proficiency: 0.7,
        gap_size: 0.3,
        priority: 'high',
      },
    ],
    recommended_topics: ['Variables', 'Functions', 'Arrays'],
    estimated_effort_hours: 40,
  };

  const mockResources = [
    {
      id: 'resource-1',
      title: 'JavaScript for Beginners',
      type: 'course' as const,
      category_id: 'category-1',
      difficulty: 0.5,
      estimated_hours: 10,
    },
    {
      id: 'resource-2',
      title: 'Functions Deep Dive',
      type: 'tutorial' as const,
      category_id: 'category-1',
      difficulty: 0.6,
      estimated_hours: 5,
    },
  ];

  const mockSelectedItems = [
    {
      resource_id: 'resource-1',
      title: 'JavaScript for Beginners',
      type: 'course' as const,
      sequence_order: 1,
      estimated_hours: 10,
      difficulty_rating: 0.5,
      reasoning: 'Foundation building',
    },
    {
      resource_id: 'resource-2',
      title: 'Functions Deep Dive',
      type: 'tutorial' as const,
      sequence_order: 2,
      estimated_hours: 5,
      difficulty_rating: 0.6,
      reasoning: 'Skill enhancement',
    },
  ];

  const mockMilestones = [
    {
      milestone_number: 1,
      title: 'Complete JavaScript Basics',
      description: 'Finish beginner course',
      item_indices: [0],
      estimated_completion_week: 2,
    },
    {
      milestone_number: 2,
      title: 'Master Functions',
      description: 'Deep dive into functions',
      item_indices: [1],
      estimated_completion_week: 4,
    },
  ];

  describe('generatePath', () => {
    it('should orchestrate all services in correct order', async () => {
      const generator = new LearningPathGenerator();

      // Setup mocks
      (gapAnalysisService.analyzeSkillGaps as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGapAnalysis
      );
      (resourceFetchService.fetchAvailableResources as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResources
      );
      (
        contentSequencingService.selectAndSequenceContent as ReturnType<typeof vi.fn>
      ).mockReturnValue(mockSelectedItems);
      (milestoneService.createMilestones as ReturnType<typeof vi.fn>).mockReturnValue(
        mockMilestones
      );
      (pathMetadataService.generatePathTitle as ReturnType<typeof vi.fn>).mockReturnValue(
        'Custom Learning Path'
      );
      (pathMetadataService.generatePathDescription as ReturnType<typeof vi.fn>).mockReturnValue(
        'A personalized path for you'
      );
      (pathMetadataService.mapLevelToDifficulty as ReturnType<typeof vi.fn>).mockReturnValue(0.5);

      const result = await generator.generatePath(
        'user-1',
        mockAssessmentData,
        mockCategoryInsights,
        mockGoal
      );

      // Verify all services were called in order
      expect(gapAnalysisService.analyzeSkillGaps).toHaveBeenCalledWith(
        mockAssessmentData,
        mockCategoryInsights,
        mockGoal
      );
      expect(resourceFetchService.fetchAvailableResources).toHaveBeenCalledWith(mockGapAnalysis);
      expect(contentSequencingService.selectAndSequenceContent).toHaveBeenCalledWith(
        mockResources,
        mockGapAnalysis,
        mockGoal,
        mockAssessmentData
      );
      expect(milestoneService.createMilestones).toHaveBeenCalledWith(mockSelectedItems, mockGoal);

      // Verify result structure
      expect(result).toBeDefined();
      expect(result.items).toEqual(mockSelectedItems);
      expect(result.milestones).toEqual(mockMilestones);
    });

    it('should generate complete GeneratedPath with all fields', async () => {
      const generator = new LearningPathGenerator();

      (gapAnalysisService.analyzeSkillGaps as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGapAnalysis
      );
      (resourceFetchService.fetchAvailableResources as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResources
      );
      (
        contentSequencingService.selectAndSequenceContent as ReturnType<typeof vi.fn>
      ).mockReturnValue(mockSelectedItems);
      (milestoneService.createMilestones as ReturnType<typeof vi.fn>).mockReturnValue(
        mockMilestones
      );
      (pathMetadataService.generatePathTitle as ReturnType<typeof vi.fn>).mockReturnValue(
        'Custom Learning Path'
      );
      (pathMetadataService.generatePathDescription as ReturnType<typeof vi.fn>).mockReturnValue(
        'A personalized path for you'
      );
      (pathMetadataService.mapLevelToDifficulty as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(0.3) // beginner
        .mockReturnValueOnce(0.6); // intermediate

      const result = await generator.generatePath(
        'user-1',
        mockAssessmentData,
        mockCategoryInsights,
        mockGoal
      );

      expect(result).toEqual({
        path_title: 'Custom Learning Path',
        path_description: 'A personalized path for you',
        difficulty_start: 0.3,
        difficulty_end: 0.6,
        estimated_completion_weeks: 8,
        estimated_total_hours: 15, // 10 + 5
        items: mockSelectedItems,
        milestones: mockMilestones,
        generation_metadata: {
          algorithm: 'irt_gap_analysis_v1',
          assessment_used: 'assessment-1',
          gap_analysis: mockGapAnalysis,
          computation_time_ms: expect.any(Number),
        },
      });
    });

    it('should calculate total hours correctly', async () => {
      const generator = new LearningPathGenerator();

      const itemsWithVaryingHours = [
        { ...mockSelectedItems[0], estimated_hours: 12.5 },
        { ...mockSelectedItems[1], estimated_hours: 7.3 },
      ];

      (gapAnalysisService.analyzeSkillGaps as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGapAnalysis
      );
      (resourceFetchService.fetchAvailableResources as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResources
      );
      (
        contentSequencingService.selectAndSequenceContent as ReturnType<typeof vi.fn>
      ).mockReturnValue(itemsWithVaryingHours);
      (milestoneService.createMilestones as ReturnType<typeof vi.fn>).mockReturnValue(
        mockMilestones
      );
      (pathMetadataService.generatePathTitle as ReturnType<typeof vi.fn>).mockReturnValue('Title');
      (pathMetadataService.generatePathDescription as ReturnType<typeof vi.fn>).mockReturnValue(
        'Description'
      );
      (pathMetadataService.mapLevelToDifficulty as ReturnType<typeof vi.fn>).mockReturnValue(0.5);

      const result = await generator.generatePath(
        'user-1',
        mockAssessmentData,
        mockCategoryInsights,
        mockGoal
      );

      // 12.5 + 7.3 = 19.8, Math.ceil = 20
      expect(result.estimated_total_hours).toBe(20);
    });

    it('should track computation time', async () => {
      const generator = new LearningPathGenerator();

      (gapAnalysisService.analyzeSkillGaps as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGapAnalysis
      );
      (resourceFetchService.fetchAvailableResources as ReturnType<typeof vi.fn>).mockImplementation(
        async () => {
          // Simulate some processing time
          await new Promise(resolve => setTimeout(resolve, 10));
          return mockResources;
        }
      );
      (
        contentSequencingService.selectAndSequenceContent as ReturnType<typeof vi.fn>
      ).mockReturnValue(mockSelectedItems);
      (milestoneService.createMilestones as ReturnType<typeof vi.fn>).mockReturnValue(
        mockMilestones
      );
      (pathMetadataService.generatePathTitle as ReturnType<typeof vi.fn>).mockReturnValue('Title');
      (pathMetadataService.generatePathDescription as ReturnType<typeof vi.fn>).mockReturnValue(
        'Description'
      );
      (pathMetadataService.mapLevelToDifficulty as ReturnType<typeof vi.fn>).mockReturnValue(0.5);

      const result = await generator.generatePath(
        'user-1',
        mockAssessmentData,
        mockCategoryInsights,
        mockGoal
      );

      expect(result.generation_metadata.computation_time_ms).toBeGreaterThan(0);
    });

    it('should call pathMetadataService with correct parameters', async () => {
      const generator = new LearningPathGenerator();

      (gapAnalysisService.analyzeSkillGaps as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGapAnalysis
      );
      (resourceFetchService.fetchAvailableResources as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResources
      );
      (
        contentSequencingService.selectAndSequenceContent as ReturnType<typeof vi.fn>
      ).mockReturnValue(mockSelectedItems);
      (milestoneService.createMilestones as ReturnType<typeof vi.fn>).mockReturnValue(
        mockMilestones
      );
      (pathMetadataService.generatePathTitle as ReturnType<typeof vi.fn>).mockReturnValue('Title');
      (pathMetadataService.generatePathDescription as ReturnType<typeof vi.fn>).mockReturnValue(
        'Description'
      );
      (pathMetadataService.mapLevelToDifficulty as ReturnType<typeof vi.fn>).mockReturnValue(0.5);

      await generator.generatePath('user-1', mockAssessmentData, mockCategoryInsights, mockGoal);

      expect(pathMetadataService.generatePathTitle).toHaveBeenCalledWith(mockGoal, mockGapAnalysis);
      expect(pathMetadataService.generatePathDescription).toHaveBeenCalledWith(
        mockGoal,
        mockGapAnalysis,
        mockSelectedItems
      );
      expect(pathMetadataService.mapLevelToDifficulty).toHaveBeenCalledWith('beginner');
      expect(pathMetadataService.mapLevelToDifficulty).toHaveBeenCalledWith('intermediate');
    });

    it('should handle empty selected items', async () => {
      const generator = new LearningPathGenerator();

      (gapAnalysisService.analyzeSkillGaps as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGapAnalysis
      );
      (resourceFetchService.fetchAvailableResources as ReturnType<typeof vi.fn>).mockResolvedValue(
        []
      );
      (
        contentSequencingService.selectAndSequenceContent as ReturnType<typeof vi.fn>
      ).mockReturnValue([]);
      (milestoneService.createMilestones as ReturnType<typeof vi.fn>).mockReturnValue([]);
      (pathMetadataService.generatePathTitle as ReturnType<typeof vi.fn>).mockReturnValue('Title');
      (pathMetadataService.generatePathDescription as ReturnType<typeof vi.fn>).mockReturnValue(
        'Description'
      );
      (pathMetadataService.mapLevelToDifficulty as ReturnType<typeof vi.fn>).mockReturnValue(0.5);

      const result = await generator.generatePath(
        'user-1',
        mockAssessmentData,
        mockCategoryInsights,
        mockGoal
      );

      expect(result.items).toEqual([]);
      expect(result.milestones).toEqual([]);
      expect(result.estimated_total_hours).toBe(0);
    });

    it('should propagate errors from gap analysis', async () => {
      const generator = new LearningPathGenerator();
      const mockError = new Error('Gap analysis failed');

      (gapAnalysisService.analyzeSkillGaps as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw mockError;
      });

      await expect(
        generator.generatePath('user-1', mockAssessmentData, mockCategoryInsights, mockGoal)
      ).rejects.toThrow('Gap analysis failed');
    });

    it('should propagate errors from resource fetching', async () => {
      const generator = new LearningPathGenerator();
      const mockError = new Error('Resource fetch failed');

      (gapAnalysisService.analyzeSkillGaps as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGapAnalysis
      );
      (resourceFetchService.fetchAvailableResources as ReturnType<typeof vi.fn>).mockRejectedValue(
        mockError
      );

      await expect(
        generator.generatePath('user-1', mockAssessmentData, mockCategoryInsights, mockGoal)
      ).rejects.toThrow('Resource fetch failed');
    });

    it('should propagate errors from content sequencing', async () => {
      const generator = new LearningPathGenerator();
      const mockError = new Error('Sequencing failed');

      (gapAnalysisService.analyzeSkillGaps as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGapAnalysis
      );
      (resourceFetchService.fetchAvailableResources as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResources
      );
      (
        contentSequencingService.selectAndSequenceContent as ReturnType<typeof vi.fn>
      ).mockImplementation(() => {
        throw mockError;
      });

      await expect(
        generator.generatePath('user-1', mockAssessmentData, mockCategoryInsights, mockGoal)
      ).rejects.toThrow('Sequencing failed');
    });

    it('should include assessment ID in metadata', async () => {
      const generator = new LearningPathGenerator();

      (gapAnalysisService.analyzeSkillGaps as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGapAnalysis
      );
      (resourceFetchService.fetchAvailableResources as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResources
      );
      (
        contentSequencingService.selectAndSequenceContent as ReturnType<typeof vi.fn>
      ).mockReturnValue(mockSelectedItems);
      (milestoneService.createMilestones as ReturnType<typeof vi.fn>).mockReturnValue(
        mockMilestones
      );
      (pathMetadataService.generatePathTitle as ReturnType<typeof vi.fn>).mockReturnValue('Title');
      (pathMetadataService.generatePathDescription as ReturnType<typeof vi.fn>).mockReturnValue(
        'Description'
      );
      (pathMetadataService.mapLevelToDifficulty as ReturnType<typeof vi.fn>).mockReturnValue(0.5);

      const result = await generator.generatePath(
        'user-1',
        mockAssessmentData,
        mockCategoryInsights,
        mockGoal
      );

      expect(result.generation_metadata.assessment_used).toBe('assessment-1');
      expect(result.generation_metadata.algorithm).toBe('irt_gap_analysis_v1');
      expect(result.generation_metadata.gap_analysis).toEqual(mockGapAnalysis);
    });

    it('should preserve estimated weeks from goal', async () => {
      const generator = new LearningPathGenerator();

      const customGoal = { ...mockGoal, estimated_weeks: 12 };

      (gapAnalysisService.analyzeSkillGaps as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGapAnalysis
      );
      (resourceFetchService.fetchAvailableResources as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResources
      );
      (
        contentSequencingService.selectAndSequenceContent as ReturnType<typeof vi.fn>
      ).mockReturnValue(mockSelectedItems);
      (milestoneService.createMilestones as ReturnType<typeof vi.fn>).mockReturnValue(
        mockMilestones
      );
      (pathMetadataService.generatePathTitle as ReturnType<typeof vi.fn>).mockReturnValue('Title');
      (pathMetadataService.generatePathDescription as ReturnType<typeof vi.fn>).mockReturnValue(
        'Description'
      );
      (pathMetadataService.mapLevelToDifficulty as ReturnType<typeof vi.fn>).mockReturnValue(0.5);

      const result = await generator.generatePath(
        'user-1',
        mockAssessmentData,
        mockCategoryInsights,
        customGoal
      );

      expect(result.estimated_completion_weeks).toBe(12);
    });
  });
});
