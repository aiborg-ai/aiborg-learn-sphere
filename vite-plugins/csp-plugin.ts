/**
 * Content Security Policy (CSP) Plugin for Vite
 *
 * Adds CSP meta tags to index.html for enhanced security
 */

import type { Plugin } from 'vite';

export function cspPlugin(): Plugin {
  return {
    name: 'vite-plugin-csp',
    transformIndexHtml(html) {
      // Define CSP directives
      const cspDirectives = [
        // Default: only allow resources from same origin
        "default-src 'self'",

        // Scripts: allow self + specific CDNs for analytics/monitoring
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",

        // Styles: allow self + inline styles (required for React/Tailwind)
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

        // Images: allow self + data URIs + Supabase storage + lovable uploads
        "img-src 'self' data: https://*.supabase.co https://lovable-uploads.s3.amazonaws.com blob:",

        // Fonts: allow self + Google Fonts
        "font-src 'self' https://fonts.gstatic.com data:",

        // Connect: allow API calls to Supabase
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co",

        // Media: allow self + Supabase storage
        "media-src 'self' https://*.supabase.co blob:",

        // Objects: disallow plugins
        "object-src 'none'",

        // Base URI: restrict to same origin
        "base-uri 'self'",

        // Forms: allow self
        "form-action 'self'",

        // Frame ancestors: prevent clickjacking
        "frame-ancestors 'none'",

        // Upgrade insecure requests in production
        ...(process.env.NODE_ENV === 'production' ? ["upgrade-insecure-requests"] : []),
      ];

      const csp = cspDirectives.join('; ');

      // Add CSP meta tag to head
      const cspMeta = `<meta http-equiv="Content-Security-Policy" content="${csp}">`;

      // Insert after charset/viewport meta tags
      return html.replace(
        '</head>',
        `  ${cspMeta}\n  </head>`
      );
    },
  };
}

export default cspPlugin;
