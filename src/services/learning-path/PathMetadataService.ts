/**
 * Path Metadata Service
 * Generates path titles, descriptions, and metadata
 */

import type { LearningGoal, GapAnalysis, PathItem } from './types';

export class PathMetadataService {
  /**
   * Generate path title based on goal and gap analysis
   */
  generatePathTitle(goal: LearningGoal, _gapAnalysis: GapAnalysis): string {
    const level = goal.target_augmentation_level;
    const focus = goal.focus_skills?.[0] ?? 'AI Skills';
    return `${level.charAt(0).toUpperCase() + level.slice(1)} ${focus} Mastery Path`;
  }

  /**
   * Generate path description
   */
  generatePathDescription(goal: LearningGoal, gapAnalysis: GapAnalysis, items: PathItem[]): string {
    const weeks = goal.estimated_weeks;
    const categories = gapAnalysis.priorityCategories
      .slice(0, 3)
      .map(c => c.name)
      .join(', ');
    return `A personalized ${weeks}-week learning journey to master ${categories}. This path includes ${items.length} carefully selected resources to help you achieve ${goal.target_augmentation_level} level proficiency.`;
  }

  /**
   * Map augmentation level to difficulty level
   */
  mapLevelToDifficulty(level: string): string {
    const mapping: Record<string, string> = {
      beginner: 'foundational',
      intermediate: 'applied',
      advanced: 'advanced',
      expert: 'strategic'
    };
    return mapping[level] ?? 'foundational';
  }
}

export const pathMetadataService = new PathMetadataService();
