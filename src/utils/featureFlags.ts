/**
 * Feature Flags
 *
 * Centralized feature flag configuration and utilities
 */

/**
 * Check if knowledge graph features are enabled
 * Controls:
 * - Prerequisite checking before enrollment
 * - Concept mastery tracking
 * - Personalized recommendations
 * - User skill dashboard
 *
 * Default: true (enabled)
 */
export const USE_KNOWLEDGE_GRAPH = import.meta.env.VITE_USE_KNOWLEDGE_GRAPH !== 'false';

/**
 * Check if adaptive assessment is enabled
 * Controls:
 * - Adaptive vs standard assessment flow
 *
 * Default: true (enabled)
 */
export const USE_ADAPTIVE_ASSESSMENT = import.meta.env.VITE_USE_ADAPTIVE_ASSESSMENT !== 'false';
