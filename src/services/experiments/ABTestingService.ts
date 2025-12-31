/**
 * A/B Testing Framework Service
 * Enables experimentation to prove platform efficacy
 * Critical for CODiE 2026 - provides evidence-based improvement data
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Experiment types
export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed' | 'archived';
export type AssignmentReason = 'random' | 'forced' | 'override';
export type EventType = 'exposure' | 'click' | 'conversion' | 'completion' | 'custom';

// Experiment definition
export interface Experiment {
  id: string;
  name: string;
  description?: string;
  hypothesis?: string;
  status: ExperimentStatus;
  targetAudience: TargetAudience;
  trafficPercentage: number;
  startDate?: Date;
  endDate?: Date;
  primaryMetric: string;
  secondaryMetrics: string[];
  minimumSampleSize: number;
  minimumEffectSize: number;
  winnerVariantId?: string;
  concludedAt?: Date;
  conclusionNotes?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Target audience definition
export interface TargetAudience {
  roles?: string[];
  courses?: string[];
  minActivityDays?: number;
  customFilters?: Record<string, unknown>;
}

// Experiment variant
export interface ExperimentVariant {
  id: string;
  experimentId: string;
  name: string;
  description?: string;
  isControl: boolean;
  weight: number;
  config: VariantConfig;
  createdAt: Date;
}

// Variant configuration
export interface VariantConfig {
  featureFlag?: string;
  params?: Record<string, unknown>;
}

// User assignment to variant
export interface ExperimentAssignment {
  id: string;
  experimentId: string;
  variantId: string;
  userId: string;
  assignedAt: Date;
  assignmentReason: AssignmentReason;
  firstExposureAt?: Date;
  lastExposureAt?: Date;
  exposureCount: number;
}

// Experiment event
export interface ExperimentEvent {
  id: string;
  experimentId: string;
  variantId: string;
  userId: string;
  eventType: EventType;
  eventName?: string;
  eventValue?: number;
  eventMetadata?: Record<string, unknown>;
  createdAt: Date;
}

// Experiment metrics summary
export interface ExperimentMetrics {
  id: string;
  experimentId: string;
  variantId: string;
  variantName: string;
  isControl: boolean;
  totalUsers: number;
  exposedUsers: number;
  convertedUsers: number;
  exposureRate: number;
  conversionRate: number;
  metricMean?: number;
  metricStdDev?: number;
  metricMedian?: number;
  liftVsControl?: number;
  confidenceIntervalLower?: number;
  confidenceIntervalUpper?: number;
  pValue?: number;
  isSignificant: boolean;
  calculatedAt: Date;
}

// Experiment results
export interface ExperimentResults {
  experiment: Experiment;
  variants: ExperimentVariant[];
  metrics: ExperimentMetrics[];
  recommendation: string;
  confidence: number;
}

/**
 * A/B Testing Service
 */
export class ABTestingService {
  /**
   * Create a new experiment
   */
  static async createExperiment(
    createdBy: string,
    options: {
      name: string;
      description?: string;
      hypothesis?: string;
      primaryMetric: string;
      secondaryMetrics?: string[];
      targetAudience?: TargetAudience;
      trafficPercentage?: number;
      minimumSampleSize?: number;
      minimumEffectSize?: number;
      variants: Array<{
        name: string;
        description?: string;
        isControl?: boolean;
        weight?: number;
        config?: VariantConfig;
      }>;
    }
  ): Promise<Experiment | null> {
    try {
      // Validate at least 2 variants
      if (options.variants.length < 2) {
        throw new Error('Experiments must have at least 2 variants');
      }

      // Ensure exactly one control
      const controlCount = options.variants.filter(v => v.isControl).length;
      if (controlCount !== 1) {
        throw new Error('Experiments must have exactly one control variant');
      }

      // Create experiment
      const { data: experiment, error: expError } = await supabase
        .from('experiments')
        .insert({
          name: options.name,
          description: options.description,
          hypothesis: options.hypothesis,
          primary_metric: options.primaryMetric,
          secondary_metrics: options.secondaryMetrics || [],
          target_audience: options.targetAudience || {},
          traffic_percentage: options.trafficPercentage || 100,
          minimum_sample_size: options.minimumSampleSize || 100,
          minimum_effect_size: options.minimumEffectSize || 0.05,
          created_by: createdBy,
          status: 'draft',
        })
        .select()
        .single();

      if (expError) throw expError;

      // Create variants
      const variantInserts = options.variants.map(v => ({
        experiment_id: experiment.id,
        name: v.name,
        description: v.description,
        is_control: v.isControl || false,
        weight: v.weight || 100 / options.variants.length,
        config: v.config || {},
      }));

      const { error: varError } = await supabase.from('experiment_variants').insert(variantInserts);

      if (varError) throw varError;

      return this.mapExperiment(experiment);
    } catch (_error) {
      logger._error('Error creating experiment:', _error);
      return null;
    }
  }

  /**
   * Start an experiment
   */
  static async startExperiment(experimentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('experiments')
        .update({
          status: 'running',
          start_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', experimentId)
        .eq('status', 'draft');

      if (error) throw error;
      return true;
    } catch (_error) {
      logger._error('Error starting experiment:', _error);
      return false;
    }
  }

  /**
   * Pause an experiment
   */
  static async pauseExperiment(experimentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('experiments')
        .update({
          status: 'paused',
          updated_at: new Date().toISOString(),
        })
        .eq('id', experimentId)
        .eq('status', 'running');

      if (error) throw error;
      return true;
    } catch (_error) {
      logger._error('Error pausing experiment:', _error);
      return false;
    }
  }

  /**
   * Complete an experiment and declare winner
   */
  static async completeExperiment(
    experimentId: string,
    winnerVariantId?: string,
    conclusionNotes?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('experiments')
        .update({
          status: 'completed',
          winner_variant_id: winnerVariantId,
          conclusion_notes: conclusionNotes,
          concluded_at: new Date().toISOString(),
          end_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', experimentId);

      if (error) throw error;
      return true;
    } catch (_error) {
      logger._error('Error completing experiment:', _error);
      return false;
    }
  }

  /**
   * Get or assign variant for a user
   */
  static async getVariantForUser(
    experimentId: string,
    userId: string,
    forceVariantId?: string
  ): Promise<ExperimentVariant | null> {
    try {
      // Check if user is already assigned
      const { data: existing } = await supabase
        .from('experiment_assignments')
        .select(
          `
          *,
          experiment_variants (*)
        `
        )
        .eq('experiment_id', experimentId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Update exposure tracking
        await supabase
          .from('experiment_assignments')
          .update({
            last_exposure_at: new Date().toISOString(),
            exposure_count: (existing.exposure_count || 0) + 1,
            first_exposure_at: existing.first_exposure_at || new Date().toISOString(),
          })
          .eq('id', existing.id);

        return this.mapVariant(existing.experiment_variants as Record<string, unknown>);
      }

      // Get experiment to check if running
      const { data: experiment } = await supabase
        .from('experiments')
        .select('*')
        .eq('id', experimentId)
        .single();

      if (!experiment || experiment.status !== 'running') {
        return null;
      }

      // Check if user is eligible (simplified check)
      const targetAudience = experiment.target_audience as TargetAudience;
      const isEligible = await this.isUserEligible(userId, targetAudience);
      if (!isEligible) {
        return null;
      }

      // Check traffic percentage
      if (Math.random() * 100 > experiment.traffic_percentage) {
        return null;
      }

      // Get variants
      const { data: variants } = await supabase
        .from('experiment_variants')
        .select('*')
        .eq('experiment_id', experimentId);

      if (!variants || variants.length === 0) {
        return null;
      }

      // Assign variant
      let assignedVariant: Record<string, unknown>;
      let assignmentReason: AssignmentReason = 'random';

      if (forceVariantId) {
        // Forced assignment
        const forced = variants.find(v => v.id === forceVariantId);
        if (forced) {
          assignedVariant = forced;
          assignmentReason = 'forced';
        } else {
          assignedVariant = this.selectVariantByWeight(variants);
        }
      } else {
        // Random assignment based on weights
        assignedVariant = this.selectVariantByWeight(variants);
      }

      // Create assignment
      await supabase.from('experiment_assignments').insert({
        experiment_id: experimentId,
        variant_id: assignedVariant.id,
        user_id: userId,
        assignment_reason: assignmentReason,
        first_exposure_at: new Date().toISOString(),
        last_exposure_at: new Date().toISOString(),
        exposure_count: 1,
      });

      // Track exposure event
      await this.trackEvent(experimentId, assignedVariant.id as string, userId, 'exposure');

      return this.mapVariant(assignedVariant);
    } catch (_error) {
      logger._error('Error getting variant for user:', _error);
      return null;
    }
  }

  /**
   * Track an experiment event
   */
  static async trackEvent(
    experimentId: string,
    variantId: string,
    userId: string,
    eventType: EventType,
    options?: {
      eventName?: string;
      eventValue?: number;
      eventMetadata?: Record<string, unknown>;
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from('experiment_events').insert({
        experiment_id: experimentId,
        variant_id: variantId,
        user_id: userId,
        event_type: eventType,
        event_name: options?.eventName,
        event_value: options?.eventValue,
        event_metadata: options?.eventMetadata || {},
      });

      if (error) throw error;
      return true;
    } catch (_error) {
      logger._error('Error tracking event:', _error);
      return false;
    }
  }

  /**
   * Track a conversion
   */
  static async trackConversion(
    experimentId: string,
    userId: string,
    conversionValue?: number,
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    try {
      // Get user's assignment
      const { data: assignment } = await supabase
        .from('experiment_assignments')
        .select('variant_id')
        .eq('experiment_id', experimentId)
        .eq('user_id', userId)
        .single();

      if (!assignment) {
        return false;
      }

      return this.trackEvent(experimentId, assignment.variant_id, userId, 'conversion', {
        eventValue: conversionValue,
        eventMetadata: metadata,
      });
    } catch (_error) {
      logger._error('Error tracking conversion:', _error);
      return false;
    }
  }

  /**
   * Get experiment results
   */
  static async getExperimentResults(experimentId: string): Promise<ExperimentResults | null> {
    try {
      // Get experiment
      const { data: experiment, error: expError } = await supabase
        .from('experiments')
        .select('*')
        .eq('id', experimentId)
        .single();

      if (expError || !experiment) return null;

      // Get variants
      const { data: variants } = await supabase
        .from('experiment_variants')
        .select('*')
        .eq('experiment_id', experimentId);

      if (!variants) return null;

      // Calculate metrics for each variant
      const metricsPromises = variants.map(v => this.calculateVariantMetrics(experimentId, v));
      const metrics = await Promise.all(metricsPromises);

      // Find control variant
      const controlVariant = variants.find(v => v.is_control);
      const controlMetrics = metrics.find(m => m.variantId === controlVariant?.id);

      // Calculate lift vs control for treatment variants
      for (const metric of metrics) {
        if (!metric.isControl && controlMetrics && controlMetrics.conversionRate > 0) {
          metric.liftVsControl =
            ((metric.conversionRate - controlMetrics.conversionRate) /
              controlMetrics.conversionRate) *
            100;

          // Simple significance check (would use proper statistical test in production)
          const sampleSize = metric.exposedUsers;
          const controlSize = controlMetrics.exposedUsers;
          if (sampleSize >= 30 && controlSize >= 30) {
            // Z-test approximation
            const p1 = metric.conversionRate;
            const p2 = controlMetrics.conversionRate;
            const pooledP = (p1 * sampleSize + p2 * controlSize) / (sampleSize + controlSize);
            const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / sampleSize + 1 / controlSize));
            const z = se > 0 ? (p1 - p2) / se : 0;
            metric.pValue = 2 * (1 - this.normalCDF(Math.abs(z)));
            metric.isSignificant = metric.pValue < 0.05;

            // Confidence intervals
            const me = 1.96 * se;
            metric.confidenceIntervalLower = (p1 - p2 - me) * 100;
            metric.confidenceIntervalUpper = (p1 - p2 + me) * 100;
          }
        }
      }

      // Generate recommendation
      const recommendation = this.generateRecommendation(experiment, variants, metrics);

      // Calculate overall confidence
      const significantMetrics = metrics.filter(m => m.isSignificant);
      const confidence =
        significantMetrics.length > 0
          ? Math.max(...significantMetrics.map(m => 1 - (m.pValue || 1)))
          : 0;

      return {
        experiment: this.mapExperiment(experiment),
        variants: variants.map(this.mapVariant),
        metrics,
        recommendation,
        confidence: confidence * 100,
      };
    } catch (_error) {
      logger._error('Error getting experiment results:', _error);
      return null;
    }
  }

  /**
   * Get all active experiments
   */
  static async getActiveExperiments(): Promise<Experiment[]> {
    try {
      const { data, error } = await supabase
        .from('experiments')
        .select('*')
        .eq('status', 'running')
        .order('start_date', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapExperiment);
    } catch (_error) {
      logger._error('Error getting active experiments:', _error);
      return [];
    }
  }

  /**
   * Get user's active experiment assignments
   */
  static async getUserAssignments(userId: string): Promise<
    Array<{
      experiment: Experiment;
      variant: ExperimentVariant;
      assignment: ExperimentAssignment;
    }>
  > {
    try {
      const { data, error } = await supabase
        .from('experiment_assignments')
        .select(
          `
          *,
          experiments (*),
          experiment_variants (*)
        `
        )
        .eq('user_id', userId);

      if (error) throw error;

      return (data || [])
        .filter(d => (d.experiments as Record<string, unknown>)?.status === 'running')
        .map(d => ({
          experiment: this.mapExperiment(d.experiments as Record<string, unknown>),
          variant: this.mapVariant(d.experiment_variants as Record<string, unknown>),
          assignment: this.mapAssignment(d),
        }));
    } catch (_error) {
      logger._error('Error getting user assignments:', _error);
      return [];
    }
  }

  // Private helper methods

  private static async isUserEligible(
    _userId: string,
    _audience: TargetAudience
  ): Promise<boolean> {
    // Simplified eligibility check
    // In production, would check roles, courses, activity, etc.
    return true;
  }

  private static selectVariantByWeight(
    variants: Array<Record<string, unknown>>
  ): Record<string, unknown> {
    const totalWeight = variants.reduce((sum, v) => sum + (v.weight as number), 0);
    let random = Math.random() * totalWeight;

    for (const variant of variants) {
      random -= variant.weight as number;
      if (random <= 0) {
        return variant;
      }
    }

    return variants[0];
  }

  private static async calculateVariantMetrics(
    experimentId: string,
    variant: Record<string, unknown>
  ): Promise<ExperimentMetrics> {
    const variantId = variant.id as string;

    // Get assignments
    const { data: assignments } = await supabase
      .from('experiment_assignments')
      .select('*')
      .eq('experiment_id', experimentId)
      .eq('variant_id', variantId);

    const totalUsers = assignments?.length || 0;
    const exposedUsers = assignments?.filter(a => a.exposure_count > 0).length || 0;

    // Get conversions
    const { data: conversions } = await supabase
      .from('experiment_events')
      .select('user_id, event_value')
      .eq('experiment_id', experimentId)
      .eq('variant_id', variantId)
      .eq('event_type', 'conversion');

    const uniqueConversions = new Set(conversions?.map(c => c.user_id) || []);
    const convertedUsers = uniqueConversions.size;

    // Calculate rates
    const exposureRate = totalUsers > 0 ? exposedUsers / totalUsers : 0;
    const conversionRate = exposedUsers > 0 ? convertedUsers / exposedUsers : 0;

    // Calculate metric statistics
    const values = (conversions?.map(c => c.event_value).filter(v => v !== null) as number[]) || [];
    const metricMean =
      values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : undefined;
    const metricStdDev =
      values.length > 1
        ? Math.sqrt(
            values.map(x => Math.pow(x - (metricMean || 0), 2)).reduce((a, b) => a + b, 0) /
              (values.length - 1)
          )
        : undefined;
    const sortedValues = [...values].sort((a, b) => a - b);
    const metricMedian =
      sortedValues.length > 0 ? sortedValues[Math.floor(sortedValues.length / 2)] : undefined;

    return {
      id: `${experimentId}-${variantId}`,
      experimentId,
      variantId,
      variantName: variant.name as string,
      isControl: variant.is_control as boolean,
      totalUsers,
      exposedUsers,
      convertedUsers,
      exposureRate,
      conversionRate,
      metricMean,
      metricStdDev,
      metricMedian,
      isSignificant: false,
      calculatedAt: new Date(),
    };
  }

  private static generateRecommendation(
    experiment: Record<string, unknown>,
    variants: Array<Record<string, unknown>>,
    metrics: ExperimentMetrics[]
  ): string {
    const minSampleSize = experiment.minimum_sample_size as number;
    const minEffectSize = experiment.minimum_effect_size as number;

    // Check sample size
    const totalSamples = metrics.reduce((sum, m) => sum + m.exposedUsers, 0);
    if (totalSamples < minSampleSize) {
      return `Insufficient sample size. Need ${minSampleSize} samples, currently have ${totalSamples}. Continue running the experiment.`;
    }

    // Find best performer
    const controlMetrics = metrics.find(m => m.isControl);
    const treatmentMetrics = metrics.filter(m => !m.isControl);

    const bestTreatment = treatmentMetrics.sort(
      (a, b) =>
        b.conversionRate -
        (controlMetrics?.conversionRate || 0) -
        (a.conversionRate - (controlMetrics?.conversionRate || 0))
    )[0];

    if (!bestTreatment || !controlMetrics) {
      return 'Unable to determine recommendation. Check experiment setup.';
    }

    const lift = bestTreatment.liftVsControl || 0;
    const isSignificant = bestTreatment.isSignificant;

    if (isSignificant && lift > minEffectSize * 100) {
      return `Winner: "${bestTreatment.variantName}" outperforms control by ${lift.toFixed(1)}% (p < 0.05). Recommend implementing the winning variant.`;
    }

    if (isSignificant && lift < 0) {
      return `Control wins. Treatment "${bestTreatment.variantName}" underperforms by ${Math.abs(lift).toFixed(1)}% (p < 0.05). Recommend keeping the control.`;
    }

    return `No significant difference detected. Lift is ${lift > 0 ? '+' : ''}${lift.toFixed(1)}% but not statistically significant. Consider running longer or accepting the null hypothesis.`;
  }

  private static normalCDF(x: number): number {
    // Approximation of the normal CDF
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  private static mapExperiment(data: Record<string, unknown>): Experiment {
    return {
      id: data.id as string,
      name: data.name as string,
      description: data.description as string | undefined,
      hypothesis: data.hypothesis as string | undefined,
      status: data.status as ExperimentStatus,
      targetAudience: (data.target_audience || {}) as TargetAudience,
      trafficPercentage: data.traffic_percentage as number,
      startDate: data.start_date ? new Date(data.start_date as string) : undefined,
      endDate: data.end_date ? new Date(data.end_date as string) : undefined,
      primaryMetric: data.primary_metric as string,
      secondaryMetrics: (data.secondary_metrics || []) as string[],
      minimumSampleSize: data.minimum_sample_size as number,
      minimumEffectSize: data.minimum_effect_size as number,
      winnerVariantId: data.winner_variant_id as string | undefined,
      concludedAt: data.concluded_at ? new Date(data.concluded_at as string) : undefined,
      conclusionNotes: data.conclusion_notes as string | undefined,
      createdBy: data.created_by as string | undefined,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private static mapVariant(data: Record<string, unknown>): ExperimentVariant {
    return {
      id: data.id as string,
      experimentId: data.experiment_id as string,
      name: data.name as string,
      description: data.description as string | undefined,
      isControl: data.is_control as boolean,
      weight: data.weight as number,
      config: (data.config || {}) as VariantConfig,
      createdAt: new Date(data.created_at as string),
    };
  }

  private static mapAssignment(data: Record<string, unknown>): ExperimentAssignment {
    return {
      id: data.id as string,
      experimentId: data.experiment_id as string,
      variantId: data.variant_id as string,
      userId: data.user_id as string,
      assignedAt: new Date(data.assigned_at as string),
      assignmentReason: data.assignment_reason as AssignmentReason,
      firstExposureAt: data.first_exposure_at
        ? new Date(data.first_exposure_at as string)
        : undefined,
      lastExposureAt: data.last_exposure_at ? new Date(data.last_exposure_at as string) : undefined,
      exposureCount: data.exposure_count as number,
    };
  }
}

// React hook for experiments
export function useExperiment(_experimentId: string) {
  // This would be a React hook implementation
  // For now, exporting as documentation for how to use the service
  /*
  Usage:

  const { variant, trackConversion } = useExperiment('experiment-id');

  if (variant?.config.featureFlag === 'new_ui') {
    // Show new UI
  }

  // Track conversion
  await trackConversion(42); // optional value
  */
}
