/**
 * Type definitions for Batch Blog Scheduler feature
 */

// =====================================================
// BLOG TEMPLATE TYPES
// =====================================================

export type Audience = 'primary' | 'secondary' | 'professional' | 'business';
export type Tone = 'professional' | 'casual' | 'technical' | 'friendly';
export type Length = 'short' | 'medium' | 'long';

export interface BlogTemplate {
  id: string;
  name: string;
  description: string | null;
  topic_template: string;
  audience: Audience;
  tone: Tone;
  length: Length;
  keywords: string | null;
  category_id: string | null;
  default_tags: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  topic_template: string;
  audience: Audience;
  tone: Tone;
  length: Length;
  keywords?: string;
  category_id?: string;
  default_tags?: string[];
  is_active?: boolean;
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  topic_template?: string;
  audience?: Audience;
  tone?: Tone;
  length?: Length;
  keywords?: string;
  category_id?: string;
  default_tags?: string[];
  is_active?: boolean;
}

// =====================================================
// BLOG CAMPAIGN TYPES
// =====================================================

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

export interface BlogCampaign {
  id: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  start_date: string | null;
  end_date: string | null;
  target_post_count: number;
  actual_post_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignData {
  name: string;
  description?: string;
  status?: CampaignStatus;
  start_date?: string;
  end_date?: string;
  target_post_count?: number;
}

export interface UpdateCampaignData {
  name?: string;
  description?: string;
  status?: CampaignStatus;
  start_date?: string;
  end_date?: string;
  target_post_count?: number;
}

export interface CampaignFilters {
  status?: CampaignStatus;
  created_by?: string;
}

export interface CampaignAnalytics {
  campaign_id: string;
  total_posts: number;
  published_posts: number;
  scheduled_posts: number;
  draft_posts: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  avg_reading_time: number;
}

// =====================================================
// BATCH JOB TYPES
// =====================================================

export type BatchJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface BatchJob {
  id: string;
  campaign_id: string | null;
  template_id: string | null;
  total_posts: number;
  completed_posts: number;
  failed_posts: number;
  status: BatchJobStatus;
  generation_params: Record<string, any>;
  error_log: Array<BatchJobError>;
  created_by: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface BatchJobError {
  topic: string;
  error: string;
  timestamp: string;
}

// =====================================================
// BATCH GENERATION TYPES
// =====================================================

export interface BatchTopic {
  topic: string;
  audience?: Audience;
  tone?: Tone;
  length?: Length;
  keywords?: string;
  scheduled_for?: string;
}

export interface AutoScheduleConfig {
  enabled: boolean;
  start_date: string;
  frequency: 'daily' | 'weekly' | 'biweekly';
  preferred_time: string; // HH:mm format
}

export interface BatchGenerationRequest {
  campaign_id?: string;
  template_id?: string;
  topics: BatchTopic[];
  auto_schedule?: AutoScheduleConfig;
  category_id?: string;
  default_tags?: string[];
}

export interface BatchGenerationResponse {
  success: boolean;
  job_id: string;
  total_posts: number;
  message: string;
}

export interface BatchJobProgress {
  job_id: string;
  status: BatchJobStatus;
  total_posts: number;
  completed_posts: number;
  failed_posts: number;
  current_topic?: string;
  progress_percentage: number;
  estimated_time_remaining?: number; // in seconds
  successful_posts: Array<{
    id: string;
    title: string;
    slug: string;
    scheduled_for?: string;
  }>;
  failed_posts: Array<{
    topic: string;
    error: string;
  }>;
}

// =====================================================
// SCHEDULE OPTIMIZER TYPES
// =====================================================

export interface ScheduleAnalytics {
  total_scheduled: number;
  posts_this_week: number;
  posts_this_month: number;
  busiest_day: string;
  busiest_hour: number;
  average_posts_per_week: number;
  recommended_posting_times: string[];
}

export interface ScheduleGap {
  date: string;
  is_weekend: boolean;
  current_post_count: number;
  recommended: boolean;
}

// =====================================================
// UI COMPONENT TYPES
// =====================================================

export interface BatchCreatorFormData {
  input_method: 'manual' | 'template' | 'ai_generate';
  template_id?: string;
  topics: string[]; // Array of topic strings
  audience: Audience;
  tone: Tone;
  length: Length;
  keywords?: string;
  category_id?: string;
  tags?: string[];
  create_as_drafts: boolean;
  auto_schedule_enabled: boolean;
  schedule_start_date?: Date;
  schedule_frequency?: 'daily' | 'weekly' | 'biweekly';
  schedule_preferred_time?: string;
  campaign_id?: string;
  create_new_campaign?: boolean;
  new_campaign_name?: string;
  new_campaign_description?: string;
}

export interface PublishingCalendarEvent {
  id: string;
  title: string;
  slug: string;
  date: string; // scheduled_for or published_at
  status: 'draft' | 'scheduled' | 'published';
  category?: string;
  campaign?: string;
  excerpt?: string;
  featured_image?: string;
}

export interface CalendarFilters {
  campaign_id?: string;
  category_id?: string;
  status?: Array<'draft' | 'scheduled' | 'published'>;
  date_range?: {
    start: Date;
    end: Date;
  };
}

// =====================================================
// GENERATION PARAMETERS (for reuse)
// =====================================================

export interface GenerationParams {
  topic: string;
  audience: Audience;
  tone: Tone;
  length: Length;
  keywords?: string;
  aiProvider?: 'ollama' | 'openai';
}

// =====================================================
// HELPER TYPE GUARDS
// =====================================================

export function isValidAudience(value: string): value is Audience {
  return ['primary', 'secondary', 'professional', 'business'].includes(value);
}

export function isValidTone(value: string): value is Tone {
  return ['professional', 'casual', 'technical', 'friendly'].includes(value);
}

export function isValidLength(value: string): value is Length {
  return ['short', 'medium', 'long'].includes(value);
}

export function isValidCampaignStatus(value: string): value is CampaignStatus {
  return ['draft', 'active', 'paused', 'completed', 'archived'].includes(value);
}

export function isValidBatchJobStatus(value: string): value is BatchJobStatus {
  return ['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(value);
}
