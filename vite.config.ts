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
      },
    },
    reportCompressedSize: false,
    chunkSizeWarningLimit: 500,
    // Disable modulepreload for better lazy loading
    modulePreload: {
      polyfill: false,
      resolveDependencies: (filename, deps) => {
        // Don't preload heavy chunks like charts and PDF
        return deps.filter(dep => !dep.includes('charts-chunk') && !dep.includes('pdf-chunk'));
      },
    },
    rollupOptions: {
      output: {
        // Manual chunks for better code splitting
        manualChunks: id => {
          // Vendor chunks - Split React into 3 smaller chunks
          if (id.includes('node_modules')) {
            // React ecosystem
            if (
              id.includes('react/') &&
              !id.includes('react-dom') &&
              !id.includes('react-router')
            ) {
              return 'react-core';
            }
            if (id.includes('react-dom')) {
              return 'react-dom';
            }
            if (id.includes('react-router')) {
              return 'react-router';
            }

            // UI libraries
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('lucide-react') || id.includes('/lucide-react/')) {
              return 'icons';
            }

            // Data & State
            if (id.includes('@tanstack')) {
              return 'tanstack';
            }
            if (id.includes('@supabase')) {
              return 'supabase';
            }

            // Forms
            if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
              return 'form';
            }

            // Charts & Visualization
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'charts';
            }

            // PDF & Document handling
            if (id.includes('react-pdf') || id.includes('pdfjs-dist')) {
              return 'pdf';
            }
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf-export';
            }

            // Markdown & Editors
            if (
              id.includes('marked') ||
              id.includes('dompurify') ||
              id.includes('syntax-highlighter')
            ) {
              return 'editor';
            }

            // Utility libraries (split into smaller chunks)
            if (id.includes('date-fns')) {
              return 'date-utils';
            }
            if (
              id.includes('class-variance-authority') ||
              id.includes('clsx') ||
              id.includes('tailwind-merge')
            ) {
              return 'style-utils';
            }
            if (id.includes('qrcode')) {
              return 'qrcode';
            }

            // UI Components & Features
            if (id.includes('cmdk') || id.includes('vaul') || id.includes('sonner')) {
              return 'ui-features';
            }
            if (id.includes('embla-carousel')) {
              return 'carousel';
            }
            if (id.includes('next-themes')) {
              return 'theme';
            }
            if (id.includes('react-day-picker') || id.includes('input-otp')) {
              return 'form-widgets';
            }
            if (id.includes('react-resizable-panels')) {
              return 'panels';
            }

            // Remaining small vendor libraries
            return 'vendor';
          }

          // Split large service groups
          if (id.includes('/src/services/social/')) {
            return 'services-social';
          }
          if (id.includes('/src/services/reporting/')) {
            return 'services-reporting';
          }
          if (id.includes('/src/services/recommendations/')) {
            return 'services-recommendations';
          }
          if (id.includes('/src/services/learning-path/')) {
            return 'services-learning-path';
          }

          // Split admin components
          if (id.includes('/src/components/admin/')) {
            return 'admin-components';
          }

          // Split AI assessment components
          if (id.includes('/src/components/ai-assessment/')) {
            return 'ai-assessment';
          }

          // Split video components
          if (id.includes('/src/components/video/')) {
            return 'video-components';
          }

          // Split analytics components
          if (id.includes('/src/components/analytics/')) {
            return 'analytics';
          }
        },
        // Use a function to generate chunk names
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
      'lucide-react', // Enable tree-shaking for icons
    ],
    exclude: ['@supabase/supabase-js/dist/module/lib/types'],
  },
  // Enable aggressive tree-shaking
  esbuild: {
    treeShaking: true,
  },
}));
