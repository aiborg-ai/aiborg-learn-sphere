/**
 * Routes Index
 * Central export for all application routes
 *
 * Routes are organized by domain/feature area:
 * - Auth: Authentication and account management
 * - Admin: Administrative functions
 * - User: Personal dashboard and settings
 * - Course: Course browsing and participation
 * - Assessment: Various assessment tools
 * - Learning: Learning paths, flashcards, calendar
 * - Content: Blog, knowledge base, CMS
 * - Instructor: Teaching and classroom management
 * - Community: Forums, workshops, memberships
 * - Lingo: Language learning game
 * - Settings: Application configuration
 * - Public: Legal pages and miscellaneous
 */

import type { RouteConfig } from './types';
import { authRoutes } from './authRoutes';
import { adminRoutes } from './adminRoutes';
import { userRoutes } from './userRoutes';
import { courseRoutes } from './courseRoutes';
import { assessmentRoutes } from './assessmentRoutes';
import { learningRoutes } from './learningRoutes';
import { contentRoutes } from './contentRoutes';
import { instructorRoutes } from './instructorRoutes';
import { communityRoutes } from './communityRoutes';
import { lingoRoutes } from './lingoRoutes';
import { settingsRoutes } from './settingsRoutes';
import { publicRoutes } from './publicRoutes';
import { marketplaceRoutes } from './marketplaceRoutes';

/**
 * All application routes
 * Order matters: more specific routes should come before catch-all routes
 * The NotFound (*) route must be last
 */
export const allRoutes: RouteConfig[] = [
  ...authRoutes,
  ...adminRoutes,
  ...assessmentRoutes,
  ...instructorRoutes,
  ...courseRoutes,
  ...marketplaceRoutes,
  ...learningRoutes,
  ...lingoRoutes,
  ...settingsRoutes,
  ...contentRoutes,
  ...communityRoutes,
  ...userRoutes,
  ...publicRoutes, // Contains NotFound (*) route - must be last
];

// Named exports for selective use
export {
  authRoutes,
  adminRoutes,
  userRoutes,
  courseRoutes,
  assessmentRoutes,
  learningRoutes,
  contentRoutes,
  instructorRoutes,
  communityRoutes,
  lingoRoutes,
  settingsRoutes,
  publicRoutes,
  marketplaceRoutes,
};

// Type exports
export type { RouteConfig, RouteModule, SkeletonType } from './types';
