/**
 * Contract Tests Setup
 * Configures test environment for database contract testing
 */

import { beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { logger } from '@/utils/logger';

// ============================================================================
// ENVIRONMENT SETUP
// ============================================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  logger.warn(
    '⚠️  Contract tests require VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables'
  );
  logger.warn('   Tests will be skipped if these are not set.');
}

// ============================================================================
// SUPABASE CLIENT FOR TESTS
// ============================================================================

export const testClient =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

// ============================================================================
// TEST LIFECYCLE HOOKS
// ============================================================================

beforeAll(async () => {
  if (!testClient) {
    logger.warn('⚠️  Skipping contract tests: Supabase credentials not configured');
    return;
  }

  logger.info('🔧 Setting up contract test environment...');

  try {
    // Verify database connection
    const { error } = await testClient
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (error) {
      logger.error('❌ Failed to connect to database:', error);
      throw new Error('Database connection failed');
    }

    logger.info('✅ Database connection verified');

    // Note: Seed data should be loaded separately via SQL files
    // This setup just verifies the connection
  } catch (_error) {
    logger.error('❌ Contract test setup failed:', _error);
    throw error;
  }
});

beforeEach(() => {
  // Reset any test-specific state before each test
  // Add test-specific setup here if needed
});

afterAll(async () => {
  if (!testClient) return;

  logger.info('🧹 Cleaning up contract test environment...');

  // Optional: Clean up test data
  // Uncomment if you want automatic cleanup
  /*
  try {
    await testClient.rpc('cleanup_test_users');
    await testClient.rpc('cleanup_test_courses');
    logger.info('✅ Test data cleaned up');
  } catch (_error) {
    logger.warn('⚠️  Failed to cleanup test data:', _error);
  }
  */
});

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Checks if contract tests can run
 */
export function canRunContractTests(): boolean {
  return testClient !== null;
}

/**
 * Skips test if contract tests cannot run
 */
export function skipIfNoDatabase() {
  if (!canRunContractTests()) {
    logger.warn('⏭️  Skipping test: Database not configured');
    return true;
  }
  return false;
}

/**
 * Test user IDs for consistent testing
 */
export const TEST_USER_IDS = {
  user: '00000000-0000-0000-0000-000000000001',
  admin: '00000000-0000-0000-0000-000000000002',
  instructor: '00000000-0000-0000-0000-000000000003',
} as const;

/**
 * Test course titles for finding test data
 */
export const TEST_COURSE_TITLES = {
  webDev: 'Introduction to Web Development',
  python: 'Intermediate Python Programming',
  ai: 'Enterprise AI Solutions',
} as const;

// ============================================================================
// EXPORTS
// ============================================================================

export { testClient as supabase };
