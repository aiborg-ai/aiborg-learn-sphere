import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'scripts/**/*', 'supabase/functions/**/*', '*.config.ts', '*.config.js'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Accessibility rules - relaxed to warnings
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-has-content': 'warn',
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-role': 'warn',
      'jsx-a11y/click-events-have-key-events': 'off', // Too noisy for this codebase
      'jsx-a11y/label-has-associated-control': 'off', // Often conflicts with custom components

      // Prevent console statements - use logger utility instead
      // Relaxed to warning for now
      'no-console': 'warn',

      // Fix for ESLint 9 compatibility - disable base rule, use TypeScript version
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': [
        'warn',
        {
          allowShortCircuit: true,
          allowTernary: true,
          allowTaggedTemplates: true,
        },
      ],

      // TypeScript rules - relaxed for development
      '@typescript-eslint/no-explicit-any': 'warn', // Changed from error to warning
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      // Enforce consistent type imports
      '@typescript-eslint/consistent-type-imports': 'off', // Disabled - causes issues with React imports

      // Prevent large files - increased threshold for test files
      'max-lines': [
        'warn',
        {
          max: 1000, // Increased from 500 to 1000
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
  // Special rules for test files
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      'max-lines': 'off', // No line limit for test files
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in tests
      'no-console': 'off', // Allow console in tests
    },
  }
);
