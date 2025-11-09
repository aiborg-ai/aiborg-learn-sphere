/**
 * SSRF Protection Utilities
 *
 * Prevents Server-Side Request Forgery (SSRF) attacks by validating and sanitizing URLs
 * before allowing server-side HTTP requests.
 *
 * @module _shared/ssrf-protection
 */

import { isIP } from 'https://deno.land/std@0.208.0/net/is_ip.ts';

/**
 * Blocked IP ranges and patterns
 */
const BLOCKED_IP_RANGES = [
  // Localhost
  /^127\./,
  /^::1$/,
  /^0\.0\.0\.0$/,
  /^localhost$/i,

  // Private networks (RFC 1918)
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,

  // Link-local
  /^169\.254\./,
  /^fe80:/i,

  // Multicast
  /^224\./,
  /^ff[0-9a-f]{2}:/i,

  // Reserved/Special
  /^0\./,
  /^255\.255\.255\.255$/,
];

/**
 * Blocked ports (commonly used for internal services)
 */
const BLOCKED_PORTS = [
  22, // SSH
  23, // Telnet
  25, // SMTP
  53, // DNS
  110, // POP3
  111, // RPC
  135, // MSRPC
  143, // IMAP
  389, // LDAP
  445, // SMB
  3306, // MySQL
  5432, // PostgreSQL
  6379, // Redis
  8080, // Common HTTP proxy
  27017, // MongoDB
];

/**
 * Allowed URL schemes
 */
const ALLOWED_SCHEMES = ['http:', 'https:'];

/**
 * Configuration for SSRF protection
 */
export interface SSRFProtectionConfig {
  allowPrivateNetworks?: boolean;
  allowedPorts?: number[];
  blockedPorts?: number[];
  allowedSchemes?: string[];
  maxRedirects?: number;
  timeout?: number; // milliseconds
  maxResponseSize?: number; // bytes
}

/**
 * Result of URL validation
 */
export interface URLValidationResult {
  valid: boolean;
  error?: string;
  url?: URL;
}

/**
 * Validate URL for SSRF protection
 */
export function validateURL(
  urlString: string,
  config: SSRFProtectionConfig = {}
): URLValidationResult {
  const {
    allowPrivateNetworks = false,
    allowedPorts = [],
    blockedPorts = BLOCKED_PORTS,
    allowedSchemes = ALLOWED_SCHEMES,
  } = config;

  try {
    // Parse URL
    const url = new URL(urlString);

    // Check scheme
    if (!allowedSchemes.includes(url.protocol)) {
      return {
        valid: false,
        error: `Scheme ${url.protocol} not allowed. Use ${allowedSchemes.join(' or ')}`,
      };
    }

    // Check for credentials in URL (security risk)
    if (url.username || url.password) {
      return {
        valid: false,
        error: 'URLs with embedded credentials are not allowed',
      };
    }

    // Resolve hostname to IP for validation
    const hostname = url.hostname.toLowerCase();

    // Check if hostname is an IP address
    const ipVersion = isIP(hostname);
    if (ipVersion) {
      // Direct IP access - validate it's not private/internal
      if (!allowPrivateNetworks && isPrivateIP(hostname)) {
        return {
          valid: false,
          error: 'Access to private/internal IP addresses is prohibited',
        };
      }
    } else {
      // Domain name - check for suspicious patterns
      if (isSuspiciousDomain(hostname)) {
        return {
          valid: false,
          error: 'Suspicious domain pattern detected',
        };
      }
    }

    // Check port
    const port = url.port ? parseInt(url.port, 10) : url.protocol === 'https:' ? 443 : 80;

    if (allowedPorts.length > 0) {
      // Whitelist mode
      if (!allowedPorts.includes(port)) {
        return {
          valid: false,
          error: `Port ${port} not in allowed list: ${allowedPorts.join(', ')}`,
        };
      }
    } else {
      // Blacklist mode
      if (blockedPorts.includes(port)) {
        return {
          valid: false,
          error: `Port ${port} is blocked for security reasons`,
        };
      }
    }

    return {
      valid: true,
      url,
    };
  } catch (error) {
    return {
      valid: false,
      error: `Invalid URL: ${error.message}`,
    };
  }
}

/**
 * Check if IP address is private/internal
 */
function isPrivateIP(ip: string): boolean {
  return BLOCKED_IP_RANGES.some(pattern => pattern.test(ip));
}

/**
 * Check for suspicious domain patterns
 */
function isSuspiciousDomain(domain: string): boolean {
  // Check for obvious localhost patterns
  if (/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(domain)) {
    return true;
  }

  // Check for metadata service endpoints (cloud providers)
  if (/169\.254\.169\.254|metadata\.google\.internal/i.test(domain)) {
    return true;
  }

  // Check for IPv6 localhost
  if (/\[::1\]|\[::\]/i.test(domain)) {
    return true;
  }

  return false;
}

/**
 * Safely fetch URL with SSRF protection
 */
export async function safeFetch(
  urlString: string,
  config: SSRFProtectionConfig = {},
  fetchOptions: RequestInit = {}
): Promise<Response> {
  const {
    maxRedirects = 5,
    timeout = 10000,
    maxResponseSize = 10 * 1024 * 1024, // 10 MB default
  } = config;

  // Validate URL
  const validation = validateURL(urlString, config);
  if (!validation.valid) {
    throw new Error(`SSRF Protection: ${validation.error}`);
  }

  // Prevent redirect-based SSRF attacks
  const fetchOptionsWithLimit: RequestInit = {
    ...fetchOptions,
    redirect: 'manual', // Manual redirect handling
    signal: AbortSignal.timeout(timeout),
  };

  let currentURL = validation.url!.toString();
  let redirectCount = 0;

  while (redirectCount <= maxRedirects) {
    // Fetch with timeout
    const response = await fetch(currentURL, fetchOptionsWithLimit);

    // Handle redirects manually
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        throw new Error('Redirect response missing Location header');
      }

      redirectCount++;
      if (redirectCount > maxRedirects) {
        throw new Error(`Too many redirects (max: ${maxRedirects})`);
      }

      // Validate redirect URL
      const redirectURL = new URL(location, currentURL);
      const redirectValidation = validateURL(redirectURL.toString(), config);
      if (!redirectValidation.valid) {
        throw new Error(`SSRF Protection (redirect): ${redirectValidation.error}`);
      }

      currentURL = redirectURL.toString();
      continue;
    }

    // Check response size
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > maxResponseSize) {
      throw new Error(`Response too large (max: ${maxResponseSize} bytes)`);
    }

    return response;
  }

  throw new Error('Unexpected redirect loop');
}

/**
 * Safely fetch JSON with SSRF protection
 */
export async function safeFetchJSON<T = unknown>(
  urlString: string,
  config: SSRFProtectionConfig = {},
  fetchOptions: RequestInit = {}
): Promise<T> {
  const response = await safeFetch(urlString, config, fetchOptions);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`Expected JSON response, got: ${contentType}`);
  }

  return await response.json();
}

/**
 * Safely fetch text with SSRF protection
 */
export async function safeFetchText(
  urlString: string,
  config: SSRFProtectionConfig = {},
  fetchOptions: RequestInit = {}
): Promise<string> {
  const response = await safeFetch(urlString, config, fetchOptions);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.text();
}

/**
 * Log SSRF attempt for security monitoring
 */
export async function logSSRFAttempt(
  url: string,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  // This would integrate with your security audit logging system
  console.warn('[SSRF PROTECTION] Blocked request:', {
    url,
    reason,
    timestamp: new Date().toISOString(),
    ...metadata,
  });

  // In production, send to security audit log table
  // await supabase.from('security_audit_log').insert({
  //   event_type: 'ssrf.blocked',
  //   severity: 'high',
  //   metadata: { url, reason, ...metadata },
  // });
}
