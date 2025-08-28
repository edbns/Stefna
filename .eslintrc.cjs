module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
  ],
  rules: {
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': ['warn', {
      vars: 'all',
      varsIgnorePattern: '^_',
      args: 'after-used',
      argsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
      destructuredArrayIgnorePattern: '^_'
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // General rules
    'no-unused-vars': 'off', // Turn off base rule as it conflicts with TypeScript rule
    'no-console': 'off',
    'no-undef': 'error',
    'no-empty': 'warn',
    'no-unreachable': 'warn',
    'no-constant-condition': 'warn',
    
    // React rules (if React is detected)
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
  },
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '*.config.js',
    '*.config.cjs',
    'netlify/functions/lib/',
    'scripts/'
  ],
};
