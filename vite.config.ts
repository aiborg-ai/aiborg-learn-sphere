import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';
import { prioritizeReactPlugin } from './vite-plugins/prioritize-react';

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
        // SIMPLIFIED CHUNKING STRATEGY TO AVOID CIRCULAR DEPENDENCIES
        // Put all non-lazy dependencies together, separate only lazy-loaded libraries
        manualChunks: id => {
          if (id.includes('node_modules')) {
            // PDF & Document handling - lazy loaded, keep separate
            if (
              id.includes('pdfjs-dist') ||
              id.includes('jspdf') ||
              id.includes('html2canvas')
            ) {
              return 'pdf-libs';
            }

            // Charts - lazy loaded, keep separate
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'charts-libs';
            }

            // Put EVERYTHING else in ONE vendor bundle to avoid circular deps
            return 'vendor';
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
