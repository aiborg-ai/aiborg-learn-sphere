/**
 * MFA Service Tests
 * Tests Multi-Factor Authentication (TOTP) functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MFAService } from '../mfa-service';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      mfa: {
        enroll: vi.fn(),
        challenge: vi.fn(),
        verify: vi.fn(),
        listFactors: vi.fn(),
        unenroll: vi.fn(),
        getAuthenticatorAssuranceLevel: vi.fn(),
      },
    },
  },
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MFAService', () => {
  let mfaService: MFAService;

  beforeEach(() => {
    vi.clearAllMocks();
    mfaService = new MFAService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================
  // enrollMFA() Tests
  // ========================================

  describe('enrollMFA', () => {
    it('should enroll user in MFA successfully', async () => {
      const mockEnrollmentData = {
        id: 'factor-123',
        totp: {
          qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
          secret: 'JBSWY3DPEHPK3PXP',
        },
      };

      (supabase.auth.mfa.enroll as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockEnrollmentData,
        error: null,
      });

      const result = await mfaService.enrollMFA('My Authenticator');

      expect(supabase.auth.mfa.enroll).toHaveBeenCalledWith({
        factorType: 'totp',
        friendlyName: 'My Authenticator',
      });

      expect(result).toEqual({
        qrCode: mockEnrollmentData.totp.qr_code,
        secret: mockEnrollmentData.totp.secret,
        factorId: mockEnrollmentData.id,
      });
    });

    it('should use default friendly name if not provided', async () => {
      const mockEnrollmentData = {
        id: 'factor-123',
        totp: {
          qr_code: 'data:image/png;base64,test',
          secret: 'SECRET123',
        },
      };

      (supabase.auth.mfa.enroll as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockEnrollmentData,
        error: null,
      });

      await mfaService.enrollMFA();

      expect(supabase.auth.mfa.enroll).toHaveBeenCalledWith({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });
    });

    it('should throw error if enrollment fails', async () => {
      (supabase.auth.mfa.enroll as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'Enrollment failed' },
      });

      await expect(mfaService.enrollMFA()).rejects.toThrow(
        'Failed to enroll in MFA: Enrollment failed'
      );
    });

    it('should throw error if QR code is missing', async () => {
      (supabase.auth.mfa.enroll as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          id: 'factor-123',
          totp: {
            secret: 'SECRET123',
          },
        },
        error: null,
      });

      await expect(mfaService.enrollMFA()).rejects.toThrow(
        'Invalid enrollment response from server'
      );
    });

    it('should throw error if secret is missing', async () => {
      (supabase.auth.mfa.enroll as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          id: 'factor-123',
          totp: {
            qr_code: 'data:image/png;base64,test',
          },
        },
        error: null,
      });

      await expect(mfaService.enrollMFA()).rejects.toThrow(
        'Invalid enrollment response from server'
      );
    });
  });

  // ========================================
  // createChallenge() Tests
  // ========================================

  describe('createChallenge', () => {
    it('should create MFA challenge successfully', async () => {
      const mockChallenge = {
        id: 'challenge-123',
        expires_at: '2024-12-31T23:59:59Z',
      };

      (supabase.auth.mfa.challenge as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockChallenge,
        error: null,
      });

      const result = await mfaService.createChallenge('factor-123');

      expect(supabase.auth.mfa.challenge).toHaveBeenCalledWith({
        factorId: 'factor-123',
      });

      expect(result).toEqual({
        challengeId: mockChallenge.id,
        expiresAt: mockChallenge.expires_at,
      });
    });

    it('should throw error if challenge creation fails', async () => {
      (supabase.auth.mfa.challenge as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'Challenge failed' },
      });

      await expect(mfaService.createChallenge('factor-123')).rejects.toThrow(
        'Failed to create MFA challenge: Challenge failed'
      );
    });

    it('should throw error if challenge ID is missing', async () => {
      (supabase.auth.mfa.challenge as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          expires_at: '2024-12-31T23:59:59Z',
        },
        error: null,
      });

      await expect(mfaService.createChallenge('factor-123')).rejects.toThrow(
        'Invalid challenge response from server'
      );
    });
  });

  // ========================================
  // verifyMFA() Tests
  // ========================================

  describe('verifyMFA', () => {
    it('should verify MFA code successfully', async () => {
      (supabase.auth.mfa.verify as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await mfaService.verifyMFA('factor-123', 'challenge-123', '123456');

      expect(supabase.auth.mfa.verify).toHaveBeenCalledWith({
        factorId: 'factor-123',
        challengeId: 'challenge-123',
        code: '123456',
      });

      expect(result).toBe(true);
    });

    it('should throw error for invalid code format (non-digits)', async () => {
      await expect(mfaService.verifyMFA('factor-123', 'challenge-123', 'abc123')).rejects.toThrow(
        'Invalid code format. Must be 6 digits.'
      );
    });

    it('should throw error for invalid code format (too short)', async () => {
      await expect(mfaService.verifyMFA('factor-123', 'challenge-123', '12345')).rejects.toThrow(
        'Invalid code format. Must be 6 digits.'
      );
    });

    it('should throw error for invalid code format (too long)', async () => {
      await expect(mfaService.verifyMFA('factor-123', 'challenge-123', '1234567')).rejects.toThrow(
        'Invalid code format. Must be 6 digits.'
      );
    });

    it('should throw error if verification fails', async () => {
      (supabase.auth.mfa.verify as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'Invalid code' },
      });

      await expect(mfaService.verifyMFA('factor-123', 'challenge-123', '123456')).rejects.toThrow(
        'Invalid verification code: Invalid code'
      );
    });
  });

  // ========================================
  // listFactors() Tests
  // ========================================

  describe('listFactors', () => {
    it('should list all MFA factors successfully', async () => {
      const mockFactors = [
        {
          id: 'factor-1',
          friendly_name: 'iPhone Authenticator',
          status: 'verified',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'factor-2',
          friendly_name: 'Android Authenticator',
          status: 'unverified',
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      (supabase.auth.mfa.listFactors as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          totp: mockFactors,
        },
        error: null,
      });

      const result = await mfaService.listFactors();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'factor-1',
        friendlyName: 'iPhone Authenticator',
        factorType: 'totp',
        status: 'verified',
        createdAt: '2024-01-01T00:00:00Z',
      });
    });

    it('should handle factor without friendly_name', async () => {
      const mockFactors = [
        {
          id: 'factor-1',
          friendly_name: null,
          status: 'verified',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      (supabase.auth.mfa.listFactors as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          totp: mockFactors,
        },
        error: null,
      });

      const result = await mfaService.listFactors();

      expect(result[0].friendlyName).toBe('Authenticator App');
    });

    it('should return empty array if no factors exist', async () => {
      (supabase.auth.mfa.listFactors as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          totp: [],
        },
        error: null,
      });

      const result = await mfaService.listFactors();

      expect(result).toEqual([]);
    });

    it('should throw error if listing fails', async () => {
      (supabase.auth.mfa.listFactors as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'List failed' },
      });

      await expect(mfaService.listFactors()).rejects.toThrow(
        'Failed to list MFA factors: List failed'
      );
    });
  });

  // ========================================
  // hasMFA() Tests
  // ========================================

  describe('hasMFA', () => {
    it('should return true if user has verified factor', async () => {
      const mockFactors = [
        {
          id: 'factor-1',
          friendly_name: 'Test',
          status: 'verified',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      (supabase.auth.mfa.listFactors as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          totp: mockFactors,
        },
        error: null,
      });

      const result = await mfaService.hasMFA();

      expect(result).toBe(true);
    });

    it('should return false if only unverified factors exist', async () => {
      const mockFactors = [
        {
          id: 'factor-1',
          friendly_name: 'Test',
          status: 'unverified',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      (supabase.auth.mfa.listFactors as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          totp: mockFactors,
        },
        error: null,
      });

      const result = await mfaService.hasMFA();

      expect(result).toBe(false);
    });

    it('should return false if no factors exist', async () => {
      (supabase.auth.mfa.listFactors as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          totp: [],
        },
        error: null,
      });

      const result = await mfaService.hasMFA();

      expect(result).toBe(false);
    });

    it('should return false on error (fail safely)', async () => {
      (supabase.auth.mfa.listFactors as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      });

      const result = await mfaService.hasMFA();

      expect(result).toBe(false);
    });
  });

  // ========================================
  // unenrollMFA() Tests
  // ========================================

  describe('unenrollMFA', () => {
    it('should unenroll MFA factor successfully', async () => {
      (supabase.auth.mfa.unenroll as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await mfaService.unenrollMFA('factor-123');

      expect(supabase.auth.mfa.unenroll).toHaveBeenCalledWith({
        factorId: 'factor-123',
      });

      expect(result).toBe(true);
    });

    it('should throw error if unenrollment fails', async () => {
      (supabase.auth.mfa.unenroll as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'Unenroll failed' },
      });

      await expect(mfaService.unenrollMFA('factor-123')).rejects.toThrow(
        'Failed to unenroll MFA: Unenroll failed'
      );
    });
  });

  // ========================================
  // getAssuranceLevel() Tests
  // ========================================

  describe('getAssuranceLevel', () => {
    it('should return aal2 for MFA-authenticated session', async () => {
      (
        supabase.auth.mfa.getAuthenticatorAssuranceLevel as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        data: {
          currentLevel: 'aal2',
        },
        error: null,
      });

      const result = await mfaService.getAssuranceLevel();

      expect(result).toBe('aal2');
    });

    it('should return aal1 for password-only session', async () => {
      (
        supabase.auth.mfa.getAuthenticatorAssuranceLevel as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        data: {
          currentLevel: 'aal1',
        },
        error: null,
      });

      const result = await mfaService.getAssuranceLevel();

      expect(result).toBe('aal1');
    });

    it('should return null if no level data', async () => {
      (
        supabase.auth.mfa.getAuthenticatorAssuranceLevel as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await mfaService.getAssuranceLevel();

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      (
        supabase.auth.mfa.getAuthenticatorAssuranceLevel as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      });

      const result = await mfaService.getAssuranceLevel();

      expect(result).toBeNull();
    });
  });

  // ========================================
  // completeEnrollment() Tests
  // ========================================

  describe('completeEnrollment', () => {
    it('should complete enrollment successfully', async () => {
      const mockChallenge = {
        id: 'challenge-123',
        expires_at: '2024-12-31T23:59:59Z',
      };

      (supabase.auth.mfa.challenge as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockChallenge,
        error: null,
      });

      (supabase.auth.mfa.verify as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await mfaService.completeEnrollment('factor-123', '123456');

      expect(supabase.auth.mfa.challenge).toHaveBeenCalledWith({
        factorId: 'factor-123',
      });

      expect(supabase.auth.mfa.verify).toHaveBeenCalledWith({
        factorId: 'factor-123',
        challengeId: 'challenge-123',
        code: '123456',
      });

      expect(result).toBe(true);
    });

    it('should throw error if challenge creation fails', async () => {
      (supabase.auth.mfa.challenge as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'Challenge failed' },
      });

      await expect(mfaService.completeEnrollment('factor-123', '123456')).rejects.toThrow();
    });

    it('should throw error if verification fails', async () => {
      const mockChallenge = {
        id: 'challenge-123',
        expires_at: '2024-12-31T23:59:59Z',
      };

      (supabase.auth.mfa.challenge as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockChallenge,
        error: null,
      });

      (supabase.auth.mfa.verify as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'Invalid code' },
      });

      await expect(mfaService.completeEnrollment('factor-123', '123456')).rejects.toThrow();
    });

    it('should throw error for invalid code format', async () => {
      // Mock challenge creation (will be called before validation)
      const mockChallenge = {
        id: 'challenge-123',
        expires_at: '2024-12-31T23:59:59Z',
      };

      (supabase.auth.mfa.challenge as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockChallenge,
        error: null,
      });

      // The invalid code format error should be thrown during verifyMFA
      await expect(mfaService.completeEnrollment('factor-123', 'invalid')).rejects.toThrow(
        'Invalid code format. Must be 6 digits.'
      );
    });
  });
});
