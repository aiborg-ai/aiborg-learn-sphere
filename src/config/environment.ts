/**
 * Environment Configuration & Validation
 *
 * Validates required environment variables on startup
 */

// Required environment variables
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

// Validate environment variables on startup
function validateEnvironment(): void {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!import.meta.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file and ensure all required variables are set.'
    );
  }

  // Validate Supabase URL format
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    console.warn('Warning: Supabase URL should use HTTPS');
  }

  // Log environment info (dev only)
  if (import.meta.env.DEV) {
    console.info('[Environment] Running in development mode');
    console.info('[Environment] Supabase URL:', supabaseUrl);
  }
}

// Run validation
validateEnvironment();

// Export validated configuration
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL as string,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  },
  app: {
    url: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
    env: import.meta.env.MODE || 'development',
  },
  features: {
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    errorReporting: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
  },
} as const;

// Disable console in production (security measure)
if (import.meta.env.PROD) {
  // Keep error logging but disable info/warn/log
  const noop = () => {};
  console.log = noop;
  console.info = noop;
  console.warn = noop;
  // Keep console.error for critical issues
}

export default config;
