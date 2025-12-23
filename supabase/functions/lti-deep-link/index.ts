/**
 * LTI Deep Linking Response Endpoint
 *
 * Creates and signs the deep linking response JWT to send content items
 * back to the LMS. This is called after the user selects courses/content
 * to add to their LMS course.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// LTI Claim namespaces
const LTI_CLAIM = 'https://purl.imsglobal.org/spec/lti/claim/';
const LTI_DL_CLAIM = 'https://purl.imsglobal.org/spec/lti-dl/claim/';

interface ContentItem {
  type: 'ltiResourceLink' | 'link' | 'file' | 'html' | 'image';
  title?: string;
  text?: string;
  url?: string;
  custom?: Record<string, string>;
  lineItem?: {
    scoreMaximum: number;
    label?: string;
  };
  thumbnail?: {
    url: string;
    width?: number;
    height?: number;
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body = await req.json();
    const {
      platform_id,
      session_id,
      content_items,
      return_url,
      data, // Echo back from deep linking settings
    } = body as {
      platform_id: string;
      session_id: string;
      content_items: ContentItem[];
      return_url: string;
      data?: string;
    };

    // Validate required fields
    if (!platform_id || !return_url || !content_items) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get platform configuration
    const { data: platform, error: platformError } = await supabase
      .from('lti_platforms')
      .select('*')
      .eq('id', platform_id)
      .eq('is_active', true)
      .single();

    if (platformError || !platform) {
      return new Response(JSON.stringify({ error: 'Platform not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate session (optional but recommended)
    if (session_id) {
      const { data: launch } = await supabase
        .from('lti_launches')
        .select('id')
        .eq('session_id', session_id)
        .eq('platform_id', platform_id)
        .single();

      if (!launch) {
        console.warn('Invalid session for deep linking:', session_id);
      }
    }

    // Build the deep linking response JWT
    const now = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomUUID();

    const payload: Record<string, unknown> = {
      iss: platform.client_id, // Tool is the issuer
      aud: platform.issuer, // Platform is the audience
      iat: now,
      exp: now + 300, // 5 minutes
      nonce: nonce,
      [`${LTI_CLAIM}message_type`]: 'LtiDeepLinkingResponse',
      [`${LTI_CLAIM}version`]: '1.3.0',
      [`${LTI_CLAIM}deployment_id`]: platform.deployment_id,
      [`${LTI_DL_CLAIM}content_items`]: content_items,
    };

    // Echo back the data if provided
    if (data) {
      payload[`${LTI_DL_CLAIM}data`] = data;
    }

    // Sign the JWT with tool's private key
    let jwt: string;
    try {
      const privateKey = await jose.importPKCS8(platform.tool_private_key, 'RS256');
      jwt = await new jose.SignJWT(payload as jose.JWTPayload)
        .setProtectedHeader({
          alg: 'RS256',
          typ: 'JWT',
          kid: platform.tool_kid,
        })
        .sign(privateKey);
    } catch (signError) {
      console.error('Failed to sign JWT:', signError);
      return new Response(JSON.stringify({ error: 'Failed to sign response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store the resource links for future reference
    for (const item of content_items) {
      if (item.type === 'ltiResourceLink' && item.custom?.course_id) {
        await supabase.from('lti_resource_links').upsert(
          {
            platform_id: platform.id,
            resource_link_id: `dl_${crypto.randomUUID()}`, // Generated ID
            course_id: item.custom.course_id,
            context_title: item.title,
            content_items: [item],
          },
          {
            onConflict: 'platform_id,resource_link_id',
          }
        );
      }
    }

    // Return the signed JWT and return URL
    // The frontend will create a form and POST to the return URL
    return new Response(
      JSON.stringify({
        jwt,
        return_url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Deep linking error:', error);
    return new Response(
      JSON.stringify({
        error: 'Deep linking failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
