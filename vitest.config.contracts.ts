import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest Configuration for Contract Tests
 *
 * Contract tests validate the shape and structure of API responses
 * from Supabase against our Zod schemas and TypeScript types.
 *
 * These tests run against a real database (local Supabase or test instance)
 * to ensure database schema matches our application expectations.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    name: 'contract-tests',
    include: ['src/**/*.contract.test.ts', 'src/__tests__/contracts/**/*.test.ts'],
    environment: 'node', // Contract tests don't need DOM
    setupFiles: ['./src/tests/setup.contracts.ts'],
    globals: true,
    testTimeout: 30000, // 30s for database operations
    hookTimeout: 30000,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/schemas/**', 'src/lib/api-validation.ts', 'src/hooks/**'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**', '**/dist/**'],
    },

    // Sequence configuration
    sequence: {
      hooks: 'list', // Run hooks in order
    },

    // Reporters
    reporters: process.env.CI ? ['json', 'github-actions'] : ['verbose'],

    // Pool options
    pool: 'forks', // Use forks for database tests to avoid conflicts
    poolOptions: {
      forks: {
        singleFork: true, // Run tests sequentially for database consistency
      },
    },
  },

  // Environment variables for contract tests
  define: {
    'import.meta.env.VITE_TEST_MODE': JSON.stringify('contract'),
  },
});
