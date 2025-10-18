/**
 * TypeScript Types for Membership System
 *
 * Comprehensive type definitions for membership plans, subscriptions,
 * vault content, family members, and event invitations
 */

// ============================================================================
// MEMBERSHIP PLANS
// ============================================================================

export interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  billing_interval: 'month' | 'year';
  features: string[];
  max_family_members: number;
  includes_vault_access: boolean;
  includes_event_access: boolean;
  includes_all_courses: boolean;
  trial_days: number;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateMembershipPlanParams {
  name: string;
  slug: string;
  description: string;
  price: number;
  currency?: string;
  billing_interval: 'month' | 'year';
  features: string[];
  max_family_members?: number;
  trial_days?: number;
  is_featured?: boolean;
}

// ============================================================================
// MEMBERSHIP SUBSCRIPTIONS
// ============================================================================

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused'
  | 'incomplete'
  | 'incomplete_expired';

export interface MembershipSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_start: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  cancellation_reason: string | null;
  cancellation_feedback: string | null;
  paused_at: string | null;
  pause_reason: string | null;
  resume_at: string | null;
  payment_method_last4: string | null;
  payment_method_brand: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionWithPlan extends MembershipSubscription {
  plan: MembershipPlan;
}

export interface CreateSubscriptionParams {
  planSlug: string;
  customerEmail: string;
  customerName: string;
  startTrial?: boolean;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

export interface SubscriptionSavings {
  individual_cost: number;
  family_pass_cost: number;
  monthly_savings: number;
  annual_savings: number;
  roi_percentage: number;
}

// ============================================================================
// VAULT CONTENT
// ============================================================================

export type VaultContentType =
  | 'video'
  | 'article'
  | 'worksheet'
  | 'template'
  | 'tool'
  | 'webinar'
  | 'case_study'
  | 'guide';

export type VaultDifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface VaultContent {
  id: string;
  title: string;
  slug: string;
  description: string;
  content_type: VaultContentType;
  url: string | null;
  thumbnail_url: string | null;
  file_size_mb: number | null;
  duration_minutes: number | null;
  difficulty_level: VaultDifficultyLevel | null;
  category: string;
  tags: string[];
  is_premium: boolean;
  required_plan_tier: number;
  view_count: number;
  download_count: number;
  bookmark_count: number;
  average_rating: number;
  rating_count: number;
  author_name: string | null;
  author_bio: string | null;
  author_avatar_url: string | null;
  is_published: boolean;
  published_at: string | null;
  featured_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVaultContentParams {
  title: string;
  slug: string;
  description: string;
  content_type: VaultContentType;
  url?: string;
  thumbnail_url?: string;
  duration_minutes?: number;
  difficulty_level?: VaultDifficultyLevel;
  category: string;
  tags?: string[];
  author_name?: string;
}

export interface VaultContentAccessLog {
  id: string;
  user_id: string;
  content_id: string;
  subscription_id: string | null;
  action_type: 'view' | 'download' | 'bookmark';
  completed: boolean;
  watch_percentage: number | null;
  accessed_at: string;
}

export interface UserVaultBookmark {
  id: string;
  user_id: string;
  content_id: string;
  notes: string | null;
  created_at: string;
  content?: VaultContent;
}

export interface VaultContentFilters {
  content_type?: VaultContentType;
  category?: string;
  difficulty_level?: VaultDifficultyLevel;
  tags?: string[];
  search?: string;
  featured_only?: boolean;
}

export interface UserVaultStats {
  total_views: number;
  total_downloads: number;
  total_bookmarks: number;
  unique_content_viewed: number;
  hours_watched: number;
}

// ============================================================================
// FAMILY MEMBERS
// ============================================================================

export type FamilyRelationship =
  | 'self'
  | 'spouse'
  | 'partner'
  | 'child'
  | 'parent'
  | 'grandparent'
  | 'grandchild'
  | 'sibling'
  | 'other';

export type FamilyMemberStatus =
  | 'pending_invitation'
  | 'invitation_sent'
  | 'active'
  | 'inactive'
  | 'removed';

export type FamilyMemberAccessLevel = 'admin' | 'member' | 'restricted';

export interface FamilyMember {
  id: string;
  subscription_id: string;
  primary_user_id: string;
  member_user_id: string | null;
  member_name: string;
  member_email: string;
  member_age: number | null;
  member_date_of_birth: string | null;
  relationship: FamilyRelationship;
  status: FamilyMemberStatus;
  access_level: FamilyMemberAccessLevel;
  can_manage_subscription: boolean;
  invitation_token: string | null;
  invitation_sent_at: string | null;
  invitation_expires_at: string | null;
  invitation_accepted_at: string | null;
  invitation_reminders_sent: number;
  last_login_at: string | null;
  courses_enrolled_count: number;
  courses_completed_count: number;
  vault_items_viewed: number;
  events_attended: number;
  created_at: string;
  updated_at: string;
  removed_at: string | null;
}

export interface AddFamilyMemberParams {
  subscription_id: string;
  member_name: string;
  member_email: string;
  member_age: number;
  relationship: FamilyRelationship;
  access_level?: FamilyMemberAccessLevel;
}

// ============================================================================
// EVENT INVITATIONS
// ============================================================================

export type EventAttendanceStatus =
  | 'invited'
  | 'registered'
  | 'confirmed'
  | 'attended'
  | 'missed'
  | 'cancelled';

export type EventInvitationType =
  | 'member_exclusive'
  | 'priority_access'
  | 'early_bird'
  | 'vip'
  | 'family_invite';

export interface EventInvitation {
  id: string;
  event_id: string;
  subscription_id: string;
  user_id: string;
  invited_by: string | null;
  invitation_type: EventInvitationType;
  attendance_status: EventAttendanceStatus;
  registered_at: string | null;
  confirmed_at: string | null;
  attended_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  ticket_number: string | null;
  access_code: string | null;
  is_free_for_member: boolean;
  member_discount_percentage: number;
  reminder_sent_count: number;
  last_reminder_sent_at: string | null;
  feedback_rating: number | null;
  feedback_comment: string | null;
  feedback_submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberEventStats {
  total_invitations: number;
  total_registered: number;
  total_attended: number;
  total_missed: number;
  attendance_rate: number;
  upcoming_events: number;
}

export interface SubmitEventFeedbackParams {
  event_id: string;
  rating: number;
  comment?: string;
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

export type SubscriptionAction = 'cancel' | 'pause' | 'resume' | 'update_payment' | 'get_portal';

export interface ManageSubscriptionParams {
  action: SubscriptionAction;
  subscriptionId: string;
  cancelImmediately?: boolean;
  cancellationReason?: string;
  cancellationFeedback?: string;
  pauseMonths?: number;
  returnUrl?: string;
}

export interface SubscriptionActionResult {
  success: boolean;
  message: string;
  subscription?: any;
  portalUrl?: string;
  canceledAt?: Date;
  cancelAtPeriodEnd?: boolean;
  periodEnd?: Date;
  resumeAt?: Date;
}

// ============================================================================
// ANALYTICS & DASHBOARD
// ============================================================================

export interface MembershipDashboardData {
  subscription: SubscriptionWithPlan | null;
  familyMembers: FamilyMember[];
  familyMemberCount: number;
  maxFamilyMembers: number;
  canAddMembers: boolean;
  vaultStats: UserVaultStats;
  eventStats: MemberEventStats;
  upcomingEvents: EventInvitation[];
  recentVaultContent: VaultContent[];
  recommendations: VaultContent[];
}

export interface MembershipBenefitsUsage {
  courses_accessed: number;
  vault_items_viewed: number;
  events_attended: number;
  family_members_active: number;
  total_value_received: number;
  monthly_savings: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class MembershipError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'MembershipError';
  }
}

export class SubscriptionLimitError extends MembershipError {
  constructor(message: string = 'Subscription limit reached') {
    super(message, 'SUBSCRIPTION_LIMIT_REACHED', 400);
    this.name = 'SubscriptionLimitError';
  }
}

export class InvalidInvitationError extends MembershipError {
  constructor(message: string = 'Invalid or expired invitation') {
    super(message, 'INVALID_INVITATION', 400);
    this.name = 'InvalidInvitationError';
  }
}

export class AccessDeniedError extends MembershipError {
  constructor(message: string = 'Access denied') {
    super(message, 'ACCESS_DENIED', 403);
    this.name = 'AccessDeniedError';
  }
}
