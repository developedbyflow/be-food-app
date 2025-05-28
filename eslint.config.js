// Import TypeScript plugin for ESLint
import eslintPluginTs from 'typescript-eslint';

// Import Node.js-specific linting rules
import eslintPluginNode from 'eslint-plugin-n';

// Import base ESLint config from the official ESLint package
import js from '@eslint/js';

// Export the ESLint configuration
export default [
  // Start with ESLint's recommended base configuration for JavaScript
  js.configs.recommended,

  {
    // Apply these settings to all TypeScript files
    files: ['**/*.ts'],

    languageOptions: {
      // Use the TypeScript parser for `.ts` files
      parser: eslintPluginTs.parser,

      parserOptions: {
        // Point to your TypeScript config
        project: './tsconfig.json',

        // Use ECMAScript modules
        sourceType: 'module',

        // Use the latest ECMAScript syntax
        ecmaVersion: 'latest',
      },
    },

    plugins: {
      // Load TypeScript rules
      '@typescript-eslint': eslintPluginTs,

      // Load Node.js rules
      n: eslintPluginNode,
    },

    rules: {
      // Warn about unused variables, but allow ones prefixed with `_`
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],

      // Warn if using `any` type
      '@typescript-eslint/no-explicit-any': 'warn',

      // Enforce using `interface` instead of `type` for object types
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],

      // Error if import paths don't resolve correctly in Node.js
      'n/no-missing-import': 'error',

      // Warn if deprecated Node.js APIs are used
      'n/no-deprecated-api': 'warn',

      // Allow using `console.log` (you can change this to 'warn' or 'error' if needed)
      'no-console': 'off',

      // Enforce semicolons at the end of statements
      semi: ['error', 'always'],

      // Enforce use of single quotes for strings
      quotes: ['error', 'single'],

      // Enforce 2-space indentation
      indent: ['error', 2],
    },
  },
];
