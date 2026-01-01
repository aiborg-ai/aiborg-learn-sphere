/**
 * Password Strength Calculator
 * Evaluates password strength based on various criteria
 */

interface PasswordStrength {
  strength: 'weak' | 'medium' | 'strong';
  message: string;
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password || password.length < 8) {
    return {
      strength: 'weak',
      message: 'Password must be at least 8 characters',
    };
  }

  let score = 0;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score < 3) {
    return {
      strength: 'weak',
      message: 'Add uppercase, lowercase, and numbers',
    };
  } else if (score < 5) {
    return {
      strength: 'medium',
      message: 'Good! Add special characters for extra security',
    };
  } else {
    return {
      strength: 'strong',
      message: 'Excellent password!',
    };
  }
}
