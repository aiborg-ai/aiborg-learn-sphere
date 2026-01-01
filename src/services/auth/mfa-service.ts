/**
 * Multi-Factor Authentication (MFA) Service
 *
 * Provides TOTP-based two-factor authentication using Supabase Auth MFA.
 * Supports enrollment, verification, and factor management.
 *
 * Security Features:
 * - Time-based One-Time Passwords (TOTP)
 * - QR code generation for authenticator apps
 * - Factor management (list, unenroll)
 * - Challenge-response verification
 *
 * @module services/auth/mfa-service
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface MFAEnrollmentData {
  qrCode: string;
  secret: string;
  factorId: string;
}

export interface MFAFactor {
  id: string;
  friendlyName: string;
  factorType: 'totp';
  status: 'verified' | 'unverified';
  createdAt: string;
}

export interface MFAChallenge {
  challengeId: string;
  expiresAt: string;
}

export class MFAService {
  /**
   * Enroll a user in MFA using TOTP (Time-based One-Time Password)
   * Returns QR code and secret for scanning with authenticator app
   *
   * @returns Enrollment data including QR code
   * @throws Error if enrollment fails
   */
  async enrollMFA(friendlyName = 'Authenticator App'): Promise<MFAEnrollmentData> {
    try {
      logger.info('Starting MFA enrollment', { friendlyName });

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName,
      });

      if (error) {
        logger.error('MFA enrollment failed', error);
        throw new Error(`Failed to enroll in MFA: ${error.message}`);
      }

      if (!data?.totp?.qr_code || !data?.totp?.secret) {
        throw new Error('Invalid enrollment response from server');
      }

      logger.info('MFA enrollment successful', { factorId: data.id });

      return {
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        factorId: data.id,
      };
    } catch (_error) {
      logger.error('MFA enrollment _error', _error);
      throw _error;
    }
  }

  /**
   * Create an MFA challenge for verification
   * User must respond with TOTP code from authenticator app
   *
   * @param factorId - The ID of the factor to challenge
   * @returns Challenge data with ID and expiration
   * @throws Error if challenge creation fails
   */
  async createChallenge(factorId: string): Promise<MFAChallenge> {
    try {
      logger.info('Creating MFA challenge', { factorId });

      const { data, error } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (error) {
        logger.error('MFA challenge creation failed', error);
        throw new Error(`Failed to create MFA challenge: ${error.message}`);
      }

      if (!data?.id) {
        throw new Error('Invalid challenge response from server');
      }

      return {
        challengeId: data.id,
        expiresAt: data.expires_at,
      };
    } catch (_error) {
      logger.error('MFA challenge _error', _error);
      throw _error;
    }
  }

  /**
   * Verify an MFA challenge with the user's TOTP code
   *
   * @param factorId - The ID of the factor being verified
   * @param challengeId - The ID of the challenge
   * @param code - The 6-digit TOTP code from authenticator app
   * @returns True if verification successful
   * @throws Error if verification fails
   */
  async verifyMFA(factorId: string, challengeId: string, code: string): Promise<boolean> {
    try {
      logger.info('Verifying MFA code', { factorId, challengeId });

      // Validate code format
      if (!/^\d{6}$/.test(code)) {
        throw new Error('Invalid code format. Must be 6 digits.');
      }

      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });

      if (error) {
        logger.error('MFA verification failed', error, { factorId });
        throw new Error(`Invalid verification code: ${error.message}`);
      }

      logger.info('MFA verification successful', { factorId });
      return true;
    } catch (_error) {
      logger.error('MFA verification _error', _error);
      throw _error;
    }
  }

  /**
   * List all MFA factors enrolled for the current user
   *
   * @returns Array of enrolled factors
   * @throws Error if listing fails
   */
  async listFactors(): Promise<MFAFactor[]> {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();

      if (error) {
        logger.error('Failed to list MFA factors', error);
        throw new Error(`Failed to list MFA factors: ${error.message}`);
      }

      const factors: MFAFactor[] = (data?.totp || []).map(factor => ({
        id: factor.id,
        friendlyName: factor.friendly_name || 'Authenticator App',
        factorType: 'totp' as const,
        status: factor.status as 'verified' | 'unverified',
        createdAt: factor.created_at,
      }));

      logger.info('Listed MFA factors', { count: factors.length });
      return factors;
    } catch (_error) {
      logger.error('List MFA factors _error', _error);
      throw _error;
    }
  }

  /**
   * Check if the current user has any verified MFA factors
   *
   * @returns True if user has MFA enabled
   */
  async hasMFA(): Promise<boolean> {
    try {
      const factors = await this.listFactors();
      const hasVerified = factors.some(f => f.status === 'verified');

      logger.info('Checked MFA status', { hasMFA: hasVerified });
      return hasVerified;
    } catch (_error) {
      logger.error('Check MFA status _error', _error);
      return false; // Fail safely
    }
  }

  /**
   * Unenroll (remove) an MFA factor
   *
   * @param factorId - The ID of the factor to remove
   * @returns True if unenrollment successful
   * @throws Error if unenrollment fails
   */
  async unenrollMFA(factorId: string): Promise<boolean> {
    try {
      logger.info('Unenrolling MFA factor', { factorId });

      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (error) {
        logger.error('MFA unenrollment failed', error);
        throw new Error(`Failed to unenroll MFA: ${error.message}`);
      }

      logger.info('MFA unenrollment successful', { factorId });
      return true;
    } catch (_error) {
      logger.error('MFA unenrollment _error', _error);
      throw _error;
    }
  }

  /**
   * Get the assurance level for the current session
   * Returns the level of authentication confidence
   *
   * @returns Assurance level ('aal1' or 'aal2')
   */
  async getAssuranceLevel(): Promise<'aal1' | 'aal2' | null> {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (error) {
        logger.error('Failed to get assurance level', error);
        return null;
      }

      return data?.currentLevel || null;
    } catch (_error) {
      logger.error('Get assurance level _error', _error);
      return null;
    }
  }

  /**
   * Complete enrollment by verifying the initial TOTP code
   * This confirms the user has successfully configured their authenticator app
   *
   * @param factorId - The factor ID from enrollment
   * @param code - The 6-digit TOTP code
   * @returns True if verification successful
   */
  async completeEnrollment(factorId: string, code: string): Promise<boolean> {
    try {
      // Create challenge
      const challenge = await this.createChallenge(factorId);

      // Verify code
      await this.verifyMFA(factorId, challenge.challengeId, code);

      logger.info('MFA enrollment completed', { factorId });
      return true;
    } catch (_error) {
      logger.error('Complete enrollment _error', _error);
      throw _error;
    }
  }
}

// Singleton export
export const mfaService = new MFAService();
