/**
 * Get detailed error from ai-chat-rag function
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://afrulkxxzcmngbrdfuzj.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcnVsa3h4emNtbmdicmRmdXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzcyMTYsImV4cCI6MjA2ODcxMzIxNn0.IdaUilLFJ8wnrok1sMI2peX9hBILeYLBA86caryjCk8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getError() {
  console.log('🔍 Getting detailed error from ai-chat-rag...\n');

  try {
    // Make a raw fetch call to get the full response
    const response = await fetch(`${supabaseUrl}/functions/v1/ai-chat-rag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Test message' }],
        audience: 'professional',
        enable_rag: false,
      }),
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log(`\nResponse body:`);
    console.log(text);

    try {
      const json = JSON.parse(text);
      console.log(`\nParsed JSON:`);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(`\n(Response is not JSON)`);
    }
  } catch (err: any) {
    console.log(`\n❌ Error: ${err.message}`);
    console.log(err);
  }
}

getError().catch(console.error);
