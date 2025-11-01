/**
 * Progress Forecast Service
 * Forecasts user progress and learning milestones based on historical data
 */

import { supabase } from '@/integrations/supabase/client';
import type { ProgressForecast, UserProfile, HistoricalProgress } from './types';

export class ProgressForecastService {
  /**
   * Forecast progress to target level
   */
  static async forecastProgress(userId: string, targetLevel: number): Promise<ProgressForecast> {
    const profile = await this.getUserProfile(userId);
    const historicalProgress = await this.getHistoricalProgress(userId);

    // Calculate learning rate from historical data
    const learningRate = this.calculateLearningRate(historicalProgress);

    // Estimate weeks needed
    const levelDifference = targetLevel - profile.currentSkillLevel;
    const baseWeeks = levelDifference / learningRate;

    // Adjust based on time commitment and learning pace
    const adjustedWeeks = this.adjustForCommitment(
      baseWeeks,
      profile.timeCommitment,
      profile.learningPace
    );

    // Generate milestones
    const milestones = this.generateProgressMilestones(
      profile.currentSkillLevel,
      targetLevel,
      adjustedWeeks
    );

    // Calculate confidence interval
    const variance = this.calculateVariance(historicalProgress);
    const confidenceInterval = {
      min: Math.max(0, adjustedWeeks - variance),
      max: Math.min(52, adjustedWeeks + variance), // Cap at 52 weeks
    };

    return {
      currentLevel: profile.currentSkillLevel,
      targetLevel,
      estimatedWeeks: Math.round(adjustedWeeks),
      milestones,
      confidenceInterval,
    };
  }

  private static async getUserProfile(userId: string): Promise<UserProfile> {
    const { data: user } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return {
      id: userId,
      currentSkillLevel: user?.skill_level || 50,
      learningGoals: user?.learning_goals || [],
      completedCourses: [],
      assessmentScores: {},
      learningPace: user?.learning_pace || 'moderate',
      preferredTopics: user?.preferred_topics || [],
      timeCommitment: user?.time_commitment || 5,
    };
  }

  private static async getHistoricalProgress(userId: string): Promise<HistoricalProgress[]> {
    const { data } = await supabase
      .from('skill_progress_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    return (data as HistoricalProgress[]) || [];
  }

  private static calculateLearningRate(history: HistoricalProgress[]): number {
    if (history.length < 2) return 5; // Default: 5 skill points per week

    const first = history[0];
    const last = history[history.length - 1];
    const timeDiff = new Date(last.created_at).getTime() - new Date(first.created_at).getTime();
    const weeks = timeDiff / (7 * 24 * 60 * 60 * 1000);
    const skillDiff = last.skill_level - first.skill_level;

    return weeks > 0 ? skillDiff / weeks : 5;
  }

  private static adjustForCommitment(
    baseWeeks: number,
    timeCommitment: number,
    pace: string
  ): number {
    const paceMultiplier = { slow: 1.3, moderate: 1, fast: 0.8 };
    const commitmentFactor = 10 / timeCommitment; // Baseline is 10 hours/week

    return (
      baseWeeks * commitmentFactor * (paceMultiplier[pace as keyof typeof paceMultiplier] || 1)
    );
  }

  private static generateProgressMilestones(
    currentLevel: number,
    targetLevel: number,
    weeks: number
  ): ProgressForecast['milestones'] {
    const milestones: ProgressForecast['milestones'] = [];
    const increment = (targetLevel - currentLevel) / 4;

    for (let i = 1; i <= 4; i++) {
      const week = Math.round((weeks / 4) * i);
      const level = Math.round(currentLevel + increment * i);
      const achievement = this.getAchievementForLevel(level);

      milestones.push({ week, level, achievement });
    }

    return milestones;
  }

  private static getAchievementForLevel(level: number): string {
    if (level >= 90) return 'AI Expert - Master Level';
    if (level >= 75) return 'Advanced Practitioner';
    if (level >= 60) return 'Intermediate Specialist';
    if (level >= 40) return 'Competent User';
    return 'Foundational Knowledge';
  }

  private static calculateVariance(history: HistoricalProgress[]): number {
    if (history.length < 3) return 2; // Default variance: ±2 weeks

    // Calculate standard deviation of learning rate
    const rates = [];
    for (let i = 1; i < history.length; i++) {
      const timeDiff =
        new Date(history[i].created_at).getTime() - new Date(history[i - 1].created_at).getTime();
      const weeks = timeDiff / (7 * 24 * 60 * 60 * 1000);
      const skillDiff = history[i].skill_level - history[i - 1].skill_level;
      rates.push(skillDiff / weeks);
    }

    const mean = rates.reduce((sum, r) => sum + r, 0) / rates.length;
    const variance = rates.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / rates.length;

    return Math.sqrt(variance);
  }
}
