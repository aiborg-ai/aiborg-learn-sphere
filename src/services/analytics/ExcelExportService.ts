/**
 * Excel Export Service
 * Handles exporting analytics data to Excel format
 * Uses xlsx library for spreadsheet generation
 */

import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { logger } from '@/utils/logger';
import { UserAnalyticsService } from './UserAnalyticsService';
import { PerformanceAnalyticsService } from './PerformanceAnalyticsService';
import { GoalPredictionService } from './GoalPredictionService';

export interface ExportOptions {
  userId: string;
  dateRange?: {
    start: string;
    end: string;
  };
  includeOverview?: boolean;
  includePerformance?: boolean;
  includeGoals?: boolean;
  includeCharts?: boolean;
  fileName?: string;
}

export class ExcelExportService {
  /**
   * Export all analytics data to Excel workbook
   */
  static async exportAnalytics(options: ExportOptions): Promise<void> {
    try {
      const {
        userId,
        dateRange,
        includeOverview = true,
        includePerformance = true,
        includeGoals = true,
        fileName = `analytics-export-${format(new Date(), 'yyyy-MM-dd')}`,
      } = options;

      // Create new workbook
      const workbook = XLSX.utils.book_new();

      // Add Overview sheet
      if (includeOverview) {
        await this.addOverviewSheet(workbook, userId, dateRange);
      }

      // Add Performance sheet
      if (includePerformance) {
        await this.addPerformanceSheet(workbook, userId);
      }

      // Add Goals sheet
      if (includeGoals) {
        await this.addGoalsSheet(workbook, userId);
      }

      // Generate Excel file and trigger download
      XLSX.writeFile(workbook, `${fileName}.xlsx`);

      logger.info('Analytics exported successfully', { userId, fileName });
    } catch (_error) {
      logger.error('Error exporting analytics:', _error);
      throw new Error('Failed to export analytics data');
    }
  }

  /**
   * Add Overview sheet with dashboard statistics
   */
  private static async addOverviewSheet(
    workbook: XLSX.WorkBook,
    userId: string,
    _dateRange?: { start: string; end: string }
  ): Promise<void> {
    try {
      const [dashboardStats, weeklyActivity, categoryDistribution] = await Promise.all([
        UserAnalyticsService.getUserDashboardStats(userId),
        UserAnalyticsService.getUserWeeklyActivity(userId, 6),
        UserAnalyticsService.getUserCategoryDistribution(userId),
      ]);

      // Dashboard Stats Section
      const statsData = [
        ['Learning Analytics Overview'],
        ['Generated on:', format(new Date(), 'MMMM d, yyyy HH:mm')],
        [],
        ['Metric', 'Value'],
        ['Total Study Time (hours)', Math.floor(dashboardStats.totalStudyTime / 60)],
        ['Total Study Time (minutes)', dashboardStats.totalStudyTime],
        ['Completed Courses', dashboardStats.completedCourses],
        ['Current Streak (days)', dashboardStats.currentStreak],
        ['Longest Streak (days)', dashboardStats.longestStreak],
        ['Average Score (%)', dashboardStats.averageScore],
        ['Total Assessments', dashboardStats.totalAssessments],
        ['Certificates Earned', dashboardStats.certificatesEarned],
        ['Achievements Count', dashboardStats.achievementsCount],
        [],
        ['Weekly Activity (Last 6 Weeks)'],
        ['Week', 'Study Time (minutes)'],
        ...weeklyActivity.map(week => [week.week, week.studyTime]),
        [],
        ['Category Distribution'],
        ['Category', 'Percentage', 'Count'],
        ...categoryDistribution.map(cat => [cat.category, `${cat.percentage}%`, cat.value]),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(statsData);

      // Apply styling
      this.applyHeaderStyle(worksheet, 'A1');
      this.applyHeaderStyle(worksheet, 'A15');
      this.applyHeaderStyle(worksheet, 'A20');

      // Set column widths
      worksheet['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Overview');
    } catch (_error) {
      logger.error('Error creating overview sheet:', _error);
    }
  }

  /**
   * Add Performance sheet with question-level analytics
   */
  private static async addPerformanceSheet(workbook: XLSX.WorkBook, userId: string): Promise<void> {
    try {
      const [stats, questions, topics, mistakes] = await Promise.all([
        PerformanceAnalyticsService.getDetailedPerformanceStats(userId),
        PerformanceAnalyticsService.getQuestionLevelPerformance(userId, 100),
        PerformanceAnalyticsService.getTopicPerformance(userId),
        PerformanceAnalyticsService.getCommonMistakes(userId, 20),
      ]);

      const performanceData = [
        ['Performance Analytics'],
        [],
        ['Overall Statistics'],
        ['Metric', 'Value'],
        ['Overall Accuracy (%)', stats.overallAccuracy],
        ['Total Questions Attempted', stats.totalQuestionsAttempted],
        ['Total Correct', stats.totalCorrect],
        ['Total Incorrect', stats.totalIncorrect],
        ['Average Time per Question (seconds)', stats.averageTimePerQuestion],
        ['Improvement Rate (%)', stats.improvementRate],
        ['Consistency Score', stats.consistencyScore],
        [],
        ['Performance by Difficulty'],
        ['Difficulty', 'Accuracy (%)', 'Total Questions'],
        [
          'Easy',
          stats.performanceByDifficulty.easy.percentage,
          stats.performanceByDifficulty.easy.total,
        ],
        [
          'Medium',
          stats.performanceByDifficulty.medium.percentage,
          stats.performanceByDifficulty.medium.total,
        ],
        [
          'Hard',
          stats.performanceByDifficulty.hard.percentage,
          stats.performanceByDifficulty.hard.total,
        ],
        [],
        ['Topic Performance'],
        ['Topic', 'Accuracy (%)', 'Total Questions', 'Mastery Level'],
        ...topics.map(topic => [
          topic.topic,
          topic.averageAccuracy,
          topic.totalQuestions,
          topic.masteryLevel,
        ]),
        [],
        ['Question Performance (Top 100)'],
        ['Question ID', 'Topic', 'Accuracy (%)', 'Attempts', 'Correct', 'Avg Time (s)'],
        ...questions.map(q => [
          q.questionId,
          q.topic || 'N/A',
          Math.round(q.accuracy),
          q.totalAttempts,
          q.correctAttempts,
          q.averageTimeSpent,
        ]),
        [],
        ['Common Mistakes'],
        ['Question ID', 'Topic', 'Incorrect Count'],
        ...mistakes.map(m => [m.questionId, m.topic || 'N/A', m.incorrectCount]),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(performanceData);

      // Apply styling
      this.applyHeaderStyle(worksheet, 'A1');
      this.applyHeaderStyle(worksheet, 'A3');
      this.applyHeaderStyle(worksheet, 'A13');
      this.applyHeaderStyle(worksheet, 'A19');
      const questionsRow = 19 + topics.length + 2;
      this.applyHeaderStyle(worksheet, `A${questionsRow}`);

      // Set column widths
      worksheet['!cols'] = [
        { wch: 35 },
        { wch: 20 },
        { wch: 18 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Performance');
    } catch (_error) {
      logger.error('Error creating performance sheet:', _error);
    }
  }

  /**
   * Add Goals sheet with goal predictions and milestones
   */
  private static async addGoalsSheet(workbook: XLSX.WorkBook, userId: string): Promise<void> {
    try {
      const goals = await GoalPredictionService.getUserGoals(userId);

      if (goals.length === 0) {
        const noGoalsData = [['Goal Tracking & Predictions'], [], ['No learning goals found']];
        const worksheet = XLSX.utils.aoa_to_sheet(noGoalsData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Goals');
        return;
      }

      const goalsData = [
        ['Goal Tracking & Predictions'],
        [],
        ['Goals Overview'],
        ['Goal Title', 'Status', 'Progress (%)', 'Target Date', 'Created Date'],
        ...goals.map(goal => [
          goal.title,
          goal.status,
          goal.currentProgress,
          format(new Date(goal.targetDate), 'yyyy-MM-dd'),
          format(new Date(goal.createdAt), 'yyyy-MM-dd'),
        ]),
        [],
      ];

      // Add predictions for each goal
      const _currentRow = goalsData.length;
      for (const goal of goals) {
        if (goal.status === 'completed') continue;

        const prediction = await GoalPredictionService.predictGoalCompletion(userId, goal.id);
        if (!prediction) continue;

        goalsData.push(
          [`Goal: ${goal.title}`],
          ['Prediction Metric', 'Value'],
          ['Current Progress (%)', prediction.currentProgress],
          ['Predicted Progress (%)', prediction.predictedProgress],
          ['Completion Probability (%)', prediction.completionProbability],
          [
            'Estimated Completion Date',
            format(new Date(prediction.estimatedCompletionDate), 'yyyy-MM-dd'),
          ],
          ['Days Remaining', prediction.daysRemaining],
          ['On Track', prediction.isOnTrack ? 'Yes' : 'No'],
          ['Risk Level', prediction.riskLevel],
          ['Recommended Daily Effort (min)', prediction.recommendedDailyEffort],
          ['Confidence Score', prediction.confidenceScore],
          []
        );

        // Add milestones
        const milestones = await GoalPredictionService.getGoalMilestones(userId, goal.id);
        if (milestones.length > 0) {
          goalsData.push(
            ['Milestones'],
            ['Milestone', 'Target Date', 'Completed', 'Progress', 'Past Due'],
            ...milestones.map(m => [
              m.title,
              format(new Date(m.targetDate), 'yyyy-MM-dd'),
              m.completed ? 'Yes' : 'No',
              m.progress,
              m.isPastDue ? 'Yes' : 'No',
            ]),
            []
          );
        }

        // Add recommendations
        const recommendations = await GoalPredictionService.getGoalRecommendations(userId, goal.id);
        if (recommendations.length > 0) {
          goalsData.push(
            ['Recommendations'],
            ['Priority', 'Title', 'Description'],
            ...recommendations.map(r => [r.priority, r.title, r.description]),
            []
          );
        }

        goalsData.push([], ['---'], []);
        // Row count tracked but not used in loop
      }

      const worksheet = XLSX.utils.aoa_to_sheet(goalsData);

      // Apply styling
      this.applyHeaderStyle(worksheet, 'A1');
      this.applyHeaderStyle(worksheet, 'A3');

      // Set column widths
      worksheet['!cols'] = [{ wch: 40 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Goals');
    } catch (_error) {
      logger.error('Error creating goals sheet:', _error);
    }
  }

  /**
   * Apply header styling to a cell
   */
  private static applyHeaderStyle(worksheet: XLSX.WorkSheet, cellRef: string): void {
    if (!worksheet[cellRef]) return;

    worksheet[cellRef].s = {
      font: {
        bold: true,
        sz: 14,
      },
      fill: {
        fgColor: { rgb: '8B5CF6' },
      },
      alignment: {
        horizontal: 'left',
        vertical: 'center',
      },
    };
  }

  /**
   * Export a single sheet as CSV
   */
  static async exportToCSV(
    data: unknown[][],
    fileName: string = `export-${format(new Date(), 'yyyy-MM-dd')}`
  ): Promise<void> {
    try {
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(worksheet);

      // Create blob and trigger download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}.csv`;
      link.click();

      logger.info('CSV exported successfully', { fileName });
    } catch (_error) {
      logger.error('Error exporting CSV:', _error);
      throw new Error('Failed to export CSV');
    }
  }

  /**
   * Export performance summary as CSV
   */
  static async exportPerformanceSummaryCSV(userId: string): Promise<void> {
    try {
      const stats = await PerformanceAnalyticsService.getDetailedPerformanceStats(userId);

      const csvData = [
        ['Performance Summary'],
        ['Generated on:', format(new Date(), 'yyyy-MM-dd HH:mm')],
        [],
        ['Metric', 'Value'],
        ['Overall Accuracy (%)', stats.overallAccuracy],
        ['Total Questions Attempted', stats.totalQuestionsAttempted],
        ['Total Correct', stats.totalCorrect],
        ['Total Incorrect', stats.totalIncorrect],
        ['Average Time per Question (s)', stats.averageTimePerQuestion],
        ['Improvement Rate (%)', stats.improvementRate],
        ['Consistency Score', stats.consistencyScore],
        [],
        ['Performance by Difficulty'],
        ['Difficulty', 'Accuracy (%)', 'Total'],
        [
          'Easy',
          stats.performanceByDifficulty.easy.percentage,
          stats.performanceByDifficulty.easy.total,
        ],
        [
          'Medium',
          stats.performanceByDifficulty.medium.percentage,
          stats.performanceByDifficulty.medium.total,
        ],
        [
          'Hard',
          stats.performanceByDifficulty.hard.percentage,
          stats.performanceByDifficulty.hard.total,
        ],
      ];

      await this.exportToCSV(csvData, `performance-summary-${format(new Date(), 'yyyy-MM-dd')}`);
    } catch (_error) {
      logger.error('Error exporting performance summary:', _error);
      throw error;
    }
  }

  /**
   * Export goals summary as CSV
   */
  static async exportGoalsSummaryCSV(userId: string): Promise<void> {
    try {
      const goals = await GoalPredictionService.getUserGoals(userId);

      const csvData = [
        ['Goals Summary'],
        ['Generated on:', format(new Date(), 'yyyy-MM-dd HH:mm')],
        [],
        ['Goal Title', 'Status', 'Progress (%)', 'Target Date', 'Created Date'],
        ...goals.map(goal => [
          goal.title,
          goal.status,
          goal.currentProgress,
          format(new Date(goal.targetDate), 'yyyy-MM-dd'),
          format(new Date(goal.createdAt), 'yyyy-MM-dd'),
        ]),
      ];

      await this.exportToCSV(csvData, `goals-summary-${format(new Date(), 'yyyy-MM-dd')}`);
    } catch (_error) {
      logger.error('Error exporting goals summary:', _error);
      throw error;
    }
  }
}
