/**
 * Webhook Management Utilities
 * Helper functions for webhook operations
 */

import type { WebhookEndpoint, WebhookDelivery, DeliveryStatus } from './types';

/**
 * Generate a secure webhook secret
 */
export function generateSecret(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let secret = 'whsec_';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

/**
 * Mask a secret for display
 */
export function maskSecret(secret: string): string {
  return secret.slice(0, 10) + '••••••••••••••••••••••';
}

/**
 * Generate sample webhook endpoints for demonstration
 */
export function generateSampleWebhooks(): WebhookEndpoint[] {
  return [
    {
      id: '1',
      name: 'Slack Notifications',
      url: 'https://hooks.slack.com/services/xxx/yyy/zzz',
      secret:
        'whsec_' +
        Array.from(
          { length: 32 },
          () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
        ).join(''),
      events: ['user.created', 'enrollment.created', 'payment.completed'],
      status: 'active',
      lastTriggered: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      successCount: 1247,
      failureCount: 3,
      retryEnabled: true,
      maxRetries: 3,
      timeoutSeconds: 30,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
      createdBy: 'admin@aiborg.ai',
    },
    {
      id: '2',
      name: 'CRM Integration',
      url: 'https://api.crm.example.com/webhooks/aiborg',
      secret:
        'whsec_' +
        Array.from(
          { length: 32 },
          () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
        ).join(''),
      events: ['user.created', 'user.updated', 'enrollment.completed'],
      status: 'active',
      lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      successCount: 892,
      failureCount: 12,
      retryEnabled: true,
      maxRetries: 5,
      timeoutSeconds: 60,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
      createdBy: 'admin@aiborg.ai',
    },
    {
      id: '3',
      name: 'Analytics Service',
      url: 'https://analytics.example.com/ingest/events',
      secret:
        'whsec_' +
        Array.from(
          { length: 32 },
          () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
        ).join(''),
      events: ['user.login', 'course.published', 'enrollment.created', 'enrollment.completed'],
      status: 'failing',
      lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      successCount: 456,
      failureCount: 89,
      retryEnabled: true,
      maxRetries: 3,
      timeoutSeconds: 15,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      createdBy: 'developer@aiborg.ai',
    },
  ];
}

/**
 * Generate sample webhook deliveries for demonstration
 */
export function generateSampleDeliveries(webhooks: WebhookEndpoint[]): WebhookDelivery[] {
  const deliveries: WebhookDelivery[] = [];
  const statuses: DeliveryStatus[] = [
    'success',
    'success',
    'success',
    'success',
    'failed',
    'retrying',
  ];

  for (let i = 0; i < 50; i++) {
    const webhook = webhooks[Math.floor(Math.random() * webhooks.length)];
    const event = webhook.events[Math.floor(Math.random() * webhook.events.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    deliveries.push({
      id: `del-${i}`,
      webhookId: webhook.id,
      webhookName: webhook.name,
      event,
      status,
      statusCode: status === 'success' ? 200 : status === 'failed' ? 500 : undefined,
      requestHeaders: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': 'sha256=...',
        'X-Webhook-Event': event,
      },
      requestBody: JSON.stringify(
        {
          event,
          timestamp: new Date(Date.now() - i * 1000 * 60 * 10).toISOString(),
          data: { id: `sample-${i}`, type: event.split('.')[0] },
        },
        null,
        2
      ),
      responseHeaders: status === 'success' ? { 'Content-Type': 'application/json' } : undefined,
      responseBody:
        status === 'success'
          ? '{"received": true}'
          : status === 'failed'
            ? '{"error": "Internal server error"}'
            : undefined,
      duration:
        status === 'success'
          ? Math.floor(Math.random() * 500) + 50
          : status === 'failed'
            ? Math.floor(Math.random() * 30000) + 5000
            : undefined,
      attempts:
        status === 'retrying' ? Math.floor(Math.random() * 3) + 1 : status === 'failed' ? 3 : 1,
      nextRetry:
        status === 'retrying' ? new Date(Date.now() + 1000 * 60 * 5).toISOString() : undefined,
      createdAt: new Date(Date.now() - i * 1000 * 60 * 10).toISOString(),
    });
  }

  return deliveries;
}
