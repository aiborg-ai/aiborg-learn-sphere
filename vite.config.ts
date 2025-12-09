import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';
import { prioritizeReactPlugin } from './vite-plugins/prioritize-react';
import { cspPlugin } from './vite-plugins/csp-plugin';
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    prioritizeReactPlugin(),
    cspPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto', // Enable service worker registration
      includeAssets: ['**/*.{png,svg,ico,woff,woff2,webp}'],
      manifest: {
        name: 'Aiborg Learn Sphere',
        short_name: 'Aiborg',
        description: 'AI-Augmented Human Learning Platform',
        theme_color: '#D4A643',
        background_color: '#1a1a1a',
        display: 'standalone',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-192x192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/icon-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Include all static assets including JS chunks
        globPatterns: ['**/*.{css,html,ico,png,svg,woff,woff2,webp,js}'],
        runtimeCaching: [
          {
            // Cache-First for static assets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache-First for images
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            // Network-First with cache fallback for API calls (Supabase)
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            // Cache-First for course content
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'course-content-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Exclude auth endpoints from caching
            urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/auth/],
      },
      devOptions: {
        enabled: false, // Disable PWA in development
      },
    }),
    // Gzip compression for smaller transfer sizes
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // Only compress files > 1KB
      deleteOriginFile: false,
    }),
    // Brotli compression (better ratio than gzip)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Performance optimizations
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    reportCompressedSize: false,
    chunkSizeWarningLimit: 400,
    // Selective modulepreload - only critical chunks
    modulePreload: {
      polyfill: false,
      resolveDependencies: (filename, deps, depsInfo) => {
        // Only preload critical chunks needed for initial render
        const criticalChunks = [
          'react-core',
          'react-router',
          'supabase-chunk',
          'tanstack-query',
          'utils-chunk',
        ];

        // Filter to only include critical dependencies
        const filteredDeps = deps.filter(dep =>
          criticalChunks.some(critical => dep.includes(critical))
        );

        // Sort to ensure react-core loads first
        return filteredDeps.sort((a, b) => {
          if (a.includes('react-core')) return -1;
          if (b.includes('react-core')) return 1;
          return 0;
        });
      },
    },
    rollupOptions: {
      output: {
        // OPTIMIZED CHUNKING STRATEGY - Split vendor bundle into smaller chunks
        manualChunks: id => {
          if (id.includes('node_modules')) {
            // PDF & Document handling - split into granular chunks for better lazy loading
            // PDF.js for viewing (used by react-pdf) - largest
            if (id.includes('pdfjs-dist')) {
              return 'pdfjs-viewer-chunk';
            }
            // jsPDF for generating PDFs
            if (id.includes('jspdf')) {
              return 'pdf-generator-chunk';
            }
            // html2canvas for DOM capture (often used with PDF generation)
            if (id.includes('html2canvas')) {
              return 'html2canvas-chunk';
            }

            // Charts - lazy loaded, keep separate
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'charts-libs-chunk';
            }

            // React Router - MUST come before react-core because @remix-run/router is used internally
            if (id.includes('react-router') || id.includes('@remix-run/router')) {
              return 'react-router-chunk';
            }

            // SPLIT REACT ECOSYSTEM for better caching
            // React Core - essential, always needed
            // Exclude specific react-* libraries that should be in their own chunks
            if (
              (id.includes('react') &&
                !id.includes('@radix-ui') &&
                !id.includes('react-router') &&
                !id.includes('react-day-picker') &&
                !id.includes('react-dropzone') &&
                !id.includes('react-resizable-panels') &&
                !id.includes('react-helmet')) ||
              id.includes('scheduler') ||
              id.includes('@remix-run')
            ) {
              return 'react-core-chunk';
            }

            // Radix UI Components - large but often tree-shaken
            if (id.includes('@radix-ui')) {
              return 'radix-ui-chunk';
            }

            // React UI Utilities - context-dependent helpers
            if (
              id.includes('@floating-ui') ||
              id.includes('use-callback-ref') ||
              id.includes('use-sidecar') ||
              id.includes('aria-hidden') ||
              id.includes('focus-lock') ||
              id.includes('detect-node-es') ||
              id.includes('get-nonce')
            ) {
              return 'react-ui-utils-chunk';
            }

            // Embla Carousel - only used in certain pages
            if (id.includes('embla-carousel')) {
              return 'carousel-chunk';
            }

            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase-chunk';
            }

            // TanStack Query
            if (id.includes('@tanstack/react-query')) {
              return 'tanstack-query-chunk';
            }

            // TipTap editor (can be large)
            if (id.includes('@tiptap') || id.includes('prosemirror')) {
              return 'editor-libs-chunk';
            }

            // Form libraries
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'form-libs-chunk';
            }

            // DnD Kit (dashboard builder)
            if (id.includes('@dnd-kit')) {
              return 'dnd-kit-chunk';
            }

            // Date libraries (including timezone utilities)
            if (id.includes('date-fns') || id.includes('date-fns-tz')) {
              return 'date-libs-chunk';
            }

            // Icons - lucide-react is HUGE, must be separate
            if (id.includes('lucide-react')) {
              return 'icons-chunk';
            }

            // Jitsi (video conferencing) - can be large
            if (id.includes('@jitsi')) {
              return 'video-conference-chunk';
            }

            // Markdown & syntax highlighting
            if (
              id.includes('react-markdown') ||
              id.includes('react-syntax-highlighter') ||
              id.includes('marked')
            ) {
              return 'markdown-chunk';
            }

            // PDF viewing (react-pdf) - group with pdfjs
            if (id.includes('react-pdf')) {
              return 'pdfjs-viewer-chunk';
            }

            // Motion/Animation
            if (id.includes('framer-motion')) {
              return 'animation-chunk';
            }

            // i18n (internationalization)
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'i18n-chunk';
            }

            // UI utilities
            if (id.includes('cmdk') || id.includes('vaul') || id.includes('sonner')) {
              return 'ui-utils-chunk';
            }

            // File processing (including SSR DOMPurify wrapper)
            if (
              id.includes('jszip') ||
              id.includes('dompurify') ||
              id.includes('isomorphic-dompurify')
            ) {
              return 'file-processing-chunk';
            }

            // Utilities (smaller libraries)
            if (
              id.includes('clsx') ||
              id.includes('class-variance-authority') ||
              id.includes('tailwind-merge')
            ) {
              return 'utils-chunk';
            }

            // === HIGH PRIORITY: Further chunk splitting ===

            // Excel/Spreadsheet - LARGE, only for admin import/export
            if (id.includes('xlsx') || id.includes('exceljs')) {
              return 'xlsx-chunk';
            }

            // Sentry error tracking - can be deferred/lazy loaded
            if (id.includes('@sentry')) {
              return 'sentry-chunk';
            }

            // === MEDIUM PRIORITY: Feature-specific chunks ===

            // Panel resizing - dashboard builder feature only
            if (id.includes('react-resizable-panels')) {
              return 'panels-chunk';
            }

            // Calendar picker - used in specific date forms
            if (id.includes('react-day-picker')) {
              return 'calendar-picker-chunk';
            }

            // File upload - feature-specific
            if (id.includes('react-dropzone')) {
              return 'file-upload-chunk';
            }

            // === LOW PRIORITY: Small utilities ===

            // SEO utilities
            if (id.includes('react-helmet')) {
              return 'seo-chunk';
            }

            // Theme management
            if (id.includes('next-themes')) {
              return 'theme-chunk';
            }

            // OTP input - group with forms
            if (id.includes('input-otp')) {
              return 'form-libs-chunk';
            }

            // QR code generation
            if (id.includes('qrcode')) {
              return 'qr-chunk';
            }

            // === ADDITIONAL CHUNKS to reduce react-ecosystem bloat ===

            // Text encoding/decoding utilities
            if (id.includes('iconv-lite') || id.includes('safer-buffer')) {
              return 'text-encoding-chunk';
            }

            // Lodash - commonly used utility
            if (id.includes('lodash')) {
              return 'lodash-chunk';
            }

            // UUID generation
            if (id.includes('uuid')) {
              return 'uuid-chunk';
            }

            // Canvas/Image processing
            if (
              id.includes('canvg') ||
              id.includes('stackblur-canvas') ||
              id.includes('rgbcolor')
            ) {
              return 'canvas-utils-chunk';
            }

            // Core-js polyfills
            if (id.includes('core-js')) {
              return 'polyfills-chunk';
            }

            // Compat/browser detection
            if (id.includes('bowser') || id.includes('ua-parser')) {
              return 'browser-compat-chunk';
            }

            // Symbol polyfills
            if (id.includes('symbol-observable')) {
              return 'observable-chunk';
            }

            // Deepmerge/deep-equal utilities
            if (
              id.includes('deepmerge') ||
              id.includes('deep-equal') ||
              id.includes('fast-deep-equal')
            ) {
              return 'deep-utils-chunk';
            }

            // CSS-in-JS related
            if (id.includes('csstype') || id.includes('emotion') || id.includes('stylis')) {
              return 'css-runtime-chunk';
            }

            // Object-assign/Object.assign polyfills
            if (id.includes('object-assign')) {
              return 'polyfills-chunk';
            }

            // Tiny invariant/warning utilities (React ecosystem helpers)
            if (id.includes('tiny-invariant') || id.includes('tiny-warning')) {
              return 'react-helpers-chunk';
            }

            // Hoist non-react-statics (React HOC helper)
            if (id.includes('hoist-non-react-statics')) {
              return 'react-helpers-chunk';
            }

            // Everything else goes to react-ecosystem to avoid createContext errors
            // This ensures all libraries that might use React load together
            return 'react-ecosystem-chunk';
          }

          // Application code - split by feature
          if (id.includes('/src/services/')) {
            if (id.includes('/src/services/social/')) return 'services-social';
            if (id.includes('/src/services/reporting/')) return 'services-reporting';
            if (id.includes('/src/services/recommendations/')) return 'services-recommendations';
            if (id.includes('/src/services/learning-path/')) return 'services-learning-path';
            if (id.includes('/src/services/analytics/')) return 'services-analytics';
            if (id.includes('/src/services/gamification/')) return 'services-gamification';
            if (id.includes('/src/services/blog/')) return 'services-blog';
            return 'services-common';
          }

          // Component chunks
          if (id.includes('/src/components/admin/')) {
            return 'admin-components';
          }
          if (id.includes('/src/components/ai-assessment/')) {
            return 'ai-assessment';
          }
          if (id.includes('/src/components/video/')) {
            return 'video-components';
          }
          if (id.includes('/src/components/analytics/')) {
            return 'analytics-components';
          }
          if (id.includes('/src/components/assessment-results/')) {
            return 'assessment-results';
          }
          if (id.includes('/src/components/blog/')) {
            return 'blog-components';
          }
          if (id.includes('/src/components/dashboard/')) {
            return 'dashboard-components';
          }
          if (id.includes('/src/components/recommendations/')) {
            return 'recommendations-components';
          }
          if (id.includes('/src/components/ui/')) {
            return 'ui-components';
          }
        },
        // Optimize chunk naming
        chunkFileNames: chunkInfo => {
          // Use cleaner names for manual chunks
          if (chunkInfo.name && chunkInfo.name.endsWith('-chunk')) {
            return `js/[name]-[hash].js`;
          }
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()
            : 'chunk';
          return `js/[name]-${facadeModuleId}-[hash].js`;
        },
        assetFileNames: assetInfo => {
          const extType = assetInfo.name?.split('.').at(-1);
          if (/css/i.test(extType || '')) {
            return 'css/[name]-[hash][extname]';
          }
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType || '')) {
            return 'img/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        entryFileNames: 'js/[name]-[hash].js',
      },
      // Tree shaking optimizations
      treeshake: {
        moduleSideEffects: 'no-external',
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    // Force React to be processed first
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      // Pre-bundle commonly used UI components
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
    ],
    // Ensure React is available as an external in dev
    entries: ['src/main.tsx'],
    exclude: [
      '@supabase/supabase-js/dist/module/lib/types',
      // Exclude heavy libraries to enable lazy loading
      'recharts',
      'pdfjs-dist',
      'jspdf',
      'html2canvas',
    ],
  },
  // Enable aggressive tree-shaking
  esbuild: {
    treeShaking: true,
    legalComments: 'none',
  },
  // CSS optimization
  css: {
    devSourcemap: false,
  },
}));
