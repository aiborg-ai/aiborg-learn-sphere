// Deno Edge Function: Generate Learner Predictions
// Generates ML-based predictions for learner success, engagement, and risk

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

interface PredictionRequest {
  user_id?: string; // Specific user or all users
  course_id?: string; // Specific course or all courses
  prediction_types?: string[]; // ['completion', 'engagement', 'at_risk', 'skills_gap']
}

interface UserFeatures {
  user_id: string;
  course_id: string | null;
  days_since_last_activity: number;
  total_time_spent_minutes: number;
  avg_session_duration_minutes: number;
  sessions_count: number;
  active_days_count: number;
  active_days_last_7d: number;
  active_days_last_30d: number;
  progress_percentage: number;
  progress_velocity: number;
  modules_completed: number;
  modules_total: number;
  avg_assessment_score: number;
  assessment_trend: string;
  assignments_submitted: number;
  assignments_on_time: number;
  assignments_late: number;
  assignments_overdue: number;
  login_streak_days: number;
  longest_inactive_period_days: number;
  engagement_momentum: number;
  performance_consistency: number;
  learning_efficiency: number;
}

// Simple ML prediction algorithms (can be replaced with TensorFlow.js or external ML API)
class PredictionEngine {
  // Calculate engagement prediction using weighted features
  static predictEngagement(features: UserFeatures): {
    current: number;
    predicted_7d: number;
    predicted_30d: number;
    trend: string;
  } {
    const current = this.calculateCurrentEngagement(features);

    // Momentum-based prediction
    const momentum = features.engagement_momentum || 0;
    const predicted_7d = Math.max(0, Math.min(100, current + momentum * 7));
    const predicted_30d = Math.max(0, Math.min(100, current + momentum * 30));

    const trend =
      momentum > 5
        ? 'increasing'
        : momentum < -5
          ? 'declining'
          : Math.abs(momentum) > 1
            ? 'stable'
            : 'critical';

    return { current, predicted_7d, predicted_30d, trend };
  }

  // Calculate current engagement score (0-100)
  private static calculateCurrentEngagement(features: UserFeatures): number {
    let score = 0;

    // Recent activity (40% weight)
    if (features.days_since_last_activity === 0) score += 40;
    else if (features.days_since_last_activity === 1) score += 35;
    else if (features.days_since_last_activity <= 3) score += 25;
    else if (features.days_since_last_activity <= 7) score += 15;
    else if (features.days_since_last_activity <= 14) score += 5;

    // Progress velocity (30% weight)
    const velocityScore = Math.min(30, features.progress_velocity * 10);
    score += velocityScore;

    // Session frequency (20% weight)
    const sessionFrequency = features.active_days_last_7d / 7;
    score += sessionFrequency * 20;

    // Streak bonus (10% weight)
    const streakScore = Math.min(10, features.login_streak_days * 2);
    score += streakScore;

    return Math.round(Math.min(100, score));
  }

  // Calculate at-risk score (0-100, higher = more at risk)
  static calculateRiskScore(features: UserFeatures): {
    risk_score: number;
    risk_level: string;
    risk_factors: string[];
    dropout_probability: number;
  } {
    const risk_factors: string[] = [];
    let risk_score = 0;

    // Inactivity (25% weight)
    if (features.days_since_last_activity > 14) {
      risk_score += 25;
      risk_factors.push('inactive_14d');
    } else if (features.days_since_last_activity > 7) {
      risk_score += 15;
      risk_factors.push('inactive_7d');
    } else if (features.days_since_last_activity > 3) {
      risk_score += 8;
      risk_factors.push('low_recent_activity');
    }

    // Low progress (25% weight)
    if (features.progress_percentage < 20) {
      risk_score += 25;
      risk_factors.push('very_low_progress');
    } else if (features.progress_percentage < 40) {
      risk_score += 15;
      risk_factors.push('low_progress');
    }

    // Poor performance (20% weight)
    if (features.avg_assessment_score < 50) {
      risk_score += 20;
      risk_factors.push('poor_performance');
    } else if (features.avg_assessment_score < 70) {
      risk_score += 10;
      risk_factors.push('below_average_performance');
    }

    // Assignment issues (15% weight)
    const assignment_completion =
      features.assignments_submitted /
      (features.assignments_submitted + features.assignments_overdue + features.assignments_late ||
        1);
    if (assignment_completion < 0.5) {
      risk_score += 15;
      risk_factors.push('low_assignment_completion');
    } else if (assignment_completion < 0.7) {
      risk_score += 8;
      risk_factors.push('moderate_assignment_issues');
    }

    // Declining engagement (15% weight)
    if (features.engagement_momentum < -5) {
      risk_score += 15;
      risk_factors.push('declining_engagement');
    } else if (features.engagement_momentum < 0) {
      risk_score += 8;
      risk_factors.push('stagnant_engagement');
    }

    risk_score = Math.min(100, risk_score);

    const risk_level =
      risk_score >= 75
        ? 'critical'
        : risk_score >= 50
          ? 'high'
          : risk_score >= 25
            ? 'medium'
            : 'low';

    // Simple dropout probability model
    const dropout_probability = Math.min(
      100,
      risk_score * 0.8 + (features.longest_inactive_period_days / 30) * 20
    );

    return { risk_score, risk_level, risk_factors, dropout_probability };
  }

  // Predict course completion
  static predictCompletion(features: UserFeatures): {
    completion_probability: number;
    estimated_days: number;
    predicted_date: string;
    confidence: number;
  } {
    // Base probability on current progress and velocity
    const progress = features.progress_percentage;
    const velocity = features.progress_velocity || 0.5; // Default to slow progress

    // Calculate completion probability
    let completion_probability = progress;
    if (velocity > 1) completion_probability += 20; // Fast learner bonus
    if (features.login_streak_days > 7) completion_probability += 10; // Consistency bonus
    if (features.avg_assessment_score > 80) completion_probability += 10; // Performance bonus
    completion_probability = Math.min(100, completion_probability);

    // Estimate days to complete
    const remaining_progress = 100 - progress;
    const estimated_days = velocity > 0 ? Math.round(remaining_progress / velocity) : 999;

    // Predict completion date
    const predicted_date = new Date();
    predicted_date.setDate(predicted_date.getDate() + estimated_days);

    // Calculate confidence based on data quality
    const confidence = Math.min(
      100,
      (features.sessions_count / 10) * 50 + // More data = more confidence
        (velocity > 0 ? 30 : 0) + // Active learner
        (features.active_days_count > 7 ? 20 : 0) // Established pattern
    );

    return {
      completion_probability: Math.round(completion_probability),
      estimated_days,
      predicted_date: predicted_date.toISOString().split('T')[0],
      confidence: Math.round(confidence),
    };
  }

  // Predict skills gaps
  static predictSkillsGaps(features: UserFeatures): {
    skill_gaps: any;
    hours_needed: number;
  } {
    // Simplified skills gap prediction
    // In production, this would analyze performance by topic/category
    const skill_gaps = {};
    const hours_needed = Math.max(0, (100 - features.progress_percentage) / 10);

    return { skill_gaps, hours_needed };
  }

  // Generate recommended interventions
  static getRecommendedInterventions(risk_factors: string[]): string[] {
    const interventions: string[] = [];

    if (risk_factors.includes('inactive_14d') || risk_factors.includes('inactive_7d')) {
      interventions.push('send_engagement_email');
      interventions.push('instructor_outreach');
    }

    if (risk_factors.includes('poor_performance')) {
      interventions.push('offer_tutoring');
      interventions.push('recommend_supplemental_materials');
    }

    if (risk_factors.includes('low_assignment_completion')) {
      interventions.push('deadline_extension');
      interventions.push('assignment_reminder');
    }

    if (risk_factors.includes('declining_engagement')) {
      interventions.push('peer_mentor_assignment');
      interventions.push('study_group_invitation');
    }

    return interventions;
  }
}

Deno.serve(async req => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData: PredictionRequest = await req.json();
    const {
      user_id,
      course_id,
      prediction_types = ['completion', 'engagement', 'at_risk'],
    } = requestData;

    console.log('Generating predictions for:', { user_id, course_id, prediction_types });

    // Step 1: Calculate/fetch features for users
    const { data: features, error: featuresError } = await supabaseClient.rpc(
      'calculate_prediction_features',
      {
        p_user_id: user_id,
        p_course_id: course_id,
      }
    );

    if (featuresError) {
      console.error('Error fetching features:', featuresError);
      throw new Error(`Failed to fetch features: ${featuresError.message}`);
    }

    if (!features || features.length === 0) {
      return new Response(JSON.stringify({ error: 'No data available for predictions' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Generate predictions for each user
    const predictions = [];
    const alerts = [];

    for (const userFeatures of features) {
      const userId = userFeatures.user_id;
      const courseId = userFeatures.course_id;

      // Generate predictions based on requested types
      if (prediction_types.includes('engagement')) {
        const engagement = PredictionEngine.predictEngagement(userFeatures);
        predictions.push({
          user_id: userId,
          course_id: courseId,
          prediction_type: 'engagement',
          engagement_score: engagement.current,
          predicted_engagement_7d: engagement.predicted_7d,
          predicted_engagement_30d: engagement.predicted_30d,
          engagement_trend: engagement.trend,
          model_version: '1.0',
          valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      if (prediction_types.includes('at_risk')) {
        const risk = PredictionEngine.calculateRiskScore(userFeatures);
        predictions.push({
          user_id: userId,
          course_id: courseId,
          prediction_type: 'at_risk',
          risk_score: risk.risk_score,
          risk_level: risk.risk_level,
          risk_factors: risk.risk_factors,
          dropout_probability: risk.dropout_probability,
          recommended_interventions: PredictionEngine.getRecommendedInterventions(
            risk.risk_factors
          ),
          intervention_priority:
            risk.risk_level === 'critical'
              ? 5
              : risk.risk_level === 'high'
                ? 4
                : risk.risk_level === 'medium'
                  ? 3
                  : 2,
          model_version: '1.0',
          valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

        // Create alert for high-risk learners
        if (risk.risk_level === 'high' || risk.risk_level === 'critical') {
          alerts.push({
            user_id: userId,
            course_id: courseId,
            alert_type: risk.risk_factors[0] || 'general_risk',
            severity: risk.risk_level,
            risk_score: risk.risk_score,
            title: `At-Risk Learner: ${risk.risk_level.toUpperCase()} priority`,
            description: `Learner showing ${risk.risk_factors.join(', ')}. Dropout probability: ${risk.dropout_probability.toFixed(1)}%`,
            contributing_factors: risk.risk_factors,
            recommended_actions: PredictionEngine.getRecommendedInterventions(risk.risk_factors),
            follow_up_required: true,
            next_follow_up_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
          });
        }
      }

      if (prediction_types.includes('completion')) {
        const completion = PredictionEngine.predictCompletion(userFeatures);
        predictions.push({
          user_id: userId,
          course_id: courseId,
          prediction_type: 'completion',
          predicted_completion_date: completion.predicted_date,
          completion_probability: completion.completion_probability,
          estimated_days_to_complete: completion.estimated_days,
          completion_confidence: completion.confidence,
          model_version: '1.0',
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      if (prediction_types.includes('skills_gap')) {
        const skills = PredictionEngine.predictSkillsGaps(userFeatures);
        predictions.push({
          user_id: userId,
          course_id: courseId,
          prediction_type: 'skills_gap',
          skill_gaps: skills.skill_gaps,
          hours_needed_to_close_gaps: skills.hours_needed,
          model_version: '1.0',
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    // Step 3: Insert predictions into database
    const { data: insertedPredictions, error: insertError } = await supabaseClient
      .from('learner_predictions')
      .insert(predictions)
      .select();

    if (insertError) {
      console.error('Error inserting predictions:', insertError);
      throw new Error(`Failed to save predictions: ${insertError.message}`);
    }

    // Step 4: Insert at-risk alerts
    if (alerts.length > 0) {
      const { data: insertedAlerts, error: alertsError } = await supabaseClient
        .from('at_risk_alerts')
        .insert(alerts)
        .select();

      if (alertsError) {
        console.error('Error inserting alerts:', alertsError);
        // Don't fail the whole request if alerts fail
      }

      console.log(`Created ${alerts.length} at-risk alerts`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        predictions_generated: predictions.length,
        alerts_created: alerts.length,
        predictions: insertedPredictions,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating predictions:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
