/**
 * Security Configuration
 *
 * Centralized security settings and limits
 */

export const SECURITY_CONFIG = {
  // Share links
  SHARE_LINK_MAX_EXPIRY_DAYS: 365,
  SHARE_LINK_DEFAULT_EXPIRY_DAYS: 7,
  SHARE_LINK_MAX_USES: 1000,
  SHARE_LINK_DEFAULT_MAX_USES: 0, // Unlimited

  // Rate limiting
  API_RATE_LIMIT_REQUESTS: 100,
  API_RATE_LIMIT_WINDOW_MS: 60000, // 1 minute

  // Widget limits
  MAX_WIDGETS_PER_DASHBOARD: 20,
  MAX_DASHBOARD_VIEWS_PER_USER: 50,
  MAX_WIDGET_TITLE_LENGTH: 200,

  // Template limits
  MAX_TEMPLATE_NAME_LENGTH: 100,
  MAX_TEMPLATE_DESC_LENGTH: 500,
  MAX_TEMPLATE_TAGS: 10,
  MAX_TEMPLATE_TAG_LENGTH: 50,

  // Search limits
  MAX_SEARCH_QUERY_LENGTH: 200,
  MAX_SEARCH_RESULTS: 100,

  // Session security
  SESSION_TIMEOUT_MS: 24 * 60 * 60 * 1000, // 24 hours
  REQUIRE_REAUTHENTICATION_FOR_SENSITIVE_OPS: true,

  // Input validation
  MAX_STRING_LENGTH: 1000,
  MAX_HTML_LENGTH: 5000,
  MAX_JSON_SIZE: 100 * 1024, // 100KB

  // Grid constraints
  GRID_COLUMNS: 12,
  MIN_WIDGET_WIDTH: 1,
  MAX_WIDGET_WIDTH: 12,
  MIN_WIDGET_HEIGHT: 1,
  MAX_WIDGET_HEIGHT: 20,

  // Refresh intervals
  MIN_REFRESH_INTERVAL: 0,
  MAX_REFRESH_INTERVAL: 86400, // 24 hours in seconds
} as const;

// Validate configuration on load
function validateConfig(): void {
  const config = SECURITY_CONFIG;

  // Ensure all limits are positive
  const numericKeys = Object.keys(config).filter(key =>
    key.startsWith('MAX_') || key.startsWith('MIN_')
  );

  for (const key of numericKeys) {
    const value = config[key as keyof typeof config];
    if (typeof value === 'number' && value < 0) {
      throw new Error(`Invalid security config: ${key} must be positive`);
    }
  }
}

// Run validation
validateConfig();

export default SECURITY_CONFIG;
