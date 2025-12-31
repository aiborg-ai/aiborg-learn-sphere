// ============================================================================
// AI Readiness Recommendation Generator
// AI-powered generation of personalized roadmaps and action items
// ============================================================================

import type {
  ReadinessRecommendation,
  Roadmap,
  DimensionType,
  DimensionScore,
  BenchmarkComparison,
  RecommendationPriority,
  RecommendationTimeframe,
} from '@/types/aiReadiness';

// ============================================================================
// RECOMMENDATION TEMPLATES
// ============================================================================

interface RecommendationTemplate {
  dimension: DimensionType;
  scoreRange: 'low' | 'medium' | 'high';
  priority: RecommendationPriority;
  timeframe: RecommendationTimeframe;
  title: string;
  description: string;
  expected_impact: string;
  estimated_effort: string;
  estimated_cost_range: string;
  required_resources: string[];
  success_metrics: string[];
}

const RECOMMENDATION_TEMPLATES: RecommendationTemplate[] = [
  // STRATEGIC ALIGNMENT - Low Score
  {
    dimension: 'strategic',
    scoreRange: 'low',
    priority: 'critical',
    timeframe: 'quick_win',
    title: 'Secure Executive Buy-In',
    description:
      'Conduct executive workshops to educate leadership on AI opportunities and build commitment. Create business case with clear ROI projections for top 3 use cases.',
    expected_impact: 'Unlock budget and resources for AI initiatives',
    estimated_effort: 'medium',
    estimated_cost_range: '£5-10K',
    required_resources: ['Executive time', 'External AI consultant', 'Business analyst'],
    success_metrics: [
      'Leadership approval for AI strategy',
      'Budget allocated',
      'Use cases prioritized',
    ],
  },
  {
    dimension: 'strategic',
    scoreRange: 'low',
    priority: 'high',
    timeframe: 'short_term',
    title: 'Define AI Strategy & Roadmap',
    description:
      'Develop comprehensive AI strategy document with clear use cases, KPIs, and implementation timeline. Align with business objectives and competitive positioning.',
    expected_impact: 'Clear direction for AI adoption across organization',
    estimated_effort: 'high',
    estimated_cost_range: '£15-30K',
    required_resources: [
      'Strategy consultant',
      'Department heads',
      'Technical lead',
      'Project manager',
    ],
    success_metrics: ['Strategy document approved', 'Roadmap published', 'Champions appointed'],
  },

  // DATA MATURITY - Low Score
  {
    dimension: 'data',
    scoreRange: 'low',
    priority: 'critical',
    timeframe: 'short_term',
    title: 'Conduct Data Quality Audit',
    description:
      'Perform comprehensive audit of data quality, accessibility, and governance. Identify critical gaps and create data improvement plan.',
    expected_impact: 'Foundation for AI-ready data infrastructure',
    estimated_effort: 'medium',
    estimated_cost_range: '£10-20K',
    required_resources: ['Data analyst', 'IT team', 'Audit tools'],
    success_metrics: [
      'Data quality baseline established',
      'Top 10 issues identified',
      'Improvement plan created',
    ],
  },
  {
    dimension: 'data',
    scoreRange: 'low',
    priority: 'high',
    timeframe: 'medium_term',
    title: 'Implement Data Governance Framework',
    description:
      'Establish data governance policies, procedures, and ownership. Create data catalog and implement master data management for critical entities.',
    expected_impact: 'Trusted, well-managed data for AI initiatives',
    estimated_effort: 'high',
    estimated_cost_range: '£25-50K',
    required_resources: [
      'Data governance lead',
      'MDM platform',
      'Data stewards',
      'Training budget',
    ],
    success_metrics: ['Governance framework approved', 'Data catalog live', 'Stewards trained'],
  },

  // TECH INFRASTRUCTURE - Low Score
  {
    dimension: 'tech',
    scoreRange: 'low',
    priority: 'critical',
    timeframe: 'short_term',
    title: 'Cloud Migration Planning',
    description:
      'Develop cloud adoption strategy for AI workloads. Start with hybrid approach, prioritizing compute-intensive and data-heavy applications.',
    expected_impact: 'Scalable infrastructure for AI experimentation',
    estimated_effort: 'high',
    estimated_cost_range: '£30-100K',
    required_resources: ['Cloud architect', 'DevOps team', 'Cloud services budget'],
    success_metrics: ['Migration plan approved', 'Pilot workload migrated', 'Cost model validated'],
  },
  {
    dimension: 'tech',
    scoreRange: 'low',
    priority: 'high',
    timeframe: 'quick_win',
    title: 'API Development for Key Systems',
    description:
      'Build REST APIs for 3-5 critical business systems to enable data integration and AI model deployment.',
    expected_impact: 'Enable data access and AI integration',
    estimated_effort: 'medium',
    estimated_cost_range: '£15-25K',
    required_resources: ['Backend developers', 'API gateway', 'Documentation tools'],
    success_metrics: ['APIs deployed', 'Documentation published', 'Integration tested'],
  },

  // HUMAN CAPITAL - Low Score
  {
    dimension: 'human',
    scoreRange: 'low',
    priority: 'critical',
    timeframe: 'quick_win',
    title: 'AI Literacy Training Program',
    description:
      'Launch AI awareness training for all employees. Focus on demystifying AI, showcasing use cases, and building enthusiasm.',
    expected_impact: 'Reduce resistance and build AI-positive culture',
    estimated_effort: 'low',
    estimated_cost_range: '£5-15K',
    required_resources: ['Training platform', 'Content licenses', 'Internal champions'],
    success_metrics: ['80% completion rate', 'Literacy scores improved', 'Champions identified'],
  },
  {
    dimension: 'human',
    scoreRange: 'low',
    priority: 'high',
    timeframe: 'short_term',
    title: 'Build AI Center of Excellence',
    description:
      'Create small AI CoE team (2-3 people) to lead initiatives, develop capabilities, and support business units. Mix of internal upskilling and external hires.',
    expected_impact: 'Dedicated AI expertise to drive adoption',
    estimated_effort: 'high',
    estimated_cost_range: '£100-200K',
    required_resources: ['Recruitment budget', 'Training budget', 'Tools and infrastructure'],
    success_metrics: ['CoE team assembled', 'First project delivered', 'Best practices documented'],
  },

  // PROCESS MATURITY - Low Score
  {
    dimension: 'process',
    scoreRange: 'low',
    priority: 'high',
    timeframe: 'short_term',
    title: 'Process Documentation Initiative',
    description:
      'Document top 10-15 business processes with current state mapping, pain points, and automation opportunities. Use process mining tools where feasible.',
    expected_impact: 'Clear understanding of automation opportunities',
    estimated_effort: 'medium',
    estimated_cost_range: '£10-20K',
    required_resources: ['Process analyst', 'Process mining tool', 'Department SMEs'],
    success_metrics: ['Processes documented', 'Pain points identified', 'ROI estimates created'],
  },

  // CHANGE READINESS - Low Score
  {
    dimension: 'change',
    scoreRange: 'low',
    priority: 'high',
    timeframe: 'quick_win',
    title: 'AI Pilot Project (Quick Win)',
    description:
      'Launch small, visible AI pilot in area with high impact and low resistance. Focus on demonstrating value quickly to build momentum.',
    expected_impact: 'Build confidence and momentum for larger initiatives',
    estimated_effort: 'low',
    estimated_cost_range: '£5-15K',
    required_resources: ['AI tool subscription', 'Champion time', 'Communication support'],
    success_metrics: ['Pilot completed', 'Measurable ROI', 'Success story shared'],
  },
  {
    dimension: 'change',
    scoreRange: 'low',
    priority: 'high',
    timeframe: 'short_term',
    title: 'Change Management Framework',
    description:
      'Develop change management plan with communication strategy, stakeholder engagement, and resistance management tactics.',
    expected_impact: 'Smooth AI adoption with minimal disruption',
    estimated_effort: 'medium',
    estimated_cost_range: '£10-25K',
    required_resources: ['Change manager', 'Communication team', 'Training coordinator'],
    success_metrics: [
      'Framework approved',
      'Communications launched',
      'Sentiment tracking established',
    ],
  },

  // MEDIUM SCORE RECOMMENDATIONS (Optimization)
  {
    dimension: 'strategic',
    scoreRange: 'medium',
    priority: 'high',
    timeframe: 'short_term',
    title: 'Scale Successful Pilots',
    description:
      'Expand proven AI use cases across organization. Develop playbooks for replication and train additional teams.',
    expected_impact: 'Multiply ROI from successful initiatives',
    estimated_effort: 'medium',
    estimated_cost_range: '£25-50K',
    required_resources: ['Project managers', 'Technical resources', 'Change support'],
    success_metrics: ['3+ departments using AI', 'ROI multiplied 3x', 'Playbooks created'],
  },
  {
    dimension: 'data',
    scoreRange: 'medium',
    priority: 'medium',
    timeframe: 'medium_term',
    title: 'Advanced Analytics Platform',
    description:
      'Deploy modern data platform with ML capabilities, self-service analytics, and automated pipelines.',
    expected_impact: 'Enable data-driven decision making at scale',
    estimated_effort: 'high',
    estimated_cost_range: '£50-150K',
    required_resources: ['Data platform', 'Data engineers', 'BI tools', 'Training'],
    success_metrics: ['Platform deployed', 'Self-service adoption', 'Data quality >95%'],
  },

  // HIGH SCORE RECOMMENDATIONS (Optimization & Innovation)
  {
    dimension: 'strategic',
    scoreRange: 'high',
    priority: 'medium',
    timeframe: 'medium_term',
    title: 'AI Innovation Lab',
    description:
      'Establish innovation lab to explore emerging AI technologies, develop proprietary capabilities, and prototype next-gen solutions.',
    expected_impact: 'Maintain competitive edge through continuous innovation',
    estimated_effort: 'high',
    estimated_cost_range: '£100-250K',
    required_resources: ['Innovation team', 'R&D budget', 'Partnership budget', 'Lab space'],
    success_metrics: ['Lab established', '3+ prototypes built', 'Patent filed'],
  },
  {
    dimension: 'human',
    scoreRange: 'high',
    priority: 'low',
    timeframe: 'long_term',
    title: 'AI Thought Leadership Program',
    description:
      'Develop industry-leading expertise. Publish research, speak at conferences, and contribute to AI standards and ethics frameworks.',
    expected_impact: 'Position company as AI leader, attract top talent',
    estimated_effort: 'medium',
    estimated_cost_range: '£20-50K',
    required_resources: ['Research time', 'Conference budget', 'Content marketing'],
    success_metrics: ['Publications released', 'Conference presentations', 'Media coverage'],
  },
];

// ============================================================================
// RECOMMENDATION GENERATION
// ============================================================================

/**
 * Generate recommendations based on assessment scores
 */
export function generateRecommendations(
  dimensionScores: DimensionScore[],
  _benchmarkComparisons: Record<DimensionType, BenchmarkComparison>
): ReadinessRecommendation[] {
  const recommendations: ReadinessRecommendation[] = [];
  let order = 0;

  dimensionScores.forEach(({ dimension, score }) => {
    if (dimension === 'overall') return;

    const scoreRange: 'low' | 'medium' | 'high' =
      score < 40 ? 'low' : score < 70 ? 'medium' : 'high';

    // Get relevant templates for this dimension and score range
    const relevantTemplates = RECOMMENDATION_TEMPLATES.filter(
      t => t.dimension === dimension && t.scoreRange === scoreRange
    );

    // Create recommendations from templates
    relevantTemplates.forEach(template => {
      recommendations.push({
        id: `rec_${dimension}_${order++}`,
        assessment_id: '', // Will be set when saving
        dimension: template.dimension,
        priority: template.priority,
        timeframe: template.timeframe,
        title: template.title,
        description: template.description,
        expected_impact: template.expected_impact,
        estimated_effort: template.estimated_effort,
        estimated_cost_range: template.estimated_cost_range,
        required_resources: template.required_resources,
        success_metrics: template.success_metrics,
        prerequisite_recommendations: [],
        is_ai_generated: true,
        marked_complete: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });
  });

  // Sort by priority and timeframe
  return sortRecommendations(recommendations);
}

/**
 * Sort recommendations by priority and timeframe
 */
export function sortRecommendations(
  recommendations: ReadinessRecommendation[]
): ReadinessRecommendation[] {
  const priorityOrder: Record<RecommendationPriority, number> = {
    critical: 1,
    high: 2,
    medium: 3,
    low: 4,
  };

  const timeframeOrder: Record<RecommendationTimeframe, number> = {
    quick_win: 1,
    short_term: 2,
    medium_term: 3,
    long_term: 4,
  };

  return [...recommendations].sort((a, b) => {
    // First by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by timeframe
    return timeframeOrder[a.timeframe] - timeframeOrder[b.timeframe];
  });
}

/**
 * Organize recommendations into roadmap
 */
export function createRoadmap(recommendations: ReadinessRecommendation[]): Roadmap {
  return {
    quick_wins: recommendations.filter(r => r.timeframe === 'quick_win'),
    short_term: recommendations.filter(r => r.timeframe === 'short_term'),
    medium_term: recommendations.filter(r => r.timeframe === 'medium_term'),
    long_term: recommendations.filter(r => r.timeframe === 'long_term'),
  };
}

/**
 * Calculate total estimated cost for roadmap
 */
export function estimateRoadmapCost(roadmap: Roadmap): {
  quick_wins: { min: number; max: number };
  short_term: { min: number; max: number };
  medium_term: { min: number; max: number };
  long_term: { min: number; max: number };
  total: { min: number; max: number };
} {
  const parseCostRange = (range: string): { min: number; max: number } => {
    const match = range.match(/£(\d+)-(\d+)K/);
    if (!match) return { min: 0, max: 0 };
    return {
      min: parseInt(match[1]) * 1000,
      max: parseInt(match[2]) * 1000,
    };
  };

  const sumCosts = (items: ReadinessRecommendation[]) => {
    return items.reduce(
      (sum, item) => {
        const costs = parseCostRange(item.estimated_cost_range || '£0-0K');
        return {
          min: sum.min + costs.min,
          max: sum.max + costs.max,
        };
      },
      { min: 0, max: 0 }
    );
  };

  const quickWinsCost = sumCosts(roadmap.quick_wins);
  const shortTermCost = sumCosts(roadmap.short_term);
  const mediumTermCost = sumCosts(roadmap.medium_term);
  const longTermCost = sumCosts(roadmap.long_term);

  return {
    quick_wins: quickWinsCost,
    short_term: shortTermCost,
    medium_term: mediumTermCost,
    long_term: longTermCost,
    total: {
      min: quickWinsCost.min + shortTermCost.min + mediumTermCost.min + longTermCost.min,
      max: quickWinsCost.max + shortTermCost.max + mediumTermCost.max + longTermCost.max,
    },
  };
}

/**
 * Generate executive summary of recommendations
 */
export function generateExecutiveSummary(
  recommendations: ReadinessRecommendation[],
  overallScore: number
): string {
  const criticalCount = recommendations.filter(r => r.priority === 'critical').length;
  const highCount = recommendations.filter(r => r.priority === 'high').length;
  const quickWinsCount = recommendations.filter(r => r.timeframe === 'quick_win').length;

  const maturityLevel =
    overallScore < 20
      ? 'Awareness'
      : overallScore < 40
        ? 'Experimenting'
        : overallScore < 60
          ? 'Adopting'
          : overallScore < 80
            ? 'Optimizing'
            : 'Leading';

  return `Based on your AI readiness assessment (${Math.round(overallScore)}/100 - ${maturityLevel} level), we've identified ${recommendations.length} prioritized recommendations to advance your AI journey.

${criticalCount > 0 ? `${criticalCount} critical actions require immediate attention to establish foundation. ` : ''}${highCount} high-priority initiatives will drive meaningful progress over the next 6-12 months.

Focus on ${quickWinsCount} quick wins (0-3 months) to build momentum and demonstrate value, then scale successful pilots while addressing foundational gaps in data, infrastructure, and skills.`;
}

// ============================================================================
// EXPORT SERVICE
// ============================================================================

export const RecommendationGenerator = {
  generateRecommendations,
  sortRecommendations,
  createRoadmap,
  estimateRoadmapCost,
  generateExecutiveSummary,
};

export default RecommendationGenerator;
