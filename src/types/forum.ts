/**
 * Forum Type Definitions
 * TypeScript types for the discussion forum system
 */

// ================================================================
// ENUMS & CONSTANTS
// ================================================================

export type VoteType = 'upvote' | 'downvote';
export type VotableType = 'thread' | 'post';
export type BanType = 'temporary' | 'permanent' | 'shadow';
export type WarningSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'offtopic' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'actioned' | 'dismissed';
export type FileType = 'image' | 'document' | 'code' | 'video';
export type ModeratorActionType =
  | 'delete_thread'
  | 'delete_post'
  | 'pin_thread'
  | 'unpin_thread'
  | 'lock_thread'
  | 'unlock_thread'
  | 'ban_user'
  | 'unban_user'
  | 'warn_user'
  | 'edit_post'
  | 'move_thread'
  | 'purge_user'
  | 'mark_best_answer';

export type TrustLevel = 0 | 1 | 2 | 3 | 4;

export const TRUST_LEVEL_NAMES = {
  0: 'New User',
  1: 'Member',
  2: 'Regular',
  3: 'Leader',
  4: 'Elder',
} as const;

export const TRUST_LEVEL_COLORS = {
  0: '#94a3b8', // gray
  1: '#3b82f6', // blue
  2: '#8b5cf6', // purple
  3: '#f59e0b', // amber
  4: '#ef4444', // red
} as const;

// ================================================================
// DATABASE MODELS
// ================================================================

export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string;
  display_order: number;
  is_active: boolean;
  requires_auth: boolean;
  post_count: number;
  thread_count: number;
  last_post_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ForumThread {
  id: string;
  category_id: string;
  user_id: string;
  title: string;
  content: string;
  slug: string | null;
  is_pinned: boolean;
  is_locked: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  view_count: number;
  upvote_count: number;
  downvote_count: number;
  reply_count: number;
  last_activity_at: string;
  has_best_answer: boolean;
  best_answer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ForumPost {
  id: string;
  thread_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  upvote_count: number;
  downvote_count: number;
  is_edited: boolean;
  edited_at: string | null;
  edit_reason: string | null;
  depth: number;
  path: string;
  is_best_answer: boolean;
  created_at: string;
  updated_at: string;
}

export interface ForumVote {
  id: string;
  user_id: string;
  votable_type: VotableType;
  votable_id: string;
  vote_type: VoteType;
  created_at: string;
  updated_at: string;
}

export interface ForumAttachment {
  id: string;
  post_id: string | null;
  thread_id: string | null;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: FileType;
  file_size: number;
  mime_type: string;
  thumbnail_url: string | null;
  is_embedded: boolean;
  display_order: number;
  created_at: string;
}

export interface ForumBookmark {
  id: string;
  user_id: string;
  thread_id: string;
  created_at: string;
}

export interface ForumFollow {
  id: string;
  user_id: string;
  thread_id: string;
  notify_email: boolean;
  notify_push: boolean;
  created_at: string;
}

export interface ForumReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reportable_type: VotableType;
  reportable_id: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  action_taken: string | null;
  created_at: string;
}

export interface ForumModerator {
  id: string;
  user_id: string;
  category_id: string | null;
  assigned_by: string;
  assigned_at: string;
  permissions: {
    delete?: boolean;
    edit?: boolean;
    pin?: boolean;
    lock?: boolean;
    ban?: boolean;
    warn?: boolean;
  };
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export interface ForumBan {
  id: string;
  user_id: string;
  banned_by: string;
  ban_type: BanType;
  reason: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  can_read: boolean;
  can_vote: boolean;
  notes: string | null;
  created_at: string;
}

export interface ForumWarning {
  id: string;
  user_id: string;
  issued_by: string;
  severity: WarningSeverity;
  reason: string;
  description: string | null;
  auto_ban_threshold: number;
  is_acknowledged: boolean;
  acknowledged_at: string | null;
  created_at: string;
}

export interface ForumUserTrustLevel {
  user_id: string;
  trust_level: TrustLevel;
  posts_count: number;
  topics_created: number;
  likes_given: number;
  likes_received: number;
  days_visited: number;
  read_count: number;
  flags_agreed: number;
  flags_disagreed: number;
  time_read_minutes: number;
  last_calculated_at: string;
  last_promoted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ForumModeratorAction {
  id: string;
  moderator_id: string;
  action_type: ModeratorActionType;
  target_type: 'thread' | 'post' | 'user' | null;
  target_id: string | null;
  reason: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface ForumOnlineUser {
  id: string;
  user_id: string;
  thread_id: string | null;
  last_seen_at: string;
  is_typing: boolean;
  updated_at: string;
}

// ================================================================
// EXTENDED TYPES (With User/Category Data)
// ================================================================

export interface ForumThreadWithDetails extends ForumThread {
  category: ForumCategory;
  user: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  user_vote?: VoteType | null;
  is_bookmarked?: boolean;
  is_following?: boolean;
  user_trust_level?: TrustLevel;
}

export interface ForumPostWithDetails extends ForumPost {
  user: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  user_vote?: VoteType | null;
  replies?: ForumPostWithDetails[];
  user_trust_level?: TrustLevel;
}

export interface ForumCategoryWithStats extends ForumCategory {
  latest_thread?: {
    id: string;
    title: string;
    created_at: string;
    user: {
      id: string;
      email: string;
      full_name?: string;
    };
  };
}

export interface ForumReportWithDetails extends ForumReport {
  reporter: {
    id: string;
    email: string;
    full_name?: string;
  };
  reported_user: {
    id: string;
    email: string;
    full_name?: string;
  };
  content_preview: string;
}

// ================================================================
// SERVICE REQUEST/RESPONSE TYPES
// ================================================================

export interface CreateThreadRequest {
  category_id: string;
  title: string;
  content: string;
  attachments?: File[];
}

export interface UpdateThreadRequest {
  title?: string;
  content?: string;
  is_pinned?: boolean;
  is_locked?: boolean;
}

export interface CreatePostRequest {
  thread_id: string;
  content: string;
  parent_id?: string | null;
  attachments?: File[];
}

export interface UpdatePostRequest {
  content?: string;
  edit_reason?: string;
}

export interface VoteRequest {
  votable_type: VotableType;
  votable_id: string;
  vote_type: VoteType;
}

export interface CreateReportRequest {
  reportable_type: VotableType;
  reportable_id: string;
  reported_user_id: string;
  reason: ReportReason;
  description?: string;
}

export interface BanUserRequest {
  user_id: string;
  ban_type: BanType;
  reason: string;
  end_date?: string | null;
  notes?: string;
}

export interface WarnUserRequest {
  user_id: string;
  severity: WarningSeverity;
  reason: string;
  description?: string;
}

export interface AssignModeratorRequest {
  user_id: string;
  category_id?: string | null;
  permissions?: ForumModerator['permissions'];
  notes?: string;
}

// ================================================================
// FILTER & QUERY TYPES
// ================================================================

export interface ThreadFilters {
  category_id?: string;
  user_id?: string;
  is_pinned?: boolean;
  is_locked?: boolean;
  has_best_answer?: boolean;
  sort_by?: 'hot' | 'new' | 'top' | 'controversial';
  time_range?: 'today' | 'week' | 'month' | 'year' | 'all';
  search_query?: string;
  page?: number;
  limit?: number;
}

export interface PostFilters {
  thread_id: string;
  user_id?: string;
  parent_id?: string | null;
  sort_by?: 'oldest' | 'newest' | 'top';
  page?: number;
  limit?: number;
}

export interface ForumSearchFilters {
  query: string;
  category_id?: string;
  user_id?: string;
  has_media?: boolean;
  min_score?: number;
  date_from?: string;
  date_to?: string;
  sort_by?: 'relevance' | 'newest' | 'top';
  page?: number;
  limit?: number;
}

// ================================================================
// ANALYTICS & STATS TYPES
// ================================================================

export interface ForumStats {
  total_threads: number;
  total_posts: number;
  total_users: number;
  active_users_today: number;
  threads_today: number;
  posts_today: number;
  popular_categories: Array<{
    category: ForumCategory;
    thread_count: number;
    post_count: number;
  }>;
}

export interface CategoryStats {
  category: ForumCategory;
  thread_count: number;
  post_count: number;
  unique_participants: number;
  avg_replies_per_thread: number;
  most_active_users: Array<{
    user_id: string;
    email: string;
    post_count: number;
  }>;
}

export interface UserForumStats {
  user_id: string;
  trust_level: TrustLevel;
  threads_created: number;
  posts_created: number;
  upvotes_received: number;
  downvotes_received: number;
  best_answers: number;
  badges_earned: string[];
  total_points: number;
}

// ================================================================
// UI COMPONENT PROPS TYPES
// ================================================================

export interface ThreadCardProps {
  thread: ForumThreadWithDetails;
  onVote?: (threadId: string, voteType: VoteType) => void;
  onBookmark?: (threadId: string) => void;
  showCategory?: boolean;
  compact?: boolean;
}

export interface PostCardProps {
  post: ForumPostWithDetails;
  onVote?: (postId: string, voteType: VoteType) => void;
  onReply?: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onMarkBestAnswer?: (postId: string) => void;
  showActions?: boolean;
  isNested?: boolean;
}

export interface VoteButtonsProps {
  upvotes: number;
  downvotes: number;
  userVote?: VoteType | null;
  onUpvote: () => void;
  onDownvote: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export interface TrustLevelBadgeProps {
  level: TrustLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export interface ModeratorToolbarProps {
  threadId?: string;
  postId?: string;
  isPinned?: boolean;
  isLocked?: boolean;
  onPin?: () => void;
  onLock?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onMove?: () => void;
}

// ================================================================
// PAGINATION & RESPONSE TYPES
// ================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface ThreadListResponse extends PaginatedResponse<ForumThreadWithDetails> {
  pinned_threads?: ForumThreadWithDetails[];
}

export interface PostTreeResponse {
  posts: ForumPostWithDetails[];
  total_count: number;
  online_users: ForumOnlineUser[];
}

// ================================================================
// REAL-TIME EVENT TYPES
// ================================================================

export interface ForumRealtimeEvent {
  event_type: 'new_post' | 'new_thread' | 'vote' | 'delete' | 'edit' | 'pin' | 'lock';
  payload: ForumThread | ForumPost | ForumVote;
  timestamp: string;
}

export interface TypingIndicatorEvent {
  user_id: string;
  thread_id: string;
  is_typing: boolean;
  user_email: string;
}

// ================================================================
// UTILITY TYPES
// ================================================================

export type SortOption = {
  label: string;
  value: string;
  icon?: string;
};

export type TimeRangeOption = {
  label: string;
  value: 'today' | 'week' | 'month' | 'year' | 'all';
};

export interface UploadProgress {
  file_name: string;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  error?: string;
}

// ================================================================
// ERROR TYPES
// ================================================================

export class ForumError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ForumError';
    this.code = code;
    this.details = details;
  }
}

export class BannedUserError extends ForumError {
  constructor(banDetails: ForumBan) {
    super('You are banned from posting', 'BANNED_USER', { ban: banDetails });
    this.name = 'BannedUserError';
  }
}

export class RateLimitError extends ForumError {
  constructor(retryAfter: number) {
    super('Rate limit exceeded', 'RATE_LIMIT', { retry_after: retryAfter });
    this.name = 'RateLimitError';
  }
}

export class ThreadLockedError extends ForumError {
  constructor(threadId: string) {
    super('This thread is locked', 'THREAD_LOCKED', { thread_id: threadId });
    this.name = 'ThreadLockedError';
  }
}

export class InsufficientPermissionsError extends ForumError {
  constructor(action: string, requiredLevel: TrustLevel) {
    super(`Insufficient permissions for ${action}`, 'INSUFFICIENT_PERMISSIONS', {
      action,
      required_trust_level: requiredLevel,
    });
    this.name = 'InsufficientPermissionsError';
  }
}
