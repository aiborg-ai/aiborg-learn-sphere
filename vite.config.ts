import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';
import { prioritizeReactPlugin } from './vite-plugins/prioritize-react';
import { cspPlugin } from './vite-plugins/csp-plugin';
import { VitePWA } from 'vite-plugin-pwa';

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
      includeAssets: ['**/*.{png,svg,ico,woff,woff2}'],
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
        // Aggressive caching strategy
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
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
    // Disable modulepreload for better lazy loading
    modulePreload: {
      polyfill: false,
      resolveDependencies: (filename, deps, depsInfo) => {
        // CRITICAL FIX: Ensure react-vendor loads before everything else
        // Filter out heavy chunks and ensure proper order
        const filteredDeps = deps.filter(
          dep =>
            !dep.includes('charts-chunk') &&
            !dep.includes('pdf-chunk') &&
            !dep.includes('pdf-export-chunk') &&
            !dep.includes('admin-components')
        );

        // Sort to ensure react-vendor comes first
        return filteredDeps.sort((a, b) => {
          if (a.includes('react-vendor')) return -1;
          if (b.includes('react-vendor')) return 1;
          return 0;
        });
      },
    },
    rollupOptions: {
      output: {
        // OPTIMIZED CHUNKING STRATEGY - Split vendor bundle into smaller chunks
        manualChunks: id => {
          if (id.includes('node_modules')) {
            // PDF & Document handling - lazy loaded, keep separate
            if (id.includes('pdfjs-dist') || id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf-libs-chunk';
            }

            // Charts - lazy loaded, keep separate
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'charts-libs-chunk';
            }

            // CONSOLIDATED REACT ECOSYSTEM
            // All React-related libraries go together to avoid createContext errors
            if (
              id.includes('react') ||
              id.includes('scheduler') ||
              id.includes('@radix-ui') ||
              id.includes('@floating-ui') ||
              id.includes('use-callback-ref') ||
              id.includes('use-sidecar') ||
              id.includes('aria-hidden') ||
              id.includes('focus-lock') ||
              id.includes('embla-carousel') ||
              id.includes('detect-node-es') ||
              id.includes('get-nonce') ||
              id.includes('@remix-run')
            ) {
              return 'react-ecosystem-chunk';
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

            // Date libraries
            if (id.includes('date-fns')) {
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

            // PDF viewing (react-pdf)
            if (id.includes('react-pdf')) {
              return 'pdf-libs-chunk'; // Merge with other PDF libraries
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

            // File processing
            if (id.includes('jszip') || id.includes('dompurify')) {
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
