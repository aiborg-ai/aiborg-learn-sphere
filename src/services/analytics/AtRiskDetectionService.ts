/**
 * At-Risk Detection Service
 * Predictive analytics for identifying at-risk students and triggering interventions
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Risk level thresholds
export const RISK_THRESHOLDS = {
  LOW: 30,
  MODERATE: 50,
  HIGH: 70,
  CRITICAL: 85,
} as const;

// Risk levels
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

// Risk factor weights
export const RISK_FACTOR_WEIGHTS = {
  decliningScores: 0.25,
  missedSessions: 0.2,
  lowEngagement: 0.2,
  streakBreaks: 0.15,
  timeAway: 0.1,
  assessmentFailures: 0.1,
} as const;

// Risk factor interface
export interface RiskFactor {
  name: string;
  weight: number;
  value: number;
  rawValue: number | string;
  contribution: number;
  description: string;
}

// Risk factors data
export interface RiskFactors {
  decliningScores: RiskFactor;
  missedSessions: RiskFactor;
  lowEngagement: RiskFactor;
  streakBreaks: RiskFactor;
  timeAway: RiskFactor;
  assessmentFailures: RiskFactor;
}

// Risk score result
export interface RiskScore {
  userId: string;
  score: number;
  level: RiskLevel;
  factors: RiskFactors;
  topFactor: string;
  predictedOutcome: string;
  recommendedInterventions: string[];
  calculatedAt: Date;
  validUntil: Date;
}

// User activity data for risk calculation
interface UserActivityData {
  userId: string;
  recentScores: number[];
  averageScore: number;
  lastActivityDate: Date | null;
  sessionCount7Days: number;
  avgSessionDuration: number;
  expectedSessionDuration: number;
  currentStreak: number;
  previousStreak: number;
  streakLostAt: Date | null;
  consecutiveFailures: number;
  totalAssessments: number;
}

// Intervention template
export interface InterventionTemplate {
  id: string;
  name: string;
  interventionType: 'nudge' | 'instructor_alert' | 'email' | 'in_app';
  riskLevelTrigger: RiskLevel;
  recipientType: 'student' | 'instructor' | 'admin';
  subjectTemplate?: string;
  messageTemplate: string;
}

// Intervention event
export interface InterventionEvent {
  id: string;
  studentUserId: string;
  interventionType: string;
  triggerRiskScore: number;
  triggerFactors: RiskFactors;
  messageContent: string;
  recipientType: string;
  recipientId?: string;
  deliveredAt?: Date;
  openedAt?: Date;
  actedUponAt?: Date;
  outcome?: string;
  createdAt: Date;
}

/**
 * At-Risk Detection Service
 */
export class AtRiskDetectionService {
  /**
   * Calculate risk score for a user
   */
  static async calculateRiskScore(userId: string): Promise<RiskScore> {
    try {
      // Get user activity data
      const activityData = await this.getUserActivityData(userId);

      // Calculate individual factors
      const factors = this.calculateFactors(activityData);

      // Calculate overall score
      const score = this.calculateOverallScore(factors);

      // Determine risk level
      const level = this.determineRiskLevel(score);

      // Find top contributing factor
      const topFactor = this.findTopFactor(factors);

      // Predict outcome
      const predictedOutcome = this.predictOutcome(level, factors);

      // Get recommended interventions
      const recommendedInterventions = this.getRecommendedInterventions(level, factors);

      const now = new Date();
      const validUntil = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours

      const riskScore: RiskScore = {
        userId,
        score,
        level,
        factors,
        topFactor,
        predictedOutcome,
        recommendedInterventions,
        calculatedAt: now,
        validUntil,
      };

      // Save to database
      await this.saveRiskScore(riskScore);

      return riskScore;
    } catch (_error) {
      logger._error('Error calculating risk score:', _error);
      throw error;
    }
  }

  /**
   * Get current risk score for a user (from cache or calculate new)
   */
  static async getCurrentRiskScore(userId: string): Promise<RiskScore | null> {
    try {
      // Check for valid cached score
      const { data, error } = await supabase
        .from('student_risk_scores')
        .select('*')
        .eq('user_id', userId)
        .gt('valid_until', new Date().toISOString())
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        // No valid cached score, calculate new one
        return await this.calculateRiskScore(userId);
      }

      return this.mapDatabaseToRiskScore(data);
    } catch (_error) {
      logger._error('Error getting current risk score:', _error);
      return null;
    }
  }

  /**
   * Scan all active students for at-risk indicators
   */
  static async scanAllStudents(): Promise<RiskScore[]> {
    try {
      // Get all active students
      const { data: activeStudents, error } = await supabase
        .from('enrollments')
        .select('user_id')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique user IDs
      const userIds = [...new Set(activeStudents?.map(e => e.user_id) || [])];

      const riskScores: RiskScore[] = [];

      // Calculate risk scores in batches
      const batchSize = 10;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(userId =>
            this.calculateRiskScore(userId).catch(err => {
              logger.error(`Error calculating risk for user ${userId}:`, err);
              return null;
            })
          )
        );
        riskScores.push(...batchResults.filter((r): r is RiskScore => r !== null));
      }

      return riskScores;
    } catch (_error) {
      logger._error('Error scanning all students:', _error);
      return [];
    }
  }

  /**
   * Get at-risk students for an instructor
   */
  static async getAtRiskStudentsForInstructor(
    instructorId: string,
    minRiskLevel: RiskLevel = 'moderate'
  ): Promise<Array<RiskScore & { studentName: string; studentEmail: string; courseName: string }>> {
    try {
      const riskLevelValues: Record<RiskLevel, number> = {
        low: 1,
        moderate: 2,
        high: 3,
        critical: 4,
      };

      const minLevel = riskLevelValues[minRiskLevel];

      // Get instructor's courses
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('instructor_id', instructorId);

      if (coursesError) throw coursesError;

      const courseIds = courses?.map(c => c.id) || [];
      if (courseIds.length === 0) return [];

      // Get enrollments for these courses
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(
          `
          user_id,
          course_id,
          profiles:user_id (
            full_name,
            email
          )
        `
        )
        .in('course_id', courseIds)
        .eq('status', 'active');

      if (enrollError) throw enrollError;

      // Get risk scores for these students
      const { data: riskScores, error: riskError } = await supabase
        .from('student_risk_scores')
        .select('*')
        .in('user_id', enrollments?.map(e => e.user_id) || [])
        .gt('valid_until', new Date().toISOString())
        .order('risk_score', { ascending: false });

      if (riskError) throw riskError;

      // Combine data
      const results: Array<
        RiskScore & { studentName: string; studentEmail: string; courseName: string }
      > = [];

      for (const score of riskScores || []) {
        const level = score.risk_level as RiskLevel;
        if (riskLevelValues[level] >= minLevel) {
          const enrollment = enrollments?.find(e => e.user_id === score.user_id);
          const course = courses?.find(c => c.id === enrollment?.course_id);
          const profile = enrollment?.profiles as { full_name: string; email: string } | null;

          results.push({
            ...this.mapDatabaseToRiskScore(score),
            studentName: profile?.full_name || 'Unknown',
            studentEmail: profile?.email || '',
            courseName: course?.title || 'Unknown Course',
          });
        }
      }

      return results;
    } catch (_error) {
      logger._error('Error getting at-risk students for instructor:', _error);
      return [];
    }
  }

  /**
   * Trigger interventions based on risk level
   */
  static async triggerInterventions(riskScore: RiskScore): Promise<InterventionEvent[]> {
    try {
      const triggeredEvents: InterventionEvent[] = [];

      // Get applicable templates
      const templates = await this.getInterventionTemplates(riskScore.level);

      for (const template of templates) {
        // Check if intervention was already sent recently (avoid spam)
        const recentIntervention = await this.getRecentIntervention(
          riskScore.userId,
          template.interventionType,
          24 // hours
        );

        if (recentIntervention) {
          continue; // Skip - already sent within 24 hours
        }

        // Create intervention event
        const event = await this.createInterventionEvent(riskScore, template);
        if (event) {
          triggeredEvents.push(event);
        }
      }

      return triggeredEvents;
    } catch (_error) {
      logger._error('Error triggering interventions:', _error);
      return [];
    }
  }

  /**
   * Get intervention templates for a risk level
   */
  private static async getInterventionTemplates(
    riskLevel: RiskLevel
  ): Promise<InterventionTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('intervention_templates')
        .select('*')
        .eq('risk_level_trigger', riskLevel)
        .eq('is_active', true);

      if (error) throw error;

      return (data || []).map(t => ({
        id: t.id,
        name: t.name,
        interventionType: t.intervention_type as InterventionTemplate['interventionType'],
        riskLevelTrigger: t.risk_level_trigger as RiskLevel,
        recipientType: t.recipient_type as InterventionTemplate['recipientType'],
        subjectTemplate: t.subject_template || undefined,
        messageTemplate: t.message_template,
      }));
    } catch (_error) {
      logger._error('Error getting intervention templates:', _error);
      return [];
    }
  }

  /**
   * Get recent intervention of a type
   */
  private static async getRecentIntervention(
    userId: string,
    interventionType: string,
    hoursBack: number
  ): Promise<boolean> {
    try {
      const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('intervention_events')
        .select('id')
        .eq('student_user_id', userId)
        .eq('intervention_type', interventionType)
        .gte('created_at', cutoff.toISOString())
        .limit(1);

      if (error) throw error;

      return (data?.length || 0) > 0;
    } catch {
      return false;
    }
  }

  /**
   * Create an intervention event
   */
  private static async createInterventionEvent(
    riskScore: RiskScore,
    template: InterventionTemplate
  ): Promise<InterventionEvent | null> {
    try {
      // Get student profile for personalization
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', riskScore.userId)
        .single();

      // Personalize message
      const message = this.personalizeMessage(template.messageTemplate, {
        user_name: profile?.full_name || 'there',
        risk_level: riskScore.level,
        top_factor: riskScore.topFactor,
        risk_factors: JSON.stringify(riskScore.factors),
        suggestion: riskScore.recommendedInterventions[0] || 'Keep learning!',
        course_name: 'your course', // Would need course context
      });

      // Determine recipient
      let recipientId: string | undefined;
      if (template.recipientType === 'student') {
        recipientId = riskScore.userId;
      } else if (template.recipientType === 'instructor') {
        // Get course instructor
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('courses:course_id(instructor_id)')
          .eq('user_id', riskScore.userId)
          .eq('status', 'active')
          .limit(1)
          .single();

        const courses = enrollment?.courses as { instructor_id: string } | null;
        recipientId = courses?.instructor_id;
      }

      // Insert event
      const { data, error } = await supabase
        .from('intervention_events')
        .insert({
          student_user_id: riskScore.userId,
          intervention_type: template.interventionType,
          trigger_risk_score: riskScore.score,
          trigger_factors: riskScore.factors as unknown as Record<string, unknown>,
          message_template: template.name,
          message_content: message,
          recipient_type: template.recipientType,
          recipient_id: recipientId,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        studentUserId: data.student_user_id,
        interventionType: data.intervention_type,
        triggerRiskScore: data.trigger_risk_score,
        triggerFactors: data.trigger_factors as unknown as RiskFactors,
        messageContent: data.message_content,
        recipientType: data.recipient_type,
        recipientId: data.recipient_id || undefined,
        deliveredAt: data.delivered_at ? new Date(data.delivered_at) : undefined,
        openedAt: data.opened_at ? new Date(data.opened_at) : undefined,
        actedUponAt: data.acted_upon_at ? new Date(data.acted_upon_at) : undefined,
        outcome: data.outcome || undefined,
        createdAt: new Date(data.created_at),
      };
    } catch (_error) {
      logger._error('Error creating intervention event:', _error);
      return null;
    }
  }

  /**
   * Mark intervention as delivered
   */
  static async markInterventionDelivered(interventionId: string): Promise<void> {
    try {
      await supabase
        .from('intervention_events')
        .update({ delivered_at: new Date().toISOString() })
        .eq('id', interventionId);
    } catch (_error) {
      logger._error('Error marking intervention delivered:', _error);
    }
  }

  /**
   * Mark intervention as opened
   */
  static async markInterventionOpened(interventionId: string): Promise<void> {
    try {
      await supabase
        .from('intervention_events')
        .update({ opened_at: new Date().toISOString() })
        .eq('id', interventionId);
    } catch (_error) {
      logger._error('Error marking intervention opened:', _error);
    }
  }

  /**
   * Mark intervention outcome
   */
  static async markInterventionOutcome(
    interventionId: string,
    outcome: 'ignored' | 'acknowledged' | 'action_taken' | 'engagement_improved'
  ): Promise<void> {
    try {
      await supabase
        .from('intervention_events')
        .update({
          acted_upon_at: new Date().toISOString(),
          outcome,
        })
        .eq('id', interventionId);
    } catch (_error) {
      logger._error('Error marking intervention outcome:', _error);
    }
  }

  /**
   * Get user activity data for risk calculation
   */
  private static async getUserActivityData(userId: string): Promise<UserActivityData> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get recent assessment scores
    const { data: assessments } = await supabase
      .from('assessment_attempts')
      .select('score, created_at')
      .eq('user_id', userId)
      .gte('created_at', fourteenDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    const recentScores = assessments?.map(a => a.score || 0) || [];
    const averageScore =
      recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 0;

    // Get last activity date
    const { data: lastActivity } = await supabase
      .from('learning_sessions')
      .select('end_time')
      .eq('user_id', userId)
      .order('end_time', { ascending: false })
      .limit(1)
      .single();

    const lastActivityDate = lastActivity?.end_time ? new Date(lastActivity.end_time) : null;

    // Get session count in last 7 days
    const { count: sessionCount } = await supabase
      .from('learning_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString());

    // Get average session duration
    const { data: sessions } = await supabase
      .from('learning_sessions')
      .select('duration_minutes')
      .eq('user_id', userId)
      .gte('created_at', fourteenDaysAgo.toISOString());

    const avgSessionDuration = sessions?.length
      ? sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / sessions.length
      : 0;

    // Get streak info from gamification
    const { data: streakData } = await supabase
      .from('gamification_profiles')
      .select('current_streak, best_streak, last_activity_date')
      .eq('user_id', userId)
      .single();

    // Get consecutive failures
    const { data: recentAttempts } = await supabase
      .from('assessment_attempts')
      .select('score, passing_score')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    let consecutiveFailures = 0;
    for (const attempt of recentAttempts || []) {
      if ((attempt.score || 0) < (attempt.passing_score || 70)) {
        consecutiveFailures++;
      } else {
        break;
      }
    }

    return {
      userId,
      recentScores,
      averageScore,
      lastActivityDate,
      sessionCount7Days: sessionCount || 0,
      avgSessionDuration,
      expectedSessionDuration: 30, // Expected 30 minutes
      currentStreak: streakData?.current_streak || 0,
      previousStreak: streakData?.best_streak || 0,
      streakLostAt: streakData?.last_activity_date ? new Date(streakData.last_activity_date) : null,
      consecutiveFailures,
      totalAssessments: recentScores.length,
    };
  }

  /**
   * Calculate individual risk factors
   */
  private static calculateFactors(data: UserActivityData): RiskFactors {
    // 1. Declining Scores
    const decliningScores = this.calculateDecliningScoresFactor(data.recentScores);

    // 2. Missed Sessions
    const missedSessions = this.calculateMissedSessionsFactor(
      data.sessionCount7Days,
      data.lastActivityDate
    );

    // 3. Low Engagement
    const lowEngagement = this.calculateLowEngagementFactor(
      data.avgSessionDuration,
      data.expectedSessionDuration
    );

    // 4. Streak Breaks
    const streakBreaks = this.calculateStreakBreaksFactor(
      data.currentStreak,
      data.previousStreak,
      data.streakLostAt
    );

    // 5. Time Away
    const timeAway = this.calculateTimeAwayFactor(data.lastActivityDate);

    // 6. Assessment Failures
    const assessmentFailures = this.calculateAssessmentFailuresFactor(
      data.consecutiveFailures,
      data.totalAssessments
    );

    return {
      decliningScores,
      missedSessions,
      lowEngagement,
      streakBreaks,
      timeAway,
      assessmentFailures,
    };
  }

  /**
   * Calculate declining scores factor
   */
  private static calculateDecliningScoresFactor(scores: number[]): RiskFactor {
    let value = 0;
    let description = 'Scores are stable';

    if (scores.length >= 3) {
      // Compare first half to second half
      const mid = Math.floor(scores.length / 2);
      const recentAvg = scores.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
      const olderAvg = scores.slice(mid).reduce((a, b) => a + b, 0) / (scores.length - mid);

      const decline = olderAvg - recentAvg;
      if (decline > 15) {
        value = 1.0;
        description = `Scores dropped by ${decline.toFixed(0)}% recently`;
      } else if (decline > 10) {
        value = 0.7;
        description = `Scores declined by ${decline.toFixed(0)}%`;
      } else if (decline > 5) {
        value = 0.4;
        description = 'Slight score decline detected';
      }
    }

    const contribution = value * RISK_FACTOR_WEIGHTS.decliningScores * 100;

    return {
      name: 'Declining Scores',
      weight: RISK_FACTOR_WEIGHTS.decliningScores,
      value,
      rawValue: scores.length > 0 ? scores[0] : 'N/A',
      contribution,
      description,
    };
  }

  /**
   * Calculate missed sessions factor
   */
  private static calculateMissedSessionsFactor(
    sessionCount: number,
    lastActivity: Date | null
  ): RiskFactor {
    let value = 0;
    let description = 'Regular session attendance';

    // Expected: at least 3 sessions per week
    const expectedSessions = 3;
    const sessionDeficit = expectedSessions - sessionCount;

    if (sessionDeficit >= 3) {
      value = 1.0;
      description = 'No sessions in the past week';
    } else if (sessionDeficit >= 2) {
      value = 0.7;
      description = 'Only 1 session this week';
    } else if (sessionDeficit >= 1) {
      value = 0.4;
      description = 'Fewer sessions than usual';
    }

    const contribution = value * RISK_FACTOR_WEIGHTS.missedSessions * 100;

    return {
      name: 'Missed Sessions',
      weight: RISK_FACTOR_WEIGHTS.missedSessions,
      value,
      rawValue: `${sessionCount} sessions`,
      contribution,
      description,
    };
  }

  /**
   * Calculate low engagement factor
   */
  private static calculateLowEngagementFactor(
    avgDuration: number,
    expectedDuration: number
  ): RiskFactor {
    let value = 0;
    let description = 'Good engagement levels';

    const engagementRatio = avgDuration / expectedDuration;

    if (engagementRatio < 0.25) {
      value = 1.0;
      description = 'Very low engagement time';
    } else if (engagementRatio < 0.5) {
      value = 0.7;
      description = 'Below expected engagement';
    } else if (engagementRatio < 0.75) {
      value = 0.4;
      description = 'Slightly lower engagement';
    }

    const contribution = value * RISK_FACTOR_WEIGHTS.lowEngagement * 100;

    return {
      name: 'Low Engagement',
      weight: RISK_FACTOR_WEIGHTS.lowEngagement,
      value,
      rawValue: `${avgDuration.toFixed(0)} min avg`,
      contribution,
      description,
    };
  }

  /**
   * Calculate streak breaks factor
   */
  private static calculateStreakBreaksFactor(
    currentStreak: number,
    previousStreak: number,
    streakLostAt: Date | null
  ): RiskFactor {
    let value = 0;
    let description = 'Streak maintained';

    if (previousStreak > 7 && currentStreak === 0 && streakLostAt) {
      const daysSinceLost = Math.floor(
        (Date.now() - streakLostAt.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (daysSinceLost <= 3) {
        value = 1.0;
        description = `Lost ${previousStreak}-day streak ${daysSinceLost} days ago`;
      } else if (daysSinceLost <= 7) {
        value = 0.6;
        description = 'Streak lost recently';
      }
    } else if (previousStreak > 3 && currentStreak === 0) {
      value = 0.4;
      description = 'Short streak broken';
    }

    const contribution = value * RISK_FACTOR_WEIGHTS.streakBreaks * 100;

    return {
      name: 'Streak Breaks',
      weight: RISK_FACTOR_WEIGHTS.streakBreaks,
      value,
      rawValue: `${currentStreak} days (was ${previousStreak})`,
      contribution,
      description,
    };
  }

  /**
   * Calculate time away factor
   */
  private static calculateTimeAwayFactor(lastActivity: Date | null): RiskFactor {
    let value = 0;
    let description = 'Recently active';
    let daysAway = 0;

    if (lastActivity) {
      daysAway = Math.floor((Date.now() - lastActivity.getTime()) / (24 * 60 * 60 * 1000));

      if (daysAway >= 14) {
        value = 1.0;
        description = `Inactive for ${daysAway} days`;
      } else if (daysAway >= 7) {
        value = 0.7;
        description = 'Inactive for over a week';
      } else if (daysAway >= 3) {
        value = 0.4;
        description = `${daysAway} days since last activity`;
      }
    } else {
      value = 0.8;
      description = 'No activity recorded';
    }

    const contribution = value * RISK_FACTOR_WEIGHTS.timeAway * 100;

    return {
      name: 'Time Away',
      weight: RISK_FACTOR_WEIGHTS.timeAway,
      value,
      rawValue: `${daysAway} days`,
      contribution,
      description,
    };
  }

  /**
   * Calculate assessment failures factor
   */
  private static calculateAssessmentFailuresFactor(
    consecutiveFailures: number,
    totalAssessments: number
  ): RiskFactor {
    let value = 0;
    let description = 'Assessment performance OK';

    if (consecutiveFailures >= 4) {
      value = 1.0;
      description = `${consecutiveFailures} consecutive failed assessments`;
    } else if (consecutiveFailures >= 3) {
      value = 0.7;
      description = '3 consecutive failures';
    } else if (consecutiveFailures >= 2) {
      value = 0.4;
      description = '2 consecutive failures';
    }

    const contribution = value * RISK_FACTOR_WEIGHTS.assessmentFailures * 100;

    return {
      name: 'Assessment Failures',
      weight: RISK_FACTOR_WEIGHTS.assessmentFailures,
      value,
      rawValue: `${consecutiveFailures} failures`,
      contribution,
      description,
    };
  }

  /**
   * Calculate overall risk score
   */
  private static calculateOverallScore(factors: RiskFactors): number {
    let score = 0;

    for (const [key, factor] of Object.entries(factors)) {
      const weight = RISK_FACTOR_WEIGHTS[key as keyof typeof RISK_FACTOR_WEIGHTS];
      score += factor.value * weight * 100;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Determine risk level from score
   */
  private static determineRiskLevel(score: number): RiskLevel {
    if (score >= RISK_THRESHOLDS.CRITICAL) return 'critical';
    if (score >= RISK_THRESHOLDS.HIGH) return 'high';
    if (score >= RISK_THRESHOLDS.MODERATE) return 'moderate';
    return 'low';
  }

  /**
   * Find the top contributing factor
   */
  private static findTopFactor(factors: RiskFactors): string {
    let topFactor = 'Unknown';
    let maxContribution = 0;

    for (const [, factor] of Object.entries(factors)) {
      if (factor.contribution > maxContribution) {
        maxContribution = factor.contribution;
        topFactor = factor.name;
      }
    }

    return topFactor;
  }

  /**
   * Predict outcome based on risk level and factors
   */
  private static predictOutcome(level: RiskLevel, factors: RiskFactors): string {
    if (level === 'critical') {
      return 'High likelihood of dropout without intervention';
    }
    if (level === 'high') {
      if (factors.decliningScores.value > 0.7) {
        return 'May fail upcoming assessments';
      }
      if (factors.timeAway.value > 0.7) {
        return 'At risk of disengagement';
      }
      return 'Needs attention to stay on track';
    }
    if (level === 'moderate') {
      return 'Minor concerns - monitoring recommended';
    }
    return 'On track for successful completion';
  }

  /**
   * Get recommended interventions based on risk level and factors
   */
  private static getRecommendedInterventions(level: RiskLevel, factors: RiskFactors): string[] {
    const interventions: string[] = [];

    // Always add level-appropriate base intervention
    if (level === 'critical') {
      interventions.push('Immediate instructor outreach');
      interventions.push('Consider one-on-one support session');
    } else if (level === 'high') {
      interventions.push('Send personalized encouragement message');
    } else if (level === 'moderate') {
      interventions.push('In-app nudge with study suggestions');
    }

    // Add factor-specific interventions
    if (factors.decliningScores.value > 0.5) {
      interventions.push('Recommend review of struggling topics');
      interventions.push('Suggest easier practice questions');
    }

    if (factors.missedSessions.value > 0.5) {
      interventions.push('Send session reminder notifications');
    }

    if (factors.lowEngagement.value > 0.5) {
      interventions.push('Suggest shorter, more focused study sessions');
    }

    if (factors.streakBreaks.value > 0.5) {
      interventions.push('Motivate with streak recovery challenge');
    }

    if (factors.timeAway.value > 0.5) {
      interventions.push('Send "we miss you" re-engagement email');
    }

    if (factors.assessmentFailures.value > 0.5) {
      interventions.push('Provide additional study resources');
      interventions.push('Consider adaptive difficulty adjustment');
    }

    return interventions.slice(0, 5); // Max 5 interventions
  }

  /**
   * Save risk score to database
   */
  private static async saveRiskScore(riskScore: RiskScore): Promise<void> {
    try {
      await supabase.from('student_risk_scores').insert({
        user_id: riskScore.userId,
        risk_score: riskScore.score,
        risk_level: riskScore.level,
        risk_factors: riskScore.factors as unknown as Record<string, unknown>,
        predicted_outcome: riskScore.predictedOutcome,
        recommended_interventions: riskScore.recommendedInterventions,
        calculated_at: riskScore.calculatedAt.toISOString(),
        valid_until: riskScore.validUntil.toISOString(),
      });
    } catch (_error) {
      logger._error('Error saving risk score:', _error);
    }
  }

  /**
   * Map database record to RiskScore
   */
  private static mapDatabaseToRiskScore(data: Record<string, unknown>): RiskScore {
    return {
      userId: data.user_id as string,
      score: data.risk_score as number,
      level: data.risk_level as RiskLevel,
      factors: data.risk_factors as unknown as RiskFactors,
      topFactor: this.findTopFactor(data.risk_factors as unknown as RiskFactors),
      predictedOutcome: (data.predicted_outcome as string) || '',
      recommendedInterventions: (data.recommended_interventions as string[]) || [],
      calculatedAt: new Date(data.calculated_at as string),
      validUntil: new Date(data.valid_until as string),
    };
  }

  /**
   * Personalize message template
   */
  private static personalizeMessage(template: string, variables: Record<string, string>): string {
    let message = template;
    for (const [key, value] of Object.entries(variables)) {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return message;
  }

  /**
   * Get risk score history for a user
   */
  static async getRiskScoreHistory(
    userId: string,
    limit: number = 10
  ): Promise<Array<{ score: number; level: RiskLevel; calculatedAt: Date }>> {
    try {
      const { data, error } = await supabase
        .from('student_risk_scores')
        .select('risk_score, risk_level, calculated_at')
        .eq('user_id', userId)
        .order('calculated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(d => ({
        score: d.risk_score,
        level: d.risk_level as RiskLevel,
        calculatedAt: new Date(d.calculated_at),
      }));
    } catch (_error) {
      logger._error('Error getting risk score history:', _error);
      return [];
    }
  }

  /**
   * Get intervention history for a user
   */
  static async getInterventionHistory(
    userId: string,
    limit: number = 20
  ): Promise<InterventionEvent[]> {
    try {
      const { data, error } = await supabase
        .from('intervention_events')
        .select('*')
        .eq('student_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(d => ({
        id: d.id,
        studentUserId: d.student_user_id,
        interventionType: d.intervention_type,
        triggerRiskScore: d.trigger_risk_score,
        triggerFactors: d.trigger_factors as unknown as RiskFactors,
        messageContent: d.message_content,
        recipientType: d.recipient_type,
        recipientId: d.recipient_id || undefined,
        deliveredAt: d.delivered_at ? new Date(d.delivered_at) : undefined,
        openedAt: d.opened_at ? new Date(d.opened_at) : undefined,
        actedUponAt: d.acted_upon_at ? new Date(d.acted_upon_at) : undefined,
        outcome: d.outcome || undefined,
        createdAt: new Date(d.created_at),
      }));
    } catch (_error) {
      logger._error('Error getting intervention history:', _error);
      return [];
    }
  }
}
