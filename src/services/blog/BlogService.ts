/**
 * Blog Service (Unified Facade)
 * Provides backward-compatible unified interface for all blog operations
 * Delegates to focused service modules
 */

import type { BlogPost, BlogCategory, BlogFilters, BlogStats } from '@/types/blog';
import { BlogPostService } from './BlogPostService';
import { BlogCategoryService } from './BlogCategoryService';
import { BlogTagService } from './BlogTagService';
import { BlogCommentService } from './BlogCommentService';
import { BlogInteractionService } from './BlogInteractionService';
import { BlogStatsService } from './BlogStatsService';

/**
 * Unified Blog Service
 * @deprecated Use individual services (BlogPostService, BlogCategoryService, etc.) for better code organization
 */
export class BlogService {
  // ========== Posts ==========

  static async getPosts(filters: BlogFilters = {}) {
    return BlogPostService.getPosts(filters);
  }

  static async getPostBySlug(slug: string) {
    // Get post data
    const post = await BlogPostService.getPostBySlug(slug);

    // Get engagement stats
    const [likes, comments, bookmarks] = await Promise.all([
      this.getPostLikeCount(post.id),
      this.getPostCommentCount(post.id),
      this.isPostBookmarked(post.id),
    ]);

    // Increment view count
    await this.incrementViewCount(post.id);

    return {
      ...post,
      like_count: likes,
      comment_count: comments,
      is_bookmarked: bookmarks,
    };
  }

  static async createPost(post: Partial<BlogPost>) {
    return BlogPostService.createPost(post);
  }

  static async updatePost(id: string, updates: Partial<BlogPost>) {
    return BlogPostService.updatePost(id, updates);
  }

  static async deletePost(id: string) {
    return BlogPostService.deletePost(id);
  }

  static async incrementViewCount(postId: string) {
    return BlogPostService.incrementViewCount(postId);
  }

  // ========== Categories ==========

  static async getCategories() {
    return BlogCategoryService.getCategories();
  }

  static async createCategory(category: Partial<BlogCategory>) {
    return BlogCategoryService.createCategory(category);
  }

  // ========== Tags ==========

  static async getTags() {
    return BlogTagService.getTags();
  }

  static async getPostTags(postId: string) {
    return BlogTagService.getPostTags(postId);
  }

  static async updatePostTags(postId: string, tagIds: string[]) {
    return BlogTagService.updatePostTags(postId, tagIds);
  }

  // ========== Comments ==========

  static async getPostComments(postId: string) {
    return BlogCommentService.getPostComments(postId);
  }

  static async createComment(postId: string, content: string, parentId?: string) {
    return BlogCommentService.createComment(postId, content, parentId);
  }

  static async updateComment(commentId: string, content: string) {
    return BlogCommentService.updateComment(commentId, content);
  }

  static async deleteComment(commentId: string) {
    return BlogCommentService.deleteComment(commentId);
  }

  static async getPostCommentCount(postId: string) {
    return BlogCommentService.getPostCommentCount(postId);
  }

  // ========== Likes ==========

  static async likePost(postId: string) {
    return BlogInteractionService.likePost(postId);
  }

  static async unlikePost(postId: string) {
    return BlogInteractionService.unlikePost(postId);
  }

  static async isPostLiked(postId: string) {
    return BlogInteractionService.isPostLiked(postId);
  }

  static async getPostLikeCount(postId: string) {
    return BlogInteractionService.getPostLikeCount(postId);
  }

  // ========== Bookmarks ==========

  static async bookmarkPost(postId: string) {
    return BlogInteractionService.bookmarkPost(postId);
  }

  static async unbookmarkPost(postId: string) {
    return BlogInteractionService.unbookmarkPost(postId);
  }

  static async isPostBookmarked(postId: string) {
    return BlogInteractionService.isPostBookmarked(postId);
  }

  static async getUserBookmarks() {
    return BlogInteractionService.getUserBookmarks();
  }

  // ========== Shares ==========

  static async sharePost(postId: string, platform: string) {
    return BlogInteractionService.sharePost(postId, platform);
  }

  // ========== Stats ==========

  static async getBlogStats(): Promise<BlogStats> {
    return BlogStatsService.getBlogStats();
  }
}
