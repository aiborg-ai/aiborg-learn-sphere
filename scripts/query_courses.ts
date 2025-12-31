/**
 * Quick script to query sample course data
 * Run with: npx tsx scripts/query_courses.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://afrulkxxzcmngbrdfuzj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function queryCourses() {
  console.log('Querying sample courses...\n');

  const { data, error } = await supabase
    .from('courses')
    .select('id, title, category, keywords, prerequisites, level')
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Sample Courses:');
  console.log(JSON.stringify(data, null, 2));
}

queryCourses();
