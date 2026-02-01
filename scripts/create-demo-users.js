/**
 * Create Demo Users Script
 * Run this script to create demo users in Supabase
 *
 * Usage: node scripts/create-demo-users.js
 *
 * Prerequisites:
 * - Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 * - Or create users manually in Supabase Dashboard
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://afrulkxxzcmngbrdfuzj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DEMO_USERS = [
  {
    email: 'demo-learner@aiborg.ai',
    password: 'demo123!secure',
    user_metadata: {
      role: 'user',
      demo_account: true,
      display_name: 'Demo Learner',
      first_name: 'Demo',
      last_name: 'Learner',
    },
  },
  {
    email: 'demo-admin@aiborg.ai',
    password: 'demo123!secure',
    user_metadata: {
      role: 'admin',
      demo_account: true,
      display_name: 'Demo Admin',
      first_name: 'Demo',
      last_name: 'Admin',
    },
  },
];

async function createUser(user) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: user.user_metadata,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    if (
      data.msg?.includes('already been registered') ||
      data.message?.includes('already been registered')
    ) {
      console.log(`⚠️  User ${user.email} already exists`);
      return { exists: true, email: user.email };
    }
    throw new Error(`Failed to create ${user.email}: ${JSON.stringify(data)}`);
  }

  return data;
}

async function createProfile(userId, user) {
  const profile = {
    id: userId,
    email: user.email,
    display_name: user.user_metadata.display_name,
    first_name: user.user_metadata.first_name,
    last_name: user.user_metadata.last_name,
    role: user.user_metadata.role,
    preferences: { theme: 'system', notifications: true, demo_mode: true },
    bio:
      user.user_metadata.role === 'admin'
        ? "Demo admin account for exploring AIBORG's full capabilities."
        : 'Demo learner account for exploring AIBORG as a student.',
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    const data = await response.json();
    console.log(`⚠️  Could not create profile for ${user.email}: ${JSON.stringify(data)}`);
    return null;
  }

  return true;
}

async function main() {
  console.log('🚀 Creating Demo Users for AIBORG\n');

  if (!SUPABASE_SERVICE_KEY) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY not set!\n');
    console.log('Please either:');
    console.log('1. Set the environment variable:');
    console.log('   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
    console.log('   node scripts/create-demo-users.js\n');
    console.log('2. Or create users manually in Supabase Dashboard:\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('MANUAL SETUP INSTRUCTIONS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/auth/users\n');

    console.log('Create Demo Learner:');
    console.log('  • Click "Add user" → "Create new user"');
    console.log('  • Email: demo-learner@aiborg.ai');
    console.log('  • Password: demo123!secure');
    console.log('  • Check "Auto Confirm User"');
    console.log('  • Click "Create user"\n');

    console.log('Create Demo Admin:');
    console.log('  • Click "Add user" → "Create new user"');
    console.log('  • Email: demo-admin@aiborg.ai');
    console.log('  • Password: demo123!secure');
    console.log('  • Check "Auto Confirm User"');
    console.log('  • Click "Create user"\n');

    console.log('Then update admin role in SQL Editor:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'demo-admin@aiborg.ai';
`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(1);
  }

  for (const user of DEMO_USERS) {
    try {
      console.log(`Creating user: ${user.email}...`);
      const result = await createUser(user);

      if (result.exists) {
        console.log(`  → User already exists, skipping profile creation\n`);
        continue;
      }

      console.log(`  ✓ User created with ID: ${result.id}`);

      // Create profile
      const profileResult = await createProfile(result.id, user);
      if (profileResult) {
        console.log(`  ✓ Profile created\n`);
      }
    } catch (error) {
      console.error(`  ✗ Error: ${error.message}\n`);
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Demo Users Ready!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Demo Learner:');
  console.log('  Email: demo-learner@aiborg.ai');
  console.log('  Password: demo123!secure\n');
  console.log('Demo Admin:');
  console.log('  Email: demo-admin@aiborg.ai');
  console.log('  Password: demo123!secure\n');
  console.log('Access the demo at: /demo');
}

main().catch(console.error);
