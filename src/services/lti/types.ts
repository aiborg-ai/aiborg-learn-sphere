/**
 * LTI 1.3 Type Definitions
 * Based on IMS Global LTI 1.3 specification
 */

// ============================================================================
// Platform Configuration Types
// ============================================================================

export interface LTIPlatform {
  id: string;
  tenant_id?: string;
  name: string;
  platform_type: LTIPlatformType;
  issuer: string;
  client_id: string;
  deployment_id?: string;
  auth_login_url: string;
  auth_token_url: string;
  jwks_url: string;
  platform_public_key?: string;
  tool_private_key: string;
  tool_public_key: string;
  tool_kid?: string;
  is_active: boolean;
  settings: LTIPlatformSettings;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export type LTIPlatformType =
  | 'canvas'
  | 'moodle'
  | 'blackboard'
  | 'd2l'
  | 'schoology'
  | 'google_classroom'
  | 'microsoft_teams'
  | 'sakai'
  | 'generic';

export interface LTIPlatformSettings {
  // Feature toggles
  enable_deep_linking?: boolean;
  enable_grade_passback?: boolean;
  enable_nrps?: boolean; // Names and Roles Provisioning Service

  // Customization
  default_course_id?: string;
  auto_enroll?: boolean;
  sync_user_info?: boolean;

  // Advanced
  custom_params?: Record<string, string>;
}

export interface LTIPlatformConfig {
  name: string;
  platform_type?: LTIPlatformType;
  issuer: string;
  client_id: string;
  deployment_id?: string;
  auth_login_url: string;
  auth_token_url: string;
  jwks_url: string;
  platform_public_key?: string;
  settings?: LTIPlatformSettings;
}

// ============================================================================
// LTI Message Types
// ============================================================================

export type LTIMessageType =
  | 'LtiResourceLinkRequest'
  | 'LtiDeepLinkingRequest'
  | 'LtiSubmissionReviewRequest';

export type LTILaunchType = 'resource_link' | 'deep_linking' | 'submission_review';

// ============================================================================
// LTI Claims (JWT payload)
// ============================================================================

export interface LTIClaims {
  // Required claims
  iss: string; // Issuer
  sub: string; // Subject (user ID)
  aud: string | string[]; // Audience (client ID)
  exp: number; // Expiration time
  iat: number; // Issued at
  nonce: string; // Nonce for replay prevention

  // LTI-specific claims
  'https://purl.imsglobal.org/spec/lti/claim/message_type': LTIMessageType;
  'https://purl.imsglobal.org/spec/lti/claim/version': string; // "1.3.0"
  'https://purl.imsglobal.org/spec/lti/claim/deployment_id': string;
  'https://purl.imsglobal.org/spec/lti/claim/target_link_uri': string;

  // Resource link claim (for resource link launches)
  'https://purl.imsglobal.org/spec/lti/claim/resource_link'?: {
    id: string;
    title?: string;
    description?: string;
  };

  // Context claim (course/context info)
  'https://purl.imsglobal.org/spec/lti/claim/context'?: {
    id: string;
    type?: string[];
    label?: string;
    title?: string;
  };

  // Roles claim
  'https://purl.imsglobal.org/spec/lti/claim/roles'?: string[];

  // User info
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  picture?: string;

  // Deep linking settings
  'https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings'?: {
    deep_link_return_url: string;
    accept_types: string[];
    accept_presentation_document_targets: string[];
    accept_media_types?: string;
    accept_multiple?: boolean;
    auto_create?: boolean;
    title?: string;
    text?: string;
    data?: string;
  };

  // Assignment and Grade Services
  'https://purl.imsglobal.org/spec/lti-ags/claim/endpoint'?: {
    scope: string[];
    lineitems?: string;
    lineitem?: string;
  };

  // Names and Roles Provisioning
  'https://purl.imsglobal.org/spec/lti-nrps/claim/namesroleservice'?: {
    context_memberships_url: string;
    service_versions: string[];
  };

  // Custom parameters
  'https://purl.imsglobal.org/spec/lti/claim/custom'?: Record<string, string>;

  // Launch presentation
  'https://purl.imsglobal.org/spec/lti/claim/launch_presentation'?: {
    document_target?: string;
    height?: number;
    width?: number;
    return_url?: string;
    locale?: string;
  };

  // Platform info
  'https://purl.imsglobal.org/spec/lti/claim/tool_platform'?: {
    guid: string;
    name?: string;
    version?: string;
    product_family_code?: string;
  };
}

// ============================================================================
// LTI Launch Data
// ============================================================================

export interface LTILaunchData {
  platform: LTIPlatform;
  claims: LTIClaims;
  launchType: LTILaunchType;
  messageType: LTIMessageType;

  // Extracted user info
  user: {
    ltiUserId: string;
    email?: string;
    name?: string;
    givenName?: string;
    familyName?: string;
    picture?: string;
    roles: LTIRole[];
  };

  // Context info
  context?: {
    id: string;
    title?: string;
    label?: string;
    type?: string[];
  };

  // Resource link info
  resourceLink?: {
    id: string;
    title?: string;
    description?: string;
  };

  // Service endpoints
  services?: {
    ags?: {
      scope: string[];
      lineitems?: string;
      lineitem?: string;
    };
    nrps?: {
      contextMembershipsUrl: string;
      serviceVersions: string[];
    };
  };

  // Deep linking settings
  deepLinking?: {
    returnUrl: string;
    acceptTypes: string[];
    acceptMultiple: boolean;
    data?: string;
  };
}

// ============================================================================
// LTI Roles
// ============================================================================

export type LTIRole =
  | 'Administrator'
  | 'ContentDeveloper'
  | 'Instructor'
  | 'Learner'
  | 'Mentor'
  | 'Manager'
  | 'Member'
  | 'Officer';

export const LTI_ROLE_URNS = {
  // System roles
  Administrator: 'http://purl.imsglobal.org/vocab/lis/v2/system/person#Administrator',

  // Institution roles
  Faculty: 'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Faculty',
  Staff: 'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Staff',
  Student: 'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Student',

  // Context roles
  Instructor: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor',
  Learner: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner',
  ContentDeveloper: 'http://purl.imsglobal.org/vocab/lis/v2/membership#ContentDeveloper',
  Mentor: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Mentor',
  Manager: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Manager',
  Member: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Member',
  Officer: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Officer',
} as const;

// ============================================================================
// Deep Linking Types
// ============================================================================

export interface LTIContentItem {
  type: 'ltiResourceLink' | 'link' | 'file' | 'html' | 'image';
  title?: string;
  text?: string;
  url?: string;

  // For ltiResourceLink type
  custom?: Record<string, string>;
  lineItem?: {
    scoreMaximum: number;
    label?: string;
    resourceId?: string;
    tag?: string;
  };

  // For file type
  mediaType?: string;

  // For image type
  width?: number;
  height?: number;

  // Presentation
  iframe?: {
    width?: number;
    height?: number;
  };
  window?: {
    targetName?: string;
    width?: number;
    height?: number;
  };

  // Thumbnail
  thumbnail?: {
    url: string;
    width?: number;
    height?: number;
  };
}

export interface DeepLinkingResponse {
  contentItems: LTIContentItem[];
  data?: string; // Echo back deep_linking_settings.data
  message?: string;
  log?: string;
  errormsg?: string;
  errorlog?: string;
}

// ============================================================================
// Assignment and Grade Services (AGS)
// ============================================================================

export interface LTILineItem {
  id?: string;
  scoreMaximum: number;
  label: string;
  resourceId?: string;
  resourceLinkId?: string;
  tag?: string;
  startDateTime?: string;
  endDateTime?: string;
  gradesReleased?: boolean;
}

export interface LTIScore {
  userId: string;
  scoreGiven?: number;
  scoreMaximum?: number;
  activityProgress: LTIActivityProgress;
  gradingProgress: LTIGradingProgress;
  timestamp: string;
  comment?: string;
}

export type LTIActivityProgress =
  | 'Initialized'
  | 'Started'
  | 'InProgress'
  | 'Submitted'
  | 'Completed';

export type LTIGradingProgress =
  | 'FullyGraded'
  | 'Pending'
  | 'PendingManual'
  | 'Failed'
  | 'NotReady';

// ============================================================================
// Resource Links
// ============================================================================

export interface LTIResourceLink {
  id: string;
  platform_id: string;
  resource_link_id: string;
  context_id?: string;
  context_title?: string;
  context_label?: string;
  course_id?: string;
  lesson_id?: string;
  content_items: LTIContentItem[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// User Mappings
// ============================================================================

export interface LTIUserMapping {
  id: string;
  platform_id: string;
  lti_user_id: string;
  lti_email?: string;
  lti_name?: string;
  lti_given_name?: string;
  lti_family_name?: string;
  lti_picture?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

// ============================================================================
// Launch Records
// ============================================================================

export interface LTILaunch {
  id: string;
  platform_id: string;
  resource_link_id?: string;
  user_id?: string;
  lti_user_id: string;
  launch_type: LTILaunchType;
  message_type?: LTIMessageType;
  claims: LTIClaims;
  context_id?: string;
  context_title?: string;
  roles: string[];
  session_id?: string;
  expires_at?: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

// ============================================================================
// Grade Submissions
// ============================================================================

export interface LTIGradeSubmission {
  id: string;
  platform_id: string;
  resource_link_id?: string;
  user_id: string;
  lti_user_id: string;
  score_given?: number;
  score_maximum: number;
  activity_progress?: LTIActivityProgress;
  grading_progress?: LTIGradingProgress;
  lineitem_url?: string;
  submitted_at?: string;
  synced_at?: string;
  sync_status: 'pending' | 'synced' | 'failed';
  sync_error?: string;
  created_at: string;
  updated_at: string;
}
