/**
 * Wizard Configurations
 * Defines the steps and default data for each asset type
 */

import type {
  WizardConfig,
  CourseWizardData,
  EventWizardData,
  BlogWizardData,
  AnnouncementWizardData,
  AssetType,
} from '@/types/studio.types';

// Import Course Step Components
import { CourseBasicInfoStep } from '@/components/studio/steps/course/CourseBasicInfoStep';
import { CourseContentStep } from '@/components/studio/steps/course/CourseContentStep';
import { CourseSchedulingStep } from '@/components/studio/steps/course/CourseSchedulingStep';
import { CourseAudienceStep } from '@/components/studio/steps/course/CourseAudienceStep';
import { CoursePricingStep } from '@/components/studio/steps/course/CoursePricingStep';
import { CourseTagsStep } from '@/components/studio/steps/course/CourseTagsStep';
import { CourseReviewStep } from '@/components/studio/steps/course/CourseReviewStep';

// Import Event Step Components
import { EventBasicInfoStep } from '@/components/studio/steps/event/EventBasicInfoStep';
import { EventDetailsStep } from '@/components/studio/steps/event/EventDetailsStep';
import { EventSchedulingStep } from '@/components/studio/steps/event/EventSchedulingStep';
import { EventLocationStep } from '@/components/studio/steps/event/EventLocationStep';
import { EventCapacityStep } from '@/components/studio/steps/event/EventCapacityStep';
import { EventTagsStep } from '@/components/studio/steps/event/EventTagsStep';
import { EventReviewStep } from '@/components/studio/steps/event/EventReviewStep';

// Import Blog Step Components
import { BlogBasicInfoStep } from '@/components/studio/steps/blog/BlogBasicInfoStep';
import { BlogContentStep } from '@/components/studio/steps/blog/BlogContentStep';
import { BlogSeoStep } from '@/components/studio/steps/blog/BlogSeoStep';
import { BlogSchedulingStep } from '@/components/studio/steps/blog/BlogSchedulingStep';
import { BlogTagsStep } from '@/components/studio/steps/blog/BlogTagsStep';
import { BlogReviewStep } from '@/components/studio/steps/blog/BlogReviewStep';

// Import Announcement Step Components
import { AnnouncementBasicInfoStep } from '@/components/studio/steps/announcement/AnnouncementBasicInfoStep';
import { AnnouncementAudienceStep } from '@/components/studio/steps/announcement/AnnouncementAudienceStep';
import { AnnouncementSchedulingStep } from '@/components/studio/steps/announcement/AnnouncementSchedulingStep';
import { AnnouncementReviewStep } from '@/components/studio/steps/announcement/AnnouncementReviewStep';

// ========== Default Data ==========

export const defaultCourseData: CourseWizardData = {
  title: '',
  description: '',
  image_url: '',
  category: '',
  features: [],
  prerequisites: '',
  level: 'beginner',
  mode: 'online',
  duration: '',
  start_date: '',
  schedule: {
    timezone: 'UTC',
  },
  audiences: [],
  target_description: '',
  price: '',
  payment_options: [],
  early_bird_price: '',
  group_discount: '',
  currently_enrolling: true,
  tags: [],
  keywords: [],
  is_active: true,
  display: true,
  sort_order: 0,
};

export const defaultEventData: EventWizardData = {
  title: '',
  description: '',
  image_url: '',
  event_type: 'workshop',
  format: 'in-person',
  special_requirements: '',
  event_date: '',
  event_time: '',
  duration: '',
  schedule: {
    timezone: 'UTC',
  },
  location: '',
  online_link: '',
  venue_details: '',
  max_capacity: 50,
  allow_waitlist: false,
  registration_deadline: '',
  tags: [],
  is_visible: true,
  is_active: true,
  is_past: false,
};

export const defaultBlogData: BlogWizardData = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  featured_image: '',
  meta_title: '',
  meta_description: '',
  focus_keywords: [],
  publish_date: '',
  expiry_date: '',
  schedule: {
    timezone: 'UTC',
  },
  category_id: '',
  tags: [],
  status: 'draft',
  is_featured: false,
  allow_comments: true,
};

export const defaultAnnouncementData: AnnouncementWizardData = {
  title: '',
  content: '',
  target_audience: '',
  priority: 1,
  schedule: {
    timezone: 'UTC',
  },
  is_active: true,
};

// ========== Wizard Step Definitions ==========

// Note: Actual step components will be imported when they're created in Phase 2-7
// For now, we use placeholders that can be replaced

export const courseSteps: WizardConfig<CourseWizardData>['steps'] = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Course title, description, and category',
    icon: 'info',
    component: CourseBasicInfoStep,
  },
  {
    id: 'content',
    title: 'Content & Features',
    description: 'Course features, level, and mode',
    icon: 'book',
    component: CourseContentStep,
  },
  {
    id: 'scheduling',
    title: 'Scheduling',
    description: 'Start date, duration, and active period',
    icon: 'calendar',
    component: CourseSchedulingStep,
  },
  {
    id: 'audience',
    title: 'Audience',
    description: 'Target audiences and prerequisites',
    icon: 'users',
    component: CourseAudienceStep,
  },
  {
    id: 'pricing',
    title: 'Pricing',
    description: 'Price and payment options',
    icon: 'dollar',
    component: CoursePricingStep,
  },
  {
    id: 'tags',
    title: 'Tags & Keywords',
    description: 'Drag and drop tags for categorization',
    icon: 'tag',
    component: CourseTagsStep,
  },
  {
    id: 'review',
    title: 'Review & Publish',
    description: 'Preview and finalize your course',
    icon: 'check',
    component: CourseReviewStep,
  },
];

export const eventSteps: WizardConfig<EventWizardData>['steps'] = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Event title, description, and type',
    icon: 'info',
    component: EventBasicInfoStep,
  },
  {
    id: 'details',
    title: 'Event Details',
    description: 'Format and special requirements',
    icon: 'settings',
    component: EventDetailsStep,
  },
  {
    id: 'scheduling',
    title: 'Scheduling',
    description: 'Date, time, and recurring pattern',
    icon: 'calendar',
    component: EventSchedulingStep,
  },
  {
    id: 'location',
    title: 'Location',
    description: 'Venue or online meeting details',
    icon: 'map-pin',
    component: EventLocationStep,
  },
  {
    id: 'capacity',
    title: 'Capacity',
    description: 'Attendee limits and registration',
    icon: 'users',
    component: EventCapacityStep,
  },
  {
    id: 'tags',
    title: 'Tags',
    description: 'Categorize your event',
    icon: 'tag',
    component: EventTagsStep,
  },
  {
    id: 'review',
    title: 'Review & Publish',
    description: 'Preview and finalize your event',
    icon: 'check',
    component: EventReviewStep,
  },
];

export const blogSteps: WizardConfig<BlogWizardData>['steps'] = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Title, slug, and excerpt',
    icon: 'info',
    component: BlogBasicInfoStep,
  },
  {
    id: 'content',
    title: 'Content',
    description: 'Write your blog post content',
    icon: 'edit',
    component: BlogContentStep,
  },
  {
    id: 'seo',
    title: 'SEO',
    description: 'Meta information and keywords',
    icon: 'search',
    component: BlogSeoStep,
  },
  {
    id: 'scheduling',
    title: 'Scheduling',
    description: 'Publish and expiry dates',
    icon: 'calendar',
    component: BlogSchedulingStep,
  },
  {
    id: 'tags',
    title: 'Tags & Categories',
    description: 'Organize your content',
    icon: 'tag',
    component: BlogTagsStep,
  },
  {
    id: 'review',
    title: 'Review & Publish',
    description: 'Preview and finalize your post',
    icon: 'check',
    component: BlogReviewStep,
  },
];

export const announcementSteps: WizardConfig<AnnouncementWizardData>['steps'] = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Announcement title and content',
    icon: 'info',
    component: AnnouncementBasicInfoStep,
  },
  {
    id: 'audience',
    title: 'Audience & Priority',
    description: 'Who should see this announcement',
    icon: 'users',
    component: AnnouncementAudienceStep,
  },
  {
    id: 'scheduling',
    title: 'Scheduling',
    description: 'When to display the announcement',
    icon: 'calendar',
    component: AnnouncementSchedulingStep,
  },
  {
    id: 'review',
    title: 'Review & Publish',
    description: 'Preview and finalize',
    icon: 'check',
    component: AnnouncementReviewStep,
  },
];

// ========== Wizard Configurations Registry ==========

type AnyWizardData = CourseWizardData | EventWizardData | BlogWizardData | AnnouncementWizardData;

export const wizardConfigs: Record<AssetType, WizardConfig<AnyWizardData>> = {
  course: {
    assetType: 'course',
    title: 'Create Course',
    icon: '📚',
    description: 'Create training programs and courses with curriculum, pricing, and scheduling',
    steps: courseSteps,
    defaultData: defaultCourseData,
    finalizeData: (data: CourseWizardData) => {
      // Transform wizard data to match database schema
      return {
        title: data.title,
        description: data.description,
        image_url: data.image_url || null,
        audience: data.audiences[0] || '', // Backward compatibility
        audiences: data.audiences,
        mode: data.mode,
        duration: data.duration,
        price: data.price,
        level: data.level,
        start_date: data.start_date || null,
        features: data.features,
        category: data.category,
        keywords: data.keywords,
        prerequisites: data.prerequisites || null,
        is_active: data.is_active,
        currently_enrolling: data.currently_enrolling,
        display: data.display,
        sort_order: data.sort_order || 0,
        tags: JSON.stringify(data.tags),
      };
    },
  },
  event: {
    assetType: 'event',
    title: 'Create Event',
    icon: '🎪',
    description: 'Create workshops, seminars, and webinars with scheduling and capacity management',
    steps: eventSteps,
    defaultData: defaultEventData,
    finalizeData: (data: EventWizardData) => {
      return {
        title: data.title,
        description: data.description,
        image_url: data.image_url || null,
        event_date: data.event_date,
        event_time: data.event_time,
        location: data.location || null,
        max_capacity: data.max_capacity,
        is_visible: data.is_visible,
        is_active: data.is_active,
        is_past: data.is_past,
        event_type: data.event_type,
        tags: JSON.stringify(data.tags),
      };
    },
  },
  blog: {
    assetType: 'blog',
    title: 'Create Blog Post',
    icon: '📝',
    description: 'Write articles and content with SEO optimization and scheduling',
    steps: blogSteps,
    defaultData: defaultBlogData,
    finalizeData: (data: BlogWizardData) => {
      return {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        featured_image: data.featured_image || null,
        category_id: data.category_id || null,
        status: data.status,
        is_featured: data.is_featured,
        allow_comments: data.allow_comments,
        meta_title: data.meta_title || null,
        meta_description: data.meta_description || null,
        tags: JSON.stringify(data.tags),
      };
    },
  },
  announcement: {
    assetType: 'announcement',
    title: 'Create Announcement',
    icon: '📢',
    description: 'Create platform-wide announcements with audience targeting',
    steps: announcementSteps,
    defaultData: defaultAnnouncementData,
    finalizeData: (data: AnnouncementWizardData) => {
      return {
        title: data.title,
        content: data.content,
        target_audience: data.target_audience || null,
        priority: data.priority,
        is_active: data.is_active,
      };
    },
  },
};

// ========== Helper Functions ==========

export function getWizardConfig(assetType: AssetType): WizardConfig<AnyWizardData> {
  return wizardConfigs[assetType];
}

export function getStepCount(assetType: AssetType): number {
  return wizardConfigs[assetType].steps.length;
}

export function getStepByIndex(assetType: AssetType, index: number) {
  return wizardConfigs[assetType].steps[index];
}

export function getStepById(assetType: AssetType, stepId: string) {
  return wizardConfigs[assetType].steps.find(step => step.id === stepId);
}
