/**
 * Check what content is available for indexing
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://afrulkxxzcmngbrdfuzj.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcnVsa3h4emNtbmdicmRmdXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzcyMTYsImV4cCI6MjA2ODcxMzIxNn0.IdaUilLFJ8wnrok1sMI2peX9hBILeYLBA86caryjCk8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAvailableContent() {
  console.log('📦 Checking available content for indexing...\n');

  // Learning paths
  try {
    const { count } = await supabase
      .from('ai_generated_learning_paths')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    console.log(`✅ Learning paths (active): ${count || 0}`);
  } catch (err: any) {
    console.log(`❌ Learning paths: ${err.message}`);
  }

  // Flashcard decks
  try {
    const { count } = await supabase
      .from('flashcard_decks')
      .select('*', { count: 'exact', head: true });
    console.log(`✅ Flashcard decks: ${count || 0}`);
  } catch (err: any) {
    console.log(`❌ Flashcard decks: ${err.message}`);
  }

  // Assessment questions (for future expansion)
  try {
    const { count } = await supabase
      .from('assessment_questions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    console.log(`✅ Assessment questions (active): ${count || 0}`);
  } catch (err: any) {
    console.log(`❌ Assessment questions: ${err.message}`);
  }

  // Forum threads (for future expansion)
  try {
    const { count } = await supabase
      .from('forum_threads')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);
    console.log(`✅ Forum threads (active): ${count || 0}`);
  } catch (err: any) {
    console.log(`❌ Forum threads: ${err.message}`);
  }

  // AI tools (for future expansion)
  try {
    const { count } = await supabase
      .from('ai_tools')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    console.log(`✅ AI tools (active): ${count || 0}`);
  } catch (err: any) {
    console.log(`❌ AI tools: ${err.message}`);
  }

  // Lingo lessons (for future expansion)
  try {
    const { count } = await supabase
      .from('lingo_lessons')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);
    console.log(`✅ Lingo lessons (published): ${count || 0}`);
  } catch (err: any) {
    console.log(`❌ Lingo lessons: ${err.message}`);
  }

  console.log('\n✅ Content availability check complete');
}

checkAvailableContent().catch(console.error);
