// eslint.config.js

// Import the official TypeScript ESLint plugin for linting TypeScript code
import tsPlugin from '@typescript-eslint/eslint-plugin';

// Import the TypeScript parser to parse TypeScript syntax
import tsParser from '@typescript-eslint/parser';

// Import the Node.js specific ESLint plugin for Node environment rules
import nodePlugin from 'eslint-plugin-n';

// Import the Prettier plugin to integrate Prettier formatting as ESLint rules
import prettierPlugin from 'eslint-plugin-prettier';

// Add this import at the top
import importPlugin from 'eslint-plugin-import';

// Import the official ESLint JavaScript recommended base config
import js from '@eslint/js';

// Import global variables definitions (like console, process, etc.)
import globals from 'globals';
// Extract only Node.js globals from the globals package
const { node: globalsNode } = globals;

export default [
  // 1) Base config for all JavaScript files — ESLint's recommended rules
  js.configs.recommended,

  // 2) Specific config for all TypeScript files
  {
    files: ['**/*.ts', 'src/**/*', 'database/**/*'], // Apply this config only to TypeScript files
    languageOptions: {
      parser: tsParser, // Use the TypeScript parser to parse TypeScript syntax
      parserOptions: {
        project: './tsconfig.json', // Use your tsconfig.json to inform the parser about your TS project
        sourceType: 'module', // Code is written in ES modules style (import/export)
        ecmaVersion: 'latest', // Support the latest ECMAScript features
      },
      globals: {
        ...globalsNode, // ✅ This line adds Node.js globals like console, process, etc.
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin, // Enable TypeScript linting rules
      n: nodePlugin, // Enable Node.js specific linting rules
      import: importPlugin, // ✅ Add the import plugin
    },
    rules: {
      // Warn about unused variables in JavaScript files
      'no-unused-vars': 'warn',
      // Allow case declarations in switch statements
      // 'no-case-declarations': 'error',
      // Warn when variables are declared but never used, except those starting with _
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_', // Ignore parameters starting with _
          varsIgnorePattern: '^_', // Ignore variables starting with _
          caughtErrorsIgnorePattern: '^_', // Ignore caught errors starting with _
          destructuredArrayIgnorePattern: '^_', // Ignore destructured arrays starting with _
          ignoreRestSiblings: true, // Ignore unused in object destructuring
        },
      ],
      // Warn if the `any` type is explicitly used in TypeScript code
      '@typescript-eslint/no-explicit-any': 'warn',
      // Enforce using `interface` over `type` for defining object types in TypeScript
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      // Error when Node.js import paths cannot be resolved
      'n/no-missing-import': 'error',
      // Warn when deprecated Node.js APIs are used
      'n/no-deprecated-api': 'warn',
      // Allow the use of console.log (you can switch to 'warn' or 'error' if desired)
      'no-console': 'off',
      // Disallow multiple empty lines (max 1 empty line)
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
      // Keep external imports on top, then internal ones, separated by a line
      'import/order': [
        'error',
        {
          groups: [
            ['builtin', 'external'], // Group external packages together
            'internal', // All internal imports
            ['parent', 'sibling', 'index'],
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
          // This will help but won't separate default vs named within groups
          warnOnUnassignedImports: true,
        },
      ],
    },
  },

  // 3) Integrate Prettier formatting rules for both JavaScript and TypeScript files
  {
    files: ['**/*.{js,ts}'], // Apply Prettier rules to JS and TS files
    plugins: { prettier: prettierPlugin }, // Enable the Prettier plugin
    rules: {
      // Treat any Prettier formatting issues as ESLint errors
      // Prettier runs inside ESLint thanks to this line
      'prettier/prettier': 'error',
    },
  },
  // 4) Node.js environment for config/build files (like esbuild.config.js)
  {
    files: ['**/*.config.js', '**/*.config.ts', '**/esbuild.config.js'],
    languageOptions: {
      globals: {
        ...globalsNode, // Add Node.js globals
      },
    },
  },
];
