/**
 * Studio Types
 * TypeScript interfaces for Admin Studio functionality
 */

export type AssetType = 'course' | 'event' | 'blog' | 'announcement';
export type WizardMode = 'create' | 'edit';
export type StepStatus = 'pending' | 'active' | 'completed' | 'invalid';

// ========== Schedule Types ==========

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number; // Every N days/weeks/months
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  endType?: 'never' | 'after' | 'on'; // When does recurrence end
  endAfterOccurrences?: number; // End after N occurrences
  endOnDate?: Date; // End on specific date
}

export interface ScheduleConfig {
  startDate?: Date;
  endDate?: Date | null; // null = permanent
  timeStart?: string; // "09:00" format
  timeEnd?: string; // "17:00" format
  recurring?: RecurringPattern;
  timezone: string;
}

export interface AssetSchedule {
  id: string;
  asset_type: AssetType;
  asset_id: string;
  start_date?: string;
  end_date?: string | null;
  time_start?: string;
  time_end?: string;
  recurring_pattern?: RecurringPattern;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ========== Tag Types ==========

export interface Tag {
  id: string;
  name: string;
  category?: string;
  color?: string;
}

// ========== Course Types ==========

export interface CourseWizardData {
  // Step 1: Basic Info
  title: string;
  description: string;
  image_url?: string;
  category: string;

  // Step 2: Content
  features: string[];
  prerequisites?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  mode: 'online' | 'in-person' | 'hybrid';
  duration: string;

  // Step 3: Scheduling
  start_date?: string;
  schedule?: ScheduleConfig;

  // Step 4: Audience
  audiences: string[];
  target_description?: string;

  // Step 5: Pricing
  price: string;
  payment_options?: string[];
  early_bird_price?: string;
  group_discount?: string;
  currently_enrolling: boolean;

  // Step 6: Tags
  tags: Tag[];
  keywords: string[];

  // Meta
  is_active: boolean;
  display: boolean;
  sort_order?: number;
}

// ========== Event Types ==========

export interface EventWizardData {
  // Step 1: Basic Info
  title: string;
  description: string;
  image_url?: string;
  event_type: string;

  // Step 2: Details
  format: 'online' | 'in-person' | 'hybrid';
  special_requirements?: string;

  // Step 3: Scheduling
  event_date: string;
  event_time: string;
  duration?: string;
  schedule?: ScheduleConfig;

  // Step 4: Location
  location?: string;
  online_link?: string;
  venue_details?: string;

  // Step 5: Capacity
  max_capacity?: number;
  allow_waitlist: boolean;
  registration_deadline?: string;

  // Step 6: Tags
  tags: Tag[];

  // Meta
  is_visible: boolean;
  is_active: boolean;
  is_past: boolean;
}

// ========== Blog Types ==========

export interface BlogWizardData {
  // Step 1: Basic Info
  title: string;
  slug: string;
  excerpt: string;

  // Step 2: Content
  content: string;
  featured_image?: string;

  // Step 3: SEO
  meta_title?: string;
  meta_description?: string;
  focus_keywords?: string[];

  // Step 4: Scheduling
  publish_date?: string;
  expiry_date?: string;
  schedule?: ScheduleConfig;

  // Step 5: Tags & Categories
  category_id?: string;
  tags: Tag[];

  // Meta
  status: 'draft' | 'published';
  is_featured: boolean;
  allow_comments: boolean;
}

// ========== Announcement Types ==========

export interface AnnouncementWizardData {
  // Step 1: Basic Info
  title: string;
  content: string;

  // Step 2: Audience
  target_audience?: string;
  priority: number;

  // Step 3: Scheduling
  schedule?: ScheduleConfig;

  // Meta
  is_active: boolean;
}

// ========== Wizard State Types ==========

export interface WizardState<T> {
  assetType: AssetType;
  mode: WizardMode;
  assetId?: string; // Set when editing existing asset
  currentStep: number;
  totalSteps: number;
  data: T;
  stepValidation: boolean[]; // Validation state for each step
  isDirty: boolean;
  draftId?: string | null;
  lastSaved?: Date;
}

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  component: React.ComponentType<StepComponentProps<unknown>>;
  validate?: (data: unknown) => boolean | Promise<boolean>;
  isOptional?: boolean;
}

export interface StepComponentProps<T> {
  data: T;
  onUpdate: (updates: Partial<T>) => void;
  onValidationChange?: (isValid: boolean) => void;
  mode: WizardMode;
}

// ========== Draft Types ==========

export interface StudioDraft {
  id: string;
  user_id: string;
  asset_type: AssetType;
  asset_id?: string;
  draft_data: Record<string, unknown>; // JSON data specific to asset type
  current_step: number;
  created_at: string;
  updated_at: string;
}

// ========== Wizard Configuration ==========

export interface WizardConfig<T> {
  assetType: AssetType;
  title: string;
  icon: string;
  description: string;
  steps: WizardStep[];
  defaultData: T;
  finalizeData?: (data: T) => unknown; // Transform data before submission
}

// ========== Navigation Actions ==========

export interface WizardActions {
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: number) => void;
  updateData: (updates: Record<string, unknown>) => void;
  saveDraft: () => Promise<void>;
  publish: () => Promise<void>;
  reset: () => void;
}

// ========== Success Dialog Types ==========

export interface SuccessDialogProps {
  isOpen: boolean;
  assetType: AssetType;
  assetId: string;
  mode: WizardMode;
  onCreateAnother: () => void;
  onViewAsset: () => void;
  onGoToDashboard: () => void;
}

// ========== Asset Type Card ==========

export interface AssetTypeCard {
  type: AssetType;
  title: string;
  description: string;
  icon: string;
  color: string;
}

// ========== Utility Types ==========

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
