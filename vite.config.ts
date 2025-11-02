import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [react(), mode === 'development' && componentTagger()].filter(Boolean),
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
        // Manual chunks for better code splitting
        manualChunks: id => {
          // Vendor chunks - Further optimize splitting
          if (id.includes('node_modules')) {
            // CRITICAL: React must load FIRST - most aggressive matching
            // Include any package that depends on React
            if (
              id.includes('/react/') ||
              id.includes('react-dom') ||
              id.includes('react-') ||
              id.includes('@tanstack/react') ||
              id.includes('react-hook-form') ||
              id.includes('react-router') ||
              id.includes('scheduler')
            ) {
              return 'react-vendor';
            }

            // UI libraries - Split Radix into smaller chunks
            if (
              id.includes('@radix-ui/react-dialog') ||
              id.includes('@radix-ui/react-alert-dialog')
            ) {
              return 'ui-dialog';
            }
            if (id.includes('@radix-ui/react-dropdown') || id.includes('@radix-ui/react-select')) {
              return 'ui-dropdowns';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }

            // Icons - separate chunk (doesn't depend on React hooks)
            if (id.includes('lucide-react')) {
              return 'icons';
            }

            // Data & State (non-React parts)
            if (id.includes('@tanstack')) {
              // @tanstack/react-* already handled in react-vendor
              if (!id.includes('@tanstack/react')) {
                return 'tanstack';
              }
            }
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase-client';
            }
            if (id.includes('@supabase')) {
              return 'supabase';
            }

            // Forms - zod doesn't depend on React
            // react-hook-form already handled in react-vendor
            if (id.includes('zod')) {
              return 'zod';
            }
            if (id.includes('@hookform')) {
              return 'hookform-resolvers';
            }

            // Charts & Visualization - keep separate (lazy loaded)
            if (id.includes('recharts')) {
              return 'charts';
            }
            if (id.includes('d3-')) {
              return 'charts-d3';
            }

            // PDF & Document handling - keep separate (lazy loaded)
            if (id.includes('pdfjs-dist')) {
              return 'pdf';
            }
            if (id.includes('react-pdf')) {
              return 'react-pdf';
            }
            if (id.includes('jspdf')) {
              return 'jspdf';
            }
            if (id.includes('html2canvas')) {
              return 'html2canvas';
            }

            // Markdown & Editors
            if (id.includes('marked')) {
              return 'marked';
            }
            if (id.includes('dompurify') || id.includes('isomorphic-dompurify')) {
              return 'dompurify';
            }
            if (id.includes('react-syntax-highlighter')) {
              return 'syntax-highlighter';
            }

            // Utility libraries
            if (id.includes('date-fns')) {
              return 'date-fns';
            }
            if (id.includes('class-variance-authority')) {
              return 'cva';
            }
            if (id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'style-utils';
            }
            if (id.includes('qrcode')) {
              return 'qrcode';
            }

            // UI Components & Features
            if (id.includes('cmdk')) {
              return 'cmdk';
            }
            if (id.includes('vaul')) {
              return 'vaul';
            }
            if (id.includes('sonner')) {
              return 'sonner';
            }
            if (id.includes('embla-carousel')) {
              return 'carousel';
            }
            if (id.includes('next-themes')) {
              return 'themes';
            }
            if (id.includes('react-day-picker')) {
              return 'day-picker';
            }
            if (id.includes('input-otp')) {
              return 'input-otp';
            }
            if (id.includes('react-resizable-panels')) {
              return 'resizable-panels';
            }

            // TipTap Editor (large)
            if (id.includes('@tiptap')) {
              return 'tiptap-editor';
            }

            // DnD Kit
            if (id.includes('@dnd-kit')) {
              return 'dnd-kit';
            }

            // i18n
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'i18n';
            }

            // Markdown & React Markdown
            if (id.includes('react-markdown')) {
              return 'react-markdown';
            }

            // Dropzone
            if (id.includes('react-dropzone')) {
              return 'react-dropzone';
            }

            // Web Vitals
            if (id.includes('web-vitals')) {
              return 'web-vitals';
            }

            // Jitsi
            if (id.includes('@jitsi')) {
              return 'jitsi';
            }

            // Remaining small vendor libraries
            return 'vendor-misc';
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
