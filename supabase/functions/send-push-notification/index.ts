/**
 * Send Push Notification Edge Function
 *
 * Sends Web Push notifications to users
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-application-name',
};

interface PushPayload {
  userId?: string;
  userIds?: string[];
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  notificationType: string;
}

interface PushSubscription {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  user_id: string;
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate ECDH key pair for push encryption
 */
async function generateECDHKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveBits']
  );
}

/**
 * Send a single push notification
 */
async function sendPushNotification(
  subscription: PushSubscription,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: Record<string, unknown>;
  },
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create the notification payload
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-72x72.png',
      tag: payload.tag,
      data: payload.data,
    });

    // For simplicity, we'll use a basic approach
    // In production, you'd want to use a proper Web Push library

    // Create JWT for VAPID authentication
    const vapidHeader = {
      typ: 'JWT',
      alg: 'ES256',
    };

    const audience = new URL(subscription.endpoint).origin;
    const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12 hours

    const vapidPayload = {
      aud: audience,
      exp: expiration,
      sub: 'mailto:support@aiborg.ai',
    };

    // For now, we'll send a simple fetch request
    // The actual encryption would require the web-push library
    // This is a simplified version that demonstrates the structure

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        TTL: '86400',
        // In production, add proper VAPID Authorization header
      },
      body: new TextEncoder().encode(notificationPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Handle specific error cases
      if (response.status === 404 || response.status === 410) {
        // Subscription is no longer valid
        return { success: false, error: 'subscription_expired' };
      }

      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
}

serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: PushPayload = await req.json();

    // Validate payload
    if (!payload.title || !payload.body) {
      throw new Error('title and body are required');
    }

    if (!payload.userId && !payload.userIds) {
      throw new Error('userId or userIds is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get VAPID keys
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured');
    }

    // Get target user IDs
    const targetUserIds = payload.userIds || [payload.userId!];

    // Get push subscriptions for target users
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', targetUserIds);

    if (subError) {
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No subscriptions found for target users',
          sent: 0,
          failed: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check notification preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .in('user_id', targetUserIds);

    // Filter subscriptions based on preferences
    const filteredSubscriptions = subscriptions.filter(sub => {
      const userPref = preferences?.find(p => p.user_id === sub.user_id);
      if (!userPref) return true; // Default to enabled

      // Check if this notification type is enabled
      switch (payload.notificationType) {
        case 'deadline':
          return userPref.deadlines !== false;
        case 'course_update':
          return userPref.course_updates !== false;
        case 'achievement':
          return userPref.achievements !== false;
        case 'announcement':
          return userPref.announcements !== false;
        case 'reminder':
          return userPref.reminders !== false;
        default:
          return true;
      }
    });

    // Send notifications
    const results = await Promise.all(
      filteredSubscriptions.map(async sub => {
        const result = await sendPushNotification(
          sub,
          {
            title: payload.title,
            body: payload.body,
            icon: payload.icon,
            badge: payload.badge,
            tag: payload.tag,
            data: payload.data,
          },
          vapidPublicKey,
          vapidPrivateKey
        );

        // Log notification
        await supabase.from('notification_log').insert({
          user_id: sub.user_id,
          notification_type: payload.notificationType,
          title: payload.title,
          body: payload.body,
          data: payload.data,
          delivered: result.success,
          error: result.error,
        });

        // Remove expired subscriptions
        if (result.error === 'subscription_expired') {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        }

        return { userId: sub.user_id, ...result };
      })
    );

    const sent = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Push notifications sent: ${sent}, failed: ${failed}`);

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        failed,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-push-notification:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
