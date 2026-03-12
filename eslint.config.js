import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'supabase/functions', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['**/*.test.tsx', '**/*.test.ts', '**/test/**', 'vitest.config.ts'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Allow any for external API responses (weather, Supabase)
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      
      // Allow floating promises in event handlers
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      
      // Allow unused vars for error handling
      '@typescript-eslint/no-unused-vars': ['warn', { caughtErrors: 'none' }],
      
      // Allow non-Error promise rejection reasons (legacy code)
      '@typescript-eslint/prefer-promise-reject-errors': 'warn',
      
      // Allow setState in effects (legacy patterns)
      'react-hooks/set-state-in-effect': 'warn',
      
      // Allow manual memoization issues (legacy code)
      'react-hooks/preserve-manual-memoization': 'warn',
      
      // Allow static components (legacy patterns)
      'react-hooks/static-components': 'warn',
      
      // Allow await on non-thenables (defensive coding)
      '@typescript-eslint/await-thenable': 'warn',
    },
  },
])
