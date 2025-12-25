/**
 * Types for Skills Assessment Results Page
 *
 * Defines interfaces for career-focused assessment results including:
 * - Career readiness metrics
 * - Skill gap analysis
 * - Peer benchmarking
 * - Personalized learning paths
 */

import type { AssessmentToolAttempt } from './assessmentTools';
import type {
  UserSkill,
  SkillRecommendation,
  JobRoleMatch,
  JobRole,
} from '@/services/skills/SkillExtractionService';

/**
 * User's career goal with associated job role
 */
export interface UserCareerGoal {
  id: string;
  user_id: string;
  job_role_id: string;
  job_role: JobRole;
  target_date: string | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Enhanced job role match with additional career insights
 */
export interface EnhancedJobRoleMatch extends JobRoleMatch {
  job_role: JobRole;
  estimated_weeks_to_close: number;
  next_milestone: string;
  competitive_advantage: string[];
  readiness_level: 'not_ready' | 'developing' | 'ready' | 'exceeds';
}

/**
 * Tiered skill recommendations by priority
 */
export interface TieredRecommendations {
  critical: SkillRecommendation[]; // Must-do (critical path)
  accelerators: SkillRecommendation[]; // Should-do (accelerators)
  bonus: SkillRecommendation[]; // Could-do (bonus, trending)
}

/**
 * Skill percentile for benchmarking
 */
export interface SkillPercentile {
  skillId: string;
  skillName: string;
  userScore: number;
  peerAverage: number;
  percentile: number;
  category?: string;
}

/**
 * Complete career-focused assessment results
 */
export interface CareerFocusedResults {
  attempt: AssessmentToolAttempt;
  userSkills: UserSkill[];
  careerGoals: UserCareerGoal[];
  primaryGoal: UserCareerGoal | null;
  careerMatch: EnhancedJobRoleMatch | null;
  verifiedSkillsCount: number;
  skillGapsCount: number;
  percentileRank: number;
  recommendations: TieredRecommendations;
  benchmarks: SkillPercentile[];
}

/**
 * Benchmark group options for peer comparison
 */
export type BenchmarkGroup = 'industry' | 'role' | 'experience_level';

/**
 * Skill assessment category performance
 */
export interface CategoryPerformance {
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
  questionsAnswered: number;
  correctAnswers: number;
}
