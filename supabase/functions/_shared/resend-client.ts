/**
 * Resend Email Client
 * Shared utility for sending emails via Resend API
 * Feature: 001-create-a-free (Free Introductory AI Session)
 */

import { Resend } from 'npm:resend@4.0.0';

// Initialize Resend client with API key from environment
export const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// Email sender configuration
export const EMAIL_FROM = 'AIborg Learn Sphere <sessions@aiborg.dev>';

// Email subject templates
export const EMAIL_SUBJECTS = {
  confirmation: (sessionTitle: string) => `Session Confirmed: ${sessionTitle}`,
  waitlist_promotion: (sessionTitle: string) => `Good News! A Spot Opened Up - ${sessionTitle}`,
  reminder_24h: (sessionTitle: string) => `Reminder: ${sessionTitle} Tomorrow`,
  reminder_1h: (sessionTitle: string) => `Starting Soon: ${sessionTitle} in 1 Hour`,
  post_session: (sessionTitle: string) => `Thank You for Attending: ${sessionTitle}`,
  parent_consent: (childName: string) =>
    `Parental Consent Required: ${childName}'s Session Registration`,
  cancellation: (sessionTitle: string) => `Registration Cancelled: ${sessionTitle}`,
  admin_notification: 'Session Registration Notification',
};

// Email type for logging
export type EmailType =
  | 'confirmation'
  | 'waitlist_promotion'
  | 'reminder_24h'
  | 'reminder_1h'
  | 'post_session'
  | 'parent_consent'
  | 'cancellation'
  | 'admin_notification';

/**
 * Send email and return Resend response
 */
export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ id: string } | null> {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      reply_to: params.replyTo,
    });

    if (error) {
      console.error('Resend API error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    return null;
  }
}
