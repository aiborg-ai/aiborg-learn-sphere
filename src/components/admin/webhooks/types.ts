/**
 * Webhook Management Types
 * Shared type definitions and constants for webhook functionality
 */

export type WebhookStatus = 'active' | 'inactive' | 'failing';
export type DeliveryStatus = 'success' | 'failed' | 'pending' | 'retrying';

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  status: WebhookStatus;
  lastTriggered?: string;
  successCount: number;
  failureCount: number;
  retryEnabled: boolean;
  maxRetries: number;
  timeoutSeconds: number;
  createdAt: string;
  createdBy: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  webhookName: string;
  event: string;
  status: DeliveryStatus;
  statusCode?: number;
  requestHeaders: Record<string, string>;
  requestBody: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  duration?: number;
  attempts: number;
  nextRetry?: string;
  createdAt: string;
}

export interface WebhookEvent {
  value: string;
  label: string;
  category: string;
}

export const AVAILABLE_EVENTS: WebhookEvent[] = [
  { value: 'user.created', label: 'User Created', category: 'Users' },
  { value: 'user.updated', label: 'User Updated', category: 'Users' },
  { value: 'user.deleted', label: 'User Deleted', category: 'Users' },
  { value: 'user.login', label: 'User Login', category: 'Users' },
  { value: 'course.created', label: 'Course Created', category: 'Courses' },
  { value: 'course.updated', label: 'Course Updated', category: 'Courses' },
  { value: 'course.published', label: 'Course Published', category: 'Courses' },
  { value: 'course.deleted', label: 'Course Deleted', category: 'Courses' },
  { value: 'enrollment.created', label: 'Enrollment Created', category: 'Enrollments' },
  { value: 'enrollment.completed', label: 'Enrollment Completed', category: 'Enrollments' },
  { value: 'enrollment.cancelled', label: 'Enrollment Cancelled', category: 'Enrollments' },
  { value: 'payment.completed', label: 'Payment Completed', category: 'Payments' },
  { value: 'payment.failed', label: 'Payment Failed', category: 'Payments' },
  { value: 'payment.refunded', label: 'Payment Refunded', category: 'Payments' },
  { value: 'review.submitted', label: 'Review Submitted', category: 'Reviews' },
  { value: 'review.approved', label: 'Review Approved', category: 'Reviews' },
];
