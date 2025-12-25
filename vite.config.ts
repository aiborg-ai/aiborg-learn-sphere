import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';
import { prioritizeReactPlugin } from './vite-plugins/prioritize-react';
import { cspPlugin } from './vite-plugins/csp-plugin';
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';

// Build cache buster: 2024-12-17-v2
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
            // Cache-First for video content with range request support
            // Critical for offline lesson playback and video seeking
            urlPattern: /\.(?:mp4|webm|m3u8|mov|avi|mkv)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'video-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              rangeRequests: true, // Enable partial content (206) for video seeking
              cacheableResponse: {
                statuses: [0, 200, 206],
              },
            },
          },
          {
            // Cache-First for audio content (podcasts, lessons)
            urlPattern: /\.(?:mp3|wav|ogg|aac|m4a)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              rangeRequests: true,
              cacheableResponse: {
                statuses: [0, 200, 206],
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
    // Use default modulePreload behavior to ensure proper loading order
    modulePreload: true,
    rollupOptions: {
      output: {
        // TEMPORARILY DISABLE manual chunks to debug circular dependency issues
        // Let Vite/Rollup handle all chunking automatically
        // manualChunks: undefined,
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
      // Pre-optimize recharts and lodash to fix import issues
      'recharts',
      'lodash',
    ],
    // Ensure React is available as an external in dev
    entries: ['src/main.tsx'],
    exclude: [
      '@supabase/supabase-js/dist/module/lib/types',
      // Exclude heavy libraries to enable lazy loading
      // 'recharts', // REMOVED - needs to be optimized for lodash compatibility
      'pdfjs-dist',
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
// Build trigger: 1765967400 - no manual chunks, no canvg stub
