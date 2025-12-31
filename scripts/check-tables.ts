/**
 * Check if KG tables exist using raw SQL query
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://afrulkxxzcmngbrdfuzj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcnVsa3h4emNtbmdicmRmdXpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzEzNzIxNiwiZXhwIjoyMDY4NzEzMjE2fQ.00fzC92PHO8CjMYvtMJ52BJTYirTQgXqOhDuR5fVQd0';

async function checkTables() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log('🔍 Checking database schema for Knowledge Graph tables...\n');

  // Query information_schema to check if tables exist
  const tablesToCheck = [
    'concepts',
    'concept_relationships',
    'course_concepts',
    'user_concept_mastery',
  ];

  for (const tableName of tablesToCheck) {
    // Use raw SQL to query information_schema
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = '${tableName}'
        );
      `,
    });

    console.log(`Table "${tableName}":`, data ? 'EXISTS' : 'NOT FOUND');
    if (error) {
      console.log(`  Error: ${error.message}`);
    }
  }
}

checkTables();
