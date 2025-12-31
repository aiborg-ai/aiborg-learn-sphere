/**
 * Content Sequencing Service
 * Sequences content and manages weekly planning
 */

import type {
  LearningResources,
  GapAnalysis,
  LearningGoal,
  AssessmentData,
  PathItem,
} from './types';
import { contentSelectionService } from './ContentSelectionService';

export class ContentSequencingService {
  /**
   * Select and sequence content based on gap analysis and goals
   */
  selectAndSequenceContent(
    resources: LearningResources,
    gapAnalysis: GapAnalysis,
    goal: LearningGoal,
    assessment: AssessmentData
  ): PathItem[] {
    const items: PathItem[] = [];
    let currentWeek = 1;
    let weeklyHours = 0;
    const maxHoursPerWeek = goal.hours_per_week;

    // Phase 1: Foundation
    const foundationalItems = contentSelectionService.selectFoundationalContent(
      resources,
      gapAnalysis,
      assessment
    );

    ({ currentWeek, weeklyHours } = this.addItemsToWeek(
      foundationalItems,
      items,
      currentWeek,
      weeklyHours,
      maxHoursPerWeek
    ));

    // Phase 2: Core Learning
    currentWeek++;
    weeklyHours = 0;

    const coreItems = contentSelectionService.selectCoreContent(
      resources,
      gapAnalysis,
      goal,
      assessment
    );

    ({ currentWeek, weeklyHours } = this.addItemsToWeek(
      coreItems,
      items,
      currentWeek,
      weeklyHours,
      maxHoursPerWeek
    ));

    // Phase 3: Application
    if (goal.include_workshops && resources.workshops.length > 0) {
      currentWeek++;
      weeklyHours = 0;

      const practicalItems = contentSelectionService.selectPracticalContent(
        resources,
        gapAnalysis,
        goal
      );

      ({ currentWeek, weeklyHours } = this.addItemsToWeek(
        practicalItems,
        items,
        currentWeek,
        weeklyHours,
        maxHoursPerWeek
      ));
    }

    // Phase 4: Reassessment
    items.push(this.createReassessmentItem(assessment, currentWeek + 1));

    return this.setPrerequisites(items);
  }

  private addItemsToWeek(
    itemsToAdd: PathItem[],
    allItems: PathItem[],
    currentWeek: number,
    weeklyHours: number,
    maxHoursPerWeek: number
  ): { currentWeek: number; weeklyHours: number } {
    let week = currentWeek;
    let hours = weeklyHours;

    itemsToAdd.forEach(item => {
      // Only move to next week if current week already has items and would exceed limit
      if (hours > 0 && hours + item.estimated_hours > maxHoursPerWeek) {
        week++;
        hours = 0;
      }
      item.week_number = week;
      hours += item.estimated_hours;
      allItems.push(item);
    });

    return { currentWeek: week, weeklyHours: hours };
  }

  private createReassessmentItem(assessment: AssessmentData, weekNumber: number): PathItem {
    return {
      item_type: 'assessment',
      item_id: 'reassessment',
      item_title: 'Progress Assessment',
      item_description: 'Retake the AI assessment to measure your improvement',
      difficulty_level: assessment.augmentation_level,
      irt_difficulty: assessment.current_ability_estimate,
      estimated_hours: 0.5,
      is_required: true,
      reason_for_inclusion: 'Validate learning progress and measure skill improvement',
      confidence_score: 1.0,
      week_number: weekNumber,
    };
  }

  private setPrerequisites(items: PathItem[]): PathItem[] {
    return items.map((item, index) => ({
      ...item,
      prerequisites: index > 0 ? [items[index - 1].item_id] : [],
    }));
  }
}

export const contentSequencingService = new ContentSequencingService();
