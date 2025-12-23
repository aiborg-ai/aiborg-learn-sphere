/**
 * LTI 1.3 Launch Endpoint
 *
 * Handles LTI 1.3 resource link launches from Learning Management Systems.
 * This function validates the OIDC authentication flow and creates user sessions.
 *
 * LTI 1.3 Flow:
 * 1. LMS initiates login request to /lti/login (not this endpoint)
 * 2. Tool redirects to LMS auth endpoint
 * 3. LMS posts ID token to this launch endpoint
 * 4. Tool validates token and creates session
 * 5. User is redirected to the target resource
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
const LTI_AGS_CLAIM = 'https://purl.imsglobal.org/spec/lti-ags/claim/';

interface LTIPlatform {
  id: string;
  issuer: string;
  client_id: string;
  deployment_id: string;
  jwks_url: string;
  platform_public_key?: string;
  settings: Record<string, unknown>;
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

    // Parse form data (LTI posts as application/x-www-form-urlencoded)
    const formData = await req.formData();
    const idToken = formData.get('id_token') as string;
    const state = formData.get('state') as string;

    if (!idToken) {
      return new Response(JSON.stringify({ error: 'Missing id_token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decode the token header to get the issuer
    const tokenParts = idToken.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(atob(tokenParts[1]));
    const issuer = payload.iss;
    const clientId = Array.isArray(payload.aud) ? payload.aud[0] : payload.aud;

    // Look up the platform configuration
    const { data: platform, error: platformError } = await supabase
      .from('lti_platforms')
      .select('*')
      .eq('issuer', issuer)
      .eq('client_id', clientId)
      .eq('is_active', true)
      .single();

    if (platformError || !platform) {
      console.error('Platform not found:', issuer, clientId);
      return new Response(JSON.stringify({ error: 'Unknown LTI platform' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the JWT signature
    let verifiedPayload;
    try {
      if (platform.platform_public_key) {
        // Use stored public key
        const publicKey = await jose.importSPKI(platform.platform_public_key, 'RS256');
        const { payload: verified } = await jose.jwtVerify(idToken, publicKey, {
          issuer: platform.issuer,
          audience: platform.client_id,
        });
        verifiedPayload = verified;
      } else {
        // Fetch JWKS from platform
        const JWKS = jose.createRemoteJWKSet(new URL(platform.jwks_url));
        const { payload: verified } = await jose.jwtVerify(idToken, JWKS, {
          issuer: platform.issuer,
          audience: platform.client_id,
        });
        verifiedPayload = verified;
      }
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return new Response(JSON.stringify({ error: 'Invalid token signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate nonce (replay prevention)
    const nonce = verifiedPayload.nonce as string;
    const { data: nonceValid, error: nonceError } = await supabase.rpc('validate_lti_nonce', {
      p_nonce: nonce,
      p_platform_id: platform.id,
      p_expiry_minutes: 10,
    });

    if (nonceError || !nonceValid) {
      console.error('Nonce validation failed:', nonceError);
      return new Response(JSON.stringify({ error: 'Invalid or reused nonce' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate deployment ID
    const deploymentId = verifiedPayload[`${LTI_CLAIM}deployment_id`];
    if (platform.deployment_id && deploymentId !== platform.deployment_id) {
      return new Response(JSON.stringify({ error: 'Invalid deployment ID' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract LTI claims
    const messageType = verifiedPayload[`${LTI_CLAIM}message_type`] as string;
    const ltiVersion = verifiedPayload[`${LTI_CLAIM}version`] as string;
    const targetLinkUri = verifiedPayload[`${LTI_CLAIM}target_link_uri`] as string;
    const resourceLink = verifiedPayload[`${LTI_CLAIM}resource_link`] as
      | Record<string, unknown>
      | undefined;
    const context = verifiedPayload[`${LTI_CLAIM}context`] as Record<string, unknown> | undefined;
    const roles = (verifiedPayload[`${LTI_CLAIM}roles`] as string[]) || [];

    // Validate LTI version
    if (ltiVersion !== '1.3.0') {
      return new Response(JSON.stringify({ error: `Unsupported LTI version: ${ltiVersion}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract user info
    const ltiUserId = verifiedPayload.sub as string;
    const email = verifiedPayload.email as string | undefined;
    const name = verifiedPayload.name as string | undefined;
    const givenName = verifiedPayload.given_name as string | undefined;
    const familyName = verifiedPayload.family_name as string | undefined;

    // Find or create user mapping
    const { data: userId } = await supabase.rpc('find_or_create_lti_user', {
      p_platform_id: platform.id,
      p_lti_user_id: ltiUserId,
      p_email: email || null,
      p_name: name || null,
      p_given_name: givenName || null,
      p_family_name: familyName || null,
      p_picture: verifiedPayload.picture || null,
    });

    // If no existing user found by email, create a new auth user
    let finalUserId = userId;
    if (!finalUserId && email) {
      // Create a new user in Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          display_name: name || givenName || 'LTI User',
          lti_user: true,
          lti_platform_id: platform.id,
        },
      });

      if (authError) {
        console.error('Failed to create user:', authError);
        // Try to find existing user by email in auth
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === email);
        if (existingUser) {
          // Get profile ID
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', existingUser.id)
            .single();
          finalUserId = profile?.id;
        }
      } else if (authUser?.user) {
        // Get the new profile ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', authUser.user.id)
          .single();
        finalUserId = profile?.id;

        // Create user mapping
        if (finalUserId) {
          await supabase.from('lti_user_mappings').insert({
            platform_id: platform.id,
            lti_user_id: ltiUserId,
            lti_email: email,
            lti_name: name,
            lti_given_name: givenName,
            lti_family_name: familyName,
            user_id: finalUserId,
          });
        }
      }
    }

    // Determine launch type
    let launchType = 'resource_link';
    if (messageType === 'LtiDeepLinkingRequest') {
      launchType = 'deep_linking';
    } else if (messageType === 'LtiSubmissionReviewRequest') {
      launchType = 'submission_review';
    }

    // Get or create resource link
    let resourceLinkId: string | null = null;
    if (resourceLink) {
      const { data: existingLink } = await supabase
        .from('lti_resource_links')
        .select('id')
        .eq('platform_id', platform.id)
        .eq('resource_link_id', resourceLink.id as string)
        .single();

      if (existingLink) {
        resourceLinkId = existingLink.id;
      } else {
        const { data: newLink } = await supabase
          .from('lti_resource_links')
          .insert({
            platform_id: platform.id,
            resource_link_id: resourceLink.id as string,
            context_id: context?.id as string | undefined,
            context_title: context?.title as string | undefined,
            context_label: context?.label as string | undefined,
          })
          .select('id')
          .single();
        resourceLinkId = newLink?.id || null;
      }
    }

    // Generate session ID
    const sessionId = crypto.randomUUID();

    // Record the launch
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip');
    const userAgent = req.headers.get('user-agent');

    await supabase.from('lti_launches').insert({
      platform_id: platform.id,
      resource_link_id: resourceLinkId,
      user_id: finalUserId,
      lti_user_id: ltiUserId,
      launch_type: launchType,
      message_type: messageType,
      claims: verifiedPayload,
      context_id: context?.id as string | undefined,
      context_title: context?.title as string | undefined,
      roles: roles,
      session_id: sessionId,
      expires_at: new Date((verifiedPayload.exp as number) * 1000).toISOString(),
      ip_address: clientIp,
      user_agent: userAgent,
    });

    // Handle different message types
    if (messageType === 'LtiDeepLinkingRequest') {
      // Redirect to deep linking selection page
      const deepLinkSettings = verifiedPayload[`${LTI_DL_CLAIM}deep_linking_settings`];
      const redirectUrl = new URL('/lti/deep-link', targetLinkUri || Deno.env.get('APP_URL'));
      redirectUrl.searchParams.set('platform_id', platform.id);
      redirectUrl.searchParams.set('session_id', sessionId);
      redirectUrl.searchParams.set(
        'return_url',
        (deepLinkSettings as Record<string, string>)?.deep_link_return_url || ''
      );

      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: redirectUrl.toString(),
        },
      });
    }

    // For resource link launch, redirect to the course/content
    let redirectUrl = targetLinkUri;

    // If we have a resource link mapped to a course, redirect there
    if (resourceLinkId) {
      const { data: link } = await supabase
        .from('lti_resource_links')
        .select('course_id')
        .eq('id', resourceLinkId)
        .single();

      if (link?.course_id) {
        const appUrl = Deno.env.get('APP_URL') || 'https://aiborg.ai';
        redirectUrl = `${appUrl}/courses/${link.course_id}?lti_session=${sessionId}`;
      }
    }

    // If still no redirect URL, go to dashboard
    if (!redirectUrl) {
      const appUrl = Deno.env.get('APP_URL') || 'https://aiborg.ai';
      redirectUrl = `${appUrl}/dashboard?lti_session=${sessionId}`;
    }

    // Create a session token for the user
    if (finalUserId && email) {
      // Generate a magic link for the user
      const { data: magicLink, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (!linkError && magicLink?.properties?.action_link) {
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            Location: magicLink.properties.action_link,
          },
        });
      }
    }

    // Fallback: redirect without authentication
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: redirectUrl,
      },
    });
  } catch (error) {
    console.error('LTI launch error:', error);
    return new Response(
      JSON.stringify({
        error: 'LTI launch failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
