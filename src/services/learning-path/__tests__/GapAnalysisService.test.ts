/**
 * Tests for GapAnalysisService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GapAnalysisService } from '../GapAnalysisService';
import type { AssessmentData, CategoryInsight, LearningGoal } from '../types';

describe('GapAnalysisService', () => {
  let service: GapAnalysisService;

  beforeEach(() => {
    service = new GapAnalysisService();
  });

  const mockAssessmentData: AssessmentData = {
    id: 'assessment-1',
    user_id: 'user-1',
    augmentation_level: 'beginner',
    current_ability_estimate: 0.2,
    category_scores: {},
    completed_at: new Date().toISOString(),
  };

  const mockInsights: CategoryInsight[] = [
    {
      category_id: 'cat-1',
      category_name: 'JavaScript Basics',
      percentage: 45,
      proficiency: 0.45,
      confidence: 0.8,
      questions_answered: 10,
      strength_level: 'weak',
    },
    {
      category_id: 'cat-2',
      category_name: 'React Fundamentals',
      percentage: 75,
      proficiency: 0.75,
      confidence: 0.9,
      questions_answered: 12,
      strength_level: 'strong',
    },
    {
      category_id: 'cat-3',
      category_name: 'TypeScript',
      percentage: 55,
      proficiency: 0.55,
      confidence: 0.7,
      questions_answered: 8,
      strength_level: 'developing',
    },
    {
      category_id: 'cat-4',
      category_name: 'Node.js',
      percentage: 30,
      proficiency: 0.3,
      confidence: 0.6,
      questions_answered: 6,
      strength_level: 'weak',
    },
  ];

  const mockGoal: LearningGoal = {
    target_augmentation_level: 'intermediate',
    target_irt_ability: 0.8,
    focus_category_ids: ['cat-1', 'cat-3'],
    focus_skills: ['Variables', 'Functions'],
    estimated_weeks: 8,
    hours_per_week: 10,
    learning_style: 'visual',
  };

  describe('analyzeSkillGaps', () => {
    it('should calculate ability gap correctly', () => {
      const result = service.analyzeSkillGaps(mockAssessmentData, mockInsights, mockGoal);

      expect(result.currentAbility).toBe(0.2);
      expect(result.targetAbility).toBe(0.8);
      expect(result.abilityGap).toBeCloseTo(0.6, 5);
    });

    it('should use DIFFICULTY_MAP when target_irt_ability not provided', () => {
      const goalWithoutIRT: LearningGoal = {
        ...mockGoal,
        target_irt_ability: undefined,
      };

      const result = service.analyzeSkillGaps(mockAssessmentData, mockInsights, goalWithoutIRT);

      expect(result.targetAbility).toBeDefined();
      expect(result.abilityGap).toBeDefined();
    });

    it('should default currentAbility to 0 when not provided', () => {
      const assessmentWithoutAbility: AssessmentData = {
        ...mockAssessmentData,
        current_ability_estimate: undefined,
      };

      const result = service.analyzeSkillGaps(assessmentWithoutAbility, mockInsights, mockGoal);

      expect(result.currentAbility).toBe(0);
      expect(result.abilityGap).toBe(0.8); // 0.8 - 0
    });

    it('should identify weak categories', () => {
      const result = service.analyzeSkillGaps(mockAssessmentData, mockInsights, mockGoal);

      // Weak categories: cat-1 (45%), cat-3 (55%), cat-4 (30%)
      expect(result.weakCategories).toHaveLength(3);
      expect(result.weakCategories.map(c => c.id)).toContain('cat-1');
      expect(result.weakCategories.map(c => c.id)).toContain('cat-3');
      expect(result.weakCategories.map(c => c.id)).toContain('cat-4');
      expect(result.weakCategories.map(c => c.id)).not.toContain('cat-2'); // strong category
    });

    it('should sort weak categories by score (lowest first)', () => {
      const result = service.analyzeSkillGaps(mockAssessmentData, mockInsights, mockGoal);

      expect(result.weakCategories[0].id).toBe('cat-4'); // 30%
      expect(result.weakCategories[1].id).toBe('cat-1'); // 45%
      expect(result.weakCategories[2].id).toBe('cat-3'); // 55%
    });

    it('should calculate gap correctly for weak categories', () => {
      const result = service.analyzeSkillGaps(mockAssessmentData, mockInsights, mockGoal);

      const cat1Weak = result.weakCategories.find(c => c.id === 'cat-1');
      expect(cat1Weak?.score).toBe(45);
      expect(cat1Weak?.gap).toBe(55); // 100 - 45
    });

    it('should prioritize weak categories in focus', () => {
      const result = service.analyzeSkillGaps(mockAssessmentData, mockInsights, mockGoal);

      // Priority categories should have cat-1 and cat-3 (both weak and in focus) first
      const priorities = result.priorityCategories;
      const cat1Priority = priorities.find(c => c.id === 'cat-1');
      const cat3Priority = priorities.find(c => c.id === 'cat-3');
      const cat4Priority = priorities.find(c => c.id === 'cat-4');

      // Focus categories should have higher priority
      expect(cat1Priority).toBeDefined();
      expect(cat3Priority).toBeDefined();
      expect(cat1Priority!.priority).toBeGreaterThan(cat4Priority!.priority);
    });

    it('should calculate priority with 1.5x multiplier for focus categories', () => {
      const result = service.analyzeSkillGaps(mockAssessmentData, mockInsights, mockGoal);

      const cat1Priority = result.priorityCategories.find(c => c.id === 'cat-1');
      const cat4Priority = result.priorityCategories.find(c => c.id === 'cat-4');

      // cat-1 is in focus (gap=55 * 1.5 = 82.5)
      // cat-4 is not in focus (gap=70 * 1.0 = 70)
      expect(cat1Priority!.priority).toBe(55 * 1.5); // 82.5
      expect(cat4Priority!.priority).toBe(70 * 1.0); // 70
    });

    it('should limit priority categories to 5', () => {
      const manyInsights: CategoryInsight[] = Array.from({ length: 10 }, (_, i) => ({
        category_id: `cat-${i}`,
        category_name: `Category ${i}`,
        percentage: 40 + i * 2,
        proficiency: 0.4 + i * 0.02,
        confidence: 0.7,
        questions_answered: 10,
        strength_level: 'weak' as const,
      }));

      const result = service.analyzeSkillGaps(mockAssessmentData, manyInsights, {
        ...mockGoal,
        focus_category_ids: [],
      });

      expect(result.priorityCategories).toHaveLength(5);
    });

    it('should include focus areas from goal', () => {
      const result = service.analyzeSkillGaps(mockAssessmentData, mockInsights, mockGoal);

      expect(result.focusAreas).toEqual(['Variables', 'Functions']);
    });

    it('should default to empty array when no focus skills provided', () => {
      const goalWithoutSkills: LearningGoal = {
        ...mockGoal,
        focus_skills: undefined,
      };

      const result = service.analyzeSkillGaps(mockAssessmentData, mockInsights, goalWithoutSkills);

      expect(result.focusAreas).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should handle empty insights array', () => {
      const result = service.analyzeSkillGaps(mockAssessmentData, [], mockGoal);

      expect(result.weakCategories).toEqual([]);
      expect(result.priorityCategories).toEqual([]);
      expect(result.abilityGap).toBeCloseTo(0.6, 5); // Still calculated from assessment
    });

    it('should handle no weak categories', () => {
      const strongInsights: CategoryInsight[] = [
        {
          category_id: 'cat-1',
          category_name: 'Expert Category',
          percentage: 95,
          proficiency: 0.95,
          confidence: 0.95,
          questions_answered: 20,
          strength_level: 'mastery',
        },
      ];

      const result = service.analyzeSkillGaps(mockAssessmentData, strongInsights, mockGoal);

      expect(result.weakCategories).toEqual([]);
      expect(result.priorityCategories).toEqual([]);
    });

    it('should handle categories at exactly 60% threshold', () => {
      const edgeCaseInsights: CategoryInsight[] = [
        {
          category_id: 'cat-1',
          category_name: 'Edge Case',
          percentage: 60,
          proficiency: 0.6,
          confidence: 0.8,
          questions_answered: 10,
          strength_level: 'moderate',
        },
      ];

      const result = service.analyzeSkillGaps(mockAssessmentData, edgeCaseInsights, mockGoal);

      // percentage < 60 is the condition, so 60 should NOT be weak
      expect(result.weakCategories).toEqual([]);
    });

    it('should handle categories at 59% (just below threshold)', () => {
      const edgeCaseInsights: CategoryInsight[] = [
        {
          category_id: 'cat-1',
          category_name: 'Edge Case',
          percentage: 59,
          proficiency: 0.59,
          confidence: 0.8,
          questions_answered: 10,
          strength_level: 'moderate',
        },
      ];

      const result = service.analyzeSkillGaps(mockAssessmentData, edgeCaseInsights, mockGoal);

      expect(result.weakCategories).toHaveLength(1);
      expect(result.weakCategories[0].id).toBe('cat-1');
    });

    it('should handle no focus categories', () => {
      const goalNoFocus: LearningGoal = {
        ...mockGoal,
        focus_category_ids: [],
      };

      const result = service.analyzeSkillGaps(mockAssessmentData, mockInsights, goalNoFocus);

      // All priority categories should have 1.0x multiplier (not 1.5x)
      result.priorityCategories.forEach(pc => {
        const expectedPriority = 100 - pc.score;
        expect(pc.priority).toBe(expectedPriority);
      });
    });

    it('should handle all categories in focus', () => {
      const goalAllFocus: LearningGoal = {
        ...mockGoal,
        focus_category_ids: mockInsights.map(i => i.category_id),
      };

      const result = service.analyzeSkillGaps(mockAssessmentData, mockInsights, goalAllFocus);

      // All weak priority categories should have 1.5x multiplier
      result.priorityCategories.forEach(pc => {
        const expectedPriority = (100 - pc.score) * 1.5;
        expect(pc.priority).toBe(expectedPriority);
      });
    });

    it('should handle negative ability gap', () => {
      const advancedAssessment: AssessmentData = {
        ...mockAssessmentData,
        current_ability_estimate: 1.5,
      };

      const beginnerGoal: LearningGoal = {
        ...mockGoal,
        target_irt_ability: 0.5,
      };

      const result = service.analyzeSkillGaps(advancedAssessment, mockInsights, beginnerGoal);

      expect(result.currentAbility).toBe(1.5);
      expect(result.targetAbility).toBe(0.5);
      expect(result.abilityGap).toBe(-1.0); // Already above target
    });

    it('should identify categories by strength_level even if percentage > 60', () => {
      const mixedInsights: CategoryInsight[] = [
        {
          category_id: 'cat-1',
          category_name: 'Misleading Category',
          percentage: 65, // Above 60
          proficiency: 0.65,
          confidence: 0.8,
          questions_answered: 10,
          strength_level: 'weak', // But marked as weak
        },
      ];

      const result = service.analyzeSkillGaps(mockAssessmentData, mixedInsights, mockGoal);

      // Should be identified as weak due to strength_level
      expect(result.weakCategories).toHaveLength(1);
      expect(result.weakCategories[0].id).toBe('cat-1');
    });
  });

  describe('data mapping', () => {
    it('should map weak categories with correct structure', () => {
      const result = service.analyzeSkillGaps(mockAssessmentData, mockInsights, mockGoal);

      const weakCat = result.weakCategories[0];
      expect(weakCat).toHaveProperty('id');
      expect(weakCat).toHaveProperty('name');
      expect(weakCat).toHaveProperty('score');
      expect(weakCat).toHaveProperty('gap');
      expect(weakCat.gap).toBe(100 - weakCat.score);
    });

    it('should map priority categories with correct structure', () => {
      const result = service.analyzeSkillGaps(mockAssessmentData, mockInsights, mockGoal);

      const priorityCat = result.priorityCategories[0];
      expect(priorityCat).toHaveProperty('id');
      expect(priorityCat).toHaveProperty('name');
      expect(priorityCat).toHaveProperty('score');
      expect(priorityCat).toHaveProperty('priority');
      expect(typeof priorityCat.priority).toBe('number');
    });

    it('should preserve category names in mappings', () => {
      const result = service.analyzeSkillGaps(mockAssessmentData, mockInsights, mockGoal);

      const cat1Weak = result.weakCategories.find(c => c.id === 'cat-1');
      expect(cat1Weak?.name).toBe('JavaScript Basics');

      const cat1Priority = result.priorityCategories.find(c => c.id === 'cat-1');
      expect(cat1Priority?.name).toBe('JavaScript Basics');
    });
  });
});
