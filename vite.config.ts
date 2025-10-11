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
      resolveDependencies: (filename, deps) => {
        // Don't preload heavy chunks
        return deps.filter(
          dep =>
            !dep.includes('charts-chunk') &&
            !dep.includes('pdf-chunk') &&
            !dep.includes('pdf-export-chunk') &&
            !dep.includes('admin-components')
        );
      },
    },
    rollupOptions: {
      output: {
        // Manual chunks for better code splitting
        manualChunks: id => {
          // Vendor chunks - Further optimize splitting
          if (id.includes('node_modules')) {
            // Core React - smallest possible
            if (id.includes('react/') && !id.includes('react-dom') && !id.includes('react-router')) {
              return 'react-core';
            }
            if (id.includes('react-dom/') && !id.includes('client')) {
              return 'react-dom';
            }
            if (id.includes('react-dom/client')) {
              return 'react-dom-client';
            }
            if (id.includes('react-router-dom') || id.includes('react-router/')) {
              return 'react-router';
            }

            // UI libraries - Split Radix into smaller chunks
            if (id.includes('@radix-ui/react-dialog') || id.includes('@radix-ui/react-alert-dialog')) {
              return 'ui-dialog';
            }
            if (id.includes('@radix-ui/react-dropdown') || id.includes('@radix-ui/react-select')) {
              return 'ui-dropdowns';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }

            // Icons - separate chunk
            if (id.includes('lucide-react')) {
              return 'icons';
            }

            // Data & State
            if (id.includes('@tanstack/react-query')) {
              return 'tanstack-query';
            }
            if (id.includes('@tanstack')) {
              return 'tanstack';
            }
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase-client';
            }
            if (id.includes('@supabase')) {
              return 'supabase';
            }

            // Forms - split into smaller chunks
            if (id.includes('react-hook-form')) {
              return 'react-hook-form';
            }
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
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      // Pre-bundle commonly used UI components
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
    ],
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
