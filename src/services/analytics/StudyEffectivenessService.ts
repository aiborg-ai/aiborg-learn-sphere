/**
 * Study Effectiveness Service
 *
 * Analyzes study patterns and effectiveness to provide actionable insights.
 * Tracks time-of-day performance, session length, and focus patterns.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import {
  StudySessionAnalytics,
  StudyPatternInsight,
  OptimalStudySchedule,
} from '../feedback-loop/FeedbackLoopTypes';

interface TimeOfDayAnalysis {
  optimalHours: number[];
  worstHours: number[];
  hourlyPerformance: { hour: number; accuracy: number; samples: number }[];
}

interface SessionLengthAnalysis {
  optimalDuration: number; // minutes
  fatiguePoint: number; // minutes
  performanceByDuration: { duration: string; accuracy: number; samples: number }[];
}

interface WeeklyPattern {
  bestDays: number[];
  worstDays: number[];
  dailyPerformance: { day: number; accuracy: number; samples: number }[];
}

export class StudyEffectivenessService {
  /**
   * Record a study session for analytics
   */
  async recordStudySession(
    session: Omit<StudySessionAnalytics, 'id' | 'createdAt'>
  ): Promise<void> {
    try {
      const { error } = await supabase.from('study_session_analytics').insert({
        user_id: session.userId,
        session_start: session.sessionStart.toISOString(),
        duration_minutes: session.durationMinutes,
        hour_of_day: session.hourOfDay,
        day_of_week: session.dayOfWeek,
        questions_attempted: session.questionsAttempted,
        questions_correct: session.questionsCorrect,
        ability_start: session.abilityStart,
        ability_end: session.abilityEnd,
        focus_score: session.focusScore,
        session_type: session.sessionType,
      });

      if (error) {
        logger.error('Failed to record study session:', error);
      }
    } catch (_error) {
      logger.error('Error recording study session:', _error);
    }
  }

  /**
   * Analyze time-of-day performance
   */
  async analyzeTimeOfDayPerformance(userId: string): Promise<TimeOfDayAnalysis | null> {
    try {
      const { data: sessions, error } = await supabase
        .from('study_session_analytics')
        .select('hour_of_day, questions_attempted, questions_correct')
        .eq('user_id', userId)
        .gt('questions_attempted', 0);

      if (error || !sessions || sessions.length < 10) {
        return null;
      }

      // Group by hour
      const hourlyData: Map<number, { total: number; correct: number; count: number }> = new Map();

      for (const session of sessions) {
        const hour = session.hour_of_day;
        const existing = hourlyData.get(hour) || { total: 0, correct: 0, count: 0 };
        existing.total += session.questions_attempted;
        existing.correct += session.questions_correct;
        existing.count++;
        hourlyData.set(hour, existing);
      }

      // Calculate accuracy by hour
      const hourlyPerformance = Array.from(hourlyData.entries())
        .map(([hour, data]) => ({
          hour,
          accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
          samples: data.count,
        }))
        .filter(h => h.samples >= 2) // Need at least 2 samples
        .sort((a, b) => b.accuracy - a.accuracy);

      // Find optimal and worst hours
      const optimalHours = hourlyPerformance
        .slice(0, 3)
        .map(h => h.hour)
        .sort((a, b) => a - b);

      const worstHours = hourlyPerformance
        .slice(-3)
        .map(h => h.hour)
        .sort((a, b) => a - b);

      return {
        optimalHours,
        worstHours,
        hourlyPerformance: hourlyPerformance.sort((a, b) => a.hour - b.hour),
      };
    } catch (_error) {
      logger.error('Error analyzing time-of-day performance:', _error);
      return null;
    }
  }

  /**
   * Analyze optimal session length
   */
  async analyzeOptimalSessionLength(userId: string): Promise<SessionLengthAnalysis | null> {
    try {
      const { data: sessions, error } = await supabase
        .from('study_session_analytics')
        .select('duration_minutes, questions_attempted, questions_correct, focus_score')
        .eq('user_id', userId)
        .gt('duration_minutes', 0)
        .gt('questions_attempted', 0);

      if (error || !sessions || sessions.length < 10) {
        return null;
      }

      // Group by duration buckets
      const buckets = [
        { label: '0-15 min', min: 0, max: 15 },
        { label: '15-30 min', min: 15, max: 30 },
        { label: '30-45 min', min: 30, max: 45 },
        { label: '45-60 min', min: 45, max: 60 },
        { label: '60-90 min', min: 60, max: 90 },
        { label: '90+ min', min: 90, max: Infinity },
      ];

      const bucketData: Map<
        string,
        { total: number; correct: number; count: number; focusSum: number }
      > = new Map();

      for (const session of sessions) {
        const bucket = buckets.find(
          b => session.duration_minutes >= b.min && session.duration_minutes < b.max
        );
        if (!bucket) continue;

        const existing = bucketData.get(bucket.label) || {
          total: 0,
          correct: 0,
          count: 0,
          focusSum: 0,
        };
        existing.total += session.questions_attempted;
        existing.correct += session.questions_correct;
        existing.count++;
        existing.focusSum += session.focus_score || 0;
        bucketData.set(bucket.label, existing);
      }

      // Calculate performance by duration
      const performanceByDuration = Array.from(bucketData.entries())
        .map(([duration, data]) => ({
          duration,
          accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
          samples: data.count,
          avgFocus: data.count > 0 ? data.focusSum / data.count : 0,
        }))
        .filter(p => p.samples >= 2);

      // Find optimal duration (highest accuracy with reasonable focus)
      const bestPerformance = performanceByDuration
        .filter(p => p.samples >= 3)
        .sort((a, b) => b.accuracy - a.accuracy)[0];

      // Find fatigue point (where accuracy starts dropping significantly)
      let fatiguePoint = 60; // default
      for (let i = 1; i < performanceByDuration.length; i++) {
        const current = performanceByDuration[i];
        const previous = performanceByDuration[i - 1];
        if (current.accuracy < previous.accuracy - 10 && current.samples >= 2) {
          const bucket = buckets.find(b => b.label === current.duration);
          if (bucket) {
            fatiguePoint = bucket.min;
            break;
          }
        }
      }

      // Map duration label to midpoint
      const durationMap: Record<string, number> = {
        '0-15 min': 10,
        '15-30 min': 22,
        '30-45 min': 37,
        '45-60 min': 52,
        '60-90 min': 75,
        '90+ min': 105,
      };

      return {
        optimalDuration: bestPerformance ? durationMap[bestPerformance.duration] || 30 : 30,
        fatiguePoint,
        performanceByDuration,
      };
    } catch (_error) {
      logger.error('Error analyzing session length:', _error);
      return null;
    }
  }

  /**
   * Analyze weekly patterns
   */
  async analyzeWeeklyPattern(userId: string): Promise<WeeklyPattern | null> {
    try {
      const { data: sessions, error } = await supabase
        .from('study_session_analytics')
        .select('day_of_week, questions_attempted, questions_correct')
        .eq('user_id', userId)
        .gt('questions_attempted', 0);

      if (error || !sessions || sessions.length < 14) {
        return null;
      }

      // Group by day
      const dailyData: Map<number, { total: number; correct: number; count: number }> = new Map();

      for (const session of sessions) {
        const day = session.day_of_week;
        const existing = dailyData.get(day) || { total: 0, correct: 0, count: 0 };
        existing.total += session.questions_attempted;
        existing.correct += session.questions_correct;
        existing.count++;
        dailyData.set(day, existing);
      }

      const dailyPerformance = Array.from(dailyData.entries())
        .map(([day, data]) => ({
          day,
          accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
          samples: data.count,
        }))
        .sort((a, b) => b.accuracy - a.accuracy);

      const bestDays = dailyPerformance.slice(0, 2).map(d => d.day);
      const worstDays = dailyPerformance.slice(-2).map(d => d.day);

      return {
        bestDays,
        worstDays,
        dailyPerformance: dailyPerformance.sort((a, b) => a.day - b.day),
      };
    } catch (_error) {
      logger.error('Error analyzing weekly pattern:', _error);
      return null;
    }
  }

  /**
   * Generate study pattern insights
   */
  async generateStudyInsights(userId: string): Promise<StudyPatternInsight[]> {
    const insights: StudyPatternInsight[] = [];

    try {
      // Time of day analysis
      const timeAnalysis = await this.analyzeTimeOfDayPerformance(userId);
      if (timeAnalysis && timeAnalysis.optimalHours.length > 0) {
        const optimalTimeStr = timeAnalysis.optimalHours.map(h => `${h}:00`).join(', ');

        insights.push({
          type: 'optimal_time',
          title: 'Best Study Times',
          description: `You perform best when studying around ${optimalTimeStr}.`,
          recommendation: `Schedule your most challenging material during these hours for optimal learning.`,
          confidence: Math.min(0.9, timeAnalysis.hourlyPerformance.length / 20),
          dataPoints: timeAnalysis.hourlyPerformance.reduce((sum, h) => sum + h.samples, 0),
          metadata: { optimalHours: timeAnalysis.optimalHours },
        });

        if (timeAnalysis.worstHours.length > 0) {
          const worstTimeStr = timeAnalysis.worstHours.map(h => `${h}:00`).join(', ');
          insights.push({
            type: 'optimal_time',
            title: 'Low Performance Hours',
            description: `Your performance tends to dip around ${worstTimeStr}.`,
            recommendation: 'Consider light review or breaks during these times.',
            confidence: Math.min(0.8, timeAnalysis.hourlyPerformance.length / 20),
            dataPoints: timeAnalysis.hourlyPerformance.reduce((sum, h) => sum + h.samples, 0),
            metadata: { worstHours: timeAnalysis.worstHours },
          });
        }
      }

      // Session length analysis
      const sessionAnalysis = await this.analyzeOptimalSessionLength(userId);
      if (sessionAnalysis) {
        insights.push({
          type: 'session_length',
          title: 'Optimal Session Duration',
          description: `Your best performance comes from ${sessionAnalysis.optimalDuration}-minute sessions.`,
          recommendation: `Try to keep study sessions around ${sessionAnalysis.optimalDuration} minutes with breaks in between.`,
          confidence: Math.min(0.85, sessionAnalysis.performanceByDuration.length / 5),
          dataPoints: sessionAnalysis.performanceByDuration.reduce((sum, p) => sum + p.samples, 0),
          metadata: { optimalDuration: sessionAnalysis.optimalDuration },
        });

        if (sessionAnalysis.fatiguePoint < 90) {
          insights.push({
            type: 'session_length',
            title: 'Fatigue Warning',
            description: `Your focus tends to decline after ${sessionAnalysis.fatiguePoint} minutes.`,
            recommendation: 'Take a 5-10 minute break before this point to maintain performance.',
            confidence: 0.75,
            dataPoints: sessionAnalysis.performanceByDuration.reduce(
              (sum, p) => sum + p.samples,
              0
            ),
            metadata: { fatiguePoint: sessionAnalysis.fatiguePoint },
          });
        }
      }

      // Weekly pattern
      const weeklyPattern = await this.analyzeWeeklyPattern(userId);
      if (weeklyPattern) {
        const dayNames = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ];
        const bestDayNames = weeklyPattern.bestDays.map(d => dayNames[d]).join(' and ');

        insights.push({
          type: 'topic_preference',
          title: 'Best Days for Learning',
          description: `You perform best on ${bestDayNames}.`,
          recommendation: 'Schedule important assessments or new material on these days.',
          confidence: Math.min(0.8, weeklyPattern.dailyPerformance.length / 7),
          dataPoints: weeklyPattern.dailyPerformance.reduce((sum, d) => sum + d.samples, 0),
          metadata: { bestDays: weeklyPattern.bestDays },
        });
      }
    } catch (_error) {
      logger.error('Error generating study insights:', _error);
    }

    return insights;
  }

  /**
   * Generate optimal weekly schedule
   */
  async generateOptimalSchedule(
    userId: string,
    weeklyMinutes: number = 300
  ): Promise<OptimalStudySchedule | null> {
    try {
      const [timeAnalysis, sessionAnalysis, weeklyPattern] = await Promise.all([
        this.analyzeTimeOfDayPerformance(userId),
        this.analyzeOptimalSessionLength(userId),
        this.analyzeWeeklyPattern(userId),
      ]);

      const optimalHours = timeAnalysis?.optimalHours || [9, 14, 19];
      const optimalDays = weeklyPattern?.bestDays || [1, 2, 3, 4, 5]; // Weekdays default
      const sessionLength = sessionAnalysis?.optimalDuration || 30;
      const breakFrequency = Math.min(sessionLength, sessionAnalysis?.fatiguePoint || 45);

      // Get recent topics from study sessions or enrollments
      const { data: recentSessions } = await supabase
        .from('study_session_analytics')
        .select('session_type')
        .eq('user_id', userId)
        .order('session_start', { ascending: false })
        .limit(10);

      const sessionTypes = [...new Set(recentSessions?.map(s => s.session_type) || [])];

      return {
        userId,
        weeklyMinutes,
        optimalHours,
        optimalDays,
        recommendedSessionLength: sessionLength,
        recommendedBreakFrequency: breakFrequency,
        topicRotationSuggestion:
          sessionTypes.length > 0 ? sessionTypes : ['course', 'quiz', 'flashcard'],
        generatedAt: new Date(),
      };
    } catch (_error) {
      logger.error('Error generating optimal schedule:', _error);
      return null;
    }
  }

  /**
   * Get study statistics summary
   */
  async getStudyStatsSummary(userId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: sessions, error } = await supabase
        .from('study_session_analytics')
        .select('*')
        .eq('user_id', userId)
        .gte('session_start', startDate.toISOString());

      if (error) {
        logger.error('Error fetching study stats:', error);
        return null;
      }

      if (!sessions || sessions.length === 0) {
        return {
          totalSessions: 0,
          totalMinutes: 0,
          totalQuestions: 0,
          overallAccuracy: 0,
          averageSessionLength: 0,
          averageFocusScore: 0,
          abilityGain: 0,
          studyStreak: 0,
        };
      }

      const totalSessions = sessions.length;
      const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      const totalQuestions = sessions.reduce((sum, s) => sum + (s.questions_attempted || 0), 0);
      const totalCorrect = sessions.reduce((sum, s) => sum + (s.questions_correct || 0), 0);
      const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
      const averageSessionLength = totalSessions > 0 ? totalMinutes / totalSessions : 0;
      const focusSum = sessions.reduce((sum, s) => sum + (s.focus_score || 0), 0);
      const averageFocusScore = totalSessions > 0 ? focusSum / totalSessions : 0;

      // Calculate ability gain
      const sortedByTime = [...sessions].sort(
        (a, b) => new Date(a.session_start).getTime() - new Date(b.session_start).getTime()
      );
      const firstAbility = sortedByTime[0]?.ability_start || 0;
      const lastAbility = sortedByTime[sortedByTime.length - 1]?.ability_end || 0;
      const abilityGain = lastAbility - firstAbility;

      // Calculate study streak
      const uniqueDays = new Set(
        sessions.map(s => new Date(s.session_start).toISOString().split('T')[0])
      );
      const studyStreak = this.calculateStreak(Array.from(uniqueDays).sort());

      return {
        totalSessions,
        totalMinutes,
        totalQuestions,
        overallAccuracy,
        averageSessionLength,
        averageFocusScore,
        abilityGain,
        studyStreak,
      };
    } catch (_error) {
      logger.error('Error getting study stats summary:', _error);
      return null;
    }
  }

  /**
   * Calculate consecutive study days streak
   */
  private calculateStreak(sortedDates: string[]): number {
    if (sortedDates.length === 0) return 0;

    let streak = 1;
    const today = new Date().toISOString().split('T')[0];

    // Check if most recent date is today or yesterday
    const lastStudyDate = sortedDates[sortedDates.length - 1];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastStudyDate !== today && lastStudyDate !== yesterdayStr) {
      return 0; // Streak broken
    }

    // Count consecutive days backwards
    for (let i = sortedDates.length - 1; i > 0; i--) {
      const currentDate = new Date(sortedDates[i]);
      const previousDate = new Date(sortedDates[i - 1]);
      const diffDays = Math.floor(
        (currentDate.getTime() - previousDate.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}

export const studyEffectivenessService = new StudyEffectivenessService();
