/**
 * Progressive Onboarding Types
 *
 * Types for the progressive onboarding system that shows contextual tips
 * as users explore the platform.
 */

export type OnboardingTipPlacement = 'top' | 'bottom' | 'left' | 'right';

export type OnboardingCategory =
  | 'navigation'
  | 'dashboard'
  | 'courses'
  | 'events'
  | 'studio'
  | 'profile'
  | 'assessment'
  | 'general';

export type UserRole = 'admin' | 'instructor' | 'student' | null;

export interface OnboardingTip {
  id: string;
  title: string;
  description: string;
  target_element?: string | null; // CSS selector
  placement: OnboardingTipPlacement;
  category: OnboardingCategory;
  role?: UserRole;
  icon?: string;
  action_label: string;
  priority: number;
  is_active: boolean;
  created_at: string;
}

export interface UserOnboardingProgress {
  id: string;
  user_id: string;
  completed_tips: string[];
  has_completed_profile: boolean;
  has_enrolled_in_course: boolean;
  has_attended_event: boolean;
  has_completed_assessment: boolean;
  has_explored_dashboard: boolean;
  has_used_ai_chat: boolean;
  has_created_content: boolean;
  onboarding_completed: boolean;
  onboarding_skipped: boolean;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export interface OnboardingTooltipProps {
  tipId: string;
  title: string;
  description: string;
  placement?: OnboardingTipPlacement;
  icon?: string;
  actionLabel?: string;
  children: React.ReactNode;
  delay?: number; // Delay before showing tooltip (ms)
  showOnce?: boolean; // Only show once per session
}

export interface UseOnboardingReturn {
  // Progress state
  progress: UserOnboardingProgress | null;
  loading: boolean;
  error: Error | null;

  // Tip management
  isTipCompleted: (tipId: string) => boolean;
  markTipCompleted: (tipId: string) => Promise<void>;
  markMultipleTipsCompleted: (tipIds: string[]) => Promise<void>;

  // Milestone tracking
  markMilestone: (
    milestone: keyof Pick<
      UserOnboardingProgress,
      | 'has_completed_profile'
      | 'has_enrolled_in_course'
      | 'has_attended_event'
      | 'has_completed_assessment'
      | 'has_explored_dashboard'
      | 'has_used_ai_chat'
      | 'has_created_content'
    >
  ) => Promise<void>;

  // Overall onboarding
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;

  // Utilities
  shouldShowTip: (tipId: string, category?: OnboardingCategory) => boolean;
  getCompletionPercentage: () => number;
}

export interface OnboardingContextValue extends UseOnboardingReturn {
  tips: OnboardingTip[];
  refetchTips: () => Promise<void>;
}
