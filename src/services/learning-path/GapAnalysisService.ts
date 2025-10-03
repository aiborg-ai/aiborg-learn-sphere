/**
 * Gap Analysis Service
 * Analyzes skill gaps between current and target levels
 */

import type {
  AssessmentData,
  CategoryInsight,
  LearningGoal,
  GapAnalysis,
  WeakCategory,
  PriorityCategory
} from './types';
import { DIFFICULTY_MAP } from './types';

export class GapAnalysisService {
  /**
   * Analyze skill gaps between current and target levels
   */
  analyzeSkillGaps(
    assessment: AssessmentData,
    insights: CategoryInsight[],
    goal: LearningGoal
  ): GapAnalysis {
    const currentAbility = assessment.current_ability_estimate ?? 0;
    const targetAbility = goal.target_irt_ability ?? DIFFICULTY_MAP[goal.target_augmentation_level].irt;
    const abilityGap = targetAbility - currentAbility;

    const weakCategories = this.identifyWeakCategories(insights);
    const focusCategories = this.filterFocusCategories(insights, goal);
    const priorityCategories = this.determinePriorityCategories(
      weakCategories,
      focusCategories,
      insights
    );

    return {
      currentAbility,
      targetAbility,
      abilityGap,
      weakCategories: this.mapToWeakCategories(weakCategories),
      priorityCategories: this.mapToPriorityCategories(priorityCategories, focusCategories),
      focusAreas: goal.focus_skills ?? []
    };
  }

  private identifyWeakCategories(insights: CategoryInsight[]): CategoryInsight[] {
    return insights
      .filter(c => c.percentage < 60 || c.strength_level === 'weak' || c.strength_level === 'developing')
      .sort((a, b) => a.percentage - b.percentage);
  }

  private filterFocusCategories(insights: CategoryInsight[], goal: LearningGoal): CategoryInsight[] {
    return insights.filter(c => goal.focus_category_ids.includes(c.category_id));
  }

  private determinePriorityCategories(
    weakCategories: CategoryInsight[],
    focusCategories: CategoryInsight[],
    allInsights: CategoryInsight[]
  ): CategoryInsight[] {
    const weakInFocus = weakCategories.filter(wc =>
      focusCategories.find(fc => fc.category_id === wc.category_id)
    );
    const weakNotInFocus = weakCategories.filter(wc =>
      !focusCategories.find(fc => fc.category_id === wc.category_id)
    );

    return [...weakInFocus, ...weakNotInFocus].slice(0, 5);
  }

  private mapToWeakCategories(categories: CategoryInsight[]): WeakCategory[] {
    return categories.map(c => ({
      id: c.category_id,
      name: c.category_name,
      score: c.percentage,
      gap: 100 - c.percentage
    }));
  }

  private mapToPriorityCategories(
    priorityCategories: CategoryInsight[],
    focusCategories: CategoryInsight[]
  ): PriorityCategory[] {
    return priorityCategories.map(c => ({
      id: c.category_id,
      name: c.category_name,
      score: c.percentage,
      priority: (100 - c.percentage) * (focusCategories.find(fc => fc.category_id === c.category_id) ? 1.5 : 1)
    }));
  }
}

export const gapAnalysisService = new GapAnalysisService();
