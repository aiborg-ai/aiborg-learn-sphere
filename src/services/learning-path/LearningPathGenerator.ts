/**
 * AI-Powered Learning Path Generator
 * Orchestrates the generation of personalized learning paths
 */

import { logger } from '@/utils/logger';
import type {
  AssessmentData,
  CategoryInsight,
  LearningGoal,
  GeneratedPath
} from './types';
import { gapAnalysisService } from './GapAnalysisService';
import { resourceFetchService } from './ResourceFetchService';
import { contentSequencingService } from './ContentSequencingService';
import { milestoneService } from './MilestoneService';
import { pathMetadataService } from './PathMetadataService';

export class LearningPathGenerator {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Main function to generate a personalized learning path
   */
  async generatePath(
    userId: string,
    assessmentData: AssessmentData,
    categoryInsights: CategoryInsight[],
    goal: LearningGoal
  ): Promise<GeneratedPath> {
    logger.log('Starting path generation for user:', userId);
    this.startTime = Date.now();

    // Step 1: Perform gap analysis
    const gapAnalysis = gapAnalysisService.analyzeSkillGaps(
      assessmentData,
      categoryInsights,
      goal
    );

    // Step 2: Fetch available resources
    const resources = await resourceFetchService.fetchAvailableResources(gapAnalysis);

    // Step 3: Select and sequence content
    const selectedItems = contentSequencingService.selectAndSequenceContent(
      resources,
      gapAnalysis,
      goal,
      assessmentData
    );

    // Step 4: Create milestones
    const milestones = milestoneService.createMilestones(selectedItems, goal);

    // Step 5: Calculate path metadata
    const totalHours = selectedItems.reduce((sum, item) => sum + item.estimated_hours, 0);
    const computationTime = Date.now() - this.startTime;

    const generatedPath: GeneratedPath = {
      path_title: pathMetadataService.generatePathTitle(goal, gapAnalysis),
      path_description: pathMetadataService.generatePathDescription(goal, gapAnalysis, selectedItems),
      difficulty_start: pathMetadataService.mapLevelToDifficulty(assessmentData.augmentation_level),
      difficulty_end: pathMetadataService.mapLevelToDifficulty(goal.target_augmentation_level),
      estimated_completion_weeks: goal.estimated_weeks,
      estimated_total_hours: Math.ceil(totalHours),
      items: selectedItems,
      milestones,
      generation_metadata: {
        algorithm: 'irt_gap_analysis_v1',
        assessment_used: assessmentData.id,
        gap_analysis: gapAnalysis,
        computation_time_ms: computationTime
      }
    };

    logger.log('Path generation completed:', {
      items: selectedItems.length,
      hours: totalHours,
      weeks: goal.estimated_weeks
    });

    return generatedPath;
  }
}

export const pathGenerator = new LearningPathGenerator();
