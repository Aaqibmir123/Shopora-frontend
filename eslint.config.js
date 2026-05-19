const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**', 'backend/dist/**', 'backend/node_modules/**', 'backend/prisma/**/*.js', 'android/**', 'ios/**']
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off'
    }
  },
  {
    files: ['babel.config.js', 'eslint.config.js'],
    rules: {
      'no-undef': 'off'
    }
  }
];
