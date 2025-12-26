/**
 * ROICalculator Service
 *
 * Calculates ROI metrics for SME assessments
 * Pattern: Conservative estimation with risk-adjusted metrics
 * Reference: /src/services/ai-readiness/ScoringEngine.ts
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  AssessmentFormData,
  SMEROISummary,
  SMEROICostBreakdown,
  SMEROIBenefitBreakdown,
  ROICostCategory,
  ROIBenefitCategory,
  ConfidenceLevel,
} from '@/types/aiAssessment';

export class ROICalculator {
  /**
   * Calculate comprehensive ROI from assessment data
   */
  static async calculateROI(
    assessmentId: string,
    assessmentData: AssessmentFormData
  ): Promise<void> {
    try {
      const costs = this.calculateCosts(assessmentData);
      const benefits = this.calculateBenefits(assessmentData);
      const summary = this.calculateSummaryMetrics(costs, benefits);

      await this.saveToDatabase(assessmentId, summary, costs, benefits);
    } catch (error) {
      console.error('Error calculating ROI:', error);
      throw error;
    }
  }

  /**
   * Calculate all cost components
   */
  private static calculateCosts(
    data: AssessmentFormData
  ): Omit<SMEROICostBreakdown, 'id' | 'assessment_id' | 'created_at'>[] {
    const costs: Omit<SMEROICostBreakdown, 'id' | 'assessment_id' | 'created_at'>[] = [];

    // Implementation costs - base on complexity
    const painPointCount = data.painPoints?.length || 0;
    const userImpactCount = data.userImpacts?.length || 0;
    const complexity = painPointCount + userImpactCount;

    const baseImplementationCost = Math.max(50000, complexity * 5000);
    costs.push({
      category: 'implementation' as ROICostCategory,
      item_name: 'Initial AI Implementation',
      one_time_cost_usd: baseImplementationCost,
      annual_cost_usd: 0,
      notes: `Based on ${complexity} identified opportunities`,
    });

    // Training costs - based on team size estimate
    const trainingCost = Math.max(15000, complexity * 1500);
    costs.push({
      category: 'training' as ROICostCategory,
      item_name: 'Team Training & Onboarding',
      one_time_cost_usd: trainingCost,
      annual_cost_usd: 5000,
      notes: 'Initial training plus annual refresher sessions',
    });

    // Licensing costs (estimate based on company size - SME assumption)
    costs.push({
      category: 'licensing' as ROICostCategory,
      item_name: 'AI Platform Licensing',
      one_time_cost_usd: 0,
      annual_cost_usd: 25000,
      notes: 'Estimated for SME (10-50 users)',
    });

    // Infrastructure costs
    const infrastructureCost = Math.max(5000, complexity * 500);
    costs.push({
      category: 'infrastructure' as ROICostCategory,
      item_name: 'Cloud Infrastructure',
      one_time_cost_usd: infrastructureCost,
      annual_cost_usd: 12000,
      notes: 'GPU compute, storage, and API costs',
    });

    // Ongoing maintenance (20% of implementation cost annually)
    const maintenanceCost = Math.round(baseImplementationCost * 0.2);
    costs.push({
      category: 'ongoing_maintenance' as ROICostCategory,
      item_name: 'Maintenance & Support',
      one_time_cost_usd: 0,
      annual_cost_usd: maintenanceCost,
      notes: '20% of implementation cost annually',
    });

    return costs;
  }

  /**
   * Calculate all benefit components
   */
  private static calculateBenefits(
    data: AssessmentFormData
  ): Omit<SMEROIBenefitBreakdown, 'id' | 'assessment_id' | 'created_at'>[] {
    const benefits: Omit<SMEROIBenefitBreakdown, 'id' | 'assessment_id' | 'created_at'>[] = [];

    // Efficiency gains from pain points
    if (data.painPoints && data.painPoints.length > 0) {
      data.painPoints.forEach(pain => {
        // Only include high-impact pain points
        if (pain.currentImpact >= 4) {
          const timeSavings = this.estimateTimeSavings(pain.currentImpact, pain.impactAfterAI);
          benefits.push({
            category: 'efficiency_gains' as ROIBenefitCategory,
            benefit_name: `Time savings: ${pain.painPoint.substring(0, 50)}${pain.painPoint.length > 50 ? '...' : ''}`,
            annual_value_usd: timeSavings,
            confidence_level: 'medium' as ConfidenceLevel,
            assumptions: [
              `Current impact: ${pain.currentImpact}/5`,
              `Expected improvement to: ${pain.impactAfterAI}/5`,
              'Based on industry benchmarks for AI automation',
            ],
          });
        }
      });
    }

    // Revenue growth from user impacts
    if (data.userImpacts && data.userImpacts.length > 0) {
      data.userImpacts.forEach(impact => {
        const revenueGrowth = this.estimateRevenueGrowth(
          impact.satisfactionRating,
          impact.impactRating
        );
        benefits.push({
          category: 'revenue_growth' as ROIBenefitCategory,
          benefit_name: `Revenue from ${impact.userGroup} improvements`,
          annual_value_usd: revenueGrowth,
          confidence_level: 'low' as ConfidenceLevel,
          assumptions: [
            `Current satisfaction: ${impact.satisfactionRating}/5`,
            `Target satisfaction: ${impact.impactRating}/5`,
            'Conservative 10% improvement estimate',
          ],
        });
      });
    }

    // Cost savings from benefits
    if (data.benefits && data.benefits.length > 0) {
      data.benefits.forEach(benefit => {
        const costSavings = this.estimateCostSavings(benefit.impactRating);
        benefits.push({
          category: 'cost_savings' as ROIBenefitCategory,
          benefit_name: `Cost reduction: ${benefit.benefitArea}`,
          annual_value_usd: costSavings,
          confidence_level: 'medium' as ConfidenceLevel,
          assumptions: [
            `Impact rating: ${benefit.impactRating}/5`,
            benefit.aiImprovement,
            'Based on operational efficiency gains',
          ],
        });
      });
    }

    // Risk mitigation from risks
    if (data.risks && data.risks.length > 0) {
      data.risks.forEach(risk => {
        // Only include high-impact risks
        if (risk.impactRating >= 4 && risk.likelihood >= 3) {
          const riskReduction = this.estimateRiskReduction(risk.impactRating, risk.likelihood);
          benefits.push({
            category: 'risk_mitigation' as ROIBenefitCategory,
            benefit_name: `Risk reduction: ${risk.specificRisk.substring(0, 50)}${risk.specificRisk.length > 50 ? '...' : ''}`,
            annual_value_usd: riskReduction,
            confidence_level: 'medium' as ConfidenceLevel,
            assumptions: [
              `Risk impact: ${risk.impactRating}/5`,
              `Likelihood: ${risk.likelihood}/5`,
              `Mitigation: ${risk.mitigationStrategy}`,
            ],
          });
        }
      });
    }

    return benefits;
  }

  /**
   * Calculate summary ROI metrics
   */
  private static calculateSummaryMetrics(
    costs: Omit<SMEROICostBreakdown, 'id' | 'assessment_id' | 'created_at'>[],
    benefits: Omit<SMEROIBenefitBreakdown, 'id' | 'assessment_id' | 'created_at'>[]
  ): Omit<SMEROISummary, 'id' | 'assessment_id' | 'created_at'> {
    const totalOneTimeCost = costs.reduce((sum, c) => sum + c.one_time_cost_usd, 0);
    const totalAnnualCost = costs.reduce((sum, c) => sum + c.annual_cost_usd, 0);
    const totalAnnualBenefit = benefits.reduce((sum, b) => sum + b.annual_value_usd, 0);

    const totalInvestment = totalOneTimeCost + totalAnnualCost;
    const annualNetBenefit = totalAnnualBenefit - totalAnnualCost;

    // Payback period in months
    let paybackMonths = 0;
    if (annualNetBenefit > 0) {
      paybackMonths = Math.ceil((totalOneTimeCost / annualNetBenefit) * 12);
    } else {
      paybackMonths = 999; // Never pays back
    }

    // 3-year ROI calculation
    const threeYearBenefit = totalAnnualBenefit * 3;
    const threeYearCost = totalOneTimeCost + totalAnnualCost * 3;
    const threeYearROI =
      threeYearCost > 0 ? ((threeYearBenefit - threeYearCost) / threeYearCost) * 100 : 0;

    // Net Present Value (10% discount rate)
    const npv = this.calculateNPV(totalOneTimeCost, annualNetBenefit, 3, 0.1);

    // Risk-adjusted ROI (apply 70% confidence factor)
    const riskAdjustedROI = threeYearROI * 0.7;

    return {
      total_investment_usd: totalInvestment,
      total_annual_benefit_usd: totalAnnualBenefit,
      payback_months: paybackMonths,
      three_year_roi_percent: threeYearROI,
      net_present_value_usd: npv,
      risk_adjusted_roi_percent: riskAdjustedROI,
    };
  }

  /**
   * Calculate Net Present Value
   */
  private static calculateNPV(
    initialInvestment: number,
    annualCashFlow: number,
    years: number,
    discountRate: number
  ): number {
    let npv = -initialInvestment;
    for (let year = 1; year <= years; year++) {
      npv += annualCashFlow / Math.pow(1 + discountRate, year);
    }
    return Math.round(npv);
  }

  /**
   * Estimate time savings from pain point reduction
   * Conservative: $30K-$60K per high-impact pain point based on impact reduction
   */
  private static estimateTimeSavings(currentImpact: number, impactAfterAI: number): number {
    const impactReduction = currentImpact - impactAfterAI;
    const savingsPerPoint = 15000; // $15K per impact point reduced
    return Math.round(impactReduction * savingsPerPoint);
  }

  /**
   * Estimate revenue growth from user satisfaction improvement
   * Conservative: $10K-$40K per user group based on satisfaction gap
   */
  private static estimateRevenueGrowth(
    currentSatisfaction: number,
    targetSatisfaction: number
  ): number {
    const satisfactionGap = targetSatisfaction - currentSatisfaction;
    const revenuePerPoint = 10000; // $10K per satisfaction point improvement
    return Math.max(0, Math.round(satisfactionGap * revenuePerPoint));
  }

  /**
   * Estimate cost savings from operational improvements
   * Conservative: $20K-$60K based on impact rating
   */
  private static estimateCostSavings(impactRating: number): number {
    const baseSavings = 12000; // $12K base
    return Math.round(baseSavings * (impactRating / 5) * 5);
  }

  /**
   * Estimate risk reduction value
   * Conservative: $30K-$100K based on impact and likelihood
   */
  private static estimateRiskReduction(impactRating: number, likelihood: number): number {
    const riskValue = (impactRating * likelihood) / 25; // Normalize to 0-1
    const maxRiskValue = 100000; // $100K max
    const minRiskValue = 30000; // $30K min
    return Math.round(minRiskValue + riskValue * (maxRiskValue - minRiskValue));
  }

  /**
   * Estimate quality improvement value
   * Conservative: $25K-$50K based on impact rating
   */
  private static estimateQualityValue(impactRating: number): number {
    const baseValue = 25000; // $25K base
    const multiplier = impactRating / 5; // 0-1 range
    return Math.round(baseValue + baseValue * multiplier);
  }

  /**
   * Save ROI calculations to database
   */
  private static async saveToDatabase(
    assessmentId: string,
    summary: Omit<SMEROISummary, 'id' | 'assessment_id' | 'created_at'>,
    costs: Omit<SMEROICostBreakdown, 'id' | 'assessment_id' | 'created_at'>[],
    benefits: Omit<SMEROIBenefitBreakdown, 'id' | 'assessment_id' | 'created_at'>[]
  ): Promise<void> {
    // Using the imported supabase client

    // Insert summary
    const { error: summaryError } = await supabase.from('sme_roi_summary').insert({
      ...summary,
      assessment_id: assessmentId,
    });

    if (summaryError) {
      console.error('Error inserting ROI summary:', summaryError);
      throw summaryError;
    }

    // Insert cost breakdown
    const { error: costsError } = await supabase
      .from('sme_roi_cost_breakdown')
      .insert(costs.map(c => ({ ...c, assessment_id: assessmentId })));

    if (costsError) {
      console.error('Error inserting ROI costs:', costsError);
      throw costsError;
    }

    // Insert benefit breakdown
    const { error: benefitsError } = await supabase
      .from('sme_roi_benefit_breakdown')
      .insert(benefits.map(b => ({ ...b, assessment_id: assessmentId })));

    if (benefitsError) {
      console.error('Error inserting ROI benefits:', benefitsError);
      throw benefitsError;
    }

    console.log(
      `✓ ROI calculated: ${costs.length} costs, ${benefits.length} benefits, ${summary.three_year_roi_percent.toFixed(0)}% 3-year ROI`
    );
  }
}
