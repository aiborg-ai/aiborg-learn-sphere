import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';
import unusedImports from 'eslint-plugin-unused-imports';

export default tseslint.config(
  { ignores: ['dist', 'scripts/**/*', 'supabase/functions/**/*', '*.config.ts', '*.config.js', 'src/templates/**/*'] },
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
      'unused-imports': unusedImports,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // === Core Accessibility Rules (Errors) ===
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/html-has-lang': 'error',
      'jsx-a11y/iframe-has-title': 'error',
      'jsx-a11y/img-redundant-alt': 'warn',
      'jsx-a11y/no-access-key': 'warn',
      'jsx-a11y/no-distracting-elements': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/scope': 'error',

      // === Interactive Element Rules (Warnings) ===
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/mouse-events-have-key-events': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/no-noninteractive-tabindex': 'warn',
      'jsx-a11y/interactive-supports-focus': 'warn',

      // === Form & Label Rules (Warnings - can conflict with custom components) ===
      'jsx-a11y/label-has-associated-control': [
        'warn',
        {
          labelComponents: ['Label'],
          labelAttributes: ['label'],
          controlComponents: ['Input', 'Select', 'Textarea'],
          depth: 3,
        },
      ],
      'jsx-a11y/autocomplete-valid': 'warn',

      // === Media Rules ===
      'jsx-a11y/media-has-caption': [
        'warn',
        {
          audio: ['Audio'],
          video: ['Video'],
        },
      ],

      // === Tab Navigation Rules ===
      'jsx-a11y/tabindex-no-positive': 'error',

      // === Additional Important Rules ===
      'jsx-a11y/no-redundant-roles': 'warn',
      'jsx-a11y/prefer-tag-over-role': 'warn',
      'jsx-a11y/no-aria-hidden-on-focusable': 'error',

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

      // Unused imports/vars - use plugin for auto-fix
      '@typescript-eslint/no-unused-vars': 'off', // Turned off in favor of unused-imports plugin
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
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
