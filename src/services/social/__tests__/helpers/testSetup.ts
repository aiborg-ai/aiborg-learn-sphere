/**
 * Test Setup Helpers for Organization Service Tests
 *
 * Provides authentication and cleanup utilities for integration tests
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Setup test authentication
 * Uses a test user or creates one if needed
 */
export async function setupTestAuth(): Promise<string> {
  // Try to get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return user.id;
  }

  // If no user is logged in, try to sign in with test user
  const testUser = {
    email: 'test.admin@example.com',
    password: 'TestAdmin123!',
  };

  const { data, error } = await supabase.auth.signInWithPassword(testUser);

  if (error || !data.user) {
    throw new Error(
      `Failed to authenticate test user. Please ensure test users are created via global setup. Error: ${error?.message}`
    );
  }

  return data.user.id;
}

/**
 * Cleanup test data
 */
export async function cleanupTestData(organizationIds: string[]) {
  for (const orgId of organizationIds) {
    // Delete in correct order due to foreign key constraints
    await supabase
      .from('team_assessment_results')
      .delete()
      .match({
        team_assessment_id: supabase
          .from('team_assessments')
          .select('id')
          .eq('organization_id', orgId),
      });

    await supabase.from('team_assessments').delete().eq('organization_id', orgId);
    await supabase.from('organization_members').delete().eq('organization_id', orgId);
    await supabase.from('organizations').delete().eq('id', orgId);
  }
}

/**
 * Create a test organization
 */
export async function createTestOrganization(name?: string) {
  const orgName = name || `Test Org ${Date.now()}`;

  const { data, error } = await supabase
    .from('organizations')
    .insert({
      name: orgName,
      description: 'Test organization',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Generate unique test name
 */
export function generateTestName(prefix: string): string {
  return `${prefix} ${Date.now()}_${Math.random().toString(36).substring(7)}`;
}
