/**
 * LTI 1.3 Integration Services
 *
 * Provides Learning Tools Interoperability (LTI) 1.3 integration
 * for connecting with Learning Management Systems like Canvas, Moodle, Blackboard, etc.
 */

// Core service
export { LTIService } from './LTIService';

// Types
export type {
  // Platform types
  LTIPlatform,
  LTIPlatformType,
  LTIPlatformSettings,
  LTIPlatformConfig,

  // Message types
  LTIMessageType,
  LTILaunchType,

  // Claims and launch data
  LTIClaims,
  LTILaunchData,

  // Roles
  LTIRole,

  // Deep linking
  LTIContentItem,
  DeepLinkingResponse,

  // AGS
  LTILineItem,
  LTIScore,
  LTIActivityProgress,
  LTIGradingProgress,

  // Database types
  LTIResourceLink,
  LTIUserMapping,
  LTILaunch,
  LTIGradeSubmission,
} from './types';

// Role URN constants
export { LTI_ROLE_URNS } from './types';
