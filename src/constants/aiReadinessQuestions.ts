// ============================================================================
// AI Readiness Assessment Question Metadata
// Labels, help text, and configuration for all assessment questions
// ============================================================================

import type { QuestionMeta, SectionMeta } from '@/types/aiReadiness';

// ============================================================================
// SECTION 1: STRATEGIC ALIGNMENT
// ============================================================================

export const strategicAlignmentQuestions: QuestionMeta[] = [
  {
    key: 'executive_buy_in',
    label: 'Executive Buy-In',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'How strong is leadership commitment to AI adoption?',
  },
  {
    key: 'budget_allocated',
    label: 'Budget Allocation',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Has budget been allocated specifically for AI initiatives?',
  },
  {
    key: 'clear_use_cases',
    label: 'Clear Use Cases',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Have specific AI use cases been identified and documented?',
  },
  {
    key: 'kpis_defined',
    label: 'KPIs Defined',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Are success metrics and KPIs defined for AI initiatives?',
  },
  {
    key: 'change_champions',
    label: 'Change Champions',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Are there designated champions to drive AI adoption?',
  },
  {
    key: 'competitive_pressure',
    label: 'Competitive Pressure',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'How strong is the competitive pressure to adopt AI?',
  },
  {
    key: 'innovation_culture',
    label: 'Innovation Culture',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Does your organization have a culture of innovation?',
  },
  {
    key: 'strategic_roadmap',
    label: 'Strategic Roadmap',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Is there a strategic roadmap for AI implementation?',
  },
  {
    key: 'roi_expectations',
    label: 'ROI Expectations',
    type: 'textarea',
    required: false,
    placeholder: 'Describe your expected return on investment from AI initiatives...',
    helpText: 'What business outcomes do you expect from AI?',
  },
  {
    key: 'priority_use_cases',
    label: 'Priority Use Cases',
    type: 'array',
    required: false,
    placeholder: 'e.g., Customer service automation, predictive maintenance...',
    helpText: 'List your top 3-5 priority AI use cases',
  },
];

// ============================================================================
// SECTION 2: DATA MATURITY
// ============================================================================

export const dataMaturityQuestions: QuestionMeta[] = [
  {
    key: 'data_quality',
    label: 'Data Quality',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'How would you rate the overall quality of your data?',
  },
  {
    key: 'data_accessibility',
    label: 'Data Accessibility',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Can teams easily access the data they need?',
  },
  {
    key: 'data_governance',
    label: 'Data Governance',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Are data governance policies and procedures in place?',
  },
  {
    key: 'data_documentation',
    label: 'Data Documentation',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Is your data well-documented (data dictionaries, schemas)?',
  },
  {
    key: 'privacy_compliance',
    label: 'Privacy Compliance',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Are you compliant with data privacy regulations (GDPR, etc.)?',
  },
  {
    key: 'security_posture',
    label: 'Security Posture',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'How strong is your data security infrastructure?',
  },
  {
    key: 'data_integration',
    label: 'Data Integration',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Can data from different systems be easily integrated?',
  },
  {
    key: 'master_data_mgmt',
    label: 'Master Data Management',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Is there a master data management strategy in place?',
  },
  {
    key: 'data_volume_adequacy',
    label: 'Data Volume',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Do you have sufficient data volume for AI/ML training?',
  },
  {
    key: 'data_silos',
    label: 'Data Silos (Reverse Scored)',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'How fragmented is your data across systems? (1=highly siloed, 5=well integrated)',
  },
  {
    key: 'key_data_sources',
    label: 'Key Data Sources',
    type: 'array',
    required: false,
    placeholder: 'e.g., CRM, ERP, Web Analytics...',
    helpText: 'List your primary data sources',
  },
  {
    key: 'data_challenges',
    label: 'Data Challenges',
    type: 'textarea',
    required: false,
    placeholder: 'Describe your main data-related challenges...',
    helpText: 'What are your biggest data obstacles for AI?',
  },
];

// ============================================================================
// SECTION 3: TECHNICAL INFRASTRUCTURE
// ============================================================================

export const techInfrastructureQuestions: QuestionMeta[] = [
  {
    key: 'cloud_readiness',
    label: 'Cloud Readiness',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'How cloud-ready is your infrastructure?',
  },
  {
    key: 'it_systems_capability',
    label: 'IT Systems Capability',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Can your IT systems support AI workloads?',
  },
  {
    key: 'api_availability',
    label: 'API Availability',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Do you have well-documented APIs for key systems?',
  },
  {
    key: 'security_infrastructure',
    label: 'Security Infrastructure',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'How robust is your security infrastructure?',
  },
  {
    key: 'scalability',
    label: 'Scalability',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Can your infrastructure scale to handle AI workloads?',
  },
  {
    key: 'integration_capability',
    label: 'Integration Capability',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'How easy is it to integrate new tools and systems?',
  },
  {
    key: 'vendor_ecosystem',
    label: 'Vendor Ecosystem',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Do you have relationships with AI technology vendors?',
  },
  {
    key: 'it_support_capacity',
    label: 'IT Support Capacity',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Can your IT team support AI implementation?',
  },
  {
    key: 'current_tech_stack',
    label: 'Current Tech Stack',
    type: 'textarea',
    required: false,
    placeholder: 'Describe your current technology stack...',
    helpText: 'What are your primary technologies and platforms?',
  },
  {
    key: 'planned_upgrades',
    label: 'Planned Upgrades',
    type: 'array',
    required: false,
    placeholder: 'e.g., Cloud migration, API development...',
    helpText: 'List planned technology improvements',
  },
];

// ============================================================================
// SECTION 4: HUMAN CAPITAL
// ============================================================================

export const humanCapitalQuestions: QuestionMeta[] = [
  {
    key: 'executive_ai_literacy',
    label: 'Executive AI Literacy',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'How well do executives understand AI capabilities?',
  },
  {
    key: 'technical_team_skills',
    label: 'Technical Team Skills',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Does your technical team have AI/ML skills?',
  },
  {
    key: 'business_team_literacy',
    label: 'Business Team AI Literacy',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'How AI-literate are your business teams?',
  },
  {
    key: 'training_budget',
    label: 'Training Budget',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Is budget allocated for AI training and upskilling?',
  },
  {
    key: 'hiring_capability',
    label: 'Hiring Capability',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Can you attract and hire AI talent?',
  },
  {
    key: 'external_expertise',
    label: 'External Expertise',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Do you have access to external AI consultants/partners?',
  },
  {
    key: 'learning_culture',
    label: 'Learning Culture',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Is there a strong culture of continuous learning?',
  },
  {
    key: 'skills_gap_awareness',
    label: 'Skills Gap Awareness',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Have you identified specific AI skills gaps?',
  },
  {
    key: 'retention_capability',
    label: 'Retention Capability',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Can you retain skilled technical talent?',
  },
  {
    key: 'change_management',
    label: 'Change Management Skills',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Does your team have change management capabilities?',
  },
  {
    key: 'critical_skill_gaps',
    label: 'Critical Skill Gaps',
    type: 'array',
    required: false,
    placeholder: 'e.g., ML engineering, data science, AI ethics...',
    helpText: 'List your most critical skills gaps',
  },
  {
    key: 'training_priorities',
    label: 'Training Priorities',
    type: 'textarea',
    required: false,
    placeholder: 'Describe your training priorities...',
    helpText: 'What are your top training needs?',
  },
];

// ============================================================================
// SECTION 5: PROCESS MATURITY
// ============================================================================

export const processMaturityQuestions: QuestionMeta[] = [
  {
    key: 'process_documentation',
    label: 'Process Documentation',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Are business processes well-documented?',
  },
  {
    key: 'process_standardization',
    label: 'Process Standardization',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'How standardized are your processes across the organization?',
  },
  {
    key: 'automation_level',
    label: 'Current Automation Level',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'How automated are your current processes?',
  },
  {
    key: 'performance_metrics',
    label: 'Performance Metrics',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Do you track process performance metrics?',
  },
  {
    key: 'continuous_improvement',
    label: 'Continuous Improvement',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Is there a culture of continuous process improvement?',
  },
  {
    key: 'workflow_efficiency',
    label: 'Workflow Efficiency',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'How efficient are your current workflows?',
  },
  {
    key: 'decision_making_speed',
    label: 'Decision Making Speed',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'How quickly can decisions be made and executed?',
  },
  {
    key: 'quality_control',
    label: 'Quality Control',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'How robust are your quality control processes?',
  },
  {
    key: 'automation_opportunities',
    label: 'Automation Opportunities',
    type: 'array',
    required: false,
    placeholder: 'e.g., Invoice processing, customer support...',
    helpText: 'List processes ripe for automation',
  },
  {
    key: 'process_pain_points',
    label: 'Process Pain Points',
    type: 'textarea',
    required: false,
    placeholder: 'Describe your biggest process inefficiencies...',
    helpText: 'What are your most painful process bottlenecks?',
  },
];

// ============================================================================
// SECTION 6: CHANGE READINESS
// ============================================================================

export const changeReadinessQuestions: QuestionMeta[] = [
  {
    key: 'leadership_commitment',
    label: 'Leadership Commitment',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'How committed is leadership to driving change?',
  },
  {
    key: 'employee_sentiment',
    label: 'Employee Sentiment',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'How positive are employees about AI adoption?',
  },
  {
    key: 'communication_plan',
    label: 'Communication Plan',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Is there a plan for communicating changes?',
  },
  {
    key: 'pilot_approach',
    label: 'Pilot Approach',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Do you have a strategy for piloting AI initiatives?',
  },
  {
    key: 'risk_tolerance',
    label: 'Risk Tolerance',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'How tolerant is the organization of change-related risks?',
  },
  {
    key: 'change_history',
    label: 'Change History',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'How successful have past change initiatives been?',
  },
  {
    key: 'resistance_management',
    label: 'Resistance Management',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Can you effectively manage resistance to change?',
  },
  {
    key: 'success_celebration',
    label: 'Success Celebration',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Does the organization celebrate and share wins?',
  },
  {
    key: 'anticipated_resistance',
    label: 'Anticipated Resistance',
    type: 'textarea',
    required: false,
    placeholder: 'Describe areas where you expect resistance...',
    helpText: 'Where do you expect the most pushback?',
  },
  {
    key: 'mitigation_strategies',
    label: 'Mitigation Strategies',
    type: 'array',
    required: false,
    placeholder: 'e.g., Training programs, pilot projects...',
    helpText: 'How will you address resistance?',
  },
];

// ============================================================================
// SECTION METADATA
// ============================================================================

export const sectionsMeta: SectionMeta[] = [
  {
    section: 'strategic',
    title: 'Strategic Alignment',
    description: 'Assess leadership commitment, budget, and strategic clarity for AI adoption',
    icon: 'target',
    order: 1,
    questions: strategicAlignmentQuestions,
  },
  {
    section: 'data',
    title: 'Data Maturity',
    description: 'Evaluate data quality, governance, security, and AI-readiness',
    icon: 'database',
    order: 2,
    questions: dataMaturityQuestions,
  },
  {
    section: 'tech',
    title: 'Technical Infrastructure',
    description: 'Review IT systems, cloud capabilities, APIs, and scalability',
    icon: 'server',
    order: 3,
    questions: techInfrastructureQuestions,
  },
  {
    section: 'human',
    title: 'Human Capital',
    description: 'Assess AI literacy, skills gaps, training, and change management capacity',
    icon: 'users',
    order: 4,
    questions: humanCapitalQuestions,
  },
  {
    section: 'process',
    title: 'Process Maturity',
    description: 'Evaluate process documentation, standardization, automation, and efficiency',
    icon: 'workflow',
    order: 5,
    questions: processMaturityQuestions,
  },
  {
    section: 'change',
    title: 'Change Readiness',
    description:
      'Measure organizational culture, resistance management, and readiness for transformation',
    icon: 'trending-up',
    order: 6,
    questions: changeReadinessQuestions,
  },
];

// ============================================================================
// RATING SCALE LABELS
// ============================================================================

export const ratingLabels: Record<number, string> = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Fair',
  4: 'Good',
  5: 'Excellent',
};

export const ratingColors: Record<number, string> = {
  1: '#EF4444', // red-500
  2: '#F97316', // orange-500
  3: '#F59E0B', // amber-500
  4: '#10B981', // emerald-500
  5: '#06B6D4', // cyan-500
};
