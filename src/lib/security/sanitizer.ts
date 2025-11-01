import DOMPurify from 'isomorphic-dompurify';

import { logger } from '@/utils/logger';
/**
 * Security utilities for input sanitization and XSS prevention
 * @module sanitizer
 */

/**
 * Configuration for HTML sanitization
 * @interface SanitizeConfig
 */
export interface SanitizeConfig {
  /** Allow specific HTML tags */
  allowedTags?: string[];
  /** Allow specific attributes */
  allowedAttributes?: string[];
  /** Allow data URIs */
  allowDataUri?: boolean;
  /** Allow external links */
  allowExternalLinks?: boolean;
  /** Strip dangerous tags instead of escaping */
  stripDangerous?: boolean;
}

/**
 * Default allowed HTML tags for rich text
 */
const DEFAULT_ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  's',
  'blockquote',
  'ul',
  'ol',
  'li',
  'a',
  'code',
  'pre',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
];

/**
 * Default allowed HTML attributes
 */
const DEFAULT_ALLOWED_ATTRIBUTES = ['href', 'target', 'rel', 'class', 'id'];

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} dirty - Untrusted HTML content
 * @param {SanitizeConfig} [config] - Sanitization configuration
 * @returns {string} Sanitized HTML
 * @example
 * const clean = sanitizeHTML('<script>alert("XSS")</script><p>Hello</p>');
 * // Returns: '<p>Hello</p>'
 */
export function sanitizeHTML(dirty: string, config: SanitizeConfig = {}): string {
  const {
    allowedTags = DEFAULT_ALLOWED_TAGS,
    allowedAttributes = DEFAULT_ALLOWED_ATTRIBUTES,
    allowDataUri = false,
    allowExternalLinks = false,
    stripDangerous = true,
  } = config;

  // Configure DOMPurify
  const purifyConfig: {
    ALLOWED_TAGS: string[];
    ALLOWED_ATTR: string[];
    ALLOW_DATA_ATTR: boolean;
    ALLOW_UNKNOWN_PROTOCOLS: boolean;
    SAFE_FOR_TEMPLATES: boolean;
    WHOLE_DOCUMENT: boolean;
    RETURN_DOM: boolean;
    RETURN_DOM_FRAGMENT: boolean;
    FORCE_BODY: boolean;
    SANITIZE_DOM: boolean;
    KEEP_CONTENT: boolean;
    ALLOWED_URI_REGEXP?: RegExp;
  } = {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttributes,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SAFE_FOR_TEMPLATES: true,
    WHOLE_DOCUMENT: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    FORCE_BODY: true,
    SANITIZE_DOM: true,
    KEEP_CONTENT: true, // Always keep text content, just strip dangerous tags/attributes
  };

  // Handle data URIs
  if (!allowDataUri) {
    purifyConfig.ALLOWED_URI_REGEXP =
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i;
  }

  // Sanitize the HTML
  let clean = DOMPurify.sanitize(dirty, purifyConfig);

  // Additional security for external links
  if (!allowExternalLinks) {
    clean = clean.replace(/<a\s+(?:[^>]*?\s+)?href="(https?:\/\/[^"]*)"[^>]*>/gi, (match, url) => {
      // Add rel="noopener noreferrer" to external links
      if (!url.startsWith(window.location.origin)) {
        return match.replace('<a', '<a rel="noopener noreferrer" target="_blank"');
      }
      return match;
    });
  }

  return clean;
}

/**
 * Sanitize plain text input (removes all HTML)
 * @param {string} text - Input text
 * @returns {string} Plain text without HTML
 * @example
 * const clean = sanitizeText('<script>alert("XSS")</script>Hello');
 * // Returns: 'Hello'
 */
export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

/**
 * Escape HTML special characters
 * @param {string} text - Input text
 * @returns {string} Escaped text
 * @example
 * const escaped = escapeHTML('<script>alert("XSS")</script>');
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 */
export function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitize JSON input to prevent injection
 * @param {string} json - JSON string
 * @returns {object | null} Parsed and validated JSON object
 */
export function sanitizeJSON(json: string): object | null {
  try {
    // Remove any potential script tags or HTML
    const cleaned = sanitizeText(json);

    // Parse JSON with additional validation
    const parsed = JSON.parse(cleaned);

    // Recursive sanitization for nested objects
    const sanitizeObject = (obj: unknown): unknown => {
      if (typeof obj === 'string') {
        return sanitizeText(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      if (obj !== null && typeof obj === 'object') {
        const sanitized: Record<string, unknown> = {};
        for (const key in obj) {
          // Sanitize keys as well
          const sanitizedKey = sanitizeText(key);
          sanitized[sanitizedKey] = sanitizeObject((obj as Record<string, unknown>)[key]);
        }
        return sanitized;
      }
      return obj;
    };

    return sanitizeObject(parsed);
  } catch (error) {
    logger.error('Invalid JSON input:', error);
    return null;
  }
}

/**
 * Validate and sanitize URL
 * @param {string} url - URL to validate
 * @param {boolean} [allowDataUri=false] - Allow data URIs
 * @returns {string | null} Sanitized URL or null if invalid
 */
export function sanitizeURL(url: string, allowDataUri: boolean = false): string | null {
  try {
    const trimmed = url.trim();

    // Check for javascript: protocol
    if (trimmed.toLowerCase().startsWith('javascript:')) {
      return null;
    }

    // Check for data: URIs
    if (trimmed.toLowerCase().startsWith('data:') && !allowDataUri) {
      return null;
    }

    // Validate URL format
    const urlObj = new URL(trimmed);

    // Only allow http(s) and mailto protocols
    const allowedProtocols = ['http:', 'https:', 'mailto:'];
    if (allowDataUri) {
      allowedProtocols.push('data:');
    }

    if (!allowedProtocols.includes(urlObj.protocol)) {
      return null;
    }

    return urlObj.toString();
  } catch {
    // Invalid URL format
    return null;
  }
}

/**
 * Sanitize file name to prevent path traversal
 * @param {string} fileName - Original file name
 * @returns {string} Sanitized file name
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path traversal patterns
  let safe = fileName.replace(/\.\./g, '');

  // Remove directory separators
  safe = safe.replace(/[/\\]/g, '');

  // Remove control characters and special characters
  safe = safe.replace(/[^\w\s.-]/g, '');

  // Remove leading/trailing dots and spaces
  safe = safe.replace(/^[\s.]+|[\s.]+$/g, '');

  // Limit length
  if (safe.length > 255) {
    const extension = safe.split('.').pop();
    const name = safe.substring(0, 240);
    safe = extension ? `${name}.${extension}` : name;
  }

  return safe || 'unnamed';
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} True if valid email
 */
export function isValidEmail(email: string): boolean {
  // RFC 5321 specifies maximum email length of 254 characters
  if (email.length > 254) {
    return false;
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number
 * @returns {boolean} True if valid phone
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
}

/**
 * Check for SQL injection patterns
 * @param {string} input - User input
 * @returns {boolean} True if potential SQL injection detected
 */
export function hasSQLInjectionPattern(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|EXEC|EXECUTE|SCRIPT|JAVASCRIPT)\b)/gi,
    /(--|\/\*|\*\/|;|\||'|"|`)/g,
    /(=\s*['"0-9])/gi,
    /(\bOR\b\s*["']?\s*["']?\s*=)/gi,
    /(\bAND\b\s*["']?\s*["']?\s*=)/gi,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitize search query input
 * @param {string} query - Search query
 * @param {number} [maxLength=100] - Maximum query length
 * @returns {string} Sanitized search query
 */
export function sanitizeSearchQuery(query: string, maxLength: number = 100): string {
  // Remove HTML and scripts
  let safe = sanitizeText(query);

  // Remove SQL injection patterns
  if (hasSQLInjectionPattern(safe)) {
    // Remove special characters
    safe = safe.replace(/[^\w\s]/g, '');
    // Remove SQL keywords
    safe = safe.replace(
      /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|EXEC|EXECUTE|SCRIPT|JAVASCRIPT|TABLE|FROM|WHERE|INTO)\b/gi,
      ''
    );
  }

  // Limit length
  safe = safe.substring(0, maxLength);

  // Trim whitespace and collapse multiple spaces
  return safe.replace(/\s+/g, ' ').trim();
}

/**
 * Content Security Policy (CSP) generator
 * @returns {string} CSP header value
 */
export function generateCSP(): string {
  const policies = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ];

  return policies.join('; ');
}
