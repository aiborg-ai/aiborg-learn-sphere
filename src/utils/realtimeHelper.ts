/**
 * Realtime Helper Utilities
 *
 * Provides utilities for managing Supabase Realtime subscriptions with:
 * - Automatic reconnection on failures
 * - Better error handling
 * - Connection status tracking
 * - TypeScript support
 */

import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

export type SubscriptionStatus = 'CONNECTING' | 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED';

export interface RealtimeSubscriptionOptions {
  channelName: string;
  table: string;
  schema?: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onData: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  onStatusChange?: (status: SubscriptionStatus, error?: Error) => void;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
}

export class RealtimeSubscription {
  private channel: RealtimeChannel | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isActive = false;

  constructor(private options: RealtimeSubscriptionOptions) {
    this.options = {
      schema: 'public',
      event: '*',
      autoReconnect: true,
      maxReconnectAttempts: 5,
      ...options,
    };
  }

  /**
   * Start the subscription
   */
  subscribe() {
    if (this.isActive) {
      logger.log('⚠️ Subscription already active:', this.options.channelName);
      return;
    }

    this.isActive = true;
    this._createSubscription();
  }

  /**
   * Stop the subscription and cleanup
   */
  unsubscribe() {
    this.isActive = false;
    this._clearReconnectTimer();

    if (this.channel) {
      logger.log('🔌 Unsubscribing from:', this.options.channelName);
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  /**
   * Check if subscription is currently active
   */
  isSubscribed(): boolean {
    return this.isActive && this.channel !== null;
  }

  /**
   * Get current reconnect attempts
   */
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  private _createSubscription() {
    logger.log('📡 Creating subscription for:', this.options.channelName);

    // Create channel with config
    this.channel = supabase.channel(this.options.channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: '' },
      },
    });

    // Setup postgres changes listener
    const changeConfig: {
      event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      schema: string;
      table: string;
      filter?: string;
    } = {
      event: this.options.event!,
      schema: this.options.schema!,
      table: this.options.table,
    };

    if (this.options.filter) {
      changeConfig.filter = this.options.filter;
    }

    this.channel.on('postgres_changes', changeConfig, (payload) => {
      logger.log('🔔 Realtime event:', this.options.table, payload.eventType);
      this.options.onData(payload);
    });

    // Subscribe with status handler
    this.channel.subscribe((status, err) => {
      this._handleStatusChange(status as SubscriptionStatus, err as Error | undefined);
    });
  }

  private _handleStatusChange(status: SubscriptionStatus, error?: Error) {
    logger.log('📡 Subscription status:', this.options.channelName, status);

    // Notify caller of status change
    if (this.options.onStatusChange) {
      this.options.onStatusChange(status, error);
    }

    switch (status) {
      case 'SUBSCRIBED':
        logger.log('✅ Subscription active:', this.options.channelName);
        this.reconnectAttempts = 0;
        this._clearReconnectTimer();
        break;

      case 'CHANNEL_ERROR':
        logger.error('❌ Subscription error:', this.options.channelName, error);
        this._attemptReconnect();
        break;

      case 'TIMED_OUT':
        logger.error('⏱️ Subscription timed out:', this.options.channelName);
        this._attemptReconnect();
        break;

      case 'CLOSED':
        logger.log('🔌 Subscription closed:', this.options.channelName);
        if (this.isActive) {
          // Was closed unexpectedly, try to reconnect
          this._attemptReconnect();
        }
        break;
    }
  }

  private _attemptReconnect() {
    if (!this.options.autoReconnect || !this.isActive) {
      return;
    }

    if (this.reconnectAttempts >= this.options.maxReconnectAttempts!) {
      logger.error('🚫 Max reconnect attempts reached:', this.options.channelName);
      this.isActive = false;
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s

    logger.log(
      `🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`
    );

    this._clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      if (this.isActive) {
        // Remove old channel
        if (this.channel) {
          supabase.removeChannel(this.channel);
        }
        // Create new subscription
        this._createSubscription();
      }
    }, delay);
  }

  private _clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

/**
 * Helper function to create a realtime subscription
 *
 * @example
 * ```ts
 * const subscription = createRealtimeSubscription({
 *   channelName: 'my-channel',
 *   table: 'reviews',
 *   filter: 'approved=eq.true',
 *   onData: (payload) => {
 *     console.log('Review changed:', payload);
 *   },
 *   onStatusChange: (status, error) => {
 *     if (status === 'CHANNEL_ERROR') {
 *       console.error('Connection error:', error);
 *     }
 *   }
 * });
 *
 * subscription.subscribe();
 *
 * // Later...
 * subscription.unsubscribe();
 * ```
 */
export function createRealtimeSubscription(
  options: RealtimeSubscriptionOptions
): RealtimeSubscription {
  return new RealtimeSubscription(options);
}

/**
 * Check if a table has realtime enabled
 */
export async function isRealtimeEnabled(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_realtime_enabled', {
      table_name: tableName,
    });

    if (error) {
      logger.error('Failed to check realtime status:', error);
      return false;
    }

    return data === true;
  } catch (err) {
    logger.error('Error checking realtime status:', err);
    return false;
  }
}
