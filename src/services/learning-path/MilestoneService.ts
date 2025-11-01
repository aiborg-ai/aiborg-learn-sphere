/**
 * Milestone Service
 * Creates and manages learning path milestones
 */

import type { PathItem, LearningGoal, Milestone } from './types';

export class MilestoneService {
  /**
   * Create milestones for the learning path
   */
  createMilestones(items: PathItem[], goal: LearningGoal): Milestone[] {
    const milestonePoints = [0.25, 0.5, 0.75, 1.0];

    return milestonePoints.map((point, index) => ({
      milestone_order: index + 1,
      milestone_title: this.getMilestoneTitle(point),
      milestone_description: this.getMilestoneDescription(point, goal),
      minimum_completion_percentage: point * 100,
      reward_badge: this.getMilestoneBadge(point),
      reward_points: Math.round(point * 100),
      reward_message: this.getMilestoneReward(point),
    }));
  }

  private getMilestoneTitle(point: number): string {
    const titles: Record<number, string> = {
      0.25: 'Journey Begins',
      0.5: 'Halfway Hero',
      0.75: 'Nearly There',
      1.0: 'Goal Achieved!',
    };
    return titles[point] ?? 'Milestone';
  }

  private getMilestoneDescription(point: number, goal: LearningGoal): string {
    const pct = Math.round(point * 100);
    return `Complete ${pct}% of your ${goal.goal_title} learning path`;
  }

  private getMilestoneBadge(point: number): string {
    const badges: Record<number, string> = {
      0.25: 'beginner',
      0.5: 'intermediate',
      0.75: 'advanced',
      1.0: 'expert',
    };
    return badges[point] ?? 'achiever';
  }

  private getMilestoneReward(point: number): string {
    const messages: Record<number, string> = {
      0.25: 'Great start! Keep the momentum going!',
      0.5: "You're halfway there! Amazing progress!",
      0.75: 'Almost at your goal! One final push!',
      1.0: "Congratulations! You've achieved your learning goal!",
    };
    return messages[point] ?? 'Well done!';
  }
}

export const milestoneService = new MilestoneService();
