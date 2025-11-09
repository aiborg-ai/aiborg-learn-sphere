/**
 * PII Encryption Service
 *
 * Provides client-side interface for storing and retrieving encrypted PII.
 * All encryption/decryption happens server-side for security.
 *
 * @module services/encryption/pii-service
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Decrypted PII data structure
 */
export interface DecryptedPII {
  phone?: string | null;
  address?: string | null;
  date_of_birth?: string | null;
  national_id?: string | null;
  encrypted_at?: string;
  last_accessed_at?: string;
}

/**
 * PII storage request
 */
export interface StorePIIRequest {
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  nationalId?: string;
}

/**
 * Service for managing encrypted PII
 */
export class PIIService {
  /**
   * Store encrypted PII for current user
   * All encryption happens server-side using AES-256-GCM
   */
  async storePII(data: StorePIIRequest): Promise<void> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User must be authenticated to store PII');
    }

    // Validate input before sending to server
    this.validatePII(data);

    // Call server-side encryption function
    const { error } = await supabase.rpc('store_encrypted_pii', {
      p_user_id: user.id,
      p_phone: data.phone || null,
      p_address: data.address || null,
      p_date_of_birth: data.dateOfBirth || null,
      p_national_id: data.nationalId || null,
    });

    if (error) {
      throw new Error(`Failed to store sensitive data: ${error.message}`);
    }
  }

  /**
   * Retrieve and decrypt PII for current user
   * Decryption happens server-side with audit logging
   */
  async getPII(): Promise<DecryptedPII> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User must be authenticated to retrieve PII');
    }

    // Call server-side decryption function
    const { data, error } = await supabase.rpc('get_decrypted_pii', {
      p_user_id: user.id,
    });

    if (error) {
      throw new Error(`Failed to retrieve sensitive data: ${error.message}`);
    }

    // Transform snake_case to camelCase
    return {
      phone: data?.phone,
      address: data?.address,
      date_of_birth: data?.date_of_birth,
      national_id: data?.national_id,
      encrypted_at: data?.encrypted_at,
      last_accessed_at: data?.last_accessed_at,
    };
  }

  /**
   * Update specific PII field
   */
  async updatePIIField(
    field: 'phone' | 'address' | 'dateOfBirth' | 'nationalId',
    value: string
  ): Promise<void> {
    const fieldMap = {
      phone: 'p_phone',
      address: 'p_address',
      dateOfBirth: 'p_date_of_birth',
      nationalId: 'p_national_id',
    };

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User must be authenticated');
    }

    // Validate single field
    if (field === 'phone') {
      this.validatePhone(value);
    } else if (field === 'nationalId') {
      this.validateNationalId(value);
    }

    // Update only the specified field
    const params: Record<string, unknown> = {
      p_user_id: user.id,
      p_phone: null,
      p_address: null,
      p_date_of_birth: null,
      p_national_id: null,
    };
    params[fieldMap[field]] = value;

    const { error } = await supabase.rpc('store_encrypted_pii', params);

    if (error) {
      throw new Error(`Failed to update ${field}: ${error.message}`);
    }
  }

  /**
   * Delete all PII for current user (GDPR compliance)
   */
  async deletePII(): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User must be authenticated');
    }

    const { error } = await supabase.from('encrypted_pii').delete().eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to delete PII: ${error.message}`);
    }
  }

  /**
   * Validate PII data before storage
   */
  private validatePII(data: StorePIIRequest): void {
    if (data.phone) {
      this.validatePhone(data.phone);
    }

    if (data.address && data.address.length > 500) {
      throw new Error('Address must be less than 500 characters');
    }

    if (data.dateOfBirth) {
      this.validateDateOfBirth(data.dateOfBirth);
    }

    if (data.nationalId) {
      this.validateNationalId(data.nationalId);
    }
  }

  /**
   * Validate phone number format
   */
  private validatePhone(phone: string): void {
    // E.164 format validation (international phone numbers)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;

    if (!phoneRegex.test(phone.replace(/[\s\-()]/g, ''))) {
      throw new Error('Invalid phone number format. Use international format (e.g., +1234567890)');
    }
  }

  /**
   * Validate date of birth
   */
  private validateDateOfBirth(dob: string): void {
    const date = new Date(dob);
    const now = new Date();

    if (isNaN(date.getTime())) {
      throw new Error('Invalid date of birth format');
    }

    // Must be in the past
    if (date >= now) {
      throw new Error('Date of birth must be in the past');
    }

    // Must be reasonable (not more than 150 years ago)
    const maxAge = new Date();
    maxAge.setFullYear(maxAge.getFullYear() - 150);

    if (date < maxAge) {
      throw new Error('Invalid date of birth - too far in the past');
    }
  }

  /**
   * Validate national ID format
   */
  private validateNationalId(nationalId: string): void {
    // Basic validation - alphanumeric with dashes/spaces
    const idRegex = /^[A-Z0-9\s-]{5,20}$/i;

    if (!idRegex.test(nationalId)) {
      throw new Error('Invalid national ID format. Must be 5-20 alphanumeric characters');
    }
  }

  /**
   * Check if user has stored PII
   */
  async hasPII(): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { data, error } = await supabase
      .from('encrypted_pii')
      .select('id')
      .eq('user_id', user.id)
      .single();

    return !error && !!data;
  }

  /**
   * Get PII metadata without decrypting
   */
  async getPIIMetadata(): Promise<{
    hasPhone: boolean;
    hasAddress: boolean;
    hasDateOfBirth: boolean;
    hasNationalId: boolean;
    encryptedAt?: string;
    lastAccessedAt?: string;
  }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User must be authenticated');
    }

    const { data, error } = await supabase
      .from('encrypted_pii')
      .select(
        'phone_encrypted, address_encrypted, date_of_birth_encrypted, national_id_encrypted, encrypted_at, last_accessed_at'
      )
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return {
        hasPhone: false,
        hasAddress: false,
        hasDateOfBirth: false,
        hasNationalId: false,
      };
    }

    return {
      hasPhone: !!data.phone_encrypted,
      hasAddress: !!data.address_encrypted,
      hasDateOfBirth: !!data.date_of_birth_encrypted,
      hasNationalId: !!data.national_id_encrypted,
      encryptedAt: data.encrypted_at,
      lastAccessedAt: data.last_accessed_at,
    };
  }
}

// Export singleton instance
export const piiService = new PIIService();
