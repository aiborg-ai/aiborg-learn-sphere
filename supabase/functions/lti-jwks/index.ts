/**
 * LTI JWKS Endpoint
 *
 * Provides the JSON Web Key Set (JWKS) for LTI platforms to verify
 * signatures on JWTs issued by this tool (e.g., deep linking responses).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only accept GET requests
    if (req.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all active platforms with their public keys
    const { data: platforms, error } = await supabase
      .from('lti_platforms')
      .select('tool_public_key, tool_kid')
      .eq('is_active', true)
      .not('tool_public_key', 'is', null)
      .not('tool_kid', 'is', null);

    if (error) {
      console.error('Failed to fetch platforms:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch keys' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build JWKS
    const keys: jose.JWK[] = [];

    for (const platform of platforms || []) {
      try {
        // Parse PEM public key
        const publicKey = await jose.importSPKI(platform.tool_public_key, 'RS256');
        const jwk = await jose.exportJWK(publicKey);

        // Add required fields
        keys.push({
          ...jwk,
          kid: platform.tool_kid,
          use: 'sig',
          alg: 'RS256',
        });
      } catch (keyError) {
        console.error('Failed to export key:', keyError);
        // Skip invalid keys
      }
    }

    const jwks = { keys };

    return new Response(JSON.stringify(jwks), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('JWKS error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
