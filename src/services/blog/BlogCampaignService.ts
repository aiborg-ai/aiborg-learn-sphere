/**
 * Blog Campaign Service
 * Handles CRUD operations for blog campaigns
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  BlogCampaign,
  CreateCampaignData,
  UpdateCampaignData,
  CampaignFilters,
  CampaignAnalytics,
} from '@/types/blog-scheduler';

export class BlogCampaignService {
  /**
   * Get all campaigns with optional filtering
   */
  static async getCampaigns(filters?: CampaignFilters): Promise<BlogCampaign[]> {
    let query = supabase
      .from('blog_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.created_by) {
      query = query.eq('created_by', filters.created_by);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching campaigns:', error);
      throw new Error(`Failed to fetch campaigns: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single campaign by ID
   */
  static async getCampaignById(id: string): Promise<BlogCampaign> {
    const { data, error } = await supabase.from('blog_campaigns').select('*').eq('id', id).single();

    if (error) {
      logger.error('Error fetching campaign:', error);
      throw new Error(`Failed to fetch campaign: ${error.message}`);
    }

    if (!data) {
      throw new Error('Campaign not found');
    }

    return data;
  }

  /**
   * Create a new campaign
   */
  static async createCampaign(campaign: CreateCampaignData): Promise<BlogCampaign> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User must be authenticated to create campaigns');
    }

    const { data, error } = await supabase
      .from('blog_campaigns')
      .insert({
        ...campaign,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating campaign:', error);
      throw new Error(`Failed to create campaign: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing campaign
   */
  static async updateCampaign(id: string, updates: UpdateCampaignData): Promise<BlogCampaign> {
    const { data, error } = await supabase
      .from('blog_campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating campaign:', error);
      throw new Error(`Failed to update campaign: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a campaign
   */
  static async deleteCampaign(id: string): Promise<void> {
    const { error } = await supabase.from('blog_campaigns').delete().eq('id', id);

    if (error) {
      logger.error('Error deleting campaign:', error);
      throw new Error(`Failed to delete campaign: ${error.message}`);
    }
  }

  /**
   * Get all posts in a campaign
   */
  static async getCampaignPosts(campaignId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('blog_post_campaigns')
      .select(
        `
        position_in_campaign,
        blog_posts (
          id,
          slug,
          title,
          excerpt,
          status,
          published_at,
          scheduled_for,
          view_count,
          reading_time,
          category_id,
          featured_image
        )
      `
      )
      .eq('campaign_id', campaignId)
      .order('position_in_campaign', { ascending: true });

    if (error) {
      logger.error('Error fetching campaign posts:', error);
      throw new Error(`Failed to fetch campaign posts: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Add a post to a campaign
   */
  static async addPostToCampaign(
    postId: string,
    campaignId: string,
    position?: number
  ): Promise<void> {
    // If no position specified, get the next position
    let positionInCampaign = position;

    if (positionInCampaign === undefined) {
      const { count } = await supabase
        .from('blog_post_campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId);

      positionInCampaign = (count || 0) + 1;
    }

    const { error } = await supabase.from('blog_post_campaigns').insert({
      post_id: postId,
      campaign_id: campaignId,
      position_in_campaign: positionInCampaign,
    });

    if (error) {
      logger.error('Error adding post to campaign:', error);
      throw new Error(`Failed to add post to campaign: ${error.message}`);
    }
  }

  /**
   * Remove a post from a campaign
   */
  static async removePostFromCampaign(postId: string, campaignId: string): Promise<void> {
    const { error } = await supabase
      .from('blog_post_campaigns')
      .delete()
      .eq('post_id', postId)
      .eq('campaign_id', campaignId);

    if (error) {
      logger.error('Error removing post from campaign:', error);
      throw new Error(`Failed to remove post from campaign: ${error.message}`);
    }
  }

  /**
   * Get campaign analytics
   */
  static async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
    // Get all posts in the campaign
    const posts = await this.getCampaignPosts(campaignId);

    // Calculate analytics
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalReadingTime = 0;
    let publishedCount = 0;
    let scheduledCount = 0;
    let draftCount = 0;

    posts.forEach(item => {
      const post = item.blog_posts;
      if (!post) return;

      totalViews += post.view_count || 0;
      totalReadingTime += post.reading_time || 0;

      if (post.status === 'published') publishedCount++;
      else if (post.status === 'scheduled') scheduledCount++;
      else if (post.status === 'draft') draftCount++;
    });

    // Get likes, comments, shares counts
    const postIds = posts.map(item => item.blog_posts?.id).filter(Boolean);

    if (postIds.length > 0) {
      // Get likes
      const { count: likesCount } = await supabase
        .from('blog_post_likes')
        .select('*', { count: 'exact', head: true })
        .in('post_id', postIds);
      totalLikes = likesCount || 0;

      // Get comments
      const { count: commentsCount } = await supabase
        .from('blog_comments')
        .select('*', { count: 'exact', head: true })
        .in('post_id', postIds)
        .neq('status', 'deleted');
      totalComments = commentsCount || 0;

      // Get shares
      const { count: sharesCount } = await supabase
        .from('blog_shares')
        .select('*', { count: 'exact', head: true })
        .in('post_id', postIds);
      totalShares = sharesCount || 0;
    }

    return {
      campaign_id: campaignId,
      total_posts: posts.length,
      published_posts: publishedCount,
      scheduled_posts: scheduledCount,
      draft_posts: draftCount,
      total_views: totalViews,
      total_likes: totalLikes,
      total_comments: totalComments,
      total_shares: totalShares,
      avg_reading_time: posts.length > 0 ? Math.round(totalReadingTime / posts.length) : 0,
    };
  }

  /**
   * Get active campaigns (not archived or completed)
   */
  static async getActiveCampaigns(): Promise<BlogCampaign[]> {
    const { data, error } = await supabase
      .from('blog_campaigns')
      .select('*')
      .in('status', ['draft', 'active', 'paused'])
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching active campaigns:', error);
      throw new Error(`Failed to fetch active campaigns: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update campaign status
   */
  static async updateCampaignStatus(
    id: string,
    status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  ): Promise<BlogCampaign> {
    return this.updateCampaign(id, { status });
  }
}
