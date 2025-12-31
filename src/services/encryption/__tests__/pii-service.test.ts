/**
 * PII Service Tests
 * Tests PII encryption/decryption and validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Create shared mock object that will be populated
let mockGetUser: ReturnType<typeof vi.fn>;
let mockRpc: ReturnType<typeof vi.fn>;
let mockFrom: ReturnType<typeof vi.fn>;

// Mock Supabase client creation
vi.mock('@supabase/supabase-js', () => {
  // Create mocks inside the factory
  const getUser = vi.fn();
  const rpc = vi.fn();
  const from = vi.fn();

  return {
    createClient: vi.fn(() => ({
      auth: {
        getUser,
      },
      rpc,
      from,
    })),
    __mockGetUser: getUser,
    __mockRpc: rpc,
    __mockFrom: from,
  };
});

// Import after mocking
import { PIIService } from '../pii-service';
import * as SupabaseModule from '@supabase/supabase-js';

// Extract mocks from module
// eslint-disable-next-line prefer-const
mockGetUser = (SupabaseModule as unknown as { __mockGetUser: ReturnType<typeof vi.fn> })
  .__mockGetUser;
// eslint-disable-next-line prefer-const
mockRpc = (SupabaseModule as unknown as { __mockRpc: ReturnType<typeof vi.fn> }).__mockRpc;
// eslint-disable-next-line prefer-const
mockFrom = (SupabaseModule as unknown as { __mockFrom: ReturnType<typeof vi.fn> }).__mockFrom;

describe('PIIService', () => {
  let piiService: PIIService;

  beforeEach(() => {
    vi.clearAllMocks();
    piiService = new PIIService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================
  // storePII() Tests
  // ========================================

  describe('storePII', () => {
    it('should store PII successfully with all fields', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockRpc.mockResolvedValue({
        data: null,
        error: null,
      });

      await piiService.storePII({
        phone: '+12345678900',
        address: '123 Main St',
        dateOfBirth: '1990-01-01',
        nationalId: 'ABC123456',
      });

      expect(mockRpc).toHaveBeenCalledWith('store_encrypted_pii', {
        p_user_id: 'user-123',
        p_phone: '+12345678900',
        p_address: '123 Main St',
        p_date_of_birth: '1990-01-01',
        p_national_id: 'ABC123456',
      });
    });

    it('should store PII with partial data', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockRpc.mockResolvedValue({
        data: null,
        error: null,
      });

      await piiService.storePII({
        phone: '+12345678900',
      });

      expect(mockRpc).toHaveBeenCalledWith('store_encrypted_pii', {
        p_user_id: 'user-123',
        p_phone: '+12345678900',
        p_address: null,
        p_date_of_birth: null,
        p_national_id: null,
      });
    });

    it('should throw error if user not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(piiService.storePII({ phone: '+12345678900' })).rejects.toThrow(
        'User must be authenticated to store PII'
      );
    });

    it('should throw error for invalid phone format', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await expect(piiService.storePII({ phone: 'invalid-phone' })).rejects.toThrow(
        'Invalid phone number format'
      );
    });

    it('should throw error for address too long', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const longAddress = 'x'.repeat(501);

      await expect(piiService.storePII({ address: longAddress })).rejects.toThrow(
        'Address must be less than 500 characters'
      );
    });

    it('should throw error for future date of birth', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      await expect(piiService.storePII({ dateOfBirth: futureDate.toISOString() })).rejects.toThrow(
        'Date of birth must be in the past'
      );
    });

    it('should throw error for date of birth too far in past', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await expect(piiService.storePII({ dateOfBirth: '1800-01-01' })).rejects.toThrow(
        'Invalid date of birth - too far in the past'
      );
    });

    it('should throw error for invalid national ID format', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await expect(
        piiService.storePII({ nationalId: '12' }) // Too short
      ).rejects.toThrow('Invalid national ID format');
    });

    it('should throw error if RPC call fails', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Encryption failed' },
      });

      await expect(piiService.storePII({ phone: '+12345678900' })).rejects.toThrow(
        'Failed to store sensitive data: Encryption failed'
      );
    });
  });

  // ========================================
  // getPII() Tests
  // ========================================

  describe('getPII', () => {
    it('should retrieve and decrypt PII successfully', async () => {
      const mockUser = { id: 'user-123' };
      const mockDecryptedData = {
        phone: '+12345678900',
        address: '123 Main St',
        date_of_birth: '1990-01-01',
        national_id: 'ABC123456',
        encrypted_at: '2024-01-01T00:00:00Z',
        last_accessed_at: '2024-01-02T00:00:00Z',
      };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockRpc.mockResolvedValue({
        data: mockDecryptedData,
        error: null,
      });

      const result = await piiService.getPII();

      expect(mockRpc).toHaveBeenCalledWith('get_decrypted_pii', {
        p_user_id: 'user-123',
      });

      expect(result).toEqual(mockDecryptedData);
    });

    it('should throw error if user not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(piiService.getPII()).rejects.toThrow(
        'User must be authenticated to retrieve PII'
      );
    });

    it('should throw error if RPC call fails', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Decryption failed' },
      });

      await expect(piiService.getPII()).rejects.toThrow(
        'Failed to retrieve sensitive data: Decryption failed'
      );
    });
  });

  // ========================================
  // updatePIIField() Tests
  // ========================================

  describe('updatePIIField', () => {
    it('should update phone field', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockRpc.mockResolvedValue({
        data: null,
        error: null,
      });

      await piiService.updatePIIField('phone', '+19876543210');

      expect(mockRpc).toHaveBeenCalledWith('store_encrypted_pii', {
        p_user_id: 'user-123',
        p_phone: '+19876543210',
        p_address: null,
        p_date_of_birth: null,
        p_national_id: null,
      });
    });

    it('should update address field', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockRpc.mockResolvedValue({
        data: null,
        error: null,
      });

      await piiService.updatePIIField('address', '456 Oak Ave');

      expect(mockRpc).toHaveBeenCalledWith('store_encrypted_pii', {
        p_user_id: 'user-123',
        p_phone: null,
        p_address: '456 Oak Ave',
        p_date_of_birth: null,
        p_national_id: null,
      });
    });

    it('should validate phone format when updating', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await expect(piiService.updatePIIField('phone', 'invalid')).rejects.toThrow(
        'Invalid phone number format'
      );
    });

    it('should validate national ID format when updating', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await expect(piiService.updatePIIField('nationalId', '12')).rejects.toThrow(
        'Invalid national ID format'
      );
    });

    it('should throw error if user not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(piiService.updatePIIField('phone', '+12345678900')).rejects.toThrow(
        'User must be authenticated'
      );
    });
  });

  // ========================================
  // deletePII() Tests
  // ========================================

  describe('deletePII', () => {
    it('should delete all PII for user', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockDelete = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue(mockDelete);

      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      });

      await piiService.deletePII();

      expect(mockFrom).toHaveBeenCalledWith('encrypted_pii');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should throw error if user not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(piiService.deletePII()).rejects.toThrow('User must be authenticated');
    });

    it('should throw error if delete fails', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Delete failed' },
          }),
        }),
      });

      await expect(piiService.deletePII()).rejects.toThrow('Failed to delete PII: Delete failed');
    });
  });

  // ========================================
  // hasPII() Tests
  // ========================================

  describe('hasPII', () => {
    it('should return true if user has PII', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'pii-123' },
              error: null,
            }),
          }),
        }),
      });

      const result = await piiService.hasPII();

      expect(result).toBe(true);
    });

    it('should return false if user has no PII', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      const result = await piiService.hasPII();

      expect(result).toBe(false);
    });

    it('should return false if user not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await piiService.hasPII();

      expect(result).toBe(false);
    });
  });

  // ========================================
  // getPIIMetadata() Tests
  // ========================================

  describe('getPIIMetadata', () => {
    it('should return metadata for all fields', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockMetadata = {
        phone_encrypted: 'encrypted-data',
        address_encrypted: 'encrypted-data',
        date_of_birth_encrypted: 'encrypted-data',
        national_id_encrypted: 'encrypted-data',
        encrypted_at: '2024-01-01T00:00:00Z',
        last_accessed_at: '2024-01-02T00:00:00Z',
      };

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockMetadata,
              error: null,
            }),
          }),
        }),
      });

      const result = await piiService.getPIIMetadata();

      expect(result).toEqual({
        hasPhone: true,
        hasAddress: true,
        hasDateOfBirth: true,
        hasNationalId: true,
        encryptedAt: '2024-01-01T00:00:00Z',
        lastAccessedAt: '2024-01-02T00:00:00Z',
      });
    });

    it('should return false for missing fields', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockMetadata = {
        phone_encrypted: 'encrypted-data',
        address_encrypted: null,
        date_of_birth_encrypted: null,
        national_id_encrypted: null,
        encrypted_at: '2024-01-01T00:00:00Z',
        last_accessed_at: '2024-01-02T00:00:00Z',
      };

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockMetadata,
              error: null,
            }),
          }),
        }),
      });

      const result = await piiService.getPIIMetadata();

      expect(result).toEqual({
        hasPhone: true,
        hasAddress: false,
        hasDateOfBirth: false,
        hasNationalId: false,
        encryptedAt: '2024-01-01T00:00:00Z',
        lastAccessedAt: '2024-01-02T00:00:00Z',
      });
    });

    it('should return all false if no PII exists', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      const result = await piiService.getPIIMetadata();

      expect(result).toEqual({
        hasPhone: false,
        hasAddress: false,
        hasDateOfBirth: false,
        hasNationalId: false,
      });
    });

    it('should throw error if user not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(piiService.getPIIMetadata()).rejects.toThrow('User must be authenticated');
    });
  });

  // ========================================
  // Validation Tests (Edge Cases)
  // ========================================

  describe('validation edge cases', () => {
    it('should accept valid international phone formats', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockRpc.mockResolvedValue({
        data: null,
        error: null,
      });

      // Various valid formats
      await expect(piiService.storePII({ phone: '+12345678900' })).resolves.toBeUndefined();
      await expect(piiService.storePII({ phone: '+442012345678' })).resolves.toBeUndefined();
      await expect(piiService.storePII({ phone: '12345678900' })).resolves.toBeUndefined();
    });

    it('should accept valid national ID formats', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockRpc.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(piiService.storePII({ nationalId: 'ABC-123' })).resolves.toBeUndefined();
      await expect(piiService.storePII({ nationalId: 'A1B2C3D4E5' })).resolves.toBeUndefined();
      await expect(piiService.storePII({ nationalId: '12345' })).resolves.toBeUndefined();
    });

    it('should accept valid date of birth', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockRpc.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(piiService.storePII({ dateOfBirth: '1990-01-01' })).resolves.toBeUndefined();
    });

    it('should throw error for invalid date format', async () => {
      const mockUser = { id: 'user-123' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await expect(piiService.storePII({ dateOfBirth: 'invalid-date' })).rejects.toThrow(
        'Invalid date of birth format'
      );
    });
  });
});
