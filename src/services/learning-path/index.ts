/**
 * Learning Path Generator - Barrel Export
 * Exports all services and types for the learning path generator
 */

// Main generator
export { LearningPathGenerator, pathGenerator } from './LearningPathGenerator';

// Services
export { GapAnalysisService, gapAnalysisService } from './GapAnalysisService';
export { ResourceFetchService, resourceFetchService } from './ResourceFetchService';
export { ContentSelectionService, contentSelectionService } from './ContentSelectionService';
export { ContentSequencingService, contentSequencingService } from './ContentSequencingService';
export { MilestoneService, milestoneService } from './MilestoneService';
export { PathMetadataService, pathMetadataService } from './PathMetadataService';

// Types
export type {
  AssessmentData,
  CategoryInsight,
  LearningGoal,
  PathItem,
  GeneratedPath,
  Milestone,
  GapAnalysis,
  WeakCategory,
  PriorityCategory,
  LearningResources,
  Course,
  Workshop,
  Exercise,
  DifficultyMapping,
} from './types';

export { DIFFICULTY_MAP, LEVEL_TO_DIFFICULTY } from './types';
