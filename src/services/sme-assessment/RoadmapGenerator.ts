/**
 * RoadmapGenerator Service
 *
 * Generates implementation roadmap for SME assessments
 * Pattern: Template-based generation with phased approach
 * Reference: /src/services/ai-readiness/RecommendationGenerator.ts
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  AssessmentFormData,
  SMERoadmapItem,
  SMERoadmapPhase,
  SMERoadmapMilestone,
  RoadmapPhase,
  RoadmapPriority,
} from '@/types/aiAssessment';

export class RoadmapGenerator {
  /**
   * Generate complete implementation roadmap from assessment data
   */
  static async generateRoadmap(
    assessmentId: string,
    assessmentData: AssessmentFormData
  ): Promise<void> {
    const phases = this.determinePhases(assessmentData);
    const roadmapItems = this.generateRoadmapItems(phases, assessmentData);
    const milestones = this.generateMilestones(roadmapItems, phases);

    await this.saveToDatabase(assessmentId, phases, roadmapItems, milestones);
  }

  /**
   * Determine roadmap phases based on assessment data
   */
  private static determinePhases(
    data: AssessmentFormData
  ): Omit<SMERoadmapPhase, 'id' | 'assessment_id' | 'created_at'>[] {
    // Calculate total weeks based on pain points and complexity
    const painPointCount = data.painPoints?.length || 0;
    const riskCount = data.risks?.length || 0;
    const complexity = painPointCount + riskCount;

    // Phase durations with caps to prevent negative values
    const quickWinsDuration = 4; // Fixed: 1 month for quick wins

    // Short-term: scales with complexity but capped at 28 weeks (7 months)
    const shortTermDuration = Math.min(28, Math.max(12, Math.ceil(complexity * 2)));

    // Medium-term: scales with complexity but capped at 20 weeks (5 months)
    const mediumTermDuration = Math.min(20, Math.max(8, Math.ceil(complexity * 1.5)));

    // Long-term: minimum 4 weeks, scales based on complexity
    // For high complexity, extend beyond 52 weeks if needed
    const baseLongTerm = Math.ceil(complexity * 0.5);
    const longTermDuration = Math.max(4, Math.min(24, baseLongTerm));

    // Calculate total timeline (can extend beyond 52 weeks for complex projects)
    const totalTimelineWeeks =
      quickWinsDuration + shortTermDuration + mediumTermDuration + longTermDuration;

    // Validation: Ensure timeline is reasonable (4-104 weeks / 1-24 months)
    const validatedTimeline = Math.max(24, Math.min(104, totalTimelineWeeks));

    // Log warning if timeline is very long (indicates high complexity)
    if (validatedTimeline > 78) {
      // 18+ months - complex project
      // Note: In production, this would trigger a notification to review scope
    }

    return [
      {
        phase: 'quick_wins' as RoadmapPhase,
        start_week: 0,
        duration_weeks: quickWinsDuration,
        total_cost_usd: 0, // Will be calculated from items
        completion_criteria: [
          'High-urgency pain points addressed',
          'Quick wins demonstrated to stakeholders',
          'Foundation for larger initiatives established',
        ],
      },
      {
        phase: 'short_term' as RoadmapPhase,
        start_week: quickWinsDuration,
        duration_weeks: shortTermDuration,
        total_cost_usd: 0,
        completion_criteria: [
          'Core AI capabilities implemented',
          'User groups seeing measurable improvements',
          'Initial ROI demonstrated',
        ],
      },
      {
        phase: 'medium_term' as RoadmapPhase,
        start_week: quickWinsDuration + shortTermDuration,
        duration_weeks: mediumTermDuration,
        total_cost_usd: 0,
        completion_criteria: [
          'AI integrated across key business processes',
          'Team trained and self-sufficient',
          'Scalable infrastructure in place',
        ],
      },
      {
        phase: 'long_term' as RoadmapPhase,
        start_week: quickWinsDuration + shortTermDuration + mediumTermDuration,
        duration_weeks: longTermDuration,
        total_cost_usd: 0,
        completion_criteria: [
          'Full AI transformation complete',
          'Continuous improvement process established',
          'Competitive advantage realized',
        ],
      },
    ];
  }

  /**
   * Generate roadmap items for each phase
   */
  private static generateRoadmapItems(
    phases: Omit<SMERoadmapPhase, 'id' | 'assessment_id' | 'created_at'>[],
    data: AssessmentFormData
  ): Omit<SMERoadmapItem, 'id' | 'assessment_id' | 'created_at'>[] {
    const items: Omit<SMERoadmapItem, 'id' | 'assessment_id' | 'created_at'>[] = [];

    // Quick Wins (0-4 weeks) - Based on high-urgency pain points
    if (data.painPoints && data.painPoints.length > 0) {
      data.painPoints.forEach((pain, index) => {
        // Only include high-impact pain points in quick wins
        if (pain.currentImpact >= 4) {
          items.push({
            phase: 'quick_wins',
            phase_order: index + 1,
            title: `Address: ${pain.painPoint.substring(0, 60)}${pain.painPoint.length > 60 ? '...' : ''}`,
            description: `Quick win opportunity: ${pain.aiCapabilityToAddress}. Current impact level: ${pain.currentImpact}/5. Expected improvement: ${pain.impactAfterAI}/5.`,
            priority: pain.currentImpact >= 4 ? 'critical' : 'high',
            estimated_weeks: 2,
            estimated_cost_usd: this.estimateItemCost('quick_wins', pain.currentImpact),
            required_resources: this.determineResources('quick_wins', pain.aiCapabilityToAddress),
            dependencies: [],
            success_metrics: [
              `Reduce impact from ${pain.currentImpact}/5 to ${pain.impactAfterAI}/5`,
              'Stakeholder approval achieved',
              'Process documented for scaling',
            ],
          });
        }
      });
    }

    // Short-term (4-16 weeks) - Based on user impacts and benefits
    if (data.userImpacts && data.userImpacts.length > 0) {
      data.userImpacts.forEach((impact, index) => {
        items.push({
          phase: 'short_term',
          phase_order: index + 1,
          title: `Implement AI for: ${impact.userGroup}`,
          description: `${impact.aiImprovements}. Target satisfaction improvement from ${impact.satisfactionRating}/5 to ${impact.impactRating}/5.`,
          priority: this.determinePriority(impact.satisfactionRating, impact.impactRating),
          estimated_weeks: 8,
          estimated_cost_usd: this.estimateItemCost('short_term', impact.impactRating),
          required_resources: ['AI Engineer', 'Product Manager', 'UX Designer'],
          dependencies: ['Quick wins completed'],
          success_metrics: [
            `User satisfaction improved to ${impact.impactRating}/5`,
            'User adoption rate >70%',
            'Positive feedback from stakeholder interviews',
          ],
        });
      });
    }

    // Medium-term (16-40 weeks) - Based on benefits and competitive analysis
    if (data.benefits && data.benefits.length > 0) {
      data.benefits.forEach((benefit, index) => {
        items.push({
          phase: 'medium_term',
          phase_order: index + 1,
          title: `Scale: ${benefit.benefitArea}`,
          description: `${benefit.aiImprovement}. Current state: ${benefit.currentStatus}.`,
          priority: benefit.impactRating >= 4 ? 'high' : 'medium',
          estimated_weeks: 16,
          estimated_cost_usd: this.estimateItemCost('medium_term', benefit.impactRating),
          required_resources: ['Development Team', 'Data Scientist', 'DevOps Engineer'],
          dependencies: ['Short-term initiatives validated'],
          success_metrics: [
            `Impact rating: ${benefit.impactRating}/5`,
            'Scalable solution deployed',
            'ROI targets met',
          ],
        });
      });
    }

    // Long-term (40+ weeks) - Based on strategic alignment and recommended next steps
    if (data.recommendedNextSteps && data.recommendedNextSteps.length > 0) {
      data.recommendedNextSteps.forEach((step, index) => {
        items.push({
          phase: 'long_term',
          phase_order: index + 1,
          title: `Strategic Initiative: ${step.substring(0, 50)}${step.length > 50 ? '...' : ''}`,
          description: `Long-term strategic initiative: ${step}`,
          priority: 'medium',
          estimated_weeks: 24,
          estimated_cost_usd: this.estimateItemCost('long_term', 4),
          required_resources: ['Leadership Team', 'Full Dev Team', 'External Consultants'],
          dependencies: ['Medium-term success demonstrated'],
          success_metrics: [
            'Strategic objectives met',
            'Competitive advantage established',
            'Continuous improvement process in place',
          ],
        });
      });
    }

    // Calculate total costs for each phase
    const phaseItemsMap = items.reduce(
      (acc, item) => {
        if (!acc[item.phase]) acc[item.phase] = [];
        acc[item.phase].push(item);
        return acc;
      },
      {} as Record<string, typeof items>
    );

    phases.forEach(phase => {
      const phaseItems = phaseItemsMap[phase.phase] || [];
      phase.total_cost_usd = phaseItems.reduce(
        (sum, item) => sum + (item.estimated_cost_usd || 0),
        0
      );
    });

    return items;
  }

  /**
   * Generate milestones from roadmap items
   */
  private static generateMilestones(
    items: Omit<SMERoadmapItem, 'id' | 'assessment_id' | 'created_at'>[],
    phases: Omit<SMERoadmapPhase, 'id' | 'assessment_id' | 'created_at'>[]
  ): Omit<SMERoadmapMilestone, 'id' | 'assessment_id' | 'created_at'>[] {
    const milestones: Omit<SMERoadmapMilestone, 'id' | 'assessment_id' | 'created_at'>[] = [];

    // Create milestone at end of each phase
    phases.forEach((phase, index) => {
      const phaseItems = items.filter(item => item.phase === phase.phase);
      const targetWeek = phase.start_week + phase.duration_weeks;

      milestones.push({
        milestone_name: this.getMilestoneName(phase.phase),
        target_week: targetWeek,
        deliverables: this.getMilestoneDeliverables(phase.phase, phaseItems),
        validation_criteria: phase.completion_criteria,
      });
    });

    return milestones;
  }

  /**
   * Get milestone name for phase
   */
  private static getMilestoneName(phase: RoadmapPhase): string {
    const names: Record<RoadmapPhase, string> = {
      quick_wins: 'Quick Wins Delivered',
      short_term: 'Core Capabilities Live',
      medium_term: 'Full System Operational',
      long_term: 'AI Transformation Complete',
    };
    return names[phase];
  }

  /**
   * Get milestone deliverables
   */
  private static getMilestoneDeliverables(
    phase: RoadmapPhase,
    items: Omit<SMERoadmapItem, 'id' | 'assessment_id' | 'created_at'>[]
  ): string[] {
    const deliverables: string[] = [];

    // Add up to 5 key deliverables
    items.slice(0, 5).forEach(item => {
      deliverables.push(item.title);
    });

    // Add phase-specific deliverable
    const phaseDeliverables: Record<RoadmapPhase, string> = {
      quick_wins: 'Stakeholder presentation with initial results',
      short_term: 'User training program and documentation',
      medium_term: 'Scaled infrastructure and processes',
      long_term: 'Comprehensive AI strategy and roadmap update',
    };

    deliverables.push(phaseDeliverables[phase]);

    return deliverables;
  }

  /**
   * Determine priority based on satisfaction and impact
   */
  private static determinePriority(currentRating: number, targetRating: number): RoadmapPriority {
    const gap = targetRating - currentRating;
    if (gap >= 3) return 'critical';
    if (gap >= 2) return 'high';
    if (gap >= 1) return 'medium';
    return 'low';
  }

  /**
   * Estimate cost for roadmap item
   */
  private static estimateItemCost(phase: RoadmapPhase, impact: number): number {
    // Base costs by phase (conservative estimates)
    const baseCosts: Record<RoadmapPhase, number> = {
      quick_wins: 5000, // $5K for quick wins
      short_term: 25000, // $25K for short-term
      medium_term: 75000, // $75K for medium-term
      long_term: 150000, // $150K for long-term
    };

    // Scale by impact (1-5)
    const impactMultiplier = impact / 5;
    return Math.round(baseCosts[phase] * impactMultiplier);
  }

  /**
   * Determine required resources based on phase and capability
   */
  private static determineResources(phase: RoadmapPhase, capability: string): string[] {
    const baseResources: Record<RoadmapPhase, string[]> = {
      quick_wins: ['Product Manager', 'Developer'],
      short_term: ['Product Manager', 'AI Engineer', 'UX Designer'],
      medium_term: ['Development Team', 'Data Scientist', 'DevOps'],
      long_term: ['Full Team', 'Leadership', 'External Consultants'],
    };

    const resources = [...baseResources[phase]];

    // Add capability-specific resources
    const capabilityLower = capability.toLowerCase();
    if (capabilityLower.includes('data') || capabilityLower.includes('analytics')) {
      resources.push('Data Analyst');
    }
    if (capabilityLower.includes('ml') || capabilityLower.includes('model')) {
      resources.push('ML Engineer');
    }
    if (capabilityLower.includes('infrastructure') || capabilityLower.includes('cloud')) {
      resources.push('Cloud Architect');
    }

    // Remove duplicates
    return [...new Set(resources)];
  }

  /**
   * Save roadmap to database
   */
  private static async saveToDatabase(
    assessmentId: string,
    phases: Omit<SMERoadmapPhase, 'id' | 'assessment_id' | 'created_at'>[],
    items: Omit<SMERoadmapItem, 'id' | 'assessment_id' | 'created_at'>[],
    milestones: Omit<SMERoadmapMilestone, 'id' | 'assessment_id' | 'created_at'>[]
  ): Promise<void> {
    // Using the imported supabase client

    // Insert phases
    const { error: phasesError } = await supabase.from('sme_roadmap_phases').insert(
      phases.map(p => ({
        ...p,
        assessment_id: assessmentId,
      }))
    );

    if (phasesError) {
      throw phasesError;
    }

    // Insert items
    const { error: itemsError } = await supabase.from('sme_roadmap_items').insert(
      items.map(i => ({
        ...i,
        assessment_id: assessmentId,
      }))
    );

    if (itemsError) {
      throw itemsError;
    }

    // Insert milestones
    const { error: milestonesError } = await supabase.from('sme_roadmap_milestones').insert(
      milestones.map(m => ({
        ...m,
        assessment_id: assessmentId,
      }))
    );

    if (milestonesError) {
      throw milestonesError;
    }
  }
}
