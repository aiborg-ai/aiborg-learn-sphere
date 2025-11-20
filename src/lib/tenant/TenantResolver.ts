/**
 * TenantResolver
 *
 * Resolves tenant identity from domain/subdomain for multi-tenancy support.
 * Supports:
 * - Custom domains (learn.acmecorp.com)
 * - Subdomains (acmecorp.aiborg.com)
 * - Platform default (www.aiborg.com, localhost)
 */

export interface TenantIdentifier {
  type: 'custom_domain' | 'subdomain' | 'platform' | 'header';
  identifier: string;
  hostname: string;
}

export class TenantResolver {
  private static instance: TenantResolver;
  private cachedIdentifier: TenantIdentifier | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): TenantResolver {
    if (!this.instance) {
      this.instance = new TenantResolver();
    }
    return this.instance;
  }

  /**
   * Resolve tenant from current URL
   * Priority: Custom Domain > Subdomain > Default Platform
   */
  resolveTenant(): TenantIdentifier {
    // Return cached if available (performance optimization)
    if (this.cachedIdentifier) {
      return this.cachedIdentifier;
    }

    const hostname = this.getHostname();
    const identifier = this.resolveFromHostname(hostname);

    // Cache the result
    this.cachedIdentifier = identifier;

    return identifier;
  }

  /**
   * Resolve tenant from a specific hostname
   */
  resolveFromHostname(hostname: string): TenantIdentifier {
    // Remove port if present
    const cleanHostname = hostname.split(':')[0];

    // Development/localhost handling
    if (this.isLocalhost(cleanHostname)) {
      return {
        type: 'platform',
        identifier: 'platform',
        hostname: cleanHostname,
      };
    }

    // Check for custom domain (not aiborg.com and not www)
    if (!cleanHostname.includes('aiborg.com')) {
      return {
        type: 'custom_domain',
        identifier: cleanHostname,
        hostname: cleanHostname,
      };
    }

    // Check for subdomain (e.g., acmecorp.aiborg.com)
    const parts = cleanHostname.split('.');

    // If it's www.aiborg.com or just aiborg.com, it's the platform
    if (parts.length < 3 || parts[0] === 'www') {
      return {
        type: 'platform',
        identifier: 'platform',
        hostname: cleanHostname,
      };
    }

    // It's a subdomain
    return {
      type: 'subdomain',
      identifier: parts[0], // The subdomain part (e.g., 'acmecorp')
      hostname: cleanHostname,
    };
  }

  /**
   * Resolve tenant from API request (for Edge Functions)
   * Checks X-Tenant-ID header first, then falls back to hostname
   */
  static resolveFromRequest(request: Request): TenantIdentifier {
    // Check for X-Tenant-ID header (for API calls)
    const tenantHeader = request.headers.get('X-Tenant-ID');
    if (tenantHeader) {
      return {
        type: 'header',
        identifier: tenantHeader,
        hostname: new URL(request.url).hostname,
      };
    }

    // Check for X-Tenant-Slug header (alternative)
    const tenantSlugHeader = request.headers.get('X-Tenant-Slug');
    if (tenantSlugHeader) {
      return {
        type: 'header',
        identifier: tenantSlugHeader,
        hostname: new URL(request.url).hostname,
      };
    }

    // Fall back to hostname resolution
    const hostname = new URL(request.url).hostname;
    return TenantResolver.getInstance().resolveFromHostname(hostname);
  }

  /**
   * Check if hostname is localhost/development
   */
  private isLocalhost(hostname: string): boolean {
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.endsWith('.local')
    );
  }

  /**
   * Get current hostname (browser or server)
   */
  private getHostname(): string {
    if (typeof window !== 'undefined') {
      return window.location.hostname;
    }

    // Server-side: try to get from environment or return default
    return process.env.VITE_APP_DOMAIN || 'localhost';
  }

  /**
   * Clear cached identifier (useful for testing or dynamic changes)
   */
  clearCache(): void {
    this.cachedIdentifier = null;
  }

  /**
   * Build tenant-aware URL
   */
  buildTenantUrl(path: string, tenantSlug?: string): string {
    if (!tenantSlug) {
      return path;
    }

    const baseUrl = this.getBaseUrl();

    // If it's already a subdomain, use it
    if (baseUrl.includes(tenantSlug)) {
      return `${baseUrl}${path}`;
    }

    // Build subdomain URL
    const domain = this.extractBaseDomain(baseUrl);
    return `https://${tenantSlug}.${domain}${path}`;
  }

  /**
   * Extract base domain from URL (aiborg.com from www.aiborg.com)
   */
  private extractBaseDomain(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      const parts = hostname.split('.');

      // Return last two parts (domain.tld)
      if (parts.length >= 2) {
        return parts.slice(-2).join('.');
      }

      return hostname;
    } catch {
      return 'aiborg.com';
    }
  }

  /**
   * Get base URL for current environment
   */
  private getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }

    return process.env.VITE_APP_URL || 'http://localhost:5173';
  }

  /**
   * Check if current context is a tenant (not platform)
   */
  isTenantContext(): boolean {
    const identifier = this.resolveTenant();
    return identifier.type !== 'platform';
  }

  /**
   * Get tenant identifier string for API calls
   */
  getTenantIdentifierString(): string | null {
    const identifier = this.resolveTenant();

    if (identifier.type === 'platform') {
      return null;
    }

    return identifier.identifier;
  }
}

/**
 * Convenience export for common usage
 */
export const tenantResolver = TenantResolver.getInstance();

/**
 * React hook for tenant resolution (optional)
 */
export function useTenantResolver() {
  const resolver = TenantResolver.getInstance();
  const identifier = resolver.resolveTenant();

  return {
    identifier,
    isTenant: identifier.type !== 'platform',
    tenantSlug: identifier.type !== 'platform' ? identifier.identifier : null,
    buildUrl: (path: string) => resolver.buildTenantUrl(path, identifier.identifier),
  };
}
