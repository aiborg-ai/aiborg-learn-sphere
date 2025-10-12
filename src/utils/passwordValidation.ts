/**
 * Password Validation Utility
 *
 * Implements strong password requirements to protect against
 * brute force and dictionary attacks.
 *
 * Requirements:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * - Not in common password list
 */

export interface PasswordValidationResult {
  valid: boolean;
  message: string;
  strength?: 'weak' | 'medium' | 'strong' | 'very-strong';
}

// Common passwords to reject (should be expanded in production)
const COMMON_PASSWORDS = [
  'password',
  'password123',
  'password1',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty',
  'qwerty123',
  'abc123',
  'letmein',
  'welcome',
  'welcome123',
  'admin',
  'admin123',
  'test',
  'test123',
  'user',
  'user123',
];

/**
 * Validates password against security requirements
 * @param password - Password to validate
 * @returns Validation result with message
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  // Check minimum length
  if (!password || password.length < 12) {
    return {
      valid: false,
      message: 'Password must be at least 12 characters long',
      strength: 'weak',
    };
  }

  // Check maximum length (prevent DoS through bcrypt)
  if (password.length > 128) {
    return {
      valid: false,
      message: 'Password must be less than 128 characters long',
      strength: 'weak',
    };
  }

  // Check for whitespace (optional, can be allowed)
  if (/^\s|\s$/.test(password)) {
    return {
      valid: false,
      message: 'Password cannot start or end with whitespace',
      strength: 'weak',
    };
  }

  // Check for required character types
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);

  const missingRequirements: string[] = [];
  if (!hasUpperCase) missingRequirements.push('uppercase letter');
  if (!hasLowerCase) missingRequirements.push('lowercase letter');
  if (!hasNumbers) missingRequirements.push('number');
  if (!hasSpecialChar) missingRequirements.push('special character');

  if (missingRequirements.length > 0) {
    return {
      valid: false,
      message: `Password must contain at least one ${missingRequirements.join(', ')}`,
      strength: 'weak',
    };
  }

  // Check against common passwords
  const passwordLower = password.toLowerCase();
  const containsCommon = COMMON_PASSWORDS.some(
    common => passwordLower.includes(common) || common.includes(passwordLower)
  );

  if (containsCommon) {
    return {
      valid: false,
      message: 'Password is too common or easily guessable. Please choose a more unique password.',
      strength: 'weak',
    };
  }

  // Check for sequential characters (123, abc, etc.)
  const hasSequential =
    /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(
      password
    );

  if (hasSequential) {
    return {
      valid: false,
      message: 'Password contains sequential characters. Please choose a more complex password.',
      strength: 'medium',
    };
  }

  // Check for repeated characters (aaa, 111, etc.)
  const hasRepeated = /(.)\1{2,}/.test(password);

  if (hasRepeated) {
    return {
      valid: false,
      message: 'Password contains repeated characters. Please choose a more complex password.',
      strength: 'medium',
    };
  }

  // Calculate password strength
  let strength: 'medium' | 'strong' | 'very-strong' = 'medium';

  // Strong: 12-15 chars with all requirements
  if (password.length >= 12 && password.length < 16) {
    strength = 'strong';
  }

  // Very strong: 16+ chars with all requirements
  if (password.length >= 16) {
    strength = 'very-strong';
  }

  return {
    valid: true,
    message: 'Password meets all requirements',
    strength,
  };
};

/**
 * Get password strength as a percentage (0-100)
 * @param password - Password to evaluate
 * @returns Strength percentage
 */
export const getPasswordStrength = (password: string): number => {
  if (!password) return 0;

  let strength = 0;

  // Length check (up to 40 points)
  if (password.length >= 8) strength += 10;
  if (password.length >= 12) strength += 10;
  if (password.length >= 16) strength += 10;
  if (password.length >= 20) strength += 10;

  // Character variety (up to 40 points)
  if (/[a-z]/.test(password)) strength += 10;
  if (/[A-Z]/.test(password)) strength += 10;
  if (/\d/.test(password)) strength += 10;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) strength += 10;

  // Complexity bonuses (up to 20 points)
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= 8) strength += 5;
  if (uniqueChars >= 12) strength += 5;

  // No sequential or repeated characters
  if (!/(.)\1{2,}/.test(password)) strength += 5;
  if (!/(?:abc|bcd|cde|123|234|345)/i.test(password)) strength += 5;

  return Math.min(strength, 100);
};

/**
 * Get human-readable strength label
 * @param strength - Strength percentage
 * @returns Label
 */
export const getStrengthLabel = (
  strength: number
): 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong' => {
  if (strength < 20) return 'Very Weak';
  if (strength < 40) return 'Weak';
  if (strength < 60) return 'Fair';
  if (strength < 80) return 'Good';
  if (strength < 100) return 'Strong';
  return 'Very Strong';
};
