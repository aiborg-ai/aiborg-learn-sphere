import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
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
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Prevent console statements - use logger utility instead
      'no-console': 'error',

      // TypeScript rules to prevent 'any' usage
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // Enforce consistent code style
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: true,
        },
      ],

      // Prevent large files (warning at 300 lines, error at 500)
      'max-lines': [
        'warn',
        {
          max: 500,
          skipBlankLines: true,
          skipComments: true,
        },
      ],

      // Prevent hardcoded values (disabled - too noisy for this codebase)
      // Re-enable when codebase stabilizes
      // "no-magic-numbers": ["warn", {
      //   ignore: [0, 1, -1, 100, 1000],
      //   ignoreArrayIndexes: true,
      //   enforceConst: true,
      //   detectObjects: false,
      // }],
    },
  }
);
