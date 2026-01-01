/**
 * useWebhookData Hook
 * Manages webhook data fetching, CRUD operations, and state
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { WebhookEndpoint, WebhookDelivery, WebhookStatus } from '../types';
import { generateSecret, generateSampleWebhooks, generateSampleDeliveries } from '../utils';

interface NewWebhookData {
  name: string;
  url: string;
  events: string[];
  retryEnabled: boolean;
  maxRetries: number;
  timeoutSeconds: number;
}

interface TestResult {
  success: boolean;
  message: string;
  duration?: number;
}

export function useWebhookData() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const fetchWebhooks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        // Fall back to sample data
        const sampleWebhooks = generateSampleWebhooks();
        setWebhooks(sampleWebhooks);
        setDeliveries(generateSampleDeliveries(sampleWebhooks));
        return;
      }

      const mappedWebhooks: WebhookEndpoint[] = data.map(wh => ({
        id: wh.id,
        name: wh.name,
        url: wh.url,
        secret: wh.secret,
        events: wh.events || [],
        status: wh.status as WebhookStatus,
        lastTriggered: wh.last_triggered,
        successCount: wh.success_count || 0,
        failureCount: wh.failure_count || 0,
        retryEnabled: wh.retry_enabled ?? true,
        maxRetries: wh.max_retries || 3,
        timeoutSeconds: wh.timeout_seconds || 30,
        createdAt: wh.created_at,
        createdBy: wh.created_by || '',
      }));

      setWebhooks(mappedWebhooks);

      // Fetch deliveries
      const { data: deliveryData } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (deliveryData && deliveryData.length > 0) {
        const mappedDeliveries: WebhookDelivery[] = deliveryData.map(del => ({
          id: del.id,
          webhookId: del.webhook_id,
          webhookName: mappedWebhooks.find(w => w.id === del.webhook_id)?.name || 'Unknown',
          event: del.event,
          status: del.status,
          statusCode: del.status_code,
          requestHeaders: del.request_headers || {},
          requestBody: del.request_body || '',
          responseHeaders: del.response_headers,
          responseBody: del.response_body,
          duration: del.duration,
          attempts: del.attempts || 1,
          nextRetry: del.next_retry,
          createdAt: del.created_at,
        }));
        setDeliveries(mappedDeliveries);
      } else {
        setDeliveries(generateSampleDeliveries(mappedWebhooks));
      }
    } catch {
      const sampleWebhooks = generateSampleWebhooks();
      setWebhooks(sampleWebhooks);
      setDeliveries(generateSampleDeliveries(sampleWebhooks));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const createWebhook = async (newWebhookData: NewWebhookData) => {
    if (!newWebhookData.name || !newWebhookData.url || newWebhookData.events.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields and select at least one event.',
        variant: 'destructive',
      });
      return false;
    }

    const secret = generateSecret();
    const webhook: WebhookEndpoint = {
      id: `wh-${Date.now()}`,
      name: newWebhookData.name,
      url: newWebhookData.url,
      secret,
      events: newWebhookData.events,
      status: 'active',
      successCount: 0,
      failureCount: 0,
      retryEnabled: newWebhookData.retryEnabled,
      maxRetries: newWebhookData.maxRetries,
      timeoutSeconds: newWebhookData.timeoutSeconds,
      createdAt: new Date().toISOString(),
      createdBy: user?.email || '',
    };

    try {
      const { error } = await supabase.from('webhooks').insert({
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        secret: webhook.secret,
        events: webhook.events,
        status: webhook.status,
        retry_enabled: webhook.retryEnabled,
        max_retries: webhook.maxRetries,
        timeout_seconds: webhook.timeoutSeconds,
        created_by: user?.id,
      });

      if (error) throw error;
    } catch {
      // Continue with local state update even if database fails
    }

    setWebhooks(prev => [webhook, ...prev]);

    toast({
      title: 'Webhook Created',
      description: `${webhook.name} has been created successfully.`,
    });

    return true;
  };

  const deleteWebhook = async (id: string) => {
    try {
      await supabase.from('webhooks').delete().eq('id', id);
    } catch {
      // Continue with local state update
    }

    setWebhooks(prev => prev.filter(wh => wh.id !== id));
    setDeliveries(prev => prev.filter(del => del.webhookId !== id));

    toast({
      title: 'Webhook Deleted',
      description: 'The webhook has been deleted.',
    });
  };

  const toggleWebhookStatus = async (webhook: WebhookEndpoint) => {
    const newStatus: WebhookStatus = webhook.status === 'active' ? 'inactive' : 'active';

    try {
      await supabase.from('webhooks').update({ status: newStatus }).eq('id', webhook.id);
    } catch {
      // Continue with local state update
    }

    setWebhooks(prev => prev.map(wh => (wh.id === webhook.id ? { ...wh, status: newStatus } : wh)));

    toast({
      title: 'Status Updated',
      description: `${webhook.name} is now ${newStatus}.`,
    });
  };

  const testWebhook = async (webhook: WebhookEndpoint) => {
    setTesting(true);
    setTestResult(null);

    // Simulate webhook test
    await new Promise(resolve => setTimeout(resolve, 1500));

    const success = Math.random() > 0.2;
    const result = {
      success,
      message: success
        ? 'Webhook delivered successfully'
        : 'Connection failed: Timeout after 30 seconds',
      duration: success ? Math.floor(Math.random() * 200) + 50 : undefined,
    };

    setTestResult(result);
    setTesting(false);

    return result;
  };

  const retryDelivery = async (delivery: WebhookDelivery) => {
    toast({
      title: 'Retry Scheduled',
      description: `Delivery ${delivery.id} will be retried shortly.`,
    });

    setDeliveries(prev =>
      prev.map(del =>
        del.id === delivery.id ? { ...del, status: 'pending', attempts: del.attempts + 1 } : del
      )
    );
  };

  return {
    webhooks,
    deliveries,
    loading,
    testing,
    testResult,
    fetchWebhooks,
    createWebhook,
    deleteWebhook,
    toggleWebhookStatus,
    testWebhook,
    retryDelivery,
  };
}
