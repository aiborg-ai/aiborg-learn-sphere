/**
 * Script to apply Knowledge Graph migration directly
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://afrulkxxzcmngbrdfuzj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcnVsa3h4emNtbmdicmRmdXpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzEzNzIxNiwiZXhwIjoyMDY4NzEzMjE2fQ.00fzC92PHO8CjMYvtMJ52BJTYirTQgXqOhDuR5fVQd0';

async function applyMigration() {
  console.log('🚀 Applying Knowledge Graph migration...\n');

  // Create Supabase client with service role (admin access)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Read the migration file
  const migrationPath = join(
    __dirname,
    '../supabase/migrations/20250128_knowledge_graph_foundation.sql'
  );

  console.log(`📄 Reading migration: ${migrationPath}\n`);
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  try {
    // Execute the migration SQL
    console.log('⚙️  Executing migration SQL...\n');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL,
    });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      console.error('\nFull error:', error);
      process.exit(1);
    }

    console.log('✅ Migration executed successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...\n');

    const tablesToCheck = [
      'concepts',
      'concept_relationships',
      'course_concepts',
      'user_concept_mastery',
    ];

    for (const table of tablesToCheck) {
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.warn(`⚠️  Could not verify table ${table}:`, countError.message);
      } else {
        console.log(`✅ Table '${table}' exists (${count || 0} rows)`);
      }
    }

    console.log('\n✨ Knowledge Graph foundation migration complete!\n');

    // Show seed data
    console.log('📊 Checking seed data...\n');
    const { data: concepts, error: conceptsError } = await supabase
      .from('concepts')
      .select('name, type, difficulty_level')
      .order('difficulty_level');

    if (!conceptsError && concepts) {
      console.log(`Created ${concepts.length} seed concepts:`);
      concepts.forEach((c: any) => {
        console.log(`  - ${c.name} (${c.type}, ${c.difficulty_level})`);
      });
    }

    const { data: relationships, error: relsError } = await supabase
      .from('concept_relationships')
      .select('relationship_type')
      .order('relationship_type');

    if (!relsError && relationships) {
      const typeCounts = relationships.reduce((acc: any, r: any) => {
        acc[r.relationship_type] = (acc[r.relationship_type] || 0) + 1;
        return acc;
      }, {});

      console.log(`\nCreated ${relationships.length} relationships:`);
      Object.entries(typeCounts).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}`);
      });
    }
  } catch (err: any) {
    console.error('❌ Unexpected error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

applyMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
