import { logger } from '@/utils/logger';
/**
 * Share Link Service
 *
 * Handles private sharing of dashboards via unique links.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  DashboardShareLink,
  ShareLinkOptions,
  ShareLinkInfo,
  DashboardConfig,
} from '@/types/dashboard';
import { DashboardConfigService } from './DashboardConfigService';
import { validateUUID } from '@/utils/validation';
import { verifyDashboardOwnership, checkRateLimit } from '@/utils/authorization';
import { AppError, ERROR_CODES, withErrorHandling } from '@/utils/errorHandling';
import { audit } from '@/utils/auditLog';
import { SECURITY_CONFIG } from '@/config/security';

export class ShareLinkService {
  /**
   * Generate a unique share token
   */
  private static generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Create a share link for a dashboard view
   */
  static async createShareLink(
    viewId: string,
    userId: string,
    options?: ShareLinkOptions
  ): Promise<DashboardShareLink> {
    return withErrorHandling(async () => {
      // Validate inputs
      if (!validateUUID(viewId) || !validateUUID(userId)) {
        throw new AppError(
          'Invalid ID format',
          ERROR_CODES.INVALID_INPUT.code,
          ERROR_CODES.INVALID_INPUT.statusCode
        );
      }

      // Check rate limit (stricter for share link creation)
      if (!checkRateLimit(userId, 'createShareLink', 10)) {
        throw new AppError(
          'Too many share links created. Please try again later.',
          ERROR_CODES.RATE_LIMIT_EXCEEDED.code,
          ERROR_CODES.RATE_LIMIT_EXCEEDED.statusCode
        );
      }

      // Verify ownership
      const ownsView = await verifyDashboardOwnership(viewId, userId);
      if (!ownsView) {
        throw new AppError(
          'You do not have permission to share this dashboard',
          ERROR_CODES.FORBIDDEN.code,
          ERROR_CODES.FORBIDDEN.statusCode
        );
      }

      // Verify view exists
      const view = await DashboardConfigService.getView(viewId, userId);
      if (!view) {
        throw new AppError(
          'Dashboard view not found',
          ERROR_CODES.NOT_FOUND.code,
          ERROR_CODES.NOT_FOUND.statusCode
        );
      }

      // Validate expiration (max 1 year)
      let expiresAt: string | null = null;
      if (options?.expiresIn) {
        const maxExpiry = SECURITY_CONFIG.SHARE_LINK_MAX_EXPIRY_DAYS;
        if (options.expiresIn > maxExpiry) {
          throw new AppError(
            `Expiration cannot exceed ${maxExpiry} days`,
            ERROR_CODES.INVALID_INPUT.code,
            ERROR_CODES.INVALID_INPUT.statusCode
          );
        }
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + options.expiresIn);
        expiresAt = expiryDate.toISOString();
      }

      // Validate max uses
      const maxUses = options?.maxUses || null;
      if (maxUses && maxUses > SECURITY_CONFIG.SHARE_LINK_MAX_USES) {
        throw new AppError(
          `Max uses cannot exceed ${SECURITY_CONFIG.SHARE_LINK_MAX_USES}`,
          ERROR_CODES.INVALID_INPUT.code,
          ERROR_CODES.INVALID_INPUT.statusCode
        );
      }

      // Deactivate existing active links for this view
      await this.deactivateAllLinks(viewId);

      // Generate unique token
      const shareToken = this.generateToken();

      // Create share link
      const { data, error } = await supabase
        .from('dashboard_share_links')
        .insert({
          dashboard_view_id: viewId,
          creator_id: userId,
          share_token: shareToken,
          expires_at: expiresAt,
          max_uses: maxUses,
          allow_editing: options?.allowEditing || false,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating share link:', error);
        throw new AppError(
          'Failed to create share link',
          ERROR_CODES.DATABASE_ERROR.code,
          ERROR_CODES.DATABASE_ERROR.statusCode
        );
      }

      // Audit log
      await audit.shareLinkCreated(userId, data.id, {
        expiresAt,
        maxUses,
        allowEditing: options?.allowEditing || false,
      });

      return data;
    });
  }

  /**
   * Get share link info by token
   */
  static async getShareLinkInfo(token: string): Promise<ShareLinkInfo> {
    const { data: link, error } = await supabase
      .from('dashboard_share_links')
      .select(
        `
        *,
        dashboard_view:custom_dashboard_views!inner(*),
        creator:profiles!creator_id(full_name)
      `
      )
      .eq('share_token', token)
      .eq('is_active', true)
      .single();

    if (error || !link) {
      return {
        isValid: false,
        isExpired: false,
        isMaxedOut: false,
        allowEditing: false,
      };
    }

    // Check if expired
    const isExpired = link.expires_at ? new Date(link.expires_at) < new Date() : false;

    // Check if maxed out
    const isMaxedOut = link.max_uses ? link.current_uses >= link.max_uses : false;

    const isValid = !isExpired && !isMaxedOut;

    return {
      isValid,
      isExpired,
      isMaxedOut,
      dashboardConfig: isValid
        ? (link.dashboard_view as { config?: DashboardConfig })?.config
        : undefined,
      creatorName: (link.creator as { full_name?: string })?.full_name,
      viewName: (link.dashboard_view as { name?: string })?.name,
      allowEditing: link.allow_editing,
    };
  }

  /**
   * Use a share link (increment count and return config)
   */
  static async useShareLink(token: string): Promise<DashboardConfig | null> {
    // Get link info
    const info = await this.getShareLinkInfo(token);

    if (!info.isValid || !info.dashboardConfig) {
      return null;
    }

    // Increment usage count
    const { error } = await supabase.rpc('increment_share_link_usage', {
      share_token_param: token,
    });

    // If function doesn't exist, do it manually
    if (error && error.code === '42883') {
      await supabase
        .from('dashboard_share_links')
        .update({ current_uses: supabase.sql`current_uses + 1` as unknown as number })
        .eq('share_token', token);
    }

    return info.dashboardConfig;
  }

  /**
   * Get all share links for a view
   */
  static async getViewLinks(viewId: string): Promise<DashboardShareLink[]> {
    const { data, error } = await supabase
      .from('dashboard_share_links')
      .select('*')
      .eq('dashboard_view_id', viewId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching share links:', error);
      throw new Error(`Failed to fetch share links: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all share links created by a user
   */
  static async getUserLinks(userId: string): Promise<DashboardShareLink[]> {
    const { data, error } = await supabase
      .from('dashboard_share_links')
      .select(
        `
        *,
        dashboard_view:custom_dashboard_views(name)
      `
      )
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching user share links:', error);
      throw new Error(`Failed to fetch user share links: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Deactivate a share link
   */
  static async deactivateLink(linkId: string, userId: string): Promise<void> {
    return withErrorHandling(async () => {
      // Validate inputs
      if (!validateUUID(linkId) || !validateUUID(userId)) {
        throw new AppError(
          'Invalid ID format',
          ERROR_CODES.INVALID_INPUT.code,
          ERROR_CODES.INVALID_INPUT.statusCode
        );
      }

      // Check rate limit
      if (!checkRateLimit(userId, 'deactivateLink')) {
        throw new AppError(
          'Rate limit exceeded',
          ERROR_CODES.RATE_LIMIT_EXCEEDED.code,
          ERROR_CODES.RATE_LIMIT_EXCEEDED.statusCode
        );
      }

      // Verify link exists and user owns it
      const { data: link } = await supabase
        .from('dashboard_share_links')
        .select('creator_id')
        .eq('id', linkId)
        .single();

      if (!link) {
        throw new AppError(
          'Share link not found',
          ERROR_CODES.NOT_FOUND.code,
          ERROR_CODES.NOT_FOUND.statusCode
        );
      }

      if (link.creator_id !== userId) {
        throw new AppError(
          'You do not have permission to deactivate this link',
          ERROR_CODES.FORBIDDEN.code,
          ERROR_CODES.FORBIDDEN.statusCode
        );
      }

      const { error } = await supabase
        .from('dashboard_share_links')
        .update({ is_active: false })
        .eq('id', linkId);

      if (error) {
        logger.error('Error deactivating share link:', error);
        throw new AppError(
          'Failed to deactivate share link',
          ERROR_CODES.DATABASE_ERROR.code,
          ERROR_CODES.DATABASE_ERROR.statusCode
        );
      }

      // Audit log
      await audit.shareLinkRevoked(userId, linkId);
    });
  }

  /**
   * Deactivate all active links for a view
   */
  static async deactivateAllLinks(viewId: string): Promise<void> {
    const { error } = await supabase
      .from('dashboard_share_links')
      .update({ is_active: false })
      .eq('dashboard_view_id', viewId)
      .eq('is_active', true);

    if (error) {
      logger.error('Error deactivating links:', error);
      throw new Error(`Failed to deactivate links: ${error.message}`);
    }
  }

  /**
   * Delete a share link
   */
  static async deleteLink(linkId: string, userId: string): Promise<void> {
    return withErrorHandling(async () => {
      // Validate inputs
      if (!validateUUID(linkId) || !validateUUID(userId)) {
        throw new AppError(
          'Invalid ID format',
          ERROR_CODES.INVALID_INPUT.code,
          ERROR_CODES.INVALID_INPUT.statusCode
        );
      }

      // Check rate limit
      if (!checkRateLimit(userId, 'deleteLink')) {
        throw new AppError(
          'Rate limit exceeded',
          ERROR_CODES.RATE_LIMIT_EXCEEDED.code,
          ERROR_CODES.RATE_LIMIT_EXCEEDED.statusCode
        );
      }

      // Verify link exists and user owns it
      const { data: link } = await supabase
        .from('dashboard_share_links')
        .select('creator_id')
        .eq('id', linkId)
        .single();

      if (!link) {
        throw new AppError(
          'Share link not found',
          ERROR_CODES.NOT_FOUND.code,
          ERROR_CODES.NOT_FOUND.statusCode
        );
      }

      if (link.creator_id !== userId) {
        throw new AppError(
          'You do not have permission to delete this link',
          ERROR_CODES.FORBIDDEN.code,
          ERROR_CODES.FORBIDDEN.statusCode
        );
      }

      const { error } = await supabase.from('dashboard_share_links').delete().eq('id', linkId);

      if (error) {
        logger.error('Error deleting share link:', error);
        throw new AppError(
          'Failed to delete share link',
          ERROR_CODES.DATABASE_ERROR.code,
          ERROR_CODES.DATABASE_ERROR.statusCode
        );
      }

      // Audit log
      await audit.shareLinkRevoked(userId, linkId);
    });
  }

  /**
   * Update share link options
   */
  static async updateLink(
    linkId: string,
    updates: {
      expiresAt?: string | null;
      maxUses?: number | null;
      allowEditing?: boolean;
      isActive?: boolean;
    }
  ): Promise<DashboardShareLink> {
    const updateData: Partial<{
      expires_at: string | null;
      max_uses: number | null;
      allow_editing: boolean;
      is_active: boolean;
    }> = {};
    if (updates.expiresAt !== undefined) updateData.expires_at = updates.expiresAt;
    if (updates.maxUses !== undefined) updateData.max_uses = updates.maxUses;
    if (updates.allowEditing !== undefined) updateData.allow_editing = updates.allowEditing;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('dashboard_share_links')
      .update(updateData)
      .eq('id', linkId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating share link:', error);
      throw new Error(`Failed to update share link: ${error.message}`);
    }

    return data;
  }

  /**
   * Clean up expired links
   */
  static async cleanupExpiredLinks(): Promise<number> {
    const { data, error } = await supabase.rpc('deactivate_expired_share_links');

    if (error) {
      logger.error('Error cleaning up expired links:', error);
      return 0;
    }

    return data || 0;
  }

  /**
   * Generate shareable URL for a token
   */
  static generateShareUrl(token: string, baseUrl?: string): string {
    const base = baseUrl || window.location.origin;
    return `${base}/dashboard/shared/${token}`;
  }

  /**
   * Get share link statistics
   */
  static async getLinkStats(linkId: string): Promise<{
    totalUses: number;
    remainingUses: number | null;
    isExpired: boolean;
    daysUntilExpiry: number | null;
  }> {
    const { data: link, error } = await supabase
      .from('dashboard_share_links')
      .select('*')
      .eq('id', linkId)
      .single();

    if (error || !link) {
      throw new Error('Share link not found');
    }

    const isExpired = link.expires_at ? new Date(link.expires_at) < new Date() : false;

    let daysUntilExpiry: number | null = null;
    if (link.expires_at) {
      const expiry = new Date(link.expires_at);
      const now = new Date();
      daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    const remainingUses = link.max_uses ? link.max_uses - link.current_uses : null;

    return {
      totalUses: link.current_uses,
      remainingUses,
      isExpired,
      daysUntilExpiry,
    };
  }
}

export default ShareLinkService;
