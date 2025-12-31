/**
 * Apply Knowledge Graph Migration
 * Reads the migration file and executes it against the database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://afrulkxxzcmngbrdfuzj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('This migration requires service role key for admin operations');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('📦 Reading migration file...\n');

  const migrationPath = join(
    process.cwd(),
    'supabase',
    'migrations',
    '20251229_knowledge_graph_schema.sql'
  );

  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  console.log('🚀 Applying Knowledge Graph Schema Migration...\n');

  // Execute the migration SQL
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: migrationSQL,
  });

  if (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  console.log('✅ Migration applied successfully!\n');
  console.log('Created tables:');
  console.log('  - knowledge_graph_concepts');
  console.log('  - knowledge_graph_concept_relationships');
  console.log('  - knowledge_graph_course_concepts');
  console.log('  - knowledge_graph_user_mastery');
  console.log('  - knowledge_graph_mastery_evidence\n');

  console.log('You can now run the seeding script to populate concepts.');
}

applyMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
