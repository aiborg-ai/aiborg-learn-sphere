/**
 * Database Helpers for Test Isolation
 * Provides utilities for setting up and tearing down test data
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Create a Supabase client with service role key for test operations
 * This bypasses RLS policies to allow test data cleanup
 */
export function createTestClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing Supabase credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.'
    );
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Cleanup test data by email pattern
 * Useful for removing all test users created during test runs
 */
export async function cleanupTestUsers(emailPattern: string = '%test%@example.com') {
  const client = createTestClient();

  try {
    // Delete from profiles (cascades to related tables)
    const { error: profilesError } = await client
      .from('profiles')
      .delete()
      .ilike('email', emailPattern);

    if (profilesError) {
      throw profilesError;
    }

    // Delete from auth.users (requires admin API)
    // Note: This requires the service role key
    const { data: users } = await client.auth.admin.listUsers();
    const testUsers = users.users.filter(
      user => user.email?.toLowerCase().includes('test') && user.email?.includes('@example.com')
    );

    for (const user of testUsers) {
      await client.auth.admin.deleteUser(user.id);
    }

    return { success: true, deletedCount: testUsers.length };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Create a test user in the database
 */
export async function createTestUser(user: {
  email: string;
  password: string;
  role?: string;
  firstName?: string;
  lastName?: string;
}) {
  const client = createTestClient();

  try {
    // Create auth user
    const { data: authData, error: authError } = await client.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      throw authError;
    }

    // Update profile with role and names
    const { error: profileError } = await client
      .from('profiles')
      .update({
        role: user.role || 'student',
        first_name: user.firstName,
        last_name: user.lastName,
      })
      .eq('id', authData.user.id);

    if (profileError) {
      throw profileError;
    }

    return { success: true, user: authData.user };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Delete a test user by email
 */
export async function deleteTestUser(email: string) {
  const client = createTestClient();

  try {
    // Get user by email
    const { data: users } = await client.auth.admin.listUsers();
    const user = users.users.find(u => u.email === email);

    if (!user) {
      return { success: true, message: 'User not found' };
    }

    // Delete from profiles
    await client.from('profiles').delete().eq('id', user.id);

    // Delete from auth
    await client.auth.admin.deleteUser(user.id);

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Cleanup vault claims by email
 */
export async function cleanupVaultClaims(userEmail?: string) {
  const client = createTestClient();

  try {
    let query = client.from('vault_subscription_claims').delete();

    if (userEmail) {
      query = query.eq('user_email', userEmail);
    } else {
      // Delete all test claims (emails containing 'test' or '@example.com')
      query = query.or('user_email.ilike.%test%,user_email.ilike.%@example.com%');
    }

    const { error } = await query;

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Cleanup enrollments by user ID
 */
export async function cleanupEnrollments(userId?: string) {
  const client = createTestClient();

  try {
    let query = client.from('enrollments').delete();

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      // Delete all enrollments for test users
      const { data: testProfiles } = await client
        .from('profiles')
        .select('id')
        .ilike('email', '%test%@example.com%');

      if (testProfiles && testProfiles.length > 0) {
        const testUserIds = testProfiles.map(p => p.id);
        query = query.in('user_id', testUserIds);
      }
    }

    const { error } = await query;

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Cleanup all test data
 * Use this in global teardown to ensure clean state
 */
export async function cleanupAllTestData() {
  try {
    await cleanupVaultClaims();
    await cleanupEnrollments();
    await cleanupTestUsers();

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Wait for database operation to complete
 * Useful for ensuring data is written before assertions
 */
export async function waitForDbOperation(timeout: number = 5000): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

/**
 * Check if a record exists in the database
 */
export async function recordExists(table: string, column: string, value: string): Promise<boolean> {
  const client = createTestClient();

  try {
    const { data, error } = await client.from(table).select('id').eq(column, value).maybeSingle();

    if (error) {
      throw error;
    }

    return !!data;
  } catch (error) {
    return false;
  }
}
