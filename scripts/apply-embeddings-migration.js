#!/usr/bin/env node

/**
 * Apply Embeddings Migration Script
 *
 * This script applies the content_embeddings table migration directly to Supabase.
 * Run with: node scripts/apply-embeddings-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get Supabase credentials from environment
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Read migration file
const migrationPath = join(__dirname, '../supabase/migrations/20251112132757_ai_recommendations_system.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

console.log('🚀 Applying embeddings migration...\n');
console.log('Migration file:', migrationPath);
console.log('Migration size:', migrationSQL.length, 'bytes\n');

// Note: We can't execute raw SQL with anon key
console.log('⚠️  IMPORTANT: Cannot execute SQL migrations with anon key');
console.log('\n📋 To apply this migration, you have 3 options:\n');
console.log('Option 1: Use Supabase Dashboard (Recommended)');
console.log('  1. Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/editor');
console.log('  2. Click "SQL Editor" in the left sidebar');
console.log('  3. Paste the migration SQL');
console.log('  4. Click "Run"\n');

console.log('Option 2: Use Supabase CLI with access token');
console.log('  1. Get your access token from: https://supabase.com/dashboard/account/tokens');
console.log('  2. Run: npx supabase login');
console.log('  3. Run: npx supabase db push --linked\n');

console.log('Option 3: Execute via browser console');
console.log('  1. Start dev server: npm run dev');
console.log('  2. Open browser at http://localhost:8080');
console.log('  3. Open DevTools console (F12)');
console.log('  4. Run the commands shown in the guide below\n');

console.log('Migration SQL:');
console.log('─'.repeat(80));
console.log(migrationSQL);
console.log('─'.repeat(80));

console.log('\n✅ Migration file is ready to apply');
console.log('Please use one of the options above to execute it.');
