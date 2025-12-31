/**
 * Performance Analytics Service
 * Provides granular performance analytics for quizzes and assessments
 * Includes question-level analysis, difficulty tracking, and learning curves
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface QuestionPerformance {
  questionId: string;
  questionText?: string;
  topic?: string;
  difficulty?: number; // IRT difficulty parameter
  discrimination?: number; // IRT discrimination parameter
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number; // percentage
  averageTimeSpent: number; // seconds
  lastAttemptDate?: string;
}

export interface TopicPerformance {
  topic: string;
  totalQuestions: number;
  averageAccuracy: number;
  averageDifficulty: number;
  masteryLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  weakAreas: string[];
  strongAreas: string[];
}

export interface LearningCurveData {
  attemptNumber: number;
  date: string;
  accuracy: number;
  averageScore: number;
  questionsAttempted: number;
}

export interface CommonMistake {
  questionId: string;
  questionText?: string;
  topic?: string;
  incorrectCount: number;
  commonWrongAnswer?: string;
  correctAnswer?: string;
  explanation?: string;
}

export interface PerformanceBreakdown {
  easy: { correct: number; total: number; percentage: number };
  medium: { correct: number; total: number; percentage: number };
  hard: { correct: number; total: number; percentage: number };
}

export interface DetailedPerformanceStats {
  overallAccuracy: number;
  totalQuestionsAttempted: number;
  totalCorrect: number;
  totalIncorrect: number;
  averageTimePerQuestion: number; // seconds
  performanceByDifficulty: PerformanceBreakdown;
  improvementRate: number; // percentage change over time
  consistencyScore: number; // 0-100, based on variance in performance
}

export class PerformanceAnalyticsService {
  /**
   * Get question-level performance for a user
   */
  static async getQuestionLevelPerformance(
    userId: string,
    limit: number = 50
  ): Promise<QuestionPerformance[]> {
    try {
      const { data, error } = await supabase
        .from('assessment_answer_performance')
        .select(
          `
          question_id,
          is_correct,
          time_spent,
          created_at,
          quiz_questions (
            question_text,
            topic,
            irt_difficulty,
            irt_discrimination
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1000); // Get more data for aggregation

      if (error) {
        logger.error('Error fetching question performance:', error);
        return [];
      }

      // Aggregate by question
      const performanceMap = new Map<
        string,
        {
          questionText?: string;
          topic?: string;
          difficulty?: number;
          discrimination?: number;
          attempts: { correct: boolean; timeSpent: number; date: string }[];
        }
      >();

      interface AnswerPerformanceItem {
        question_id: string;
        is_correct: boolean;
        time_spent: number | null;
        created_at: string;
        quiz_questions?: {
          question_text?: string;
          topic?: string;
          irt_difficulty?: number;
          irt_discrimination?: number;
        } | null;
      }

      data?.forEach((item: AnswerPerformanceItem) => {
        const qid = item.question_id;
        if (!performanceMap.has(qid)) {
          performanceMap.set(qid, {
            questionText: item.quiz_questions?.question_text,
            topic: item.quiz_questions?.topic,
            difficulty: item.quiz_questions?.irt_difficulty,
            discrimination: item.quiz_questions?.irt_discrimination,
            attempts: [],
          });
        }
        performanceMap.get(qid)!.attempts.push({
          correct: item.is_correct,
          timeSpent: item.time_spent || 0,
          date: item.created_at,
        });
      });

      // Convert to array and calculate metrics
      const performance: QuestionPerformance[] = Array.from(performanceMap.entries()).map(
        ([questionId, data]) => {
          const totalAttempts = data.attempts.length;
          const correctAttempts = data.attempts.filter(a => a.correct).length;
          const totalTime = data.attempts.reduce((sum, a) => sum + a.timeSpent, 0);

          return {
            questionId,
            questionText: data.questionText,
            topic: data.topic,
            difficulty: data.difficulty,
            discrimination: data.discrimination,
            totalAttempts,
            correctAttempts,
            accuracy: totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0,
            averageTimeSpent: totalAttempts > 0 ? totalTime / totalAttempts : 0,
            lastAttemptDate: data.attempts[0]?.date,
          };
        }
      );

      // Sort by most recent attempts and limit
      return performance
        .sort((a, b) => {
          const dateA = a.lastAttemptDate ? new Date(a.lastAttemptDate).getTime() : 0;
          const dateB = b.lastAttemptDate ? new Date(b.lastAttemptDate).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, limit);
    } catch (_error) {
      logger._error('Error in getQuestionLevelPerformance:', _error);
      return [];
    }
  }

  /**
   * Get performance breakdown by topic
   */
  static async getTopicPerformance(userId: string): Promise<TopicPerformance[]> {
    try {
      const questions = await this.getQuestionLevelPerformance(userId, 500);

      // Group by topic
      const topicMap = new Map<string, QuestionPerformance[]>();
      questions.forEach(q => {
        const topic = q.topic || 'General';
        if (!topicMap.has(topic)) {
          topicMap.set(topic, []);
        }
        topicMap.get(topic)!.push(q);
      });

      // Calculate topic metrics
      const topicPerformance: TopicPerformance[] = Array.from(topicMap.entries()).map(
        ([topic, questions]) => {
          const totalQuestions = questions.length;
          const averageAccuracy =
            questions.reduce((sum, q) => sum + q.accuracy, 0) / totalQuestions;
          const averageDifficulty =
            questions.reduce((sum, q) => sum + (q.difficulty || 0), 0) / totalQuestions;

          // Determine mastery level
          let masteryLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
          if (averageAccuracy >= 90) masteryLevel = 'expert';
          else if (averageAccuracy >= 75) masteryLevel = 'advanced';
          else if (averageAccuracy >= 60) masteryLevel = 'intermediate';
          else masteryLevel = 'beginner';

          // Identify weak and strong areas (sub-topics)
          const weakAreas = questions
            .filter(q => q.accuracy < 50)
            .map(q => q.questionText || 'Unknown')
            .slice(0, 3);

          const strongAreas = questions
            .filter(q => q.accuracy >= 90)
            .map(q => q.questionText || 'Unknown')
            .slice(0, 3);

          return {
            topic,
            totalQuestions,
            averageAccuracy: Math.round(averageAccuracy),
            averageDifficulty: Math.round(averageDifficulty * 100) / 100,
            masteryLevel,
            weakAreas,
            strongAreas,
          };
        }
      );

      return topicPerformance.sort((a, b) => b.averageAccuracy - a.averageAccuracy);
    } catch (_error) {
      logger._error('Error in getTopicPerformance:', _error);
      return [];
    }
  }

  /**
   * Get learning curve data showing improvement over time
   */
  static async getLearningCurve(
    userId: string,
    topicFilter?: string
  ): Promise<LearningCurveData[]> {
    try {
      const query = supabase
        .from('assessment_answer_performance')
        .select(
          `
          is_correct,
          created_at,
          quiz_questions (
            topic
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching learning curve data:', error);
        return [];
      }

      // Filter by topic if specified
      interface LearningCurveItem {
        is_correct: boolean;
        created_at: string;
        quiz_questions?: {
          topic?: string;
        } | null;
      }

      let filteredData: LearningCurveItem[] = (data as LearningCurveItem[]) || [];
      if (topicFilter) {
        filteredData = filteredData.filter(item => item.quiz_questions?.topic === topicFilter);
      }

      // Group by day and calculate metrics
      const dailyPerformance = new Map<
        string,
        { correct: number; total: number; dates: string[] }
      >();

      filteredData.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        if (!dailyPerformance.has(date)) {
          dailyPerformance.set(date, { correct: 0, total: 0, dates: [] });
        }
        const day = dailyPerformance.get(date)!;
        day.total++;
        if (item.is_correct) day.correct++;
        day.dates.push(item.created_at);
      });

      // Convert to learning curve data
      let attemptNumber = 0;
      const curve: LearningCurveData[] = Array.from(dailyPerformance.entries())
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, data]) => {
          attemptNumber += data.total;
          const accuracy = (data.correct / data.total) * 100;

          return {
            attemptNumber,
            date,
            accuracy: Math.round(accuracy),
            averageScore: Math.round(accuracy),
            questionsAttempted: data.total,
          };
        });

      return curve;
    } catch (_error) {
      logger._error('Error in getLearningCurve:', _error);
      return [];
    }
  }

  /**
   * Get common mistakes - questions frequently answered incorrectly
   */
  static async getCommonMistakes(userId: string, limit: number = 10): Promise<CommonMistake[]> {
    try {
      const questions = await this.getQuestionLevelPerformance(userId, 200);

      // Filter for questions with low accuracy and multiple attempts
      const mistakes: CommonMistake[] = questions
        .filter(q => q.accuracy < 60 && q.totalAttempts >= 2)
        .map(q => ({
          questionId: q.questionId,
          questionText: q.questionText,
          topic: q.topic,
          incorrectCount: q.totalAttempts - q.correctAttempts,
          // In production, would fetch actual wrong answers from database
          commonWrongAnswer: undefined,
          correctAnswer: undefined,
          explanation: undefined,
        }))
        .sort((a, b) => b.incorrectCount - a.incorrectCount)
        .slice(0, limit);

      return mistakes;
    } catch (_error) {
      logger._error('Error in getCommonMistakes:', _error);
      return [];
    }
  }

  /**
   * Get detailed performance statistics
   */
  static async getDetailedPerformanceStats(userId: string): Promise<DetailedPerformanceStats> {
    try {
      const questions = await this.getQuestionLevelPerformance(userId, 500);

      if (questions.length === 0) {
        return {
          overallAccuracy: 0,
          totalQuestionsAttempted: 0,
          totalCorrect: 0,
          totalIncorrect: 0,
          averageTimePerQuestion: 0,
          performanceByDifficulty: {
            easy: { correct: 0, total: 0, percentage: 0 },
            medium: { correct: 0, total: 0, percentage: 0 },
            hard: { correct: 0, total: 0, percentage: 0 },
          },
          improvementRate: 0,
          consistencyScore: 0,
        };
      }

      // Calculate overall stats
      const totalAttempts = questions.reduce((sum, q) => sum + q.totalAttempts, 0);
      const totalCorrect = questions.reduce((sum, q) => sum + q.correctAttempts, 0);
      const totalIncorrect = totalAttempts - totalCorrect;
      const overallAccuracy = (totalCorrect / totalAttempts) * 100;
      const averageTimePerQuestion =
        questions.reduce((sum, q) => sum + q.averageTimeSpent, 0) / questions.length;

      // Performance by difficulty (using IRT difficulty)
      const easy = questions.filter(q => (q.difficulty || 0) < 0.3);
      const medium = questions.filter(q => (q.difficulty || 0) >= 0.3 && (q.difficulty || 0) < 0.7);
      const hard = questions.filter(q => (q.difficulty || 0) >= 0.7);

      const calcDifficultyStats = (qs: QuestionPerformance[]) => {
        const total = qs.reduce((sum, q) => sum + q.totalAttempts, 0);
        const correct = qs.reduce((sum, q) => sum + q.correctAttempts, 0);
        return {
          correct,
          total,
          percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
        };
      };

      // Calculate improvement rate (compare first 25% to last 25% of attempts)
      const learningCurve = await this.getLearningCurve(userId);
      let improvementRate = 0;
      if (learningCurve.length >= 4) {
        const firstQuarter = learningCurve.slice(0, Math.ceil(learningCurve.length / 4));
        const lastQuarter = learningCurve.slice(-Math.ceil(learningCurve.length / 4));
        const firstAvg = firstQuarter.reduce((sum, d) => sum + d.accuracy, 0) / firstQuarter.length;
        const lastAvg = lastQuarter.reduce((sum, d) => sum + d.accuracy, 0) / lastQuarter.length;
        improvementRate = lastAvg - firstAvg;
      }

      // Calculate consistency score (inverse of variance)
      const accuracies = questions.map(q => q.accuracy);
      const mean = accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length;
      const variance =
        accuracies.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / accuracies.length;
      const stdDev = Math.sqrt(variance);
      const consistencyScore = Math.max(0, Math.min(100, 100 - stdDev));

      return {
        overallAccuracy: Math.round(overallAccuracy),
        totalQuestionsAttempted: questions.length,
        totalCorrect,
        totalIncorrect,
        averageTimePerQuestion: Math.round(averageTimePerQuestion),
        performanceByDifficulty: {
          easy: calcDifficultyStats(easy),
          medium: calcDifficultyStats(medium),
          hard: calcDifficultyStats(hard),
        },
        improvementRate: Math.round(improvementRate),
        consistencyScore: Math.round(consistencyScore),
      };
    } catch (_error) {
      logger._error('Error in getDetailedPerformanceStats:', _error);
      return {
        overallAccuracy: 0,
        totalQuestionsAttempted: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        averageTimePerQuestion: 0,
        performanceByDifficulty: {
          easy: { correct: 0, total: 0, percentage: 0 },
          medium: { correct: 0, total: 0, percentage: 0 },
          hard: { correct: 0, total: 0, percentage: 0 },
        },
        improvementRate: 0,
        consistencyScore: 0,
      };
    }
  }
}
