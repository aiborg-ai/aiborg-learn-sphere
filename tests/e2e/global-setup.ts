/**
 * Global Setup for E2E Tests
 * Creates test users in Supabase if they don't already exist
 */

import { createClient } from '@supabase/supabase-js';
import { TEST_USERS } from './utils/test-data';
import { config } from 'dotenv';
import { resolve } from 'path';

async function globalSetup() {
  console.log('Running global E2E test setup...');

  // Load environment variables from .env.local
  config({ path: resolve(process.cwd(), '.env.local') });

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  // Use the hardcoded service role key for test setup
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcnVsa3h4emNtbmdicmRmdXpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzEzNzIxNiwiZXhwIjoyMDY4NzEzMjE2fQ.00fzC92PHO8CjMYvtMJ52BJTYirTQgXqOhDuR5fVQd0';

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    console.error('Required: VITE_SUPABASE_URL');
    throw new Error('Missing Supabase credentials for test setup');
  }

  // Create Supabase admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('Creating test users...');

  // Create each test user
  for (const [roleName, testUser] of Object.entries(TEST_USERS)) {
    try {
      console.log(`Checking if ${testUser.email} exists...`);

      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const userExists = existingUsers?.users.some(u => u.email === testUser.email);

      if (userExists) {
        console.log(`✓ User ${testUser.email} already exists`);
        continue;
      }

      // Create user
      console.log(`Creating user ${testUser.email}...`);
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true, // Auto-confirm email for test users
        user_metadata: {
          display_name: testUser.fullName,
        },
      });

      if (authError) {
        console.error(`Failed to create auth user ${testUser.email}:`, authError.message);
        continue;
      }

      console.log(`✓ Created auth user ${testUser.email}`);

      // Create profile with role
      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          user_id: authData.user.id,
          email: testUser.email,
          display_name: testUser.fullName,
          role: testUser.role,
        });

        if (profileError) {
          console.error(`Failed to create profile for ${testUser.email}:`, profileError.message);
        } else {
          console.log(`✓ Created profile for ${testUser.email} with role ${testUser.role}`);
        }
      }
    } catch (error) {
      console.error(`Error setting up user ${testUser.email}:`, error);
    }
  }

  console.log('Test setup complete!');
}

export default globalSetup;
