import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        sourceType: 'module',
      },
      globals: {
        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        NodeJS: 'readonly',
        // Browser globals
        console: 'readonly',
        document: 'readonly',
        HTMLElement: 'readonly',
        HTMLStyleElement: 'readonly',
        HTMLImageElement: 'readonly',
        SVGSVGElement: 'readonly',
        Image: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-prototype-builtins': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-async-promise-executor': 'warn',
      'no-misleading-character-class': 'warn',
      'no-useless-escape': 'warn',
    },
  },
  {
    ignores: ['node_modules/', 'main.js', '*.d.ts', '.obsidian/'],
  },
];