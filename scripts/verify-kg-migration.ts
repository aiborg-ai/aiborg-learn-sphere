/**
 * Script to verify Knowledge Graph tables exist
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://afrulkxxzcmngbrdfuzj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcnVsa3h4emNtbmdicmRmdXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzcyMTYsImV4cCI6MjA2ODcxMzIxNn0.IdaUilLFJ8wnrok1sMI2peX9hBILeYLBA86caryjCk8';

async function verifyMigration() {
  console.log('🔍 Verifying Knowledge Graph migration...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const tablesToCheck = [
    'concepts',
    'concept_relationships',
    'course_concepts',
    'user_concept_mastery',
  ];

  let allTablesExist = true;

  for (const table of tablesToCheck) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ Table '${table}' does NOT exist or is not accessible`);
        console.log(`   Error: ${error.message}`);
        allTablesExist = false;
      } else {
        console.log(`✅ Table '${table}' exists (${count || 0} rows)`);
      }
    } catch (err: any) {
      console.log(`❌ Error checking table '${table}':`, err.message);
      allTablesExist = false;
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');

  if (allTablesExist) {
    console.log('✨ All Knowledge Graph tables exist!\n');
    console.log('Checking seed data...\n');

    // Check concepts
    const { data: concepts, error: conceptsError } = await supabase
      .from('concepts')
      .select('name, type, difficulty_level')
      .order('difficulty_level');

    if (!conceptsError && concepts) {
      console.log(`📚 Found ${concepts.length} concepts:`);
      if (concepts.length > 0) {
        concepts.slice(0, 5).forEach((c: any) => {
          console.log(`   - ${c.name} (${c.type}, ${c.difficulty_level})`);
        });
        if (concepts.length > 5) {
          console.log(`   ... and ${concepts.length - 5} more`);
        }
      }
    }

    // Check relationships
    const { data: relationships, error: relsError } = await supabase
      .from('concept_relationships')
      .select('relationship_type');

    if (!relsError && relationships) {
      console.log(`\n🔗 Found ${relationships.length} relationships`);
    }

    console.log('\n✅ Migration verification PASSED\n');
    return true;
  } else {
    console.log('⚠️  Migration needs to be applied\n');
    console.log('To apply the migration, you have two options:\n');
    console.log('1. Manual (recommended):');
    console.log('   - Go to Supabase Dashboard → SQL Editor');
    console.log('   - Copy the contents of:');
    console.log('     supabase/migrations/20250128_knowledge_graph_foundation.sql');
    console.log('   - Paste and run the SQL\n');
    console.log('2. CLI (if db push issue is resolved):');
    console.log('   - Run: npx supabase db push\n');
    return false;
  }
}

verifyMigration()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
