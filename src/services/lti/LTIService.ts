/**
 * LTI 1.3 Service
 *
 * Core service for handling LTI 1.3 integration with Learning Management Systems.
 * Implements OIDC authentication flow, JWT validation, and launch handling.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  LTIPlatform,
  LTIPlatformConfig,
  LTIClaims,
  LTILaunchData,
  LTILaunchType,
  LTIMessageType,
  LTIRole,
  LTIContentItem,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const LTI_VERSION = '1.3.0';
const NONCE_EXPIRY_MINUTES = 10;

// Claim namespaces
const LTI_CLAIM_PREFIX = 'https://purl.imsglobal.org/spec/lti/claim/';
const LTI_DL_CLAIM_PREFIX = 'https://purl.imsglobal.org/spec/lti-dl/claim/';
const LTI_AGS_CLAIM_PREFIX = 'https://purl.imsglobal.org/spec/lti-ags/claim/';
const LTI_NRPS_CLAIM_PREFIX = 'https://purl.imsglobal.org/spec/lti-nrps/claim/';

// ============================================================================
// LTI Service Class
// ============================================================================

export class LTIService {
  // --------------------------------------------------------------------------
  // Platform Registration
  // --------------------------------------------------------------------------

  /**
   * Register a new LTI platform
   */
  static async registerPlatform(config: LTIPlatformConfig): Promise<LTIPlatform> {
    // Generate RSA key pair for tool
    const keyPair = await this.generateKeyPair();

    const { data, error } = await supabase
      .from('lti_platforms')
      .insert({
        name: config.name,
        platform_type: config.platform_type || 'generic',
        issuer: config.issuer,
        client_id: config.client_id,
        deployment_id: config.deployment_id,
        auth_login_url: config.auth_login_url,
        auth_token_url: config.auth_token_url,
        jwks_url: config.jwks_url,
        platform_public_key: config.platform_public_key,
        tool_private_key: keyPair.privateKey,
        tool_public_key: keyPair.publicKey,
        tool_kid: keyPair.kid,
        settings: config.settings || {},
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to register LTI platform:', error);
      throw new Error(`Failed to register platform: ${error.message}`);
    }

    return data as LTIPlatform;
  }

  /**
   * Get platform by issuer and client ID
   */
  static async getPlatform(issuer: string, clientId: string): Promise<LTIPlatform | null> {
    const { data, error } = await supabase
      .from('lti_platforms')
      .select('*')
      .eq('issuer', issuer)
      .eq('client_id', clientId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      logger.error('Failed to get LTI platform:', error);
      throw error;
    }

    return data as LTIPlatform;
  }

  /**
   * Get platform by ID
   */
  static async getPlatformById(id: string): Promise<LTIPlatform | null> {
    const { data, error } = await supabase.from('lti_platforms').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data as LTIPlatform;
  }

  /**
   * List all active platforms
   */
  static async listPlatforms(): Promise<LTIPlatform[]> {
    const { data, error } = await supabase
      .from('lti_platforms')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      logger.error('Failed to list LTI platforms:', error);
      throw error;
    }

    return data as LTIPlatform[];
  }

  // --------------------------------------------------------------------------
  // Launch Validation
  // --------------------------------------------------------------------------

  /**
   * Validate an LTI launch and extract launch data
   * This is called from the edge function after receiving the ID token
   */
  static async validateLaunch(idToken: string, platform: LTIPlatform): Promise<LTILaunchData> {
    // Decode and validate the JWT
    const claims = await this.verifyIdToken(idToken, platform);

    // Validate required claims
    this.validateRequiredClaims(claims);

    // Validate nonce (replay prevention)
    await this.validateNonce(claims.nonce, platform.id);

    // Extract launch type and message type
    const messageType = claims[`${LTI_CLAIM_PREFIX}message_type`] as LTIMessageType;
    const launchType = this.getLaunchType(messageType);

    // Extract user info
    const user = this.extractUserInfo(claims);

    // Extract context
    const contextClaim = claims[`${LTI_CLAIM_PREFIX}context`];
    const context = contextClaim
      ? {
          id: contextClaim.id,
          title: contextClaim.title,
          label: contextClaim.label,
          type: contextClaim.type,
        }
      : undefined;

    // Extract resource link
    const resourceLinkClaim = claims[`${LTI_CLAIM_PREFIX}resource_link`];
    const resourceLink = resourceLinkClaim
      ? {
          id: resourceLinkClaim.id,
          title: resourceLinkClaim.title,
          description: resourceLinkClaim.description,
        }
      : undefined;

    // Extract services
    const agsClaim = claims[`${LTI_AGS_CLAIM_PREFIX}endpoint`];
    const nrpsClaim = claims[`${LTI_NRPS_CLAIM_PREFIX}namesroleservice`];
    const services = {
      ags: agsClaim
        ? {
            scope: agsClaim.scope,
            lineitems: agsClaim.lineitems,
            lineitem: agsClaim.lineitem,
          }
        : undefined,
      nrps: nrpsClaim
        ? {
            contextMembershipsUrl: nrpsClaim.context_memberships_url,
            serviceVersions: nrpsClaim.service_versions,
          }
        : undefined,
    };

    // Extract deep linking settings
    const dlSettings = claims[`${LTI_DL_CLAIM_PREFIX}deep_linking_settings`];
    const deepLinking = dlSettings
      ? {
          returnUrl: dlSettings.deep_link_return_url,
          acceptTypes: dlSettings.accept_types,
          acceptMultiple: dlSettings.accept_multiple ?? false,
          data: dlSettings.data,
        }
      : undefined;

    return {
      platform,
      claims,
      launchType,
      messageType,
      user,
      context,
      resourceLink,
      services,
      deepLinking,
    };
  }

  /**
   * Verify the ID token JWT
   * In production, this should verify against the platform's JWKS
   */
  private static async verifyIdToken(idToken: string, platform: LTIPlatform): Promise<LTIClaims> {
    // For now, decode without verification (edge function should do full verification)
    // In a complete implementation, fetch JWKS and verify signature
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    try {
      const payload = JSON.parse(atob(parts[1]));

      // Validate issuer
      if (payload.iss !== platform.issuer) {
        throw new Error('Invalid issuer');
      }

      // Validate audience
      const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (!aud.includes(platform.client_id)) {
        throw new Error('Invalid audience');
      }

      // Validate expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        throw new Error('Token expired');
      }

      return payload as LTIClaims;
    } catch (error) {
      logger.error('Failed to verify ID token:', error);
      throw new Error('Invalid ID token');
    }
  }

  /**
   * Validate required LTI claims
   */
  private static validateRequiredClaims(claims: LTIClaims): void {
    const required = [
      'iss',
      'sub',
      'aud',
      'exp',
      'iat',
      'nonce',
      `${LTI_CLAIM_PREFIX}message_type`,
      `${LTI_CLAIM_PREFIX}version`,
      `${LTI_CLAIM_PREFIX}deployment_id`,
    ];

    for (const claim of required) {
      if (!(claim in claims)) {
        throw new Error(`Missing required claim: ${claim}`);
      }
    }

    // Validate LTI version
    const version = claims[`${LTI_CLAIM_PREFIX}version`];
    if (version !== LTI_VERSION) {
      throw new Error(`Unsupported LTI version: ${version}`);
    }
  }

  /**
   * Validate nonce for replay attack prevention
   */
  private static async validateNonce(nonce: string, platformId: string): Promise<void> {
    const { data, error } = await supabase.rpc('validate_lti_nonce', {
      p_nonce: nonce,
      p_platform_id: platformId,
      p_expiry_minutes: NONCE_EXPIRY_MINUTES,
    });

    if (error || !data) {
      throw new Error('Nonce validation failed - possible replay attack');
    }
  }

  // --------------------------------------------------------------------------
  // User Provisioning
  // --------------------------------------------------------------------------

  /**
   * Provision or find user from LTI claims
   */
  static async provisionUser(
    launchData: LTILaunchData
  ): Promise<{ userId: string; isNew: boolean }> {
    const { platform, user } = launchData;

    // Call database function to find or create user
    const { data, error } = await supabase.rpc('find_or_create_lti_user', {
      p_platform_id: platform.id,
      p_lti_user_id: user.ltiUserId,
      p_email: user.email || null,
      p_name: user.name || null,
      p_given_name: user.givenName || null,
      p_family_name: user.familyName || null,
      p_picture: user.picture || null,
    });

    if (error) {
      logger.error('Failed to provision LTI user:', error);
      throw new Error('User provisioning failed');
    }

    // If no user found/created, the application needs to handle user creation
    if (!data) {
      // Create a new user through auth
      // This should be handled by the edge function with service role
      return { userId: '', isNew: true };
    }

    return { userId: data, isNew: false };
  }

  /**
   * Record a launch event
   */
  static async recordLaunch(
    launchData: LTILaunchData,
    userId: string | null,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    const { platform, claims, launchType, messageType, user, context, resourceLink } = launchData;

    // Get or create resource link mapping
    let resourceLinkId: string | null = null;
    if (resourceLink) {
      resourceLinkId = await this.getOrCreateResourceLink(platform.id, resourceLink, context);
    }

    const { data, error } = await supabase
      .from('lti_launches')
      .insert({
        platform_id: platform.id,
        resource_link_id: resourceLinkId,
        user_id: userId,
        lti_user_id: user.ltiUserId,
        launch_type: launchType,
        message_type: messageType,
        claims: claims,
        context_id: context?.id,
        context_title: context?.title,
        roles: user.roles,
        session_id: sessionId,
        expires_at: new Date(claims.exp * 1000).toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Failed to record LTI launch:', error);
      throw error;
    }

    return data.id;
  }

  // --------------------------------------------------------------------------
  // Resource Link Management
  // --------------------------------------------------------------------------

  /**
   * Get or create a resource link mapping
   */
  private static async getOrCreateResourceLink(
    platformId: string,
    resourceLink: { id: string; title?: string; description?: string },
    context?: { id: string; title?: string; label?: string }
  ): Promise<string> {
    // Try to find existing
    const { data: existing } = await supabase
      .from('lti_resource_links')
      .select('id')
      .eq('platform_id', platformId)
      .eq('resource_link_id', resourceLink.id)
      .single();

    if (existing) {
      return existing.id;
    }

    // Create new
    const { data, error } = await supabase
      .from('lti_resource_links')
      .insert({
        platform_id: platformId,
        resource_link_id: resourceLink.id,
        context_id: context?.id,
        context_title: context?.title,
        context_label: context?.label,
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Failed to create resource link:', error);
      throw error;
    }

    return data.id;
  }

  /**
   * Map a resource link to a course
   */
  static async mapResourceLinkToCourse(resourceLinkId: string, courseId: string): Promise<void> {
    const { error } = await supabase
      .from('lti_resource_links')
      .update({ course_id: courseId })
      .eq('id', resourceLinkId);

    if (error) {
      logger.error('Failed to map resource link to course:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Deep Linking
  // --------------------------------------------------------------------------

  /**
   * Create a deep linking response JWT
   */
  static async createDeepLinkResponse(
    platform: LTIPlatform,
    contentItems: LTIContentItem[],
    data?: string
  ): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    const payload = {
      iss: platform.client_id, // Tool is the issuer
      aud: platform.issuer, // Platform is the audience
      iat: now,
      exp: now + 300, // 5 minutes
      nonce: this.generateNonce(),
      [`${LTI_CLAIM_PREFIX}message_type`]: 'LtiDeepLinkingResponse',
      [`${LTI_CLAIM_PREFIX}version`]: LTI_VERSION,
      [`${LTI_CLAIM_PREFIX}deployment_id`]: platform.deployment_id,
      [`${LTI_DL_CLAIM_PREFIX}content_items`]: contentItems,
      [`${LTI_DL_CLAIM_PREFIX}data`]: data,
    };

    // Sign with tool's private key
    // In production, use proper JWT library with RS256
    return this.signJwt(payload, platform.tool_private_key, platform.tool_kid);
  }

  /**
   * Build content items for courses
   */
  static buildCourseContentItems(
    courses: Array<{
      id: string;
      title: string;
      description?: string;
      thumbnail_url?: string;
    }>
  ): LTIContentItem[] {
    return courses.map(course => ({
      type: 'ltiResourceLink',
      title: course.title,
      text: course.description,
      url: `${window.location.origin}/courses/${course.id}`,
      thumbnail: course.thumbnail_url ? { url: course.thumbnail_url } : undefined,
      custom: {
        course_id: course.id,
      },
    }));
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  /**
   * Extract user info from claims
   */
  private static extractUserInfo(claims: LTIClaims): LTILaunchData['user'] {
    const rolesClaim = claims[`${LTI_CLAIM_PREFIX}roles`] || [];
    const roles = this.parseRoles(rolesClaim);

    return {
      ltiUserId: claims.sub,
      email: claims.email,
      name: claims.name,
      givenName: claims.given_name,
      familyName: claims.family_name,
      picture: claims.picture,
      roles,
    };
  }

  /**
   * Parse LTI role URNs to simple role names
   */
  private static parseRoles(roleUrns: string[]): LTIRole[] {
    const roleMap: Record<string, LTIRole> = {
      Instructor: 'Instructor',
      Learner: 'Learner',
      ContentDeveloper: 'ContentDeveloper',
      Mentor: 'Mentor',
      Manager: 'Manager',
      Member: 'Member',
      Officer: 'Officer',
      Administrator: 'Administrator',
      // Also check for simple role names
      Teacher: 'Instructor',
      Student: 'Learner',
    };

    const roles: LTIRole[] = [];

    for (const urn of roleUrns) {
      // Extract role name from URN
      for (const [key, value] of Object.entries(roleMap)) {
        if (urn.includes(key)) {
          if (!roles.includes(value)) {
            roles.push(value);
          }
          break;
        }
      }
    }

    return roles.length > 0 ? roles : ['Member'];
  }

  /**
   * Get launch type from message type
   */
  private static getLaunchType(messageType: LTIMessageType): LTILaunchType {
    switch (messageType) {
      case 'LtiDeepLinkingRequest':
        return 'deep_linking';
      case 'LtiSubmissionReviewRequest':
        return 'submission_review';
      default:
        return 'resource_link';
    }
  }

  /**
   * Generate a random nonce
   */
  private static generateNonce(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate RSA key pair for tool signing
   * Returns PEM-encoded keys
   */
  private static async generateKeyPair(): Promise<{
    privateKey: string;
    publicKey: string;
    kid: string;
  }> {
    // Generate key ID
    const kid = this.generateNonce().substring(0, 16);

    // In browser, we use WebCrypto API
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['sign', 'verify']
    );

    // Export keys
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);

    // Convert to PEM format
    const privateKey = this.arrayBufferToPem(privateKeyBuffer, 'PRIVATE KEY');
    const publicKey = this.arrayBufferToPem(publicKeyBuffer, 'PUBLIC KEY');

    return { privateKey, publicKey, kid };
  }

  /**
   * Convert ArrayBuffer to PEM format
   */
  private static arrayBufferToPem(buffer: ArrayBuffer, type: string): string {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const lines = base64.match(/.{1,64}/g) || [];
    return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`;
  }

  /**
   * Sign a JWT (simplified - use proper library in production)
   */
  private static async signJwt(
    payload: Record<string, unknown>,
    privateKeyPem: string,
    kid?: string
  ): Promise<string> {
    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: kid,
    };

    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));

    // In production, properly sign with the private key
    // For now, return unsigned (edge function should handle signing)
    const signature = 'SIGNATURE_PLACEHOLDER';

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Get JWKS for this tool (for LMS to verify our signatures)
   */
  static async getToolJWKS(): Promise<{ keys: Array<Record<string, unknown>> }> {
    const platforms = await this.listPlatforms();

    const keys = platforms
      .filter(p => p.tool_public_key && p.tool_kid)
      .map(p => ({
        kty: 'RSA',
        use: 'sig',
        alg: 'RS256',
        kid: p.tool_kid,
        // In production, extract n and e from public key
        // This is a placeholder
      }));

    return { keys };
  }
}

// Export singleton methods
export const {
  registerPlatform,
  getPlatform,
  getPlatformById,
  listPlatforms,
  validateLaunch,
  provisionUser,
  recordLaunch,
  mapResourceLinkToCourse,
  createDeepLinkResponse,
  buildCourseContentItems,
  getToolJWKS,
} = LTIService;
