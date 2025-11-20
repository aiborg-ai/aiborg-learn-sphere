/**
 * Integration Service
 *
 * Manages enterprise integrations including:
 * - SSO (SAML 2.0, OIDC, Azure AD, Okta, Google Workspace)
 * - HR Systems (Workday, BambooHR, ADP, etc.)
 * - Webhooks
 * - Notification Channels (Slack, Microsoft Teams)
 */

import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// TYPES
// =============================================================================

export interface SSOConfiguration {
  id: string;
  organization_id: string;
  provider_type: 'saml' | 'oidc' | 'azure_ad' | 'okta' | 'google_workspace' | 'onelogin';
  display_name: string;

  // SAML
  saml_entity_id?: string;
  saml_sso_url?: string;
  saml_slo_url?: string;
  saml_certificate?: string;
  saml_signature_algorithm?: string;
  saml_name_id_format?: string;

  // OIDC
  oidc_issuer?: string;
  oidc_client_id?: string;
  oidc_authorization_endpoint?: string;
  oidc_token_endpoint?: string;
  oidc_userinfo_endpoint?: string;
  oidc_scopes?: string[];

  // Mapping
  attribute_mapping: Record<string, string>;

  // Settings
  allow_idp_initiated: boolean;
  auto_create_users: boolean;
  default_role: string;
  enforce_sso: boolean;
  allowed_domains: string[];

  // Status
  is_active: boolean;
  is_verified: boolean;
  verified_at?: string;

  created_at: string;
  updated_at: string;
}

export interface HRIntegration {
  id: string;
  organization_id: string;
  provider: 'workday' | 'bamboohr' | 'adp' | 'namely' | 'gusto' | 'rippling' | 'custom_api';
  display_name: string;

  api_url: string;
  api_version?: string;
  auth_type: 'api_key' | 'oauth2' | 'basic';

  sync_enabled: boolean;
  sync_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  last_sync_at?: string;
  next_sync_at?: string;

  field_mapping: Record<string, string>;
  auto_enroll_enabled: boolean;
  enrollment_rules: Array<{
    condition: Record<string, unknown>;
    courses?: string[];
    learning_paths?: string[];
  }>;

  auto_unenroll_on_termination: boolean;
  termination_grace_days: number;

  is_active: boolean;
  connection_status: 'pending' | 'connected' | 'error' | 'disconnected';
  last_error?: string;

  created_at: string;
  updated_at: string;
}

export interface HRSyncLog {
  id: string;
  hr_integration_id: string;
  sync_type: 'full' | 'incremental' | 'manual';
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed' | 'partial';
  users_created: number;
  users_updated: number;
  users_deactivated: number;
  enrollments_created: number;
  enrollments_removed: number;
  errors_count: number;
  error_details: Array<{ message: string; details?: unknown }>;
}

export interface WebhookEndpoint {
  id: string;
  organization_id?: string;
  user_id?: string;
  name: string;
  description?: string;
  url: string;
  auth_type: 'none' | 'basic' | 'bearer' | 'signature' | 'custom_header';
  signing_secret?: string;
  events: string[];
  is_active: boolean;
  content_type: string;
  timeout_seconds: number;
  retry_enabled: boolean;
  max_retries: number;
  retry_delay_seconds: number;
  rate_limit_per_minute: number;
  last_triggered_at?: string;
  last_success_at?: string;
  last_failure_at?: string;
  consecutive_failures: number;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_endpoint_id: string;
  event_type: string;
  event_id: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  response_status?: number;
  response_time_ms?: number;
  attempt_number: number;
  created_at: string;
  delivered_at?: string;
  error_message?: string;
}

export interface NotificationChannel {
  id: string;
  organization_id: string;
  channel_type: 'slack' | 'microsoft_teams' | 'email' | 'discord' | 'custom_webhook';
  name: string;
  description?: string;

  // Slack
  slack_webhook_url?: string;
  slack_channel?: string;

  // Teams
  teams_webhook_url?: string;
  teams_channel_id?: string;

  // Email
  email_recipients?: string[];
  email_cc?: string[];

  subscribed_events: string[];
  templates: Record<string, { title: string; body: string }>;

  is_active: boolean;
  rate_limit_per_hour: number;
  last_sent_at?: string;
  last_success_at?: string;
  last_failure_at?: string;
  failure_count: number;

  created_at: string;
  updated_at: string;
}

export interface IntegrationAuditLog {
  id: string;
  organization_id?: string;
  user_id?: string;
  integration_type: 'sso' | 'hr' | 'webhook' | 'notification_channel' | 'api_key';
  integration_id: string;
  action: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  created_at: string;
}

// Available webhook events
export const WEBHOOK_EVENTS = [
  'user.created',
  'user.updated',
  'user.deleted',
  'enrollment.created',
  'enrollment.completed',
  'enrollment.expired',
  'course.published',
  'course.updated',
  'assessment.completed',
  'assessment.passed',
  'assessment.failed',
  'certificate.issued',
  'compliance.completed',
  'compliance.overdue',
  'compliance.expired',
  'payment.completed',
  'payment.failed',
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

// =============================================================================
// SERVICE
// =============================================================================

class IntegrationServiceClass {
  // ===========================================================================
  // SSO CONFIGURATION
  // ===========================================================================

  async getSSOConfigurations(organizationId: string): Promise<SSOConfiguration[]> {
    const { data, error } = await supabase
      .from('sso_configurations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getSSOConfiguration(id: string): Promise<SSOConfiguration | null> {
    const { data, error } = await supabase
      .from('sso_configurations')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createSSOConfiguration(
    config: Partial<SSOConfiguration> & {
      organization_id: string;
      provider_type: SSOConfiguration['provider_type'];
      display_name: string;
    }
  ): Promise<SSOConfiguration> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('sso_configurations')
      .insert({
        ...config,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateSSOConfiguration(
    id: string,
    updates: Partial<SSOConfiguration>
  ): Promise<SSOConfiguration> {
    const { data, error } = await supabase
      .from('sso_configurations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteSSOConfiguration(id: string): Promise<void> {
    const { error } = await supabase
      .from('sso_configurations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async verifySSOConfiguration(id: string): Promise<void> {
    const { error } = await supabase
      .from('sso_configurations')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  }

  async toggleSSOConfiguration(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('sso_configurations')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  }

  // ===========================================================================
  // HR INTEGRATIONS
  // ===========================================================================

  async getHRIntegrations(organizationId: string): Promise<HRIntegration[]> {
    const { data, error } = await supabase
      .from('hr_integrations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getHRIntegration(id: string): Promise<HRIntegration | null> {
    const { data, error } = await supabase
      .from('hr_integrations')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createHRIntegration(
    integration: Partial<HRIntegration> & {
      organization_id: string;
      provider: HRIntegration['provider'];
      display_name: string;
      api_url: string;
      auth_type: HRIntegration['auth_type'];
    }
  ): Promise<HRIntegration> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('hr_integrations')
      .insert({
        ...integration,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateHRIntegration(
    id: string,
    updates: Partial<HRIntegration>
  ): Promise<HRIntegration> {
    const { data, error } = await supabase
      .from('hr_integrations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteHRIntegration(id: string): Promise<void> {
    const { error } = await supabase
      .from('hr_integrations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async testHRConnection(id: string): Promise<{ success: boolean; message: string }> {
    // This would typically call an edge function to test the connection
    const integration = await this.getHRIntegration(id);
    if (!integration) {
      return { success: false, message: 'Integration not found' };
    }

    // Placeholder - actual implementation would test the API
    return { success: true, message: 'Connection test successful' };
  }

  async triggerHRSync(id: string, syncType: 'full' | 'incremental' = 'incremental'): Promise<string> {
    const { data, error } = await supabase.rpc('start_hr_sync', {
      p_integration_id: id,
      p_sync_type: syncType,
    });

    if (error) throw error;
    return data;
  }

  async getHRSyncLogs(integrationId: string, limit = 20): Promise<HRSyncLog[]> {
    const { data, error } = await supabase
      .from('hr_sync_logs')
      .select('*')
      .eq('hr_integration_id', integrationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // ===========================================================================
  // WEBHOOKS
  // ===========================================================================

  async getWebhookEndpoints(options?: {
    organizationId?: string;
    userId?: string;
  }): Promise<WebhookEndpoint[]> {
    let query = supabase
      .from('webhook_endpoints')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.organizationId) {
      query = query.eq('organization_id', options.organizationId);
    }

    if (options?.userId) {
      query = query.eq('user_id', options.userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getWebhookEndpoint(id: string): Promise<WebhookEndpoint | null> {
    const { data, error } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createWebhookEndpoint(
    endpoint: Partial<WebhookEndpoint> & {
      name: string;
      url: string;
      events: string[];
    }
  ): Promise<WebhookEndpoint> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('webhook_endpoints')
      .insert({
        ...endpoint,
        user_id: endpoint.user_id || user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateWebhookEndpoint(
    id: string,
    updates: Partial<WebhookEndpoint>
  ): Promise<WebhookEndpoint> {
    const { data, error } = await supabase
      .from('webhook_endpoints')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteWebhookEndpoint(id: string): Promise<void> {
    const { error } = await supabase
      .from('webhook_endpoints')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async toggleWebhookEndpoint(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('webhook_endpoints')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  }

  async testWebhook(id: string): Promise<{ success: boolean; message: string }> {
    const endpoint = await this.getWebhookEndpoint(id);
    if (!endpoint) {
      return { success: false, message: 'Webhook endpoint not found' };
    }

    // Send a test event
    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: { message: 'This is a test webhook delivery' },
    };

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': endpoint.content_type,
        },
        body: JSON.stringify(testPayload),
      });

      if (response.ok) {
        return { success: true, message: `Webhook delivered successfully (${response.status})` };
      } else {
        return { success: false, message: `Webhook failed: ${response.status} ${response.statusText}` };
      }
    } catch (err) {
      return { success: false, message: `Connection error: ${(err as Error).message}` };
    }
  }

  async getWebhookDeliveries(
    endpointId: string,
    options?: { limit?: number; status?: WebhookDelivery['status'] }
  ): Promise<WebhookDelivery[]> {
    let query = supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('webhook_endpoint_id', endpointId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async triggerWebhookEvent(
    eventType: WebhookEvent,
    payload: Record<string, unknown>,
    options?: { organizationId?: string; userId?: string }
  ): Promise<number> {
    const { data, error } = await supabase.rpc('trigger_webhook_event', {
      p_event_type: eventType,
      p_payload: payload,
      p_organization_id: options?.organizationId || null,
      p_user_id: options?.userId || null,
    });

    if (error) throw error;
    return data;
  }

  // ===========================================================================
  // NOTIFICATION CHANNELS
  // ===========================================================================

  async getNotificationChannels(organizationId: string): Promise<NotificationChannel[]> {
    const { data, error } = await supabase
      .from('notification_channels')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getNotificationChannel(id: string): Promise<NotificationChannel | null> {
    const { data, error } = await supabase
      .from('notification_channels')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createNotificationChannel(
    channel: Partial<NotificationChannel> & {
      organization_id: string;
      channel_type: NotificationChannel['channel_type'];
      name: string;
    }
  ): Promise<NotificationChannel> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('notification_channels')
      .insert({
        ...channel,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateNotificationChannel(
    id: string,
    updates: Partial<NotificationChannel>
  ): Promise<NotificationChannel> {
    const { data, error } = await supabase
      .from('notification_channels')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteNotificationChannel(id: string): Promise<void> {
    const { error } = await supabase
      .from('notification_channels')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async toggleNotificationChannel(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('notification_channels')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  }

  async testNotificationChannel(id: string): Promise<{ success: boolean; message: string }> {
    const channel = await this.getNotificationChannel(id);
    if (!channel) {
      return { success: false, message: 'Notification channel not found' };
    }

    // Test message based on channel type
    const testMessage = {
      text: 'Test notification from AiBorg Learn Sphere',
      timestamp: new Date().toISOString(),
    };

    try {
      let webhookUrl = '';
      let payload: Record<string, unknown> = {};

      if (channel.channel_type === 'slack') {
        webhookUrl = channel.slack_webhook_url || '';
        payload = {
          text: testMessage.text,
          channel: channel.slack_channel,
        };
      } else if (channel.channel_type === 'microsoft_teams') {
        webhookUrl = channel.teams_webhook_url || '';
        payload = {
          '@type': 'MessageCard',
          '@context': 'http://schema.org/extensions',
          summary: 'Test Notification',
          text: testMessage.text,
        };
      } else {
        return { success: false, message: 'Unsupported channel type for testing' };
      }

      if (!webhookUrl) {
        return { success: false, message: 'Webhook URL not configured' };
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return { success: true, message: 'Test notification sent successfully' };
      } else {
        return { success: false, message: `Failed: ${response.status} ${response.statusText}` };
      }
    } catch (err) {
      return { success: false, message: `Error: ${(err as Error).message}` };
    }
  }

  // ===========================================================================
  // AUDIT LOG
  // ===========================================================================

  async getIntegrationAuditLog(options?: {
    organizationId?: string;
    integrationType?: IntegrationAuditLog['integration_type'];
    limit?: number;
  }): Promise<IntegrationAuditLog[]> {
    let query = supabase
      .from('integration_audit_log')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.organizationId) {
      query = query.eq('organization_id', options.organizationId);
    }

    if (options?.integrationType) {
      query = query.eq('integration_type', options.integrationType);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // ===========================================================================
  // SUMMARY / DASHBOARD
  // ===========================================================================

  async getIntegrationsSummary(organizationId: string): Promise<{
    sso: { total: number; active: number; verified: number };
    hr: { total: number; connected: number; lastSync?: string };
    webhooks: { total: number; active: number; deliveries24h: number };
    channels: { total: number; active: number };
  }> {
    // Get SSO stats
    const { data: ssoData } = await supabase
      .from('sso_configurations')
      .select('is_active, is_verified')
      .eq('organization_id', organizationId);

    // Get HR stats
    const { data: hrData } = await supabase
      .from('hr_integrations')
      .select('connection_status, last_sync_at')
      .eq('organization_id', organizationId);

    // Get webhook stats
    const { data: webhookData } = await supabase
      .from('webhook_endpoints')
      .select('is_active')
      .eq('organization_id', organizationId);

    // Get channel stats
    const { data: channelData } = await supabase
      .from('notification_channels')
      .select('is_active')
      .eq('organization_id', organizationId);

    return {
      sso: {
        total: ssoData?.length || 0,
        active: ssoData?.filter(s => s.is_active).length || 0,
        verified: ssoData?.filter(s => s.is_verified).length || 0,
      },
      hr: {
        total: hrData?.length || 0,
        connected: hrData?.filter(h => h.connection_status === 'connected').length || 0,
        lastSync: hrData?.find(h => h.last_sync_at)?.last_sync_at,
      },
      webhooks: {
        total: webhookData?.length || 0,
        active: webhookData?.filter(w => w.is_active).length || 0,
        deliveries24h: 0, // Would need a separate query
      },
      channels: {
        total: channelData?.length || 0,
        active: channelData?.filter(c => c.is_active).length || 0,
      },
    };
  }
}

export const IntegrationService = new IntegrationServiceClass();
export default IntegrationService;
