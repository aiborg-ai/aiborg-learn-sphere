/**
 * API Key Service
 * Manages API keys for third-party integrations
 */

import { supabase } from '@/integrations/supabase/client';
import type { APIKey } from './types';

export class APIKeyService {
  /**
   * Create API key for third-party integration
   */
  static async create(
    userId: string,
    keyName: string,
    permissions: { read: boolean; write: boolean; admin: boolean },
    allowedEndpoints?: string[],
    expiresInDays?: number
  ): Promise<APIKey> {
    const apiKey = this.generateKey();
    const apiSecret = this.generateSecret();
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        key_name: keyName,
        api_key: apiKey,
        api_secret: apiSecret,
        permissions,
        allowed_endpoints: allowedEndpoints,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Validate API key and check permissions
   */
  static async validate(apiKey: string, endpoint: string, method: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (error || !data) return false;

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) return false;

    // Check endpoint permissions
    if (data.allowed_endpoints && !data.allowed_endpoints.includes(endpoint)) return false;

    // Check method permissions
    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      if (!data.permissions.write) return false;
    }

    // Log usage
    await this.logUsage(data.id, endpoint, method);

    return true;
  }

  /**
   * Log API usage
   */
  private static async logUsage(apiKeyId: string, endpoint: string, method: string): Promise<void> {
    await supabase.from('api_usage_logs').insert({
      api_key_id: apiKeyId,
      endpoint,
      method,
      status_code: 200,
    });

    // Update last_used_at
    await supabase.from('api_keys').update({ last_used_at: new Date() }).eq('id', apiKeyId);
  }

  private static generateKey(): string {
    return `ak_${this.randomString(32)}`;
  }

  private static generateSecret(): string {
    return `as_${this.randomString(64)}`;
  }

  private static randomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
