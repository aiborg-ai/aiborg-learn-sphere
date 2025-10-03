import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

type NotificationType =
  | 'course_enrollment'
  | 'assignment_due'
  | 'assignment_graded'
  | 'course_update'
  | 'new_announcement'
  | 'deadline_reminder'
  | 'certificate_ready'
  | 'discussion_reply';

interface EmailNotificationData {
  to: string;
  type: NotificationType;
  data: Record<string, any>;
}

export async function sendEmailNotification(
  type: NotificationType,
  recipientEmail: string,
  data: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: result, error } = await supabase.functions.invoke(
      'send-email-notification',
      {
        body: {
          to: recipientEmail,
          type,
          data,
        },
      }
    );

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    logger.error('Error sending email notification:', error);
    return { success: false, error: error.message };
  }
}

// Helper functions for specific notification types

export async function sendEnrollmentEmail(params: {
  studentEmail: string;
  studentName: string;
  courseName: string;
  instructorName: string;
  duration: string;
  startDate: string;
  courseUrl: string;
}) {
  return sendEmailNotification('course_enrollment', params.studentEmail, {
    studentName: params.studentName,
    courseName: params.courseName,
    instructorName: params.instructorName,
    duration: params.duration,
    startDate: params.startDate,
    courseUrl: params.courseUrl,
    dashboardUrl: `${window.location.origin}/dashboard`,
    settingsUrl: `${window.location.origin}/profile#notifications`,
  });
}

export async function sendAssignmentDueEmail(params: {
  studentEmail: string;
  studentName: string;
  assignmentName: string;
  courseName: string;
  dueDate: string;
  daysLeft: number;
  description: string;
  assignmentUrl: string;
}) {
  return sendEmailNotification('assignment_due', params.studentEmail, params);
}

export async function sendAssignmentGradedEmail(params: {
  studentEmail: string;
  studentName: string;
  assignmentName: string;
  courseName: string;
  score: number;
  totalPoints: number;
  grade: string;
  percentage: number;
  feedback?: string;
  submittedDate: string;
  gradedDate: string;
  assignmentUrl: string;
}) {
  return sendEmailNotification('assignment_graded', params.studentEmail, params);
}

export async function sendCourseUpdateEmail(params: {
  studentEmail: string;
  studentName: string;
  courseName: string;
  updateTitle: string;
  updateMessage: string;
  instructorName: string;
  updateDate: string;
  courseUrl: string;
}) {
  return sendEmailNotification('course_update', params.studentEmail, params);
}

export async function sendAnnouncementEmail(params: {
  studentEmail: string;
  studentName: string;
  courseName: string;
  announcementTitle: string;
  announcementBody: string;
  instructorName: string;
  date: string;
  courseUrl: string;
}) {
  return sendEmailNotification('new_announcement', params.studentEmail, params);
}

export async function sendDeadlineReminderEmail(params: {
  studentEmail: string;
  studentName: string;
  itemName: string;
  courseName: string;
  hoursLeft: number;
  dueDateTime: string;
  submissionUrl: string;
}) {
  return sendEmailNotification('deadline_reminder', params.studentEmail, params);
}

export async function sendCertificateReadyEmail(params: {
  studentEmail: string;
  studentName: string;
  courseName: string;
  completionDate: string;
  finalGrade: string;
  totalModules: number;
  totalAssignments: number;
  totalHours: number;
  certificateUrl: string;
}) {
  return sendEmailNotification('certificate_ready', params.studentEmail, params);
}

export async function sendDiscussionReplyEmail(params: {
  studentEmail: string;
  studentName: string;
  courseName: string;
  replierName: string;
  originalPost: string;
  replyContent: string;
  topicName: string;
  replyDate: string;
  discussionUrl: string;
}) {
  return sendEmailNotification('discussion_reply', params.studentEmail, params);
}
