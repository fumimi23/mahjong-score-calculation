import jseslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import perfectionist from 'eslint-plugin-perfectionist';
import preferArrowFunctions from 'eslint-plugin-prefer-arrow-functions';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';


export default tseslint.config(
  jseslint.configs.recommended,
  ...tseslint.configs.recommended,
  stylistic.configs['recommended-flat'],
  perfectionist.configs['recommended-alphabetical'],
  importPlugin.flatConfigs.recommended,
  {
    ignores: [
      'dist',
      '.yarn',
      '*.config.{js,ts}'
    ],
  },
  {
    files: [
      '**/*.{js,ts,tsx}'
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: './tsconfig.app.json',
      }
    },
    plugins: {
      'prefer-arrow-functions': preferArrowFunctions,
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      unicorn,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@stylistic/array-bracket-newline': [
        'error',
        'always'
      ],
      '@stylistic/array-element-newline': [
        'error',
        'always'
      ],
      '@stylistic/comma-dangle': [
        'error',
        { objects: 'always', }
      ],
      '@stylistic/comma-style': [
        'error',
        'last'
      ],
      '@stylistic/dot-location': [
        'error',
        'property'
      ],
      '@stylistic/function-call-argument-newline': [
        'error',
        'always'
      ],
      '@stylistic/max-len': [
        'error',
        { code: 120, }
      ],
      '@stylistic/quotes': [
        'error',
        'single'
      ],
      '@stylistic/semi': [
        'error',
        'always'
      ],
      '@stylistic/object-curly-newline': [
        'error',
        'always'
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'inline-type-imports', }
      ],
      '@typescript-eslint/restrict-plus-operands': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      'arrow-body-style': ['error', 'always'],
      'func-style': [
        'error',
        'declaration',
        { allowArrowFunctions: true }
      ],
      'import/no-cycle': 'error',
      'no-implicit-coercion': 'error',
      'prefer-arrow-functions/prefer-arrow-functions': [
        'error',
        {
          'classPropertiesAllowed': false,
          'disallowPrototype': false,
          'returnStyle': 'unchanged',
          'singleReturnOnly': false
        }
      ],
      'prefer-template': 'error',
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true, }
      ],
      'react/jsx-no-bind': 'error',
      'react/jsx-no-leaked-render': 'error',
      'unicorn/prefer-switch': 'error',
    },
    settings: {
      perfectionist: {
        partitionByComment: true,
        type: 'alphabetical',
      },
    },
  }
);
